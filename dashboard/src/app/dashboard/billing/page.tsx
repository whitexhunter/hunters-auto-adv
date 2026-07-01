'use client';

import { useState, useEffect } from 'react';
import { Check, Loader2, Zap } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));

    axios.get('/api/billing/prices')
      .then(({ data }) => {
        const p = data.prices;
        setPlans([
          { id: 'v1', name: 'Starter', price: p.v1.monthly, accounts: 1, features: ['Channel messaging', 'Send all at once'] },
          { id: 'v2', name: 'Professional', price: p.v2.monthly, accounts: 3, features: ['Channel messaging', 'Send all at once', 'Image attachments'] },
          { id: 'v3', name: 'Elite Monthly', price: p.v3.monthly, accounts: 5, features: ['Channel messaging', 'Send all at once', 'Image attachments', 'DM auto-reply'] },
          { id: 'lifetime', name: 'Elite Forever', price: p.lifetime.lifetime, accounts: 5, features: ['All features forever', 'No recurring payments'], lifetime: true },
        ]);
      })
      .catch(() => {
        setPlans([
          { id: 'v1', name: 'Starter', price: 1, accounts: 1, features: ['Channel messaging', 'Send all at once'] },
          { id: 'v2', name: 'Professional', price: 2, accounts: 3, features: ['Channel messaging', 'Send all at once', 'Image attachments'] },
          { id: 'v3', name: 'Elite Monthly', price: 3, accounts: 5, features: ['Channel messaging', 'Send all at once', 'Image attachments', 'DM auto-reply'] },
          { id: 'lifetime', name: 'Elite Forever', price: 30, accounts: 5, features: ['All features forever', 'No recurring payments'], lifetime: true },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSelectPlan(planId: string) { setSelectedPlan(planId); setPaymentInfo(null); }

  async function handleStartTrial() {
    setPaying(true);
    try {
      await axios.post('/api/billing/trial');
      alert('Trial started! You have 10 minutes of full access.');
      router.push('/dashboard');
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to start trial'); }
    finally { setPaying(false); }
  }

  async function handlePurchase() {
    if (!selectedPlan) return;
    setPaying(true);
    try {
      const { data } = await axios.post('/api/billing/generate-address', { plan: selectedPlan });
      setPaymentInfo(data);
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to generate payment'); }
    finally { setPaying(false); }
  }

  async function handleVerifyPayment() {
    if (!paymentInfo) return;
    setPaying(true);
    try {
      await axios.post('/api/billing/verify', {
        subscriptionId: paymentInfo.subscriptionId,
        txId: prompt('Enter Litecoin transaction ID:'),
      });
      alert('Payment verified! Plan upgraded.');
      router.push('/dashboard');
    } catch (err: any) { alert(err.response?.data?.error || 'Verification failed'); }
    finally { setPaying(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Billing & Plans</h1>
      <p className="text-dark-100 mb-8">Current plan: <span className="text-accent font-medium capitalize">{user?.plan || 'Free'}</span></p>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {plans.map(plan => (
          <div key={plan.id} className={`card cursor-pointer transition-all ${selectedPlan === plan.id ? 'border-accent-dark bg-dark-700/50' : 'hover:border-dark-400'}`} onClick={() => handleSelectPlan(plan.id)}>
            <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
            <div className="text-3xl font-bold mb-4">${plan.price}<span className="text-sm text-dark-100 font-normal">/{plan.lifetime ? 'once' : 'mo'}</span></div>
            <div className="text-sm text-dark-100 mb-4"><Check className="w-4 h-4 inline mr-1 text-green-500" />{plan.accounts} Account{plan.accounts > 1 ? 's' : ''}</div>
            <ul className="space-y-2 mb-6">{plan.features.map(f => <li key={f} className="text-sm flex items-center gap-2"><Check className="w-3 h-3 text-green-500" />{f}</li>)}</ul>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <button onClick={handleStartTrial} disabled={paying || user?.isTrialUsed} className="btn-secondary flex items-center gap-2">
          <Zap className="w-4 h-4" /> {user?.isTrialUsed ? 'Trial Used' : 'Start 10-min Trial'}
        </button>
        <button onClick={handlePurchase} disabled={!selectedPlan || paying} className="btn-primary flex items-center gap-2">
          {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pay with Litecoin'}
        </button>
      </div>

      {paymentInfo && (
        <div className="card space-y-3">
          <h3 className="font-semibold">Payment Details</h3>
          <div className="text-sm space-y-2">
            <p>Send <span className="text-accent font-bold">{paymentInfo.amount} LTC</span> to:</p>
            <code className="block bg-dark-700 p-3 rounded-lg text-sm font-mono break-all">{paymentInfo.address}</code>
            <p className="text-dark-100">Expires: {new Date(paymentInfo.expiresAt).toLocaleString()}</p>
          </div>
          <button onClick={handleVerifyPayment} disabled={paying} className="btn-primary mt-2">
            {paying ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "I Sent the Payment — Verify"}
          </button>
        </div>
      )}
    </div>
  );
}
