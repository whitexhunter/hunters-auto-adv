'use client';

import { useEffect, useState } from 'react';
import { Activity, Database, Cloud, Users, MessageSquare, Play, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function AdminStatusPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/status')
      .then(({ data }) => setStatus(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const statusCards = [
    { icon: Database, label: 'Database', value: status?.database || 'unknown', color: status?.database === 'connected' ? 'text-green-400' : 'text-red-400' },
    { icon: Cloud, label: 'Redis', value: status?.redis || 'unknown', color: status?.redis === 'connected' ? 'text-green-400' : 'text-red-400' },
    { icon: Activity, label: 'Uptime', value: status?.uptime ? `${Math.floor(status.uptime / 60)} min` : 'N/A', color: 'text-blue-400' },
    { icon: Users, label: 'Total Users', value: status?.stats?.users || 0, color: 'text-purple-400' },
    { icon: MessageSquare, label: 'Campaigns', value: status?.stats?.campaigns || 0, color: 'text-cyan-400' },
    { icon: Play, label: 'Running Now', value: status?.stats?.runningCampaigns || 0, color: 'text-green-400' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">System Status</h1>
      <p className="text-dark-100 mb-6">Real-time status of all services.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statusCards.map((card) => (
          <div key={card.label} className="card">
            <div className="flex items-center gap-3">
              <card.icon className={`w-8 h-8 ${card.color}`} />
              <div>
                <div className="text-sm text-dark-100">{card.label}</div>
                <div className="text-xl font-bold">{card.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Memory */}
      {status?.memoryUsage && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Memory Usage</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-100">RSS</span>
              <span>{(status.memoryUsage.rss / 1024 / 1024).toFixed(1)} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-100">Heap Total</span>
              <span>{(status.memoryUsage.heapTotal / 1024 / 1024).toFixed(1)} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-100">Heap Used</span>
              <span>{(status.memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-100">External</span>
              <span>{(status.memoryUsage.external / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
