import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { StatusBadge, UrgencyBadge, BloodGroupTag } from '../../components/UI';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const ORGAN_TYPES = ['kidney', 'liver', 'heart', 'lungs', 'cornea', 'pancreas', 'skin', 'bone_marrow'];
const URGENCIES = ['low', 'medium', 'high', 'critical'];

export default function RecipientRequests() {
  const [tab, setTab] = useState('blood');
  const [bloodReqs, setBloodReqs] = useState([]);
  const [organReqs, setOrganReqs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ blood_group: 'O+', organ_type: 'kidney', units_needed: 1, urgency: 'medium', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get('/blood-requests/me').then((res) => setBloodReqs(res.data.data));
    api.get('/organ-requests/me').then((res) => setOrganReqs(res.data.data));
  };

  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (tab === 'blood') {
        await api.post('/blood-requests', {
          blood_group: form.blood_group, units_needed: Number(form.units_needed), urgency: form.urgency, notes: form.notes,
        });
      } else {
        await api.post('/organ-requests', { organ_type: form.organ_type, urgency: form.urgency, notes: form.notes });
      }
      toast.success('Request submitted');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async (id, type) => {
    if (!confirm('Cancel this request?')) return;
    await api.put(`/${type}-requests/${id}/cancel`);
    toast.success('Request cancelled');
    load();
  };

  const list = tab === 'blood' ? bloodReqs : organReqs;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Create and track blood or organ requests.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> New Request</button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {['blood', 'organ'].map((t) => (
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
          <p className="text-sm text-gray-400 text-center py-8">No {tab} requests yet.</p>
        ) : (
          <div className="space-y-3">
            {list.map((r) => (
              <div key={r.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {tab === 'blood' ? <BloodGroupTag group={r.blood_group} /> : (
                    <span className="capitalize font-semibold text-gray-700">{r.organ_type}</span>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {tab === 'blood' ? `${r.units_needed} unit(s) needed` : 'Organ transplant needed'}
                    </p>
                    <p className="text-xs text-gray-500">{r.hospital_name || 'No hospital assigned'} · {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UrgencyBadge urgency={r.urgency} />
                  <StatusBadge status={r.status} />
                  {r.status === 'pending' && (
                    <button onClick={() => cancelRequest(r.id, tab)} className="text-gray-400 hover:text-red-600"><X size={18} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">New {tab === 'blood' ? 'Blood' : 'Organ'} Request</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              {tab === 'blood' ? (
                <>
                  <div>
                    <label className="label">Blood Group</label>
                    <select className="input" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}>
                      {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Units Needed</label>
                    <input type="number" min="1" className="input" value={form.units_needed} onChange={(e) => setForm({ ...form, units_needed: e.target.value })} />
                  </div>
                </>
              ) : (
                <div>
                  <label className="label">Organ Type</label>
                  <select className="input" value={form.organ_type} onChange={(e) => setForm({ ...form, organ_type: e.target.value })}>
                    {ORGAN_TYPES.map((o) => <option key={o} value={o} className="capitalize">{o}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Urgency</label>
                <select className="input" value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
                  {URGENCIES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">Submit Request</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
