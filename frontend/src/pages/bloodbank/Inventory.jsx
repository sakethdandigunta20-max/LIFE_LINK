import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import api from '../../lib/api';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [saving, setSaving] = useState(null);

  const load = () => api.get('/bloodbanks/me/inventory').then((res) => setInventory(res.data.data));
  useEffect(() => { load(); }, []);

  const updateLocal = (group, val) => {
    setInventory((inv) => inv.map((i) => (i.blood_group === group ? { ...i, units_available: val } : i)));
  };

  const save = async (group, val) => {
    setSaving(group);
    try {
      await api.put('/bloodbanks/me/inventory', { blood_group: group, units_available: Number(val) });
      toast.success(`${group} inventory updated`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Blood Inventory</h1>
        <p className="text-gray-500 text-sm mt-1">Update stock levels for each blood group.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {inventory.map((i) => (
          <div key={i.blood_group} className="card">
            <p className="text-2xl font-extrabold text-brand-700 mb-2">{i.blood_group}</p>
            <label className="label">Units Available</label>
            <div className="flex gap-2">
              <input
                type="number" min="0" className="input"
                value={i.units_available}
                onChange={(e) => updateLocal(i.blood_group, e.target.value)}
              />
              <button
                onClick={() => save(i.blood_group, i.units_available)}
                disabled={saving === i.blood_group}
                className="btn-primary px-3"
              >
                <Save size={16} />
              </button>
            </div>
            {i.units_available < 5 && <p className="text-xs text-red-600 mt-2 font-medium">⚠ Low stock</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
