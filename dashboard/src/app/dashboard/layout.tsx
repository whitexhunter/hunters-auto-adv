'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bot, MessageSquare, Users, CreditCard, LogOut, Menu, BarChart3 } from 'lucide-react';
import axios from 'axios';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    axios.defaults.baseURL = 'https://hunters-api-gnyg.onrender.com';
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    axios.get('/api/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => { localStorage.removeItem('token'); router.push('/login'); })
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-dark-900"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent" /></div>;
  }

  const navItems = [
    { icon: BarChart3, label: 'Overview', href: '/dashboard' },
    { icon: Users, label: 'Accounts', href: '/dashboard/accounts' },
    { icon: MessageSquare, label: 'Campaigns', href: '/dashboard/campaigns' },
    { icon: CreditCard, label: 'Billing', href: '/dashboard/billing' },
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex">
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-dark-800 border-r border-dark-600 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-dark-600">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Bot className="w-8 h-8" />
            <span className="text-lg font-bold">Hunter's<span className="text-dark-100">AutoAdv</span></span>
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-100 hover:text-accent hover:bg-dark-700 transition-all">
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-600">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-dark-500 flex items-center justify-center text-sm font-bold">{user.username?.charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user.username}</div>
                <div className="text-xs text-dark-100 capitalize">{user.plan} Plan</div>
              </div>
              <button onClick={handleLogout} className="text-dark-100 hover:text-red-400 transition-colors" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-dark-900/80 backdrop-blur-sm border-b border-dark-600 px-4 h-16 flex items-center gap-4">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          {user?.plan === 'free' && (
            <Link href="/dashboard/billing" className="ml-auto btn-primary text-sm">Upgrade Plan</Link>
          )}
          {user?.plan !== 'free' && user?.plan !== 'lifetime' && user?.subscriptionExpiresAt && (
            <div className="ml-auto text-xs text-dark-100">Expires: {new Date(user.subscriptionExpiresAt).toLocaleDateString()}</div>
          )}
        </header>
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
