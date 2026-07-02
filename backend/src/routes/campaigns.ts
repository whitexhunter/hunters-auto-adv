import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { Campaign } from '../models/Campaign';
import { DiscordAccount } from '../models/DiscordAccount';
import { User, PLAN_CONFIG } from '../models/User';

const router = Router();
router.use(authMiddleware);

const WORKER_URL = process.env.WORKER_URL || 'https://hunters-worker.onrender.com';

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const campaigns = await Campaign.find({ userId: req.userId }).populate('accountId', 'username email').sort({ createdAt: -1 });
    res.json({ campaigns });
  } catch { res.status(500).json({ error: 'Failed to fetch campaigns' }); }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, accountId, channels, messages, schedule, replyTrigger, sendAllAtOnce } = req.body;

    const account = await DiscordAccount.findOne({ _id: accountId, userId: req.userId });
    if (!account) return res.status(404).json({ error: 'Discord account not found' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const planConfig = PLAN_CONFIG[user.plan] || PLAN_CONFIG.free;
    if (type === 'dm_auto_reply' && !planConfig.features.includes('auto_reply_dm')) {
      return res.status(403).json({ error: 'DM auto-reply requires plan v3 or higher' });
    }
    if (sendAllAtOnce && !planConfig.features.includes('send_all_at_once')) {
      return res.status(403).json({ error: 'Send all at once requires plan v2 or higher' });
    }

    const campaign = new Campaign({ userId: req.userId, accountId, name, type, channels: channels || [], messages: messages || [], schedule: schedule || { type: 'immediate' }, replyTrigger, sendAllAtOnce: sendAllAtOnce || false, status: 'paused' });
    await campaign.save();
    res.status(201).json({ campaign });
  } catch { res.status(500).json({ error: 'Failed to create campaign' }); }
});

router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const campaign = await Campaign.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, { status }, { new: true });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (status === 'running') {
      await DiscordAccount.findByIdAndUpdate(campaign.accountId, { lastUsed: new Date() });
      // Notify the worker via HTTP instead of Redis
      fetch(`${WORKER_URL}/process-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign._id.toString() }),
      }).catch(err => console.error('[Campaign] Worker notify failed:', err.message));
    }
    res.json({ campaign });
  } catch (err) {
    console.error('[Campaign] Status update error:', err);
    res.status(500).json({ error: 'Failed to update campaign status' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ message: 'Campaign deleted' });
  } catch { res.status(500).json({ error: 'Failed to delete campaign' }); }
});

export default router;
