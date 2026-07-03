import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

import DonorProfile from './pages/donor/DonorProfile';
import RecipientRequests from './pages/recipient/RecipientRequests';
import Inventory from './pages/bloodbank/Inventory';
import BloodBankRequests from './pages/bloodbank/BloodBankRequests';
import PatientRequests from './pages/hospital/PatientRequests';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVerifications from './pages/admin/AdminVerifications';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminReports from './pages/admin/AdminReports';

function withLayout(children) {
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<ProtectedRoute>{withLayout(<Dashboard />)}</ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute>{withLayout(<Search />)}</ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute>{withLayout(<Profile />)}</ProtectedRoute>} />

      <Route path="/donor/profile" element={<ProtectedRoute roles={['donor']}>{withLayout(<DonorProfile />)}</ProtectedRoute>} />

      <Route path="/recipient/requests" element={<ProtectedRoute roles={['recipient']}>{withLayout(<RecipientRequests />)}</ProtectedRoute>} />

      <Route path="/bloodbank/inventory" element={<ProtectedRoute roles={['bloodbank']}>{withLayout(<Inventory />)}</ProtectedRoute>} />
      <Route path="/bloodbank/requests" element={<ProtectedRoute roles={['bloodbank']}>{withLayout(<BloodBankRequests />)}</ProtectedRoute>} />

      <Route path="/hospital/requests" element={<ProtectedRoute roles={['hospital']}>{withLayout(<PatientRequests />)}</ProtectedRoute>} />

      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}>{withLayout(<AdminUsers />)}</ProtectedRoute>} />
      <Route path="/admin/verifications" element={<ProtectedRoute roles={['admin']}>{withLayout(<AdminVerifications />)}</ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}>{withLayout(<AdminAnalytics />)}</ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}>{withLayout(<AdminReports />)}</ProtectedRoute>} />

      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
