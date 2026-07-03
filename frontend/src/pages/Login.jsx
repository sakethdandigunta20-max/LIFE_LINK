import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-teal-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center">
            <HeartPulse size={22} className="text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight">LifeLink</span>
        </div>
        <div className="card">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-6">Sign in to manage donations, requests, and records.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email" required className="input pl-9"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password" required className="input pl-9"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Sign In
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-6 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-semibold">Register</Link>
          </p>
        </div>
        <p className="text-xs text-gray-400 text-center mt-6">
          Demo: admin@example.com / donor1@example.com / recipient@example.com — password: Password123!
        </p>
      </div>
    </div>
  );
}
