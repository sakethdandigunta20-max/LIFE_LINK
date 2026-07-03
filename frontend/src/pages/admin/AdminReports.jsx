import React from 'react';
import { FileText, FileSpreadsheet } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const REPORTS = [
  { type: 'donations', label: 'Donations Report', desc: 'All completed and scheduled donations' },
  { type: 'blood_requests', label: 'Blood Requests Report', desc: 'All recipient blood requests' },
  { type: 'organ_requests', label: 'Organ Requests Report', desc: 'All recipient organ requests' },
  { type: 'inventory', label: 'Blood Inventory Report', desc: 'Stock levels across all blood banks' },
  { type: 'hospitals', label: 'Hospitals Report', desc: 'Registered hospital records' },
  { type: 'blood_banks', label: 'Blood Banks Report', desc: 'Registered blood bank records' },
  { type: 'users', label: 'User Activity Report', desc: 'All user accounts and status' },
];

export default function AdminReports() {
  const download = async (type, format) => {
    try {
      const res = await api.get(`/reports/${type}`, { params: { format }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to generate report');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Generate downloadable reports in PDF or CSV format.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORTS.map((r) => (
          <div key={r.type} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">{r.label}</p>
              <p className="text-sm text-gray-500">{r.desc}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => download(r.type, 'csv')} className="btn-secondary !px-3" title="Download CSV">
                <FileSpreadsheet size={16} />
              </button>
              <button onClick={() => download(r.type, 'pdf')} className="btn-primary !px-3" title="Download PDF">
                <FileText size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
