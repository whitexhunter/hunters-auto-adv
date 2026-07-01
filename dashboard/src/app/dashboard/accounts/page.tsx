'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Account { _id: string; email: string; username: string; isOnline: boolean; status: string; createdAt: string; }

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [token, setToken] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchAccounts(); }, []);

  async function fetchAccounts() {
    try {
      const { data } = await axios.get('/api/accounts');
      setAccounts(data.accounts || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function addAccount() {
    setAdding(true);
    try {
      await axios.post('/api/accounts', { token });
      setToken(''); setShowAdd(false);
      fetchAccounts();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to add account'); }
    finally { setAdding(false); }
  }

  async function deleteAccount(id: string) {
    if (!confirm('Delete this account?')) return;
    try { await axios.delete(`/api/accounts/${id}`); fetchAccounts(); }
    catch (err) { console.error(err); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Discord Accounts</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {showAdd && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-3">Add Discord Account</h3>
          <p className="text-sm text-dark-100 mb-4">Paste your Discord user token to add an account.</p>
          <div className="flex gap-3">
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)}
              placeholder="Discord user token (mfa.xxx or OTgxxx...)" className="input-field flex-1 font-mono text-sm" />
            <button onClick={addAccount} disabled={!token || adding} className="btn-primary">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
            </button>
          </div>
          <button onClick={() => { setShowAdd(false); setToken(''); }} className="text-sm text-dark-100 mt-2 hover:text-accent">Cancel</button>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="card text-center py-12">
          <ExternalLink className="w-12 h-12 mx-auto mb-4 text-dark-200" />
          <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
          <p className="text-dark-100 mb-4">Add your first Discord account to get started.</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary">Add Account</button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <div key={acc._id} className="card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${acc.isOnline ? 'bg-green-500' : 'bg-dark-300'}`} />
                <div>
                  <div className="font-medium">{acc.username || 'Unnamed'}</div>
                  <div className="text-sm text-dark-100">{acc.email || 'No email'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full ${acc.status === 'active' ? 'bg-green-900/30 text-green-400' : acc.status === 'rate_limited' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'}`}>{acc.status}</span>
                <button onClick={() => deleteAccount(acc._id)} className="text-dark-200 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
