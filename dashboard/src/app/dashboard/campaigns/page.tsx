'use client';

import { useEffect, useState } from 'react';
import { Plus, Play, Pause, Trash2, Loader2, MessageSquare } from 'lucide-react';
import axios from 'axios';
import CreateCampaignModal from './CreateCampaignModal';

interface Campaign { _id: string; name: string; type: string; status: string; channels: string[]; accountId: { username: string; email: string }; stats: { sent: number; failed: number; replied: number }; createdAt: string; }

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchCampaigns(); }, []);

  async function fetchCampaigns() {
    try {
      const { data } = await axios.get('/api/campaigns');
      setCampaigns(data.campaigns || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function toggleStatus(campaign: Campaign) {
    const newStatus = campaign.status === 'running' ? 'paused' : 'running';
    try { await axios.patch(`/api/campaigns/${campaign._id}/status`, { status: newStatus }); fetchCampaigns(); }
    catch (err) { console.error(err); }
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Delete this campaign?')) return;
    try { await axios.delete(`/api/campaigns/${id}`); fetchCampaigns(); }
    catch (err) { console.error(err); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Campaign
        </button>
      </div>

      {showCreate && <CreateCampaignModal onClose={() => setShowCreate(false)} onCreated={fetchCampaigns} />}

      {campaigns.length === 0 ? (
        <div className="card text-center py-12">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-dark-200" />
          <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
          <p className="text-dark-100 mb-4">Create your first messaging campaign.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">Create Campaign</button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((camp) => (
            <div key={camp._id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{camp.name}</h3>
                  <div className="text-sm text-dark-100">
                    {camp.type === 'channel_messaging' ? '
		    {camp.type === 'channel_messaging' ? 'Channel Messaging' : 'DM Auto-Reply'}
                    {' · '}Account: {camp.accountId?.username || 'Unknown'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    camp.status === 'running' ? 'bg-green-900/30 text-green-400' :
                    camp.status === 'paused' ? 'bg-yellow-900/30 text-yellow-400' :
                    camp.status === 'completed' ? 'bg-blue-900/30 text-blue-400' :
                    'bg-red-900/30 text-red-400'
                  }`}>{camp.status}</span>
                  {camp.status !== 'completed' && (
                    <button onClick={() => toggleStatus(camp)} className="btn-secondary p-2">
                      {camp.status === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  )}
                  <button onClick={() => deleteCampaign(camp._id)} className="btn-danger p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex gap-6 text-sm text-dark-100">
                <span>Sent: <span className="text-accent font-medium">{camp.stats?.sent || 0}</span></span>
                <span>Failed: <span className="text-red-400 font-medium">{camp.stats?.failed || 0}</span></span>
                {camp.type === 'dm_auto_reply' && <span>Replied: <span className="text-accent font-medium">{camp.stats?.replied || 0}</span></span>}
                <span>Channels: <span className="text-accent font-medium">{camp.channels?.length || 0}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
