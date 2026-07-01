'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Users, Play, TrendingUp } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

export default function DashboardOverview() {
  const [stats, setStats] = useState({ accounts: 0, campaigns: 0, running: 0, messagesSent: 0 });

  useEffect(() => {
    Promise.all([axios.get('/api/accounts'), axios.get('/api/campaigns')])
      .then(([accountsRes, campaignsRes]) => {
        const campaigns = campaignsRes.data.campaigns || [];
        setStats({
          accounts: accountsRes.data.accounts?.length || 0,
          campaigns: campaigns.length,
          running: campaigns.filter((c: any) => c.status === 'running').length,
          messagesSent: campaigns.reduce((sum: number, c: any) => sum + (c.stats?.sent || 0), 0),
        });
      }).catch(console.error);
  }, []);

  const cards = [
    { icon: Users, label: 'Discord Accounts', value: stats.accounts, href: '/dashboard/accounts', color: 'text-blue-400' },
    { icon: MessageSquare, label: 'Campaigns', value: stats.campaigns, href: '/dashboard/campaigns', color: 'text-purple-400' },
    { icon: Play, label: 'Running', value: stats.running, href: '/dashboard/campaigns', color: 'text-green-400' },
    { icon: TrendingUp, label: 'Messages Sent', value: stats.messagesSent.toLocaleString(), href: '/dashboard/campaigns', color: 'text-amber-400' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="card hover:border-accent-dark/50 transition-colors group">
            <div className="flex items-start justify-between mb-4">
              <card.icon className={`w-8 h-8 ${card.color} group-hover:scale-110 transition-transform`} />
            </div>
            <div className="text-3xl font-bold mb-1">{card.value}</div>
            <div className="text-sm text-dark-100">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/dashboard/accounts" className="p-4 rounded-lg bg-dark-700 border border-dark-500 hover:border-accent-dark/50 transition-all">
            <Users className="w-6 h-6 mb-2 text-blue-400" />
            <div className="font-medium">Add Account</div>
            <div className="text-sm text-dark-100">Connect a Discord token</div>
          </Link>
          <Link href="/dashboard/campaigns" className="p-4 rounded-lg bg-dark-700 border border-dark-500 hover:border-accent-dark/50 transition-all">
            <MessageSquare className="w-6 h-6 mb-2 text-purple-400" />
            <div className="font-medium">Create Campaign</div>
            <div className="text-sm text-dark-100">Start channel messaging</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
