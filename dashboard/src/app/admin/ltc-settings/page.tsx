'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Wallet } from 'lucide-react';
import axios from 'axios';

export default function LTCSettingsPage() {
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    axios.get('/api/admin/ltc-address')
      .then(({ data }) => {
        setAddress(data.address || '');
        setLabel(data.label || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveSettings() {
    if (!address.trim()) {
      setMessage({ text: 'Wallet address is required', type: 'error' });
      return;
    }
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      await axios.post('/api/admin/ltc-address', { address: address.trim(), label: label.trim() });
      setMessage({ text: 'LTC wallet address updated!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || 'Failed to save', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">LTC Wallet Settings</h1>
      <p className="text-dark-100 mb-6">Set the Litecoin address where payments are received.</p>

      <div className="card space-y-6">
        <div className="flex items-center gap-3 p-4 bg-dark-700 rounded-lg">
          <Wallet className="w-8 h-8 text-amber-400" />
          <div>
            <div className="font-medium">Current Address</div>
            <div className="text-sm text-dark-100 font-mono break-all">{address || 'Not set'}</div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Litecoin Address</label>
          <input
            className="input-field font-mono text-sm"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="LTC address starting with L or M..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Label (optional)</label>
          <input
            className="input-field"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Main Wallet / Hot Wallet / etc."
          />
        </div>

        <button onClick={saveSettings} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-black">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Wallet Address'}
        </button>

        {message.text && (
          <div className={`text-sm p-3 rounded-lg ${
            message.type === 'error' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
