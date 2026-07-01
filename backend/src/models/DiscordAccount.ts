import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscordAccount extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  email: string;
  username: string;
  isOnline: boolean;
  status: 'active' | 'disabled' | 'locked' | 'rate_limited';
  lastUsed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DiscordAccountSchema = new Schema<IDiscordAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    email: { type: String, default: '' },
    username: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'disabled', 'locked', 'rate_limited'], default: 'active' },
    lastUsed: { type: Date, default: null },
  },
  { timestamps: true }
);

export const DiscordAccount = mongoose.model<IDiscordAccount>('DiscordAccount', DiscordAccountSchema);
