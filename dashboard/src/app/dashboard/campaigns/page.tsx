'use client';

import { useEffect, useState } from 'react';
import { Plus, Play, Pause, Trash2, Loader2, MessageSquare } from 'lucide-react';
import axios from 'axios';
import CreateCampaignModal from './CreateCampaignModal';

interface Campaign {
  _id: string;
  name: string;
  type: string;
  status: string;
  channels: string[];
  accountId: { username: string; email: string };
  stats: { sent: number; failed: number; replied: number };
  createdAt: string;
}

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
    try {
      await axios.patch(`/api/campaigns/${campaign._id}/status`, { status: newStatus });
      fetchCampaigns();
    } catch (err) { console.error(err); }
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Delete this campaign?')) return;
    try { await axios.delete(`/api/campaigns/${id}`); fetchCampaigns(); }
    catch (err) { console.error(err); }
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Campaign
        </button>
      </div>

      {showCreate && <CreateCampaignModal onClose={() => setShowCreate(false)} onCreated={fetchCampaigns} />}

      {campaigns.length === 0 ? (
        <div className="card text-center py-12">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
          <p className="text-gray-400 mb-4">Create your first messaging campaign.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">Create Campaign</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((camp) => (
            <div key={camp._id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{camp.name}</h3>
                  <p className="text-sm text-gray-400">
                    {camp.type === 'channel_messaging' ? 'Channel Messaging' : 'DM Auto-Reply'}
                    {' · '}Account: {camp.accountId?.username || 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${camp.status === 'running' ? 'bg-green-500/20 text-green-400' : camp.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>{camp.status}</span>
                  {camp.status !== 'completed' && (
                    <button onClick={() => toggleStatus(camp)} className="btn-secondary p-2">
                      {camp.status === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  )}
                  <button onClick={() => deleteCampaign(camp._id)} className="btn-danger p-2"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-sm text-gray-400">
                <span>Sent: {camp.stats?.sent || 0}</span>
                <span>Failed: {camp.stats?.failed || 0}</span>
                {camp.type === 'dm_auto_reply' && <span>Replied: {camp.stats?.replied || 0}</span>}
                <span>Channels: {camp.channels?.length || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
