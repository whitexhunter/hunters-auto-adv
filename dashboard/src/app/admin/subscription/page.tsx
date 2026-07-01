'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchSubscriptions(); }, [page]);

  async function fetchSubscriptions() {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/subscriptions?page=${page}&limit=30`);
      setSubscriptions(data.subscriptions);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Subscriptions</h1>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-dark-100 border-b border-dark-600">
                  <th className="text-left py-3 px-2">User</th>
                  <th className="text-left py-3 px-2">Plan</th>
                  <th className="text-left py-3 px-2">Method</th>
                  <th className="text-right py-3 px-2">Amount (LTC)</th>
                  <th className="text-center py-3 px-2">Status</th>
                  <th className="text-right py-3 px-2">Expires</th>
                  <th className="text-right py-3 px-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub._id} className="border-b border-dark-700 hover:bg-dark-700/50">
                    <td className="py-3 px-2">
                      <div className="font-medium">{sub.userId?.username || 'Unknown'}</div>
                      <div className="text-dark-200 text-xs">{sub.userId?.email || ''}</div>
                    </td>
                    <td className="py-3 px-2 capitalize">{sub.plan}</td>
                    <td className="py-3 px-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        sub.paymentMethod === 'ltc' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-blue-900/30 text-blue-400'
                      }`}>{sub.paymentMethod}</span>
                    </td>
                    <td className="py-3 px-2 text-right font-mono">{sub.amount}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        sub.status === 'confirmed' ? 'bg-green-900/30 text-green-400' :
                        sub.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                        sub.status === 'expired' ? 'bg-red-900/30 text-red-400' :
                        'bg-dark-600 text-dark-200'
                      }`}>{sub.status}</span>
                    </td>
                    <td className="py-3 px-2 text-right text-xs text-dark-200">
                      {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-2 text-right text-xs text-dark-200">
                      {new Date(sub.createdAt).toLocaleDateString()}
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
