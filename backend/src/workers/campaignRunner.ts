import Queue from 'bull';
import { config } from '../config';
import { Campaign } from '../models/Campaign';
import { DiscordAccount } from '../models/DiscordAccount';
import { clientManager } from '../discord/clientManager';

const campaignQueue = new Queue('campaigns', config.redisUrl);

campaignQueue.process(async (job) => {
  const { campaignId, action } = job.data;
  if (action === 'send') await executeCampaign(campaignId);
  else if (action === 'auto_reply') await setupAutoReply(campaignId);
});

async function executeCampaign(campaignId: string): Promise<void> {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign || campaign.status !== 'running') return;

  const account = await DiscordAccount.findById(campaign.accountId);
  if (!account) { await Campaign.findByIdAndUpdate(campaignId, { status: 'failed' }); return; }

  if (!clientManager.isConnected(account._id.toString())) {
    await clientManager.connectAccount(account._id.toString(), account.userId.toString());
    await new Promise(r => setTimeout(r, 3000));
  }

  for (const channelId of campaign.channels) {
    for (const msg of campaign.messages) {
      const success = await clientManager.sendChannelMessage(account._id.toString(), channelId, msg.content);
      if (success) campaign.stats.sent++;
      else campaign.stats.failed++;
      if (msg.delay && msg.delay > 0) await new Promise(r => setTimeout(r, msg.delay));
    }
  }

  await campaign.save();

  if (campaign.schedule.type === 'recurring' && campaign.schedule.intervalMinutes) {
    const nextRun = new Date(Date.now() + campaign.schedule.intervalMinutes * 60 * 1000);
    if (!campaign.schedule.endAt || nextRun < campaign.schedule.endAt) {
      campaignQueue.add({ campaignId, action: 'send' }, { delay: campaign.schedule.intervalMinutes * 60 * 1000 });
    } else { campaign.status = 'completed'; await campaign.save(); }
  }
}

async function setupAutoReply(campaignId: string): Promise<void> {
  const campaign = await Campaign.findById(campaignId);
  if (campaign) { campaign.status = 'running'; await campaign.save(); }
}

export function scheduleCampaign(campaignId: string, action: 'send' | 'auto_reply'): void { campaignQueue.add({ campaignId, action }); }
export { campaignQueue };
