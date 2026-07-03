import React, { useEffect, useState } from 'react';
import { Users, Droplet, HeartPulse, Award, AlertTriangle, Building2, Warehouse, UserCheck } from 'lucide-react';
import api from '../../lib/api';
import { StatCard, StatusBadge } from '../../components/UI';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/summary'),
      api.get('/admin/emergencies'),
    ]).then(([s, e]) => {
      setStats(s.data.data);
      setEmergencies(e.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return <div className="text-center py-20 text-gray-400">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administrator Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">System-wide overview and controls.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="brand" />
        <StatCard icon={UserCheck} label="Active Donors" value={stats.activeDonors} color="teal" />
        <StatCard icon={Droplet} label="Blood Requests" value={stats.bloodRequests} color="blue" />
        <StatCard icon={HeartPulse} label="Organ Requests" value={stats.organRequests} color="violet" />
        <StatCard icon={Award} label="Successful Donations" value={stats.successfulDonations} color="teal" />
        <StatCard icon={AlertTriangle} label="Emergency Requests" value={stats.emergencyRequests} color="amber" />
        <StatCard icon={Building2} label="Hospitals" value={stats.totalHospitals} color="brand" />
        <StatCard icon={Warehouse} label="Blood Banks" value={stats.totalBloodBanks} color="blue" />
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-red-600" />
          <h2 className="font-semibold text-gray-800">Active Emergency Requests</h2>
        </div>
        {emergencies.length === 0 ? (
          <p className="text-sm text-gray-400">No active emergencies. All clear.</p>
        ) : (
          <div className="space-y-2">
            {emergencies.map((e) => (
              <div key={`${e.request_type}-${e.id}`} className="flex items-center justify-between border border-red-100 bg-red-50 rounded-xl p-3 text-sm">
                <span className="font-medium">{e.recipient_name}</span>
                <span className="capitalize">{e.request_type === 'blood' ? e.blood_group : e.organ_type}</span>
                <StatusBadge status={e.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
