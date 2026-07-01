'use client';

import { useEffect, useState } from 'react';
import { Users, MessageSquare, Play, DollarSign, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/overview')
      .then(({ data }) => setStats(data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500" /></div>;

  const cards = [
    { icon: Users, label: 'Total Users', value: stats?.totalUsers || 0, href: '/admin/users', color: 'text-blue-400' },
    { icon: KeyIcon, label: 'Discord Accounts', value: stats?.totalAccounts || 0, href: '/admin/accounts', color: 'text-purple-400' },
    { icon: MessageSquare, label: 'Total Campaigns', value: stats?.totalCampaigns || 0, href: '/admin/campaigns', color: 'text-cyan-400' },
    { icon: Play, label: 'Running Now', value: stats?.activeCampaigns || 0, href: '/admin/campaigns', color: 'text-green-400' },
    { icon: TrendingUp, label: 'Messages Sent', value: (stats?.totalSent || 0).toLocaleString(), href: '/admin/campaigns', color: 'text-amber-400' },
    { icon: AlertCircle, label: 'Failed Messages', value: (stats?.totalFailed || 0).toLocaleString(), href: '/admin/campaigns', color: 'text-red-400' },
    { icon: DollarSign, label: 'Revenue (LTC)', value: `${stats?.totalRevenue || 0} LTC`, href: '/admin/subscriptions', color: 'text-yellow-400' },
    { icon: Activity, label: 'Active Subs', value: stats?.totalSubscriptions || 0, href: '/admin/subscriptions', color: 'text-emerald-400' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="card hover:border-amber-700/50 transition-colors group">
            <div className="flex items-start justify-between mb-4"><card.icon className={`w-8 h-8 ${card.color} group-hover:scale-110 transition-transform`} /></div>
            <div className="text-3xl font-bold mb-1">{card.value}</div>
            <div className="text-sm text-dark-100">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/admin/pricing" className="block p-3 rounded-lg bg-dark-700 border border-dark-500 hover:border-amber-700/50 transition-all">
              <DollarSign className="w-5 h-5 text-amber-400 mb-1" /><div className="font-medium">Change Prices</div><div className="text-sm text-dark-100">Update plan pricing instantly</div>
            </Link>
            <Link href="/admin/ltc-settings" className="block p-3 rounded-lg bg-dark-700 border border-dark-500 hover:border-amber-700/50 transition-all">
              <SettingsIcon className="w-5 h-5 text-amber-400 mb-1" /><div className="font-medium">LTC Wallet</div><div className="text-sm text-dark-100">Set payment receiving address</div>
            </Link>
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">System</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-dark-100">API Status</span><span className="text-green-400">Online</span></div>
            <div className="flex justify-between"><span className="text-dark-100">Database</span><span className="text-green-400">Connected</span></div>
            <div className="flex justify-between"><span className="text-dark-100">Worker</span><span className="text-green-400">Active</span></div>
            <Link href="/admin/status" className="block mt-4 text-amber-400 hover:text-amber-300 underline underline-offset-2">Full system status →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function KeyIcon(props: any) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15.5 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M15.5 7.5 3 20"/><path d="m6 17 2-2"/><path d="m11 12 2-2"/></svg>;
}

function SettingsIcon(props: any) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
}
