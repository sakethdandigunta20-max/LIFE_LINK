import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, Trash2 } from 'lucide-react';
import api from '../../lib/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/admin/users', { params: { role: role || undefined, q: q || undefined } })
      .then((res) => setUsers(res.data.data.users))
      .finally(() => setLoading(false));
  };

  useEffect(load, [role]);

  const toggleStatus = async (u) => {
    await api.put(`/admin/users/${u.id}/status`, { is_active: !u.is_active });
    toast.success(`User ${u.is_active ? 'deactivated' : 'activated'}`);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Permanently delete this user?')) return;
    await api.delete(`/admin/users/${id}`);
    toast.success('User deleted');
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 text-sm mt-1">Manage all registered accounts across roles.</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            className="input pl-9" placeholder="Search by name or email..."
            value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <select className="input w-44" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All Roles</option>
          <option value="donor">Donor</option>
          <option value="recipient">Recipient</option>
          <option value="hospital">Hospital</option>
          <option value="bloodbank">Blood Bank</option>
          <option value="admin">Admin</option>
        </select>
        <button className="btn-secondary" onClick={load}>Search</button>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Joined</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{u.name}</td>
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4 capitalize">{u.role}</td>
                  <td className="py-2 pr-4">
                    <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="py-2 flex gap-3">
                    <button onClick={() => toggleStatus(u)} className="text-brand-600 font-medium text-xs">
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => remove(u.id)} className="text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
