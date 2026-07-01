// Tiny HTTP server to keep Render happy (free web services need an HTTP listener)
import http from 'http';
const PORT = process.env.PORT || 4001;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'worker-ok' }));
}).listen(PORT, () => {
  console.log(`[Ping] Health server running on port ${PORT}`);
});
import Queue from 'bull';
import mongoose from 'mongoose';
import { Client } from 'discord.js-selfbot-v13';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';
const REDIS_URL = process.env.REDIS_URL || '';
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || '';

async function connectDB() {
  for (let i = 0; i < 10; i++) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('[Worker] MongoDB connected');
      return;
    } catch (err) {
      console.error(`[Worker] MongoDB attempt ${i + 1} failed, retrying in 5s...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  process.exit(1);
}

const CampaignSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiscordAccount' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  type: { type: String, enum: ['channel_messaging', 'dm_auto_reply'] },
  status: { type: String, enum: ['running', 'paused', 'completed', 'failed'], default: 'paused' },
  channels: [String],
  messages: [{ content: String, attachments: [String], delay: Number }],
  schedule: mongoose.Schema.Types.Mixed,
  replyTrigger: String,
  sendAllAtOnce: Boolean,
  stats: { sent: { type: Number, default: 0 }, failed: { type: Number, default: 0 }, replied: { type: Number, default: 0 } },
}, { timestamps: true });

const DiscordAccountSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  token: String, email: String, username: String,
  isOnline: Boolean, status: { type: String, default: 'active' },
});

const Campaign = mongoose.model('Campaign', CampaignSchema);
const DiscordAccountModel = mongoose.model('DiscordAccount', DiscordAccountSchema);

const campaignQueue = new Queue('campaigns', REDIS_URL, {
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
});

const clients = new Map<string, Client>();

campaignQueue.process(async (job) => {
  const { campaignId } = job.data;
  console.log(`[Worker] Processing campaign: ${campaignId}`);

  const campaign = await Campaign.findById(campaignId);
  if (!campaign || campaign.status !== 'running') return;

  const account = await DiscordAccountModel.findById(campaign.accountId);
  if (!account) { await Campaign.findByIdAndUpdate(campaignId, { status: 'failed' }); return; }

  let client = clients.get(account._id.toString());
  if (!client || !client.user) {
    try {
      const bytes = CryptoJS.AES.decrypt(account.token, ENCRYPTION_KEY);
      const token = bytes.toString(CryptoJS.enc.Utf8);
      if (!token) throw new Error('Empty token');

      client = new Client({ checkUpdate: false });
      await Promise.race([
        client.login(token),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Login timeout')), 15000)),
      ]);
      clients.set(account._id.toString(), client);
      console.log(`[Worker] Logged in as ${client.user?.tag}`);

      client.on('messageCreate', async (message: any) => {
        if (message.author.id === client?.user?.id) return;
        try {
          const replyCampaigns = await Campaign.find({ accountId: account._id, type: 'dm_auto_reply', status: 'running' });
          for (const rc of replyCampaigns) {
            if (rc.replyTrigger && !message.content.toLowerCase().includes(rc.replyTrigger.toLowerCase())) continue;
            const replyMsg = rc.messages[Math.floor(Math.random() * rc.messages.length)];
            if (replyMsg) {
              await message.reply(replyMsg.content);
              rc.stats.replied = (rc.stats.replied || 0) + 1;
              await rc.save();
            }
          }
        } catch (err) { console.error('[Worker] Reply error:', err); }
      });
    } catch (err: any) {
      console.error(`[Worker] Login failed:`, err.message);
      campaign.status = 'failed'; await campaign.save(); return;
    }
  }

  for (const channelId of campaign.channels) {
    for (const msg of campaign.messages) {
      try {
        const channel = await client.channels.fetch(channelId);
        if (channel) {
          // @ts-ignore
          await channel.send(msg.content);
          campaign.stats.sent = (campaign.stats.sent || 0) + 1;
        }
      } catch (err: any) {
        campaign.stats.failed = (campaign.stats.failed || 0) + 1;
        console.error(`[Worker] Failed ${channelId}:`, err.message);
      }
      if (msg.delay && msg.delay > 0) await new Promise(r => setTimeout(r, msg.delay));
    }
  }
  await campaign.save();

  if (campaign.schedule?.type === 'recurring' && campaign.schedule.intervalMinutes) {
    const nextDelay = campaign.schedule.intervalMinutes * 60 * 1000;
    if (!campaign.schedule.endAt || Date.now() + nextDelay < new Date(campaign.schedule.endAt).getTime()) {
      await campaignQueue.add({ campaignId }, { delay: nextDelay });
    } else { campaign.status = 'completed'; await campaign.save(); }
  } else { campaign.status = 'completed'; await campaign.save(); }
});

setInterval(() => { console.log(`[Worker] Heartbeat — ${new Date().toISOString()} — Clients: ${clients.size}`); }, 5 * 60 * 1000);

process.on('SIGTERM', async () => {
  for (const [, c] of clients) { try { c.destroy(); } catch {} }
  await campaignQueue.close(); await mongoose.disconnect(); process.exit(0);
});

async function start() { await connectDB(); console.log('[Worker] Ready. Waiting for campaigns...'); }
start();
