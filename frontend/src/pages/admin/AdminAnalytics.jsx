import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../lib/api';

const COLORS = ['#dc2626', '#0d9488', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#6366f1'];

export default function AdminAnalytics() {
  const [bloodStock, setBloodStock] = useState([]);
  const [trends, setTrends] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [emergency, setEmergency] = useState({ blood: [], organ: [] });
  const [facility, setFacility] = useState({ hospitals: [], bloodBanks: [] });

  useEffect(() => {
    api.get('/analytics/blood-stock').then((r) => setBloodStock(r.data.data));
    api.get('/analytics/donation-trends').then((r) => setTrends(r.data.data));
    api.get('/analytics/blood-group-distribution').then((r) => setDistribution(r.data.data));
    api.get('/analytics/registration-trends').then((r) => setRegistrations(r.data.data));
    api.get('/analytics/emergency-stats').then((r) => setEmergency(r.data.data));
    api.get('/analytics/facility-activity').then((r) => setFacility(r.data.data));
  }, []);

  // Reshape registrations for stacked-by-role line chart
  const regByMonth = {};
  registrations.forEach((r) => {
    regByMonth[r.month] = regByMonth[r.month] || { month: r.month };
    regByMonth[r.month][r.role] = r.count;
  });
  const regData = Object.values(regByMonth);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visual insights into system-wide activity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Blood Stock Levels</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={bloodStock}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis dataKey="blood_group" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="total_units" fill="#dc2626" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Donor Blood Group Distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={distribution} dataKey="count" nameKey="blood_group" cx="50%" cy="50%" outerRadius={95} label>
                {distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Monthly Donation Trends</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">User Registration Trends</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={regData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="donor" stroke="#dc2626" strokeWidth={2} />
              <Line type="monotone" dataKey="recipient" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="hospital" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="bloodbank" stroke="#0d9488" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Emergency Request Status (Blood)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={emergency.blood}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis dataKey="status" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Emergency Request Status (Organ)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={emergency.organ}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis dataKey="status" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4">Hospital & Blood Bank Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Top Hospitals by Requests</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={facility.hospitals} layout="vertical">
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="hospital_name" width={110} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="blood_requests" fill="#dc2626" stackId="a" />
                  <Bar dataKey="organ_requests" fill="#0d9488" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Top Blood Banks by Fulfillment</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={facility.bloodBanks} layout="vertical">
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="bank_name" width={110} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="requests_fulfilled" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
