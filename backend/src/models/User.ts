import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  discordId: string;
  username: string;
  discriminator: string;
  avatar: string;
  email: string;
  plan: 'free' | 'v1' | 'v2' | 'v3' | 'lifetime';
  maxAccounts: number;
  isTrialUsed: boolean;
  trialExpiresAt: Date | null;
  subscriptionExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const PLAN_CONFIG: Record<string, { maxAccounts: number; features: string[] }> = {
  free: { maxAccounts: 1, features: ['send_all_at_once'] },
  v1: { maxAccounts: 1, features: ['send_all_at_once'] },
  v2: { maxAccounts: 3, features: ['send_all_at_once', 'image_attachments'] },
  v3: { maxAccounts: 5, features: ['send_all_at_once', 'image_attachments', 'auto_reply_dm'] },
  lifetime: { maxAccounts: 5, features: ['send_all_at_once', 'image_attachments', 'auto_reply_dm'] },
};

const UserSchema = new Schema<IUser>(
  {
    discordId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    discriminator: { type: String, default: '0' },
    avatar: { type: String, default: '' },
    email: { type: String, default: '' },
    plan: { type: String, enum: ['free', 'v1', 'v2', 'v3', 'lifetime'], default: 'free' },
    maxAccounts: { type: Number, default: 1 },
    isTrialUsed: { type: Boolean, default: false },
    trialExpiresAt: { type: Date, default: null },
    subscriptionExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
