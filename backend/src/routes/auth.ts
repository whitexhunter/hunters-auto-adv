import { authMiddleware } from '../middleware/auth';
import { Router, Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models/User';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

router.get('/discord', (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: config.discord.clientId,
    redirect_uri: config.discord.redirectUri,
    response_type: 'code',
    scope: 'identify email',
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

// ★ NEW: Handle GET callback from Discord redirect
router.get('/discord/callback', (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/login?code=${code}`);
});

router.post('/discord/callback', authLimiter, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Authorization code required' });

    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: config.discord.clientId,
        client_secret: config.discord.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.discord.redirectUri,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token } = tokenResponse.data;
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id, username, discriminator, avatar, email } = userResponse.data;

    let user = await User.findOne({ discordId: id });
    if (!user) {
      user = new User({
        discordId: id, username,
        discriminator: discriminator || '0',
        avatar: avatar || '',
        email: email || '',
        plan: 'free', maxAccounts: 1,
      });
    } else {
      user.username = username;
      user.discriminator = discriminator || '0';
      user.avatar = avatar || '';
      user.email = email || '';
    }
    await user.save();

    const token = jwt.sign(
      { userId: user._id.toString(), discordId: id },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id, discordId: user.discordId,
        username: user.username, avatar: user.avatar,
        plan: user.plan, maxAccounts: user.maxAccounts,
        isTrialUsed: user.isTrialUsed,
      },
    });
  } catch (error: any) {
    console.error('[Auth] Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/me', authMiddleware, async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-__v');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
