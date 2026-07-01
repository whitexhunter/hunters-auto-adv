'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Users, MessageSquare, CreditCard, BarChart3, LogOut, Menu, DollarSign, Activity, Key, Settings } from 'lucide-react';
import axios from 'axios';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { router.push('/admin/login'); return; }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setAdmin({ username: localStorage.getItem('adminUsername') || 'Admin' });
    setLoading(false);
  }, []);

  function handleLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    router.push('/admin/login');
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-dark-900"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500" /></div>;

  const navItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/admin' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: Key, label: 'Accounts (Keys)', href: '/admin/accounts' },
    { icon: MessageSquare, label: 'Campaigns', href: '/admin/campaigns' },
    { icon: CreditCard, label: 'Subscriptions', href: '/admin/subscriptions' },
    { icon: DollarSign, label: 'Pricing', href: '/admin/pricing' },
    { icon: Settings, label: 'LTC Settings', href: '/admin/ltc-settings' },
    { icon: Activity, label: 'System Status', href: '/admin/status' },
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex">
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-dark-800 border-r border-dark-600 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-dark-600">
          <Link href="/admin" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-amber-500" />
            <span className="text-lg font-bold">Hunter's<span className="text-dark-100">Admin</span></span>
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-100 hover:text-amber-400 hover:bg-dark-700 transition-all">
              <item.icon className="w-5 h-5" /><span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-600">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-sm font-bold text-amber-400">{admin?.username?.charAt(0).toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{admin?.username}</div>
              <div className="text-xs text-amber-500">Admin</div>
            </div>
            <button onClick={handleLogout} className="text-dark-100 hover:text-red-400 transition-colors"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-dark-900/80 backdrop-blur-sm border-b border-dark-600 px-4 h-16 flex items-center">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="w-6 h-6" /></button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-dark-100">Admin Panel</span>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
