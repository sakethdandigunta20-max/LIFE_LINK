import React, { useEffect, useState } from 'react';
import { Droplet, Award, MapPin, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { StatCard, StatusBadge, BloodGroupTag } from '../../components/UI';

export default function DonorDashboard() {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/donors/me').catch(() => ({ data: { data: null } })),
      api.get('/donors/me/history').catch(() => ({ data: { data: [] } })),
      api.get('/matching/donor/me/recommendations').catch(() => ({ data: { data: [] } })),
    ]).then(([p, h, r]) => {
      setProfile(p.data.data);
      setHistory(h.data.data);
      setRecommendations(r.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const toggleAvailability = async () => {
    const res = await api.put('/donors/me', { is_available: profile.is_available ? 0 : 1 });
    setProfile(res.data.data);
    toast.success(`Marked as ${res.data.data.is_available ? 'available' : 'unavailable'}`);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Donor Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Track your donations and availability status.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Droplet} label="Blood Group" value={profile?.blood_group || '—'} color="brand" />
        <StatCard icon={Award} label="Total Donations" value={history.length} color="teal" />
        <StatCard icon={MapPin} label="Availability" value={profile?.is_available ? 'Available' : 'Unavailable'} color={profile?.is_available ? 'teal' : 'amber'} />
      </div>

      <div className="card flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-semibold text-gray-800">Donation availability</p>
          <p className="text-sm text-gray-500">Toggle this off if you're temporarily unable to donate.</p>
        </div>
        <button onClick={toggleAvailability} className={profile?.is_available ? 'btn-secondary' : 'btn-primary'}>
          {profile?.is_available ? 'Mark Unavailable' : 'Mark Available'}
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-brand-600" />
          <h2 className="font-semibold text-gray-800">Recommended Matches Near You</h2>
        </div>
        {recommendations.length === 0 ? (
          <p className="text-sm text-gray-400">No compatible pending requests right now.</p>
        ) : (
          <div className="space-y-3">
            {recommendations.map((r) => (
              <div key={r.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <BloodGroupTag group={r.blood_group} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.recipient_name} needs {r.units_needed} unit(s)</p>
                    <p className="text-xs text-gray-500">{r.distanceKm ? `${r.distanceKm.toFixed(1)} km away` : 'Distance unknown'}</p>
                  </div>
                </div>
                <StatusBadge status={r.urgency} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Donation History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">No donations recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 capitalize">{h.type}</td>
                    <td className="py-2 pr-4">{h.hospital_name || h.bank_name || '—'}</td>
                    <td className="py-2 pr-4">{h.donation_date || '—'}</td>
                    <td className="py-2"><StatusBadge status={h.status} /></td>
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
