'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      // Show login form if no token
      setLoading(false);
      return;
    }
    // ★ THE KEY FIX — set base URL for all admin axios calls
    axios.defaults.baseURL = 'https://hunters-api-gnyg.onrender.com';
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Verify token by fetching overview
    axios.get('/api/admin/overview')
      .then(() => setAdmin({ username: 'admin' }))
      .catch(() => {
        localStorage.removeItem('adminToken');
      })
      .finally(() => setLoading(false));
  }, []);

  // If no token, show admin login form
  if (!localStorage.getItem('adminToken')) {
    return <AdminLogin />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  const navItems = [
    { label: 'Overview', href: '/admin' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Campaigns', href: '/admin/campaigns' },
    { label: 'Pricing', href: '/admin/pricing' },
    { label: 'Subscriptions', href: '/admin/subscription' },
    { label: 'Status', href: '/admin/status' },
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-dark-800 min-h-screen p-4 border-r border-dark-700">
          <h2 className="text-lg font-bold text-accent mb-6">Admin Panel</h2>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2.5 rounded-lg text-sm transition-all ${
                  pathname === item.href
                    ? 'bg-accent/10 text-accent'
                    : 'text-dark-100 hover:text-accent hover:bg-dark-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-4 border-t border-dark-700">
            <button
              onClick={() => {
                localStorage.removeItem('adminToken');
                router.push('/admin');
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-dark-700 rounded-lg"
            >
              Logout
            </button>
          </div>
        </aside>
        {/* Main content */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('https://hunters-api-gnyg.onrender.com/api/admin/auth/login', {
        username, password
      });
      localStorage.setItem('adminToken', data.token);
      window.location.href = '/admin';
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="bg-dark-800 p-8 rounded-xl w-full max-w-md border border-dark-700">
        <h1 className="text-2xl font-bold text-white mb-6">Admin Login</h1>
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-dark-300 focus:outline-none focus:border-accent"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2.5 text-white placeholder-dark-300 focus:outline-none focus:border-accent"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-accent hover:bg-accent/90 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
