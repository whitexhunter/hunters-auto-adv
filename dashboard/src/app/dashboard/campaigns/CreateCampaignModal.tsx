'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';

interface Props { onClose: () => void; onCreated: () => void; }

export default function CreateCampaignModal({ onClose, onCreated }: Props) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'channel_messaging', accountId: '', channels: [''],
    messages: [{ content: '', delay: 0 }], schedule: 'immediate',
    sendAllAtOnce: false, replyTrigger: '',
  });

  useEffect(() => {
    axios.get('/api/accounts').then(({ data }) => {
      setAccounts(data.accounts || []);
      if (data.accounts?.length) setForm(f => ({ ...f, accountId: data.accounts[0]._id }));
    }).finally(() => setLoading(false));
  }, []);

  function addChannel() { setForm(f => ({ ...f, channels: [...f.channels, ''] })); }
  function removeChannel(i: number) { setForm(f => ({ ...f, channels: f.channels.filter((_, idx) => idx !== i) })); }
  function updateChannel(i: number, v: string) { const channels = [...form.channels]; channels[i] = v; setForm(f => ({ ...f, channels })); }

  function addMessage() { setForm(f => ({ ...f, messages: [...f.messages, { content: '', delay: 0 }] })); }
  function removeMessage(i: number) { setForm(f => ({ ...f, messages: f.messages.filter((_, idx) => idx !== i) })); }
  function updateMessage(i: number, field: string, v: any) { const messages = [...form.messages]; (messages[i] as any)[field] = v; setForm(f => ({ ...f, messages })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.accountId) return;
    setSaving(true);
    try {
      await axios.post('/api/campaigns', {
        ...form,
        channels: form.channels.filter(Boolean),
        messages: form.messages.filter(m => m.content),
      });
      onCreated();
      onClose();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to create campaign'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-dark-600">
          <h2 className="text-xl font-bold">Create Campaign</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Name</label>
            <input className="input-field" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="My Campaign" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Campaign Type</label>
            <select className="input-field" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
              <option value="channel_messaging">Channel Messaging</option>
              <option value="dm_auto_reply">DM Auto-Reply</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Discord Account</label>
            <select className="input-field" value={form.accountId} onChange={e => setForm(f => ({...f, accountId: e.target.value}))}>
              {loading ? <option>Loading...</option> : accounts.map(acc => (
                <option key={acc._id} value={acc._id}>{acc.username || acc.email || 'Unnamed'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Channel IDs</label>
            {form.channels.map((ch, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="input-field flex-1 font-mono text-sm" value={ch} onChange={e => updateChannel(i, e.target.value)} placeholder="123456789012345678" />
                {form.channels.length > 1 && <button type="button" onClick={() => removeChannel(i)} className="btn-danger p-2"><Trash2 className="w-4 h-4" /></button>}
              </div>
            ))}
            <button type="button" onClick={addChannel} className="text-sm text-dark-100 hover:text-accent flex items-center gap-1"><Plus className="w-3 h-3" /> Add Channel</button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Messages</label>
            {form.messages.map((msg, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="input-field flex-1" value={msg.content} onChange={e => updateMessage(i, 'content', e.target.value)} placeholder="Message content..." />
                <input className="input-field w-24 text-sm" value={msg.delay} onChange={e => updateMessage(i, 'delay', parseInt(e.target.value) || 0)} placeholder="Delay ms" type="number" />
                {form.messages.length > 1 && <button type="button" onClick={() => removeMessage(i)} className="btn-danger p-2"><Trash2 className="w-4 h-4" /></button>}
              </div>
            ))}
            <button type="button" onClick={addMessage} className="text-sm text-dark-100 hover:text-accent flex items-center gap-1"><Plus className="w-3 h-3" /> Add Message</button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Schedule</label>
            <select className="input-field" value={form.schedule} onChange={e => setForm(f => ({...f, schedule: e.target.value}))}>
              <option value="immediate">Send Immediately</option>
              <option value="once">Schedule Once</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>

          {form.type === 'dm_auto_reply' && (
            <div>
              <label className="block text-sm font-medium mb-2">Reply Trigger Keyword (optional)</label>
              <input className="input-field" value={form.replyTrigger} onChange={e => setForm(f => ({...f, replyTrigger: e.target.value}))} placeholder="hello, help, ?" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="sendAll" checked={form.sendAllAtOnce} onChange={e => setForm(f => ({...f, sendAllAtOnce: e.target.checked}))} className="rounded border-dark-400 bg-dark-700" />
            <label htmlFor="sendAll" className="text-sm">Send all messages at once (no delay between channels)</label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-dark-600">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Create Campaign
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
