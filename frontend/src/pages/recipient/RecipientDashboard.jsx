import React, { useEffect, useState } from 'react';
import { HeartPulse, Clock, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../lib/api';
import { StatCard, StatusBadge, UrgencyBadge, BloodGroupTag } from '../../components/UI';

export default function RecipientDashboard() {
  const [data, setData] = useState({ bloodRequests: [], organRequests: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/recipients/me/history').then((res) => setData(res.data.data)).finally(() => setLoading(false));
  }, []);

  const all = [...data.bloodRequests.map((r) => ({ ...r, kind: 'Blood' })), ...data.organRequests.map((r) => ({ ...r, kind: 'Organ' }))]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const pending = all.filter((r) => r.status === 'pending').length;
  const fulfilled = all.filter((r) => r.status === 'fulfilled').length;
  const rejected = all.filter((r) => r.status === 'rejected').length;

  if (loading) return <div className="text-center py-20 text-gray-400">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recipient Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Track your blood and organ requests in one place.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard icon={HeartPulse} label="Total Requests" value={all.length} color="brand" />
        <StatCard icon={Clock} label="Pending" value={pending} color="amber" />
        <StatCard icon={CheckCircle2} label="Fulfilled" value={fulfilled} color="teal" />
        <StatCard icon={XCircle} label="Rejected" value={rejected} color="blue" />
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Recent Requests</h2>
        {all.length === 0 ? (
          <p className="text-sm text-gray-400">No requests yet. Head to "My Requests" to create one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Detail</th>
                  <th className="py-2 pr-4">Urgency</th>
                  <th className="py-2 pr-4">Hospital</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {all.slice(0, 10).map((r) => (
                  <tr key={`${r.kind}-${r.id}`} className="border-b last:border-0">
                    <td className="py-2 pr-4">{r.kind}</td>
                    <td className="py-2 pr-4">
                      {r.kind === 'Blood' ? <BloodGroupTag group={r.blood_group} /> : <span className="capitalize">{r.organ_type}</span>}
                    </td>
                    <td className="py-2 pr-4"><UrgencyBadge urgency={r.urgency} /></td>
                    <td className="py-2 pr-4">{r.hospital_name || '—'}</td>
                    <td className="py-2"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
