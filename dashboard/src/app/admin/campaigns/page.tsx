'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Trash2, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await axios.patch(`/api/admin/campaigns/${id}/status`, { status });
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed');
    }
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Delete this campaign?')) return;
    try {
      await axios.delete(`/api/admin/campaigns/${id}`);
      fetchCampaigns();
    } catch (err) {
      alert('Failed');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">All Campaigns</h1>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-dark-100 border-b border-dark-600">
                  <th className="text-left py-3 px-2">Name</th>
                  <th className="text-left py-3 px-2">User</th>
                  <th className="text-left py-3 px-2">Type</th>
                  <th className="text-center py-3 px-2">Status</th>
                  <th className="text-center py-3 px-2">Sent</th>
                  <th className="text-center py-3 px-2">Failed</th>
                  <th className="text-right py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((camp)
