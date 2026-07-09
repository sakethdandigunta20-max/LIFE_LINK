import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>

          <p className="text-gray-500 text-sm">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // User is not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User doesn't have the required role
  if (roles && !roles.includes(user.role)) {
    switch (user.role) {
      case "admin":
        return <Navigate to="/admin/users" replace />;

      case "hospital":
        return <Navigate to="/hospital/requests" replace />;

      case "bloodbank":
        return <Navigate to="/bloodbank/inventory" replace />;

      case "recipient":
        return <Navigate to="/recipient/requests" replace />;

      case "donor":
        return <Navigate to="/donor/profile" replace />;

      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}