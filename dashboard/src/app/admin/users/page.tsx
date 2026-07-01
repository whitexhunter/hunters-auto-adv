'use client';

import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Trash2, RefreshCw, Shield, ExternalLink, Loader2 } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/users?page=${page}&limit=20&search=${search}`);
      setUsers(data.users);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function viewUser(id: string) {
    try {
      const { data } = await axios.get(`/api/admin/users/${id}`);
      setSelectedUser(data.user);
      setUserDetails(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function updatePlan(userId: string, plan: string) {
    try {
      await axios.patch(`/api/admin/users/${userId}/plan`, { plan });
      viewUser(userId);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed');
    }
  }

  async function resetTrial(userId: string) {
    if (!confirm('Reset trial for this user?')) return;
    try {
      await axios.patch(`/api/admin/users/${userId}/reset-trial`);
      viewUser(userId);
      fetchUsers();
    } catch (err) {
      alert('Failed');
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm('Delete this user and ALL their data? This cannot be undone.')) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      alert('Failed');
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          className="input-field flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username, Discord ID, or email..."
        />
        <button type="submit" className="btn-primary flex items-center gap-2">
          <Search className="w-4 h-4" /> Search
        </button>
      </form>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-2">
          <div className="card">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-dark-100 border-b border-dark-600">
                      <th className="text-left py-3 px-2">User</th>
                      <th className="text-left py-3 px-2">Discord ID</th>
                      <th className="text-left py-3 px-2">Plan</th>
                      <th className="text-center py-3 px-2">Accounts</th>
                      <th className="text-center py-3 px-2">Campaigns</th>
                      <th className="text-center py-3 px-2">Trial</th>
                      <th className="text-right py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b border-dark-700 hover:bg-dark-700/50 cursor-pointer" onClick={() => viewUser(u._id)}>
                        <td className="py-3 px-2">
                          <div className="font-medium">{u.username}</div>
                          <div className="text-dark-200 text-xs">{u.email || 'No email'}</div>
                        </td>
                        <td className="py-3 px-2 font-mono text-xs text-dark-200">{u.discordId?.slice(0, 12)}...</td>
                        <td className="py-3 px-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            u.plan === 'lifetime' ? 'bg-amber-900/30 text-amber-400' :
                            u.plan === 'v3' ? 'bg-purple-900/30 text-purple-400' :
                            u.plan === 'v2' ? 'bg-blue-900/30 text-blue-400' :
                            u.plan === 'v1' ? 'bg-green-900/30 text-green-400' :
                            'bg-dark-600 text-dark-100'
                          }`}>{u.plan}</span>
                        </td>
                        <td className="py-3 px-2 text-center">{u.accountCount}</td>
                        <td className="py-3 px-2 text-center">{u.campaignCount}</td>
                        <td className="py-3 px-2 text-center">
                          {u.isTrialUsed ? <span className="text-dark-200">Used</span> : <span className="text-green-400">Available</span>}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button onClick={(e) => { e.stopPropagation(); viewUser(u._id); }} className="text-amber-400 hover:text-amber-300 text-xs">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
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

        {/* User Details Panel */}
        <div className="lg:col-span-1">
          {selectedUser ? (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{selectedUser.username}</h3>
                <button onClick={() => setSelectedUser(null)} className="text-dark-200 hover:text-accent">✕</button>
              </div>

              <div className="text-sm space-y-2">
                <div><span className="text-dark-100">Discord ID:</span> <span className="font-mono text-xs">{selectedUser.discordId}</span></div>
                <div><span className="text-dark-100">Email:</span> {selectedUser.email || 'N/A'}</div>
                <div><span className="text-dark-100">Joined:</span> {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
              </div>

              {/* Plan management */}
              <div>
                <label className="text-sm text-dark-100 block mb-1">Plan</label>
                <select
                  className="input-field text-sm"
                  value={selectedUser.plan}
                  onChange={(e) => updatePlan(selectedUser._id, e.target.value)}
                >
                  <option value="free">Free</option>
                  <option value="v1">v1 - Starter</option>
                  <option value="v2">v2 - Professional</option>
                  <option value="v3">v3 - Elite Monthly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>

              {/* Trial reset */}
              <button onClick={() => resetTrial(selectedUser._id)} className="btn-secondary text-sm w-full flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> Reset Free Trial
              </button>

              {/* Accounts */}
              <div>
                <h4 className="text-sm font-medium mb-2">Discord Accounts ({userDetails?.accounts?.length || 0})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userDetails?.accounts?.map((acc: any) => (
                    <div key={acc._id} className="text-xs bg-dark-700 p-2 rounded flex items-center justify-between">
                      <span className="font-mono">{acc.username || acc.email || 'Unknown'}</span>
                      <span className={`px-1.5 py-0.5 rounded ${
                        acc.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                      }`}>{acc.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Campaigns */}
              <div>
                <h4 className="text-sm font-medium mb-2">Campaigns ({userDetails?.campaigns?.length || 0})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userDetails?.campaigns?.map((camp: any) => (
                    <div key={camp._id} className="text-xs bg-dark-700 p-2 rounded flex items-center justify-between">
                      <span>{camp.name}</span>
                      <span className={`px-1.5 py-0.5 rounded ${
                        camp.status === 'running' ? 'bg-green-900/30 text-green-400' :
                        camp.status === 'paused' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-dark-600 text-dark-200'
                      }`}>{camp.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger zone */}
              <div className="pt-4 border-t border-red-900/50">
                <button onClick={() => deleteUser(selectedUser._id)} className="btn-danger text-sm w-full flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete User & All Data
                </button>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12 text-dark-200">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Click on a user to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Users(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
