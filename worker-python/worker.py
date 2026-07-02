#!/usr/bin/env python3
"""
Hunters Auto-Adv Python Worker
Replaces the Node.js Bull/Redis worker with a simple async Python process.
Connects directly to MongoDB, handles Discord selfbot messaging via discord.py-self.

Dependencies:
    pip install discord.py-self pymongo dnspython cryptography
"""

import os
import asyncio
import json
import logging
import random
import signal
import sys
from datetime import datetime, timezone
from base64 import b64decode
from urllib.parse import urlparse

import pymongo
from bson import ObjectId
import discord
from discord.ext import commands

# --- Configuration ---
MONGODB_URI = os.environ.get("MONGODB_URI", "")
ENCRYPTION_KEY = os.environ.get("TOKEN_ENCRYPTION_KEY", "default-32-char-key-for-dev-only!")
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", "15"))  # seconds between campaign checks
HTTP_PORT = int(os.environ.get("PORT", "4001"))

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("worker")


# --- CryptoJS-compatible AES decrypt ---
def cryptojs_aes_decrypt(ciphertext_b64: str, passphrase: str) -> str:
    """Decrypt a CryptoJS AES passphrase-encrypted string.
    
    CryptoJS.AES.encrypt(token, passphrase) uses:
      - PBKDF2 with 1 iteration, random salt (8 bytes)
      - AES-256-CBC
      - Output format: Base64("Salted__" + salt + ciphertext)
    """
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

    raw = b64decode(ciphertext_b64)
    if raw[:8] != b"Salted__":
        raise ValueError("Not a CryptoJS salted format")

    salt = raw[8:16]
    ciphertext = raw[16:]

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=48,
        salt=salt,
        iterations=1,
    )
    derived = kdf.derive(passphrase.encode("utf-8"))
    key = derived[:32]
    iv = derived[32:48]

    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    decryptor = cipher.decryptor()
    padded = decryptor.update(ciphertext) + decryptor.finalize()

    pad_len = padded[-1]
    return padded[:-pad_len].decode("utf-8")


# --- Discord Selfbot Client Manager ---
class SelfbotManager:
    def __init__(self):
        self.clients: dict[str, commands.Bot] = {}

    async def login(self, account_id: str, token: str, db) -> commands.Bot | None:
        """Login a Discord selfbot account."""
        if account_id in self.clients:
            try:
                await self.clients[account_id].close()
            except Exception:
                pass
            del self.clients[account_id]

        try:
            intents = discord.Intents.default()
            intents.message_content = True
            intents.guild_messages = True
            intents.dm_messages = True

            bot = commands.Bot(
                command_prefix="!",
                self_bot=True,
                intents=intents,
                help_command=None,
            )

            @bot.event
            async def on_ready():
                log.info(f"[{account_id}] Logged in as {bot.user} (ID: {bot.user.id})")
                try:
                    await db.discordaccounts.update_one(
                        {"_id": ObjectId(account_id)},
                        {"$set": {"isOnline": True, "status": "active"}},
                    )
                except Exception:
                    pass

            @bot.event
            async def on_message(message):
                if message.author.id == bot.user.id:
                    return
                await self._handle_auto_reply(account_id, message, db)

            await asyncio.wait_for(bot.start(token), timeout=20.0)
            self.clients[account_id] = bot
            return bot

        except asyncio.TimeoutError:
            log.error(f"[{account_id}] Login timed out")
        except Exception as e:
            log.error(f"[{account_id}] Login failed: {e}")

        try:
            await db.discordaccounts.update_one(
                {"_id": ObjectId(account_id)},
                {"$set": {"isOnline": False, "status": "disabled"}},
            )
        except Exception:
            pass
        return None

    async def disconnect(self, account_id: str, db):
        """Disconnect a selfbot."""
        if account_id in self.clients:
            try:
                await self.clients[account_id].close()
            except Exception:
                pass
            del self.clients[account_id]
        try:
            await db.discordaccounts.update_one(
                {"_id": ObjectId(account_id)},
                {"$set": {"isOnline": False}},
            )
        except Exception:
            pass

    async def send_to_channel(self, account_id: str, channel_id: str, content: str) -> bool:
        """Send a message to a channel using a logged-in selfbot."""
        bot = self.clients.get(account_id)
        if not bot or not bot.user:
            log.warning(f"[{account_id}] Not logged in, can't send to {channel_id}")
            return False
        try:
            channel = await bot.fetch_channel(int(channel_id))
            await channel.send(content)
            return True
        except Exception as e:
            log.error(f"[{account_id}] Failed to send to {channel_id}: {e}")
            return False

    async def _handle_auto_reply(self, account_id: str, message: discord.Message, db):
        """Check for DM auto-reply campaigns and reply if triggered."""
        try:
            campaigns_cursor = db.campaigns.find({
                "accountId": ObjectId(account_id),
                "type": "dm_auto_reply",
                "status": "running",
            })
            async for campaign in campaigns_cursor:
                trigger = campaign.get("replyTrigger", "")
                if trigger and trigger.lower() not in message.content.lower():
                    continue
                messages = campaign.get("messages", [])
                if not messages:
                    continue
                reply_msg = random.choice(messages)
                content = reply_msg.get("content", "")
                if not content:
                    continue
                try:
                    await message.reply(content)
                    await db.campaigns.update_one(
                        {"_id": campaign["_id"]},
                        {"$inc": {"stats.replied": 1}},
                    )
                    log.info(f"[{account_id}] Auto-replied to {message.author}")
                except Exception as e:
                    log.error(f"[{account_id}] Reply failed: {e}")
        except Exception as e:
            log.error(f"[{account_id}] Auto-reply handler error: {e}")


# --- Campaign Processor ---
async def process_campaign(campaign_id: str, sm: SelfbotManager, db):
    """Process a single campaign: login if needed, send messages."""
    try:
        campaign = await db.campaigns.find_one({"_id": ObjectId(campaign_id)})
        if not campaign or campaign.get("status") != "running":
            log.info(f"Campaign {campaign_id} not found or not running, skipping")
            return

        account_id = str(campaign["accountId"])
        account = await db.discordaccounts.find_one({"_id": ObjectId(account_id)})
        if not account:
            log.error(f"Account {account_id} not found for campaign {campaign_id}")
            await db.campaigns.update_one(
                {"_id": campaign["_id"]},
                {"$set": {"status": "failed"}},
            )
            return

        # Decrypt token
        try:
            token = cryptojs_aes_decrypt(account["token"], ENCRYPTION_KEY)
        except Exception as e:
            log.error(f"Failed to decrypt token for account {account_id}: {e}")
            await db.campaigns.update_one(
                {"_id": campaign["_id"]},
                {"$set": {"status": "failed"}},
            )
            return

        # Login if not already connected
        bot = sm.clients.get(account_id)
        if not bot or not bot.user:
            bot = await sm.login(account_id, token, db)
            if not bot:
                await db.campaigns.update_one(
                    {"_id": campaign["_id"]},
                    {"$set": {"status": "failed"}},
                )
                return
            await asyncio.sleep(2)

        # Update lastUsed
        await db.discordaccounts.update_one(
            {"_id": ObjectId(account_id)},
            {"$set": {"lastUsed": datetime.now(timezone.utc)}},
        )

        campaign_type = campaign.get("type", "channel_messaging")
        channels = campaign.get("channels", [])
        messages = campaign.get("messages", [])
        send_all = campaign.get("sendAllAtOnce", False)

        if campaign_type == "channel_messaging":
            for channel_id in channels:
                for msg in messages:
                    content = msg.get("content", "")
                    delay = msg.get("delay", 0)
                    if not content:
                        continue
                    success = await sm.send_to_channel(account_id, channel_id, content)
                    if success:
                        await db.campaigns.update_one(
                            {"_id": campaign["_id"]},
                            {"$inc": {"stats.sent": 1}},
                        )
                    else:
                        await db.campaigns.update_one(
                            {"_id": campaign["_id"]},
                            {"$inc": {"stats.failed": 1}},
                        )
                    if delay and delay > 0 and not send_all:
                        await asyncio.sleep(delay / 1000)

        # Handle schedule
        schedule = campaign.get("schedule", {})
        if schedule.get("type") == "recurring" and schedule.get("intervalMinutes"):
            next_run_ts = datetime.now(timezone.utc).timestamp() + (schedule["intervalMinutes"] * 60)
            end_at = schedule.get("endAt")
            if end_at:
                if isinstance(end_at, datetime):
                    end_ts = end_at.timestamp()
                else:
                    end_ts = end_at.timestamp() * 1000 if hasattr(end_at, 'timestamp') else float('inf')
                if datetime.now(timezone.utc).timestamp() + (schedule["intervalMinutes"] * 60) > end_ts:
                    await db.campaigns.update_one(
                        {"_id": campaign["_id"]},
                        {"$set": {"status": "completed"}},
                    )
                    log.info(f"Campaign {campaign_id} completed (schedule ended)")
                    return
            await db.campaigns.update_one(
                {"_id": campaign["_id"]},
                {"$set": {"_nextRun": next_run_ts}},
            )
            log.info(f"Campaign {campaign_id} will re-run in {schedule['intervalMinutes']} min")
        else:
            if campaign_type != "dm_auto_reply":
                await db.campaigns.update_one(
                    {"_id": campaign["_id"]},
                    {"$set": {"status": "completed"}},
                )
                log.info(f"Campaign {campaign_id} completed")

    except Exception as e:
        log.error(f"Failed to process campaign {campaign_id}: {e}")
        try:
            await db.campaigns.update_one(
                {"_id": ObjectId(campaign_id)},
                {"$set": {"status": "failed"}},
            )
        except Exception:
            pass


# --- Globals ---
pending_campaigns = []
db = None


# --- HTTP Health Check Server ---
async def run_http_server():
    """Simple HTTP health check endpoint + process-campaign."""
    async def handle_client(reader, writer):
        request_data = await reader.read(65536)
        request_text = request_data.decode("utf-8", errors="replace")
        lines = request_text.split("\r\n")
        if not lines:
            writer.close()
            return

        method_line = lines[0] if lines else ""
        parts = method_line.split(" ")
        path = parts[1] if len(parts) > 1 else "/"

        if path == "/process-campaign" and "POST" in method_line:
            body_start = request_text.find("\r\n\r\n") + 4
            body = request_text[body_start:] if body_start > 3 else "{}"
            try:
                data = json.loads(body)
                campaign_id = data.get("campaignId")
                if campaign_id:
                    pending_campaigns.append(campaign_id)
                    response = json.dumps({"queued": True, "campaignId": campaign_id})
                    writer.write(f"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {len(response)}\r\n\r\n{response}".encode())
                else:
                    response = json.dumps({"error": "campaignId required"})
                    writer.write(f"HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nContent-Length: {len(response)}\r\n\r\n{response}".encode())
            except json.JSONDecodeError:
                response = json.dumps({"error": "Invalid JSON"})
                writer.write(f"HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nContent-Length: {len(response)}\r\n\r\n{response}".encode())
        else:
            response = json.dumps({"status": "worker-ok"})
            writer.write(f"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {len(response)}\r\n\r\n{response}".encode())

        await writer.drain()
        writer.close()

    server = await asyncio.start_server(handle_client, "0.0.0.0", HTTP_PORT)
    log.info(f"HTTP server running on port {HTTP_PORT}")
    async with server:
        await server.serve_forever()


# --- Main Polling Loop ---
async def poll_loop(sm: SelfbotManager):
    """Poll MongoDB for running campaigns that need processing."""
    while True:
        try:
            # Process HTTP-triggered campaigns
            while pending_campaigns:
                cid = pending_campaigns.pop(0)
                log.info(f"Processing HTTP-triggered campaign: {cid}")
                await process_campaign(cid, sm, db)

            now = datetime.now(timezone.utc)

            # Find channel_messaging campaigns that need processing
            campaigns_cursor = db.campaigns.find({
                "status": "running",
                "type": "channel_messaging",
                "$or": [
                    {"_nextRun": {"$exists": False}},
                    {"_nextRun": {"$lte": now.timestamp()}},
                ],
            }).sort("createdAt", pymongo.ASCENDING)

            async for campaign in campaigns_cursor:
                cid = str(campaign["_id"])
                log.info(f"Poll picked up campaign: {campaign.get('name', cid)} ({cid})")
                await process_campaign(cid, sm, db)

            # Keep dm_auto_reply accounts logged in
            reply_campaigns = db.campaigns.find({
                "status": "running",
                "type": "dm_auto_reply",
            })
            async for rc in reply_campaigns:
                aid = str(rc["accountId"])
                if aid not in sm.clients:
                    log.info(f"DM auto-reply campaign needs login for account {aid}")
                    account = await db.discordaccounts.find_one({"_id": ObjectId(aid)})
                    if account:
                        try:
                            token = cryptojs_aes_decrypt(account["token"], ENCRYPTION_KEY)
                            await sm.login(aid, token, db)
                        except Exception as e:
                            log.error(f"Auto-reply login failed for {aid}: {e}")

        except Exception as e:
            log.error(f"Poll loop error: {e}")

        await asyncio.sleep(POLL_INTERVAL)


async def cleanup(sm: SelfbotManager):
    """Disconnect all selfbots on shutdown."""
    log.info("Shutting down...")
    for account_id in list(sm.clients.keys()):
        await sm.disconnect(account_id, db)


async def main():
    global db

    if not MONGODB_URI:
        log.error("MONGODB_URI environment variable is required")
        sys.exit(1)

    client = pymongo.AsyncMongoClient(MONGODB_URI)

    parsed = urlparse(MONGODB_URI)
    db_name = parsed.path.lstrip("/") if parsed.path and parsed.path != "/" else "veiled"
    db = client[db_name]

    # Verify connection
    try:
        await client.admin.command("ping")
        log.info(f"Connected to MongoDB, using database: {db_name}")
    except Exception as e:
        log.error(f"Failed to connect to MongoDB: {e}")
        sys.exit(1)

    sm = SelfbotManager()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, lambda: asyncio.create_task(cleanup(sm)))

    await asyncio.gather(
        run_http_server(),
        poll_loop(sm),
    )


if __name__ == "__main__":
    asyncio.run(main())
