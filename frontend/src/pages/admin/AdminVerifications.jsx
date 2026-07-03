import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import api from '../../lib/api';

export default function AdminVerifications() {
  const [hospitals, setHospitals] = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);

  const load = () => {
    api.get('/admin/hospitals/pending').then((res) => setHospitals(res.data.data));
    api.get('/admin/bloodbanks/pending').then((res) => setBloodBanks(res.data.data));
  };
  useEffect(load, []);

  const verifyHospital = async (id) => {
    await api.put(`/admin/hospitals/${id}/verify`);
    toast.success('Hospital verified');
    load();
  };

  const verifyBank = async (id) => {
    await api.put(`/admin/bloodbanks/${id}/verify`);
    toast.success('Blood bank verified');
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pending Verifications</h1>
        <p className="text-gray-500 text-sm mt-1">Review and verify new hospital and blood bank registrations.</p>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Hospitals</h2>
        {hospitals.length === 0 ? (
          <p className="text-sm text-gray-400">No pending hospital verifications.</p>
        ) : (
          <div className="space-y-2">
            {hospitals.map((h) => (
              <div key={h.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-3 text-sm">
                <div>
                  <p className="font-medium">{h.hospital_name}</p>
                  <p className="text-xs text-gray-500">{h.city}, {h.state} · License: {h.license_number || '—'}</p>
                </div>
                <button onClick={() => verifyHospital(h.id)} className="btn-primary !py-1.5 !px-3 text-xs"><ShieldCheck size={14} /> Verify</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Blood Banks</h2>
        {bloodBanks.length === 0 ? (
          <p className="text-sm text-gray-400">No pending blood bank verifications.</p>
        ) : (
          <div className="space-y-2">
            {bloodBanks.map((b) => (
              <div key={b.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-3 text-sm">
                <div>
                  <p className="font-medium">{b.bank_name}</p>
                  <p className="text-xs text-gray-500">{b.city}, {b.state} · License: {b.license_number || '—'}</p>
                </div>
                <button onClick={() => verifyBank(b.id)} className="btn-primary !py-1.5 !px-3 text-xs"><ShieldCheck size={14} /> Verify</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
