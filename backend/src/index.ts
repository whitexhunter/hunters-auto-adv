import { scheduleCampaign } from './workers/campaignRunner';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase } from './db';
import { config } from './config';
import { apiLimiter } from './middleware/rateLimit';

import authRoutes from './routes/auth';
import accountRoutes from './routes/accounts';
import campaignRoutes from './routes/campaigns';
import billingRoutes from './routes/billing';
import webhookRoutes from './routes/webhooks';
import adminAuthRoutes from './routes/adminAuth';
import adminDashboardRoutes from './routes/adminDashboard';
import { seedAdmin } from './routes/adminAuth';

const app = express();

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://hunters-auto-adv.vercel.app',
    'https://hunters-api-gnyg.onrender.com',
    process.env.CORS_ORIGIN || '',
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(apiLimiter);

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/accounts', accountRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/webhooks', webhookRoutes);

// Admin routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminDashboardRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/api/ping', (_req, res) => {
  res.json({ pong: true });
});

async function start() {
  await connectDatabase();
  await seedAdmin();

// Start campaign worker
import('./workers/campaignRunner');
  
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[Server] Running on port ${config.port}`);

    // Self-keepalive
    if (process.env.NODE_ENV === 'production') {
      const selfUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${config.port}`;
      setInterval(async () => {
        try {
          await fetch(`${selfUrl}/api/ping`);
        } catch {}
      }, 4 * 60 * 1000);
    }
  });
}

start().catch(console.error);
