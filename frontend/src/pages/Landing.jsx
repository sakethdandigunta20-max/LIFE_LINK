import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, Droplet, Building2, Warehouse, ShieldCheck, BarChart3 } from 'lucide-react';

const FEATURES = [
  { icon: Droplet, title: 'Smart Blood Matching', desc: 'Automatic compatibility matching by blood group, location, and availability.' },
  { icon: HeartPulse, title: 'Organ Donation Workflow', desc: 'End-to-end coordination between donors, hospitals, and recipients.' },
  { icon: Warehouse, title: 'Live Inventory Tracking', desc: 'Real-time blood stock visibility across every partner blood bank.' },
  { icon: Building2, title: 'Hospital Coordination', desc: 'Verify requests and manage transplant workflows seamlessly.' },
  { icon: ShieldCheck, title: 'Verified Network', desc: 'Admin-verified hospitals and blood banks for trusted matching.' },
  { icon: BarChart3, title: 'Actionable Analytics', desc: 'Dashboards tracking donations, requests, and system health.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <HeartPulse size={18} className="text-white" />
            </div>
            <span className="font-extrabold text-xl">LifeLink</span>
          </div>
          <div className="flex gap-3">
            <Link to="/login" className="btn-secondary">Sign In</Link>
            <Link to="/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
          Saving lives through <span className="text-brand-600">smart matching</span>
        </h1>
        <p className="text-gray-500 mt-5 max-w-2xl mx-auto text-lg">
          Connecting blood & organ donors with recipients, hospitals, and blood banks — instantly, transparently, and securely.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/register" className="btn-primary !px-6 !py-3">Register as Donor</Link>
          <Link to="/register" className="btn-secondary !px-6 !py-3">Request Assistance</Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((f) => (
          <div key={f.title} className="card">
            <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
              <f.icon size={22} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
