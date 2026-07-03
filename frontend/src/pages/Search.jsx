import React, { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import api from '../lib/api';
import { BloodGroupTag, StatusBadge } from '../components/UI';

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const ORGAN_TYPES = ['', 'kidney', 'liver', 'heart', 'lungs', 'cornea', 'pancreas', 'skin', 'bone_marrow'];

export default function SearchPage() {
  const [type, setType] = useState('donors');
  const [filters, setFilters] = useState({ q: '', blood_group: '', organ_type: '', city: '' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get('/search', { params: { type, ...filters } });
      setResults(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search & Filter</h1>
        <p className="text-gray-500 text-sm mt-1">Find donors, blood banks, hospitals, or emergency requests.</p>
      </div>

      <div className="card space-y-4">
        <div className="flex gap-2 flex-wrap">
          {['donors', 'bloodbanks', 'hospitals', 'emergency'].map((t) => (
            <button
              key={t} onClick={() => setType(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${
                type === t ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-3 text-gray-400" />
            <input className="input pl-9" placeholder="Name..." value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
          </div>
          {type === 'donors' && (
            <>
              <select className="input" value={filters.blood_group} onChange={(e) => setFilters({ ...filters, blood_group: e.target.value })}>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g || 'Any Blood Group'}</option>)}
              </select>
              <select className="input" value={filters.organ_type} onChange={(e) => setFilters({ ...filters, organ_type: e.target.value })}>
                {ORGAN_TYPES.map((o) => <option key={o} value={o}>{o || 'Any Organ Type'}</option>)}
              </select>
            </>
          )}
          {(type === 'donors' || type === 'bloodbanks' || type === 'hospitals') && (
            <input className="input" placeholder="City..." value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} />
          )}
          <button onClick={runSearch} className="btn-primary">Search</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Searching...</p>
        ) : !searched ? (
          <p className="text-sm text-gray-400 text-center py-8">Set your filters and click search.</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No results found.</p>
        ) : (
          <div className="space-y-3">
            {results.map((r, idx) => (
              <div key={r.id || idx} className="flex items-center justify-between border border-gray-100 rounded-xl p-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {type === 'donors' && <BloodGroupTag group={r.blood_group} />}
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.name || r.bank_name || r.hospital_name || r.recipient_name}</p>
                    <p className="text-xs text-gray-500">{r.city ? `${r.city}, ${r.state || ''}` : r.organ_type || r.blood_group}</p>
                  </div>
                </div>
                {r.status && <StatusBadge status={r.status} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
