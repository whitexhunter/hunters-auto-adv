import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  plan: string;
  paymentMethod: 'ltc' | 'free_trial';
  ltcTxId: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'expired' | 'refunded';
  expiresAt: Date;
  createdAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, required: true },
    paymentMethod: { type: String, enum: ['ltc', 'free_trial'], required: true },
    ltcTxId: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'confirmed', 'expired', 'refunded'], default: 'pending' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
