import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { StatusBadge, UrgencyBadge, BloodGroupTag } from '../../components/UI';

export default function BloodBankRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/blood-requests', { params: filter ? { status: filter } : {} })
      .then((res) => setRequests(res.data.data.requests))
      .finally(() => setLoading(false));
  };
  useEffect(load, [filter]);

  const act = async (id, status) => {
    try {
      await api.put(`/blood-requests/${id}/status`, { status });
      toast.success(`Request ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blood Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Approve, reject, or fulfill incoming requests.</p>
        </div>
        <select className="input w-40" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No requests found.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <BloodGroupTag group={r.blood_group} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.recipient_name} · {r.units_needed} unit(s)</p>
                    <p className="text-xs text-gray-500">{r.recipient_phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <UrgencyBadge urgency={r.urgency} />
                  <StatusBadge status={r.status} />
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => act(r.id, 'approved')} className="btn-secondary !py-1.5 !px-3 text-xs">Approve</button>
                      <button onClick={() => act(r.id, 'rejected')} className="btn-secondary !py-1.5 !px-3 text-xs text-red-600">Reject</button>
                    </>
                  )}
                  {r.status === 'approved' && (
                    <button onClick={() => act(r.id, 'fulfilled')} className="btn-primary !py-1.5 !px-3 text-xs">Fulfill</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
