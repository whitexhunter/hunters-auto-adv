import { Client } from 'discord.js-selfbot-v13';
import { DiscordAccount } from '../models/DiscordAccount';
import { Campaign } from '../models/Campaign';
import CryptoJS from 'crypto-js';
import { config } from '../config';
import { createSelfBot, sendMessage } from './selfbot';

interface ManagedClient { client: Client; accountId: string; userId: string; status: 'connected' | 'disconnected' | 'error'; }

class ClientManager {
  private clients: Map<string, ManagedClient> = new Map();

  async connectAccount(accountId: string, userId: string): Promise<boolean> {
    try {
      const account = await DiscordAccount.findById(accountId);
      if (!account || account.userId.toString() !== userId) return false;

      const bytes = CryptoJS.AES.decrypt(account.token, config.encryptionKey);
      const decryptedToken = bytes.toString(CryptoJS.enc.Utf8);

      if (this.clients.has(accountId)) await this.disconnectAccount(accountId);

      const managed: ManagedClient = {
        client: createSelfBot({
          token: decryptedToken,
          onReady: async () => {
            managed.status = 'connected';
            await DiscordAccount.findByIdAndUpdate(accountId, { isOnline: true, status: 'active' });
            await this.resumeCampaigns(accountId);
          },
          onError: async () => {
            managed.status = 'error';
            await DiscordAccount.findByIdAndUpdate(accountId, { isOnline: false, status: 'disabled' });
          },
        }),
        accountId, userId, status: 'disconnected',
      };

      this.clients.set(accountId, managed);
      return true;
    } catch (error) {
      console.error('[ClientManager] Connection failed:', error);
      return false;
    }
  }

  async disconnectAccount(accountId: string): Promise<void> {
    const managed = this.clients.get(accountId);
    if (managed) {
      managed.client.destroy();
      this.clients.delete(accountId);
      await DiscordAccount.findByIdAndUpdate(accountId, { isOnline: false });
    }
  }

  async sendChannelMessage(accountId: string, channelId: string, content: string): Promise<boolean> {
    const managed = this.clients.get(accountId);
    if (!managed || managed.status !== 'connected') return false;
    return sendMessage(managed.client, channelId, content);
  }

  getClient(accountId: string): Client | null { return this.clients.get(accountId)?.client || null; }
  isConnected(accountId: string): boolean { return this.clients.get(accountId)?.status === 'connected'; }

  private async resumeCampaigns(accountId: string): Promise<void> {
    const campaigns = await Campaign.find({ accountId, status: 'running', type: 'channel_messaging' });
    for (const campaign of campaigns) console.log(`[ClientManager] Resuming campaign: ${campaign.name}`);
  }
}

export const clientManager = new ClientManager();
