import { Router, Response } from 'express';
import CryptoJS from 'crypto-js';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { DiscordAccount } from '../models/DiscordAccount';
import { User, PLAN_CONFIG } from '../models/User';
import { config } from '../config';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const accounts = await DiscordAccount.find({ userId: req.userId }).select('-token').sort({ createdAt: -1 });
    res.json({ accounts });
  } catch { res.status(500).json({ error: 'Failed to fetch accounts' }); }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const accountCount = await DiscordAccount.countDocuments({ userId: req.userId });
    const planConfig = PLAN_CONFIG[user.plan] || PLAN_CONFIG.free;
    if (accountCount >= planConfig.maxAccounts) {
      return res.status(403).json({ error: `Plan limit reached. Max ${planConfig.maxAccounts} accounts.` });
    }

    const encryptedToken = CryptoJS.AES.encrypt(token, config.encryptionKey).toString();

    let email = '', username = '';
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        email = payload.email || '';
        username = payload.username || (payload.email ? payload.email.split('@')[0] : 'Unknown');
      }
    } catch { username = 'Token Account'; }

    const account = new DiscordAccount({ userId: req.userId, token: encryptedToken, email, username });
    await account.save();

    res.status(201).json({ account: { _id: account._id, email: account.email, username: account.username, isOnline: account.isOnline, status: account.status, createdAt: account.createdAt } });
  } catch { res.status(500).json({ error: 'Failed to add account' }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const account = await DiscordAccount.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Account deleted' });
  } catch { res.status(500).json({ error: 'Failed to delete account' }); }
});

router.get('/:id/token', async (req: AuthRequest, res: Response) => {
  try {
    const account = await DiscordAccount.findOne({ _id: req.params.id, userId: req.userId });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    const bytes = CryptoJS.AES.decrypt(account.token, config.encryptionKey);
    const decryptedToken = bytes.toString(CryptoJS.enc.Utf8);
    res.json({ token: decryptedToken });
  } catch { res.status(500).json({ error: 'Failed to decrypt token' }); }
});

export default router;
