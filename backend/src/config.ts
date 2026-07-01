import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000'),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/veiled',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  encryptionKey: process.env.TOKEN_ENCRYPTION_KEY || 'default-32-char-key-for-dev-only!',
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    redirectUri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
  },
  ltc: {
    rpcUrl: process.env.LTC_RPC_URL || '',
    rpcUser: process.env.LTC_RPC_USER || '',
    rpcPass: process.env.LTC_RPC_PASS || '',
  },
  encryption: {
    algorithm: 'aes-256-cbc',
    key: Buffer.from(process.env.TOKEN_ENCRYPTION_KEY?.padEnd(32, 'x').slice(0, 32) || 'default-32-char-key-for-dev', 'utf8'),
    iv: Buffer.alloc(16, 0),
  },
  prices: {
    v1: { monthly: parseInt(process.env.PRICE_V1 || '1'), lifetime: null },
    v2: { monthly: parseInt(process.env.PRICE_V2 || '2'), lifetime: null },
    v3: { monthly: parseInt(process.env.PRICE_V3 || '3'), lifetime: null },
    lifetime: { monthly: 0, lifetime: parseInt(process.env.PRICE_LIFETIME || '30') },
  },
};
