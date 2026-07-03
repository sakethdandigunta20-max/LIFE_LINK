import React, { useEffect, useState } from 'react';
import { Droplet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import { StatCard } from '../../components/UI';

export default function BloodBankDashboard() {
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/bloodbanks/me/inventory'),
      api.get('/blood-requests', { params: { status: 'pending' } }),
    ]).then(([inv, reqs]) => {
      setInventory(inv.data.data);
      setRequests(reqs.data.data.requests);
    }).finally(() => setLoading(false));
  }, []);

  const totalUnits = inventory.reduce((s, i) => s + i.units_available, 0);
  const lowStock = inventory.filter((i) => i.units_available < 5);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Blood Bank Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor inventory and pending fulfillment requests.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Droplet} label="Total Units in Stock" value={totalUnits} color="brand" />
        <StatCard icon={AlertTriangle} label="Low Stock Groups" value={lowStock.length} color="amber" />
        <StatCard icon={CheckCircle2} label="Pending Requests" value={requests.length} color="teal" />
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Current Inventory</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {inventory.map((i) => (
            <div key={i.blood_group} className={`rounded-xl p-4 border ${i.units_available < 5 ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
              <p className="text-lg font-extrabold text-brand-700">{i.blood_group}</p>
              <p className="text-sm text-gray-600">{i.units_available} units</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Pending Blood Requests</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-gray-400">No pending requests right now.</p>
        ) : (
          <div className="space-y-2">
            {requests.slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-3 text-sm">
                <span className="font-medium">{r.recipient_name}</span>
                <span>{r.blood_group} · {r.units_needed} unit(s)</span>
                <span className="capitalize text-gray-500">{r.urgency}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
