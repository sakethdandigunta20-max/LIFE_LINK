import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { StatusBadge, UrgencyBadge } from '../../components/UI';

export default function PatientRequests() {
  const [data, setData] = useState({ bloodRequests: [], organRequests: [] });
  const [tab, setTab] = useState('organ');

  const load = () => api.get('/hospitals/me/patient-requests').then((res) => setData(res.data.data));
  useEffect(load, []);

  const actOrgan = async (id, status) => {
    try {
      await api.put(`/organ-requests/${id}/status`, { status });
      toast.success(`Organ request ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const list = tab === 'organ' ? data.organRequests : data.bloodRequests;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Patient Requests</h1>
        <p className="text-gray-500 text-sm mt-1">Verify recipient requests and approve organ donation workflows.</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {['organ', 'blood'].map((t) => (
          <button
            key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px capitalize ${
              tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500'
            }`}
          >
            {t} Requests
          </button>
        ))}
      </div>

      <div className="card">
        {list.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No {tab} requests found.</p>
        ) : (
          <div className="space-y-3">
            {list.map((r) => (
              <div key={r.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-4 flex-wrap gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {r.recipient_name} {tab === 'organ' ? `· ${r.organ_type}` : `· ${r.blood_group} (${r.units_needed} units)`}
                  </p>
                  <p className="text-xs text-gray-500">{r.recipient_phone}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <UrgencyBadge urgency={r.urgency} />
                  <StatusBadge status={r.status} />
                  {tab === 'organ' && r.status === 'pending' && (
                    <>
                      <button onClick={() => actOrgan(r.id, 'approved')} className="btn-secondary !py-1.5 !px-3 text-xs">Approve</button>
                      <button onClick={() => actOrgan(r.id, 'rejected')} className="btn-secondary !py-1.5 !px-3 text-xs text-red-600">Reject</button>
                    </>
                  )}
                  {tab === 'organ' && r.status === 'approved' && (
                    <button onClick={() => actOrgan(r.id, 'fulfilled')} className="btn-primary !py-1.5 !px-3 text-xs">Mark Fulfilled</button>
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
