import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeartPulse, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value: "donor", label: "Donor" },
  { value: "recipient", label: "Recipient" },
  { value: "hospital", label: "Hospital" },
  { value: "bloodbank", label: "Blood Bank" },
];

const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "O+",
  "O-",
  "AB+",
  "AB-",
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "donor",
    blood_group: "O+",
    organization_name: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      (form.role === "hospital" || form.role === "bloodbank") &&
      !form.organization_name.trim()
    ) {
      toast.error(
        form.role === "hospital"
          ? "Hospital name is required"
          : "Blood Bank name is required"
      );
      return;
    }

    setLoading(true);

    try {
      const user = await register(form);

      toast.success(`Welcome ${user.name}! Account created successfully.`);

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
        err.response?.data?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-teal-50 px-4 py-10">
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
            Create Your Account
          </h1>

          <p className="text-sm text-gray-500 mb-6">
            Join as a donor, recipient, hospital, or blood bank.
          </p>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {ROLES.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    role: role.value,
                  })
                }
                className={`py-2 rounded-lg text-sm font-semibold border transition-colors ${form.role === role.value
                    ? "bg-brand-600 text-white border-brand-600"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="label">
                {form.role === "hospital" || form.role === "bloodbank"
                  ? "Contact Person Name"
                  : "Full Name"}
              </label>

              <input
                className="input"
                required
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />
            </div>

            {/* Organization */}
            {(form.role === "hospital" ||
              form.role === "bloodbank") && (
                <div>
                  <label className="label">
                    {form.role === "hospital"
                      ? "Hospital Name"
                      : "Blood Bank Name"}
                  </label>

                  <input
                    className="input"
                    required
                    value={form.organization_name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        organization_name: e.target.value,
                      })
                    }
                  />
                </div>
              )}

            {/* Email */}
            <div>
              <label className="label">Email</label>

              <input
                type="email"
                className="input"
                required
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
              />
            </div>

            {/* Phone */}
            <div>
              <label className="label">Phone</label>

              <input
                className="input"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
              />
            </div>

            {/* Blood Group */}
            {form.role === "donor" && (
              <div>
                <label className="label">
                  Blood Group
                </label>

                <select
                  className="input"
                  value={form.blood_group}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      blood_group: e.target.value,
                    })
                  }
                >
                  {BLOOD_GROUPS.map((group) => (
                    <option
                      key={group}
                      value={group}
                    >
                      {group}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="label">
                Password
              </label>

              <input
                type="password"
                minLength={6}
                required
                className="input"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
              />
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

              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>

          </form>

          {/* Login */}
          <p className="text-sm text-gray-500 mt-6 text-center">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-brand-600 font-semibold hover:underline"
            >
              Sign In
            </Link>
          </p>

        </div>

      </div>
    </div>
  );
}