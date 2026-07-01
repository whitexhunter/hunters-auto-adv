import { Router, Response } from 'express';
import { adminAuthMiddleware, AdminAuthRequest } from '../middleware/adminAuth';
import { User } from '../models/User';
import { DiscordAccount } from '../models/DiscordAccount';
import { Campaign } from '../models/Campaign';
import { Subscription } from '../models/Subscription';
import { Config } from '../models/Config';

const router = Router();
router.use(adminAuthMiddleware);

// ===== OVERVIEW =====
router.get('/overview', async (_req: AdminAuthRequest, res: Response) => {
  try {
    const [totalUsers, totalAccounts, totalCampaigns, totalSubscriptions, activeCampaigns] = await Promise.all([
      User.countDocuments(), DiscordAccount.countDocuments(), Campaign.countDocuments(),
      Subscription.countDocuments({ status: 'confirmed' }), Campaign.countDocuments({ status: 'running' }),
    ]);
    const campaigns = await Campaign.find({});
    const totalSent = campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
    const totalFailed = campaigns.reduce((sum, c) => sum + (c.stats?.failed || 0), 0);
    const subscriptions = await Subscription.find({ status: 'confirmed' });
    const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.amount || 0), 0);
    res.json({ stats: { totalUsers, totalAccounts, totalCampaigns, activeCampaigns, totalSubscriptions, totalSent, totalFailed, totalRevenue } });
  } catch { res.status(500).json({ error: 'Failed to fetch overview' }); }
});

// ===== USERS =====
router.get('/users', async (req: AdminAuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';

    let query: any = {};
    if (search) query = { $or: [{ username: { $regex: search, $options: 'i' } }, { discordId: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] };

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    const userIds = users.map(u => u._id);
    const accountCounts = await DiscordAccount.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]);
    const campaignCounts = await Campaign.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]);

    const accountCountMap = Object.fromEntries(accountCounts.map(a => [a._id.toString(), a.count]));
    const campaignCountMap = Object.fromEntries(campaignCounts.map(c => [c._id.toString(), c.count]));

    const enriched = users.map(u => ({ ...u, accountCount: accountCountMap[u._id.toString()] || 0, campaignCount: campaignCountMap[u._id.toString()] || 0 }));
    res.json({ users: enriched, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch { res.status(500).json({ error: 'Failed to fetch users' }); }
});

router.get('/users/:id', async (req: AdminAuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const [accounts, campaigns, subscriptions] = await Promise.all([
      DiscordAccount.find({ userId: user._id }).lean(),
      Campaign.find({ userId: user._id }).lean(),
      Subscription.find({ userId: user._id }).sort({ createdAt: -1 }).lean(),
    ]);
    res.json({ user, accounts, campaigns, subscriptions });
  } catch { res.status(500).json({ error: 'Failed to fetch user' }); }
});

router.patch('/users/:id/plan', async (req: AdminAuthRequest, res: Response) => {
  try {
    const { plan } = req.body;
    if (!['free', 'v1', 'v2', 'v3', 'lifetime'].includes(plan)) return res.status(400).json({ error: 'Invalid plan' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.plan = plan;
    if (plan === 'lifetime') user.subscriptionExpiresAt = null;
    await user.save();
    res.json({ success: true, user });
  } catch { res.status(500).json({ error: 'Failed to update plan' }); }
});

router.patch('/users/:id/reset-trial', async (req: AdminAuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.isTrialUsed = false;
    user.trialExpiresAt = null;
    await user.save();
    res.json({ success: true, message: 'Trial reset' });
  } catch { res.status(500).json({ error: 'Failed to reset trial' }); }
});

router.delete('/users/:id', async (req: AdminAuthRequest, res: Response) => {
  try {
    await Promise.all([
      User.findByIdAndDelete(req.params.id), DiscordAccount.deleteMany({ userId: req.params.id }),
      Campaign.deleteMany({ userId: req.params.id }), Subscription.deleteMany({ userId: req.params.id }),
    ]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete user' }); }
});

// ===== ACCOUNTS =====
router.get('/accounts', async (req: AdminAuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const [accounts, total] = await Promise.all([
      DiscordAccount.find().populate('userId', 'username email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      DiscordAccount.countDocuments(),
    ]);
    res.json({ accounts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch { res.status(500).json({ error: 'Failed to fetch accounts' }); }
});

// ===== CAMPAIGNS =====
router.get('/campaigns', async (req: AdminAuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const [campaigns, total] = await Promise.all([
      Campaign.find().populate('accountId', 'username email').populate('userId', 'username email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Campaign.countDocuments(),
    ]);
    res.json({ campaigns, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch { res.status(500).json({ error: 'Failed to fetch campaigns' }); }
});

router.patch('/campaigns/:id/status', async (req: AdminAuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['running', 'paused', 'completed', 'failed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ campaign });
  } catch { res.status(500).json({ error: 'Failed to update campaign' }); }
});

router.delete('/campaigns/:id', async (req: AdminAuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete campaign' }); }
});

// ===== PRICES =====
router.get('/prices', async (_req: AdminAuthRequest, res: Response) => {
  try {
    const configDoc = await Config.findOne({ key: 'prices' });
    const defaultPrices = { v1: { monthly: 1, lifetime: null }, v2: { monthly: 2, lifetime: null }, v3: { monthly: 3, lifetime: null }, lifetime: { monthly: 0, lifetime: 30 } };
    res.json({ prices: configDoc?.value || defaultPrices });
  } catch { res.status(500).json({ error: 'Failed to fetch prices' }); }
});

router.post('/prices', async (req: AdminAuthRequest, res: Response) => {
  try {
    const { prices } = req.body;
    if (!prices) return res.status(400).json({ error: 'Prices required' });
    await Config.findOneAndUpdate({ key: 'prices' }, { value: prices }, { upsert: true });
    res.json({ success: true, message: 'Prices updated instantly' });
  } catch { res.status(500).json({ error: 'Failed to update prices' }); }
});

// ===== LTC ADDRESS =====
router.get('/ltc-address', async (_req: AdminAuthRequest, res: Response) => {
  try {
    const configDoc = await Config.findOne({ key: 'ltc_address' });
    res.json({ address: configDoc?.value?.address || '', label: configDoc?.value?.label || '' });
  } catch { res.status(500).json({ error: 'Failed to fetch LTC address' }); }
});

router.post('/ltc-address', async (req: AdminAuthRequest, res: Response) => {
  try {
    const { address, label } = req.body;
    if (!address) return res.status(400).json({ error: 'Address required' });
    await Config.findOneAndUpdate({ key: 'ltc_address' }, { value: { address, label: label || 'Main Wallet' } }, { upsert: true });
    res.json({ success: true, message: 'LTC address updated' });
  } catch { res.status(500).json({ error: 'Failed to update LTC address' }); }
});

// ===== SUBSCRIPTIONS =====
router.get('/subscriptions', async (req: AdminAuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const [subscriptions, total] = await Promise.all([
      Subscription.find().populate('userId', 'username email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Subscription.countDocuments(),
    ]);
    res.json({ subscriptions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch { res.status(500).json({ error: 'Failed to fetch subscriptions' }); }
});

// ===== SYSTEM STATUS =====
router.get('/status', async (_req: AdminAuthRequest, res: Response) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    let redisStatus = 'unknown';
    try {
      const Redis = require('ioredis');
      const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      await redis.ping();
      redisStatus = 'connected';
      redis.disconnect();
    } catch { redisStatus = 'disconnected'; }

    const [userCount, campaignCount, runningCampaigns, accountCount] = await Promise.all([
      User.countDocuments(), Campaign.countDocuments(), Campaign.countDocuments({ status: 'running' }), DiscordAccount.countDocuments(),
    ]);

    res.json({ database: dbStatus, redis: redisStatus, uptime: process.uptime(), memoryUsage: process.memoryUsage(), stats: { users: userCount, campaigns: campaignCount, runningCampaigns, accounts: accountCount } });
  } catch { res.status(500).json({ error: 'Failed to get status' }); }
});

export default router;
