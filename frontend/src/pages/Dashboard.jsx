import React from 'react';
import { useAuth } from '../context/AuthContext';
import DonorDashboard from './donor/DonorDashboard';
import RecipientDashboard from './recipient/RecipientDashboard';
import BloodBankDashboard from './bloodbank/BloodBankDashboard';
import HospitalDashboard from './hospital/HospitalDashboard';
import AdminDashboard from './admin/AdminDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  switch (user?.role) {
    case 'donor': return <DonorDashboard />;
    case 'recipient': return <RecipientDashboard />;
    case 'bloodbank': return <BloodBankDashboard />;
    case 'hospital': return <HospitalDashboard />;
    case 'admin': return <AdminDashboard />;
    default: return null;
  }
}
