import React, { useEffect, useState } from 'react';
import { Building2, HeartPulse, Droplet } from 'lucide-react';
import api from '../../lib/api';
import { StatCard, StatusBadge } from '../../components/UI';

export default function HospitalDashboard() {
  const [data, setData] = useState({ bloodRequests: [], organRequests: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hospitals/me/patient-requests').then((res) => setData(res.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hospital Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Coordinate patient requests with blood banks and donors.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Droplet} label="Blood Requests" value={data.bloodRequests.length} color="brand" />
        <StatCard icon={HeartPulse} label="Organ Requests" value={data.organRequests.length} color="teal" />
        <StatCard icon={Building2} label="Pending Review" value={[...data.bloodRequests, ...data.organRequests].filter((r) => r.status === 'pending').length} color="amber" />
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Recent Organ Requests</h2>
        {data.organRequests.length === 0 ? (
          <p className="text-sm text-gray-400">No organ requests routed to your hospital yet.</p>
        ) : (
          <div className="space-y-2">
            {data.organRequests.slice(0, 6).map((r) => (
              <div key={r.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-3 text-sm">
                <span className="font-medium">{r.recipient_name}</span>
                <span className="capitalize">{r.organ_type}</span>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
