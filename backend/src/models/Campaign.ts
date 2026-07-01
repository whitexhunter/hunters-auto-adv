import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  content: string;
  attachments?: string[];
  delay?: number;
}

export interface ICampaign extends Document {
  accountId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  type: 'channel_messaging' | 'dm_auto_reply';
  status: 'running' | 'paused' | 'completed' | 'failed';
  channels: string[];
  messages: IMessage[];
  schedule: {
    type: 'immediate' | 'once' | 'recurring';
    startAt?: Date;
    intervalMinutes?: number;
    endAt?: Date;
  };
  replyTrigger?: string;
  sendAllAtOnce: boolean;
  stats: { sent: number; failed: number; replied: number };
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    accountId: { type: Schema.Types.ObjectId, ref: 'DiscordAccount', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['channel_messaging', 'dm_auto_reply'], required: true },
    status: { type: String, enum: ['running', 'paused', 'completed', 'failed'], default: 'paused' },
    channels: [{ type: String }],
    messages: [{ content: { type: String, required: true }, attachments: [{ type: String }], delay: { type: Number, default: 0 } }],
    schedule: {
      type: { type: String, enum: ['immediate', 'once', 'recurring'], default: 'immediate' },
      startAt: { type: Date },
      intervalMinutes: { type: Number },
      endAt: { type: Date },
    },
    replyTrigger: { type: String },
    sendAllAtOnce: { type: Boolean, default: false },
    stats: { sent: { type: Number, default: 0 }, failed: { type: Number, default: 0 }, replied: { type: Number, default: 0 } },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
