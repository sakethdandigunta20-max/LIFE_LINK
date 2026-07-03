import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Camera } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put('/profile', form);
      setUser(res.data.data);
      localStorage.setItem('user', JSON.stringify(res.data.data));
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setSavingPw(true);
    try {
      await api.put('/profile/password', pwForm);
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setSavingPw(false);
    }
  };

  const uploadPicture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('picture', file);
    try {
      const res = await api.put('/profile/picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const updatedUser = { ...user, profile_picture: res.data.data.profile_picture };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your personal information and security settings.</p>
      </div>

      <div className="card flex items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xl overflow-hidden">
            {user?.profile_picture ? <img src={user.profile_picture} alt="" className="h-full w-full object-cover" /> : user?.name?.[0]?.toUpperCase()}
          </div>
          <label className="absolute -bottom-1 -right-1 h-6 w-6 bg-white rounded-full border shadow flex items-center justify-center cursor-pointer">
            <Camera size={12} />
            <input type="file" accept="image/*" className="hidden" onChange={uploadPicture} />
          </label>
        </div>
        <div>
          <p className="font-semibold text-gray-800">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email} · <span className="capitalize">{user?.role}</span></p>
        </div>
      </div>

      <form onSubmit={saveProfile} className="card space-y-4">
        <h2 className="font-semibold text-gray-800">Personal Information</h2>
        <div>
          <label className="label">Full Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <button type="submit" disabled={savingProfile} className="btn-primary">Save Changes</button>
      </form>

      <form onSubmit={changePassword} className="card space-y-4">
        <h2 className="font-semibold text-gray-800">Change Password</h2>
        <div>
          <label className="label">Current Password</label>
          <input type="password" required className="input" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
        </div>
        <div>
          <label className="label">New Password</label>
          <input type="password" required minLength={6} className="input" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
        </div>
        <button type="submit" disabled={savingPw} className="btn-primary">Update Password</button>
      </form>
    </div>
  );
}
