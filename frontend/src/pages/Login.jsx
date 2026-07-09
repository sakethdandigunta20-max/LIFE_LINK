import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeartPulse, Mail, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const user = await login(form.email, form.password);

      toast.success(`Welcome ${user.name}!`);

      switch (user.role) {
        case "admin":
          navigate("/admin/users");
          break;

        case "hospital":
          navigate("/hospital/requests");
          break;

        case "bloodbank":
          navigate("/bloodbank/inventory");
          break;

        case "recipient":
          navigate("/recipient/requests");
          break;

        case "donor":
          navigate("/donor/profile");
          break;

        default:
          navigate("/dashboard");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-teal-50 px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center">
            <HeartPulse size={22} className="text-white" />
          </div>

          <span className="font-extrabold text-2xl tracking-tight">
            LifeLink
          </span>
        </div>

        {/* Card */}
        <div className="card">

          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Welcome Back
          </h1>

          <p className="text-sm text-gray-500 mb-6">
            Sign in to manage donations, requests, hospitals and blood banks.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="label">Email</label>

              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-3 text-gray-400"
                />

                <input
                  type="email"
                  required
                  className="input pl-9"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>

              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-3 text-gray-400"
                />

                <input
                  type="password"
                  required
                  className="input pl-9"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              )}

              {loading ? "Signing In..." : "Sign In"}
            </button>

          </form>

          {/* Register */}
          <p className="text-sm text-gray-500 mt-6 text-center">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-brand-600 font-semibold hover:underline"
            >
              Register
            </Link>
          </p>

        </div>

        {/* Demo Accounts */}
        <div className="mt-6 rounded-lg bg-white shadow-sm border p-4 text-xs text-gray-600">

          <h3 className="font-bold mb-2 text-gray-800">
            Demo Accounts
          </h3>

          <p><strong>Admin:</strong> admin@example.com</p>
          <p><strong>Hospital:</strong> apollo@test.com</p>
          <p><strong>Blood Bank:</strong> bloodbank@test.com</p>
          <p><strong>Recipient:</strong> recipient@test.com</p>

          <p className="mt-2">
            <strong>Password:</strong> Password123
          </p>

        </div>

      </div>
    </div>
  );
}