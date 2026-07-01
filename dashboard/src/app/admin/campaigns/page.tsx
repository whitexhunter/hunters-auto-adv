'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Trash2, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchCampaigns(); }, [page]);

  async function fetchCampaigns() {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/campaigns?page=${page}&limit=30`);
      setCampaigns(data.campaigns);
      setTotalPages(data.pagination.pages);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await axios.patch(`/api/admin/campaigns/${id}/status`, { status });
      fetchCampaigns();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed'); }
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Delete this campaign?')) return;
    try { await axios.delete(`/api/admin/campaigns/${id}`); fetchCampaigns(); }
    catch (err) { alert('Failed'); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">All Campaigns</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">User</th>
              <th className="text-left py-3 px-4">Type</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Sent</th>
              <th className="text-left py-3 px-4">Failed</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((camp: any) => (
              <tr key={camp._id} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                <td className="py-3 px-4">{camp.name}</td>
                <td className="py-3 px-4">{camp.userId?.username || 'N/A'}</td>
                <td className="py-3 px-4">{camp.type}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${camp.status === 'running' ? 'bg-green-500/20 text-green-400' : camp.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>{camp.status}</span>
                </td>
                <td className="py-3 px-4">{camp.stats?.sent || 0}</td>
                <td className="py-3 px-4">{camp.stats?.failed || 0}</td>
                <td className="py-3 px-4 flex gap-2">
                  {camp.status === 'running' ? (
                    <button onClick={() => updateStatus(camp._id, 'paused')} className="btn-secondary p-2"><Pause className="w-4 h-4" /></button>
                  ) : camp.status !== 'completed' ? (
                    <button onClick={() => updateStatus(camp._id, 'running')} className="btn-secondary p-2"><Play className="w-4 h-4" /></button>
                  ) : null}
                  <button onClick={() => deleteCampaign(camp._id)} className="btn-danger p-2"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary p-2"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
