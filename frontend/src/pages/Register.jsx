import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'donor', label: 'Donor' },
  { value: 'recipient', label: 'Recipient' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'bloodbank', label: 'Blood Bank' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: 'donor',
    blood_group: 'O+', organization_name: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Complete your profile to get started.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-teal-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center">
            <HeartPulse size={22} className="text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight">LifeLink</span>
        </div>
        <div className="card">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-6">Join as a donor, recipient, hospital, or blood bank.</p>

          <div className="grid grid-cols-2 gap-2 mb-5">
            {ROLES.map((r) => (
              <button
                type="button" key={r.value}
                onClick={() => setForm({ ...form, role: r.value })}
                className={`py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  form.role === r.value ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{form.role === 'hospital' || form.role === 'bloodbank' ? 'Contact Person Name' : 'Full Name'}</label>
              <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            {(form.role === 'hospital' || form.role === 'bloodbank') && (
              <div>
                <label className="label">{form.role === 'hospital' ? 'Hospital Name' : 'Blood Bank Name'}</label>
                <input required className="input" value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} />
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>

            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>

            {form.role === 'donor' && (
              <div>
                <label className="label">Blood Group</label>
                <select className="input" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}>
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="label">Password</label>
              <input type="password" required minLength={6} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Create Account
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-6 text-center">
            Already have an account? <Link to="/login" className="text-brand-600 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
