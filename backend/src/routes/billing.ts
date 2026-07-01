import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { User, PLAN_CONFIG } from '../models/User';
import { Subscription } from '../models/Subscription';
import { Config } from '../models/Config';
import crypto from 'crypto';

const router = Router();
router.use(authMiddleware);

async function getPrices() {
  const configDoc = await Config.findOne({ key: 'prices' });
  if (configDoc) return configDoc.value;
  const dotenv = require('dotenv');
  dotenv.config();
  return {
    v1: { monthly: parseInt(process.env.PRICE_V1 || '1'), lifetime: null },
    v2: { monthly: parseInt(process.env.PRICE_V2 || '2'), lifetime: null },
    v3: { monthly: parseInt(process.env.PRICE_V3 || '3'), lifetime: null },
    lifetime: { monthly: 0, lifetime: parseInt(process.env.PRICE_LIFETIME || '30') },
  };
}

router.get('/prices', async (_req: AuthRequest, res: Response) => {
  try { res.json({ prices: await getPrices() }); }
  catch { res.status(500).json({ error: 'Failed to fetch prices' }); }
});

router.post('/generate-address', async (req: AuthRequest, res: Response) => {
  try {
    const { plan } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const prices = await getPrices();
    if (!prices[plan]) return res.status(400).json({ error: 'Invalid plan' });

    const price = plan === 'lifetime' ? prices.lifetime.lifetime : prices[plan].monthly;
    if (!price) return res.status(400).json({ error: 'Invalid plan' });

    // Check for configured LTC address
    const ltcConfig = await Config.findOne({ key: 'ltc_address' });
    const ltcAddress = ltcConfig?.value?.address || `LTC_MOCK_${crypto.randomBytes(16).toString('hex')}`;

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const subscription = new Subscription({ userId: req.userId, plan, paymentMethod: 'ltc', amount: price, status: 'pending', expiresAt });
    await subscription.save();

    res.json({ address: ltcAddress, amount: price, currency: 'LTC', expiresAt, subscriptionId: subscription._id });
  } catch { res.status(500).json({ error: 'Failed to generate payment address' }); }
});

router.post('/verify', async (req: AuthRequest, res: Response) => {
  try {
    const { subscriptionId, txId } = req.body;
    const subscription = await Subscription.findOne({ _id: subscriptionId, userId: req.userId });
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });

    subscription.status = 'confirmed';
    subscription.ltcTxId = txId || 'mock_tx_' + Date.now();
    await subscription.save();

    const user = await User.findById(req.userId);
    if (user) {
      if (subscription.plan === 'lifetime') {
        user.plan = 'lifetime';
        user.maxAccounts = PLAN_CONFIG.lifetime.maxAccounts;
        user.subscriptionExpiresAt = null;
      } else {
        user.plan = subscription.plan;
        user.maxAccounts = PLAN_CONFIG[subscription.plan].maxAccounts;
        user.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
      await user.save();
    }

    res.json({ success: true, plan: user?.plan });
  } catch { res.status(500).json({ error: 'Failed to verify payment' }); }
});

router.post('/trial', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isTrialUsed) return res.status(403).json({ error: 'Trial already used' });

    user.isTrialUsed = true;
    user.plan = 'v3';
    user.maxAccounts = PLAN_CONFIG.v3.maxAccounts;
    user.trialExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const subscription = new Subscription({ userId: user._id, plan: 'v3', paymentMethod: 'free_trial', status: 'confirmed', expiresAt: user.trialExpiresAt });
    await subscription.save();

    res.json({ success: true, expiresAt: user.trialExpiresAt });
  } catch { res.status(500).json({ error: 'Failed to start trial' }); }
});

export default router;
