'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showTokens, setShowTokens] = useState<Set<string>>(new Set());

  useEffect(() => { fetchAccounts(); }, [page]);

  async function fetchAccounts() {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/accounts?page=${page}&limit=30`);
      setAccounts(data.accounts);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function toggleToken(id: string) {
    const newSet = new Set(showTokens);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setShowTokens(newSet);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Accounts & Keys</h1>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-dark-100 border-b border-dark-600">
                  <th className="text-left py-3 px-2">User</th>
                  <th className="text-left py-3 px-2">Username</th>
                  <th className="text-left py-3 px-2">Token (Encrypted)</th>
                  <th className="text-center py-3 px-2">Status</th>
                  <th className="text-center py-3 px-2">Online</th>
                  <th className="text-right py-3 px-2">Added</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc._id} className="border-b border-dark-700 hover:bg-dark-700/50">
                    <td className="py-3 px-2">
                      <div className="font-medium">{acc.userId?.username || 'Unknown'}</div>
                      <div className="text-dark-200 text-xs">{acc.userId?.email || ''}</div>
                    </td>
                    <td className="py-3 px-2">{acc.username || 'N/A'}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-dark-200">
                          {showTokens.has(acc._id) ? acc.token : `${acc.token?.slice(0, 30)}...`}
                        </span>
                        <button onClick={() => toggleToken(acc._id)} className="text-dark-200 hover:text-accent shrink-0">
                          {showTokens.has(acc._id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        acc.status === 'active' ? 'bg-green-900/30 text-green-400' :
                        acc.status === 'rate_limited' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>{acc.status}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`w-2 h-2 rounded-full inline-block ${acc.isOnline ? 'bg-green-500' : 'bg-dark-400'}`} />
                    </td>
                    <td className="py-3 px-2 text-right text-dark-200 text-xs">
                      {new Date(acc.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-600">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-dark-100">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm flex items-center gap-1">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
