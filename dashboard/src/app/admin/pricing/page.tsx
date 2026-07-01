'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function AdminPricingPage() {
  const [prices, setPrices] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    axios.get('/api/admin/prices')
      .then(({ data }) => setPrices(data.prices))
      .catch(() => setMessage({ text: 'Failed to load prices', type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  async function savePrices() {
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      await axios.post('/api/admin/prices', { prices });
      setMessage({ text: 'Prices updated! Users will see new prices instantly on next page load.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || 'Failed to save', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!prices) return <div className="text-center py-20 text-dark-100">Failed to load pricing data</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Pricing Management</h1>
      <p className="text-dark-100 mb-6">Change plan prices — updates instantly, no deploy needed.</p>

      <div className="card space-y-6">
        <div className="grid gap-4">
          {['v1', 'v2', 'v3'].map((plan) => (
            <div key={plan}>
              <label className="block text-sm font-medium mb-1 capitalize">
                {plan === 'v1' ? 'Starter' : plan === 'v2' ? 'Professional' : 'Elite Monthly'} — Monthly Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                value={prices[plan]?.monthly ?? ''}
                onChange={(e) => setPrices((p: any) => ({
                  ...p,
                  [plan]: { ...p[plan], monthly: parseFloat(e.target.value) || 0 }
                }))}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium mb-1">Lifetime — One-Time Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input-field"
              value={prices.lifetime?.lifetime ?? ''}
              onChange={(e) => setPrices((p: any) => ({
                ...p,
                lifetime: { ...p.lifetime, lifetime: parseFloat(e.target.value) || 0 }
              }))}
            />
          </div>
        </div>

        <button onClick={savePrices} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-black">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Apply Prices Now'}
        </button>

        {message.text && (
          <div className={`text-sm p-3 rounded-lg ${
            message.type === 'error' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="text-xs text-dark-200 border-t border-dark-600 pt-4">
          <p>These prices are used for LTC payment generation. The dashboard and landing page will fetch these values automatically.</p>
        </div>
      </div>
    </div>
  );
}
