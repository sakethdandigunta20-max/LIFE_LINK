import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const ORGAN_OPTIONS = ['kidney', 'liver', 'heart', 'lungs', 'cornea', 'pancreas', 'skin', 'bone_marrow'];

export default function DonorProfile() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/donors/me').then((res) => {
      const d = res.data.data;
      setForm({ ...d, organ_types_arr: d.organ_types ? d.organ_types.split(',') : [] });
    });
  }, []);

  const toggleOrgan = (organ) => {
    setForm((f) => {
      const has = f.organ_types_arr.includes(organ);
      return { ...f, organ_types_arr: has ? f.organ_types_arr.filter((o) => o !== organ) : [...f.organ_types_arr, organ] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, organ_types: form.organ_types_arr.join(',') };
      delete payload.organ_types_arr;
      const res = await api.put('/donors/me', payload);
      toast.success('Profile updated');
      setForm({ ...res.data.data, organ_types_arr: res.data.data.organ_types ? res.data.data.organ_types.split(',') : [] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Donor Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Keep your medical and location details up to date for accurate matching.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Blood Group</label>
            <select className="input" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}>
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date of Birth</label>
            <input type="date" className="input" value={form.date_of_birth?.split('T')[0] || ''} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input type="number" step="0.1" className="input" value={form.weight_kg || ''} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Medical Conditions (if any)</label>
          <textarea className="input" rows={2} value={form.medical_conditions || ''} onChange={(e) => setForm({ ...form, medical_conditions: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">City</label>
            <input className="input" value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label className="label">State</label>
            <input className="input" value={form.state || ''} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div>
            <label className="label">Latitude</label>
            <input type="number" step="0.000001" className="input" value={form.latitude || ''} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
          </div>
          <div>
            <label className="label">Longitude</label>
            <input type="number" step="0.000001" className="input" value={form.longitude || ''} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <input
            id="organDonor" type="checkbox" className="h-4 w-4"
            checked={!!form.is_organ_donor}
            onChange={(e) => setForm({ ...form, is_organ_donor: e.target.checked ? 1 : 0 })}
          />
          <label htmlFor="organDonor" className="text-sm font-medium text-gray-700">I am also willing to be an organ donor</label>
        </div>

        {!!form.is_organ_donor && (
          <div>
            <label className="label">Organs willing to donate</label>
            <div className="flex flex-wrap gap-2">
              {ORGAN_OPTIONS.map((o) => (
                <button
                  type="button" key={o} onClick={() => toggleOrgan(o)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border capitalize ${
                    form.organ_types_arr.includes(o) ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300 text-gray-600'
                  }`}
                >
                  {o.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary">Save Changes</button>
      </form>
    </div>
  );
}
