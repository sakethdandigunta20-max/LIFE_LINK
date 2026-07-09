import React, { useEffect, useState } from "react";
import {
  HeartPulse,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import api from "../../lib/api";
import {
  StatCard,
  StatusBadge,
  UrgencyBadge,
  BloodGroupTag,
} from "../../components/UI";

export default function RecipientDashboard() {
  const [data, setData] = useState({
    bloodRequests: [],
    organRequests: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/recipients/me/history");

        setData(
          res.data.data || {
            bloodRequests: [],
            organRequests: [],
          }
        );
      } catch (err) {
        console.error("Failed to load recipient history:", err);

        setData({
          bloodRequests: [],
          organRequests: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const all = [
    ...data.bloodRequests.map((r) => ({
      ...r,
      kind: "Blood",
    })),
    ...data.organRequests.map((r) => ({
      ...r,
      kind: "Organ",
    })),
  ].sort(
    (a, b) =>
      new Date(b.created_at) -
      new Date(a.created_at)
  );

  const pending = all.filter(
    (r) => r.status === "pending"
  ).length;

  const fulfilled = all.filter(
    (r) =>
      r.status === "fulfilled" ||
      r.status === "approved"
  ).length;

  const rejected = all.filter(
    (r) => r.status === "rejected"
  ).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2
          className="animate-spin text-brand-600"
          size={40}
        />

        <p className="mt-4 text-gray-500">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Recipient Dashboard
        </h1>

        <p className="text-gray-500 mt-2">
          Track all your blood and organ
          requests in one place.
        </p>
      </div>

      {/* Statistics */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

        <StatCard
          icon={HeartPulse}
          label="Total Requests"
          value={all.length}
          color="brand"
        />

        <StatCard
          icon={Clock}
          label="Pending"
          value={pending}
          color="amber"
        />

        <StatCard
          icon={CheckCircle2}
          label="Approved / Fulfilled"
          value={fulfilled}
          color="teal"
        />

        <StatCard
          icon={XCircle}
          label="Rejected"
          value={rejected}
          color="red"
        />

      </div>

      {/* Recent Requests */}

      <div className="card">

        <div className="flex items-center justify-between mb-5">

          <h2 className="text-lg font-semibold">
            Recent Requests
          </h2>

          <span className="text-sm text-gray-500">
            {all.length} Total
          </span>

        </div>

        {all.length === 0 ? (
          <div className="py-12 text-center">

            <HeartPulse
              size={50}
              className="mx-auto text-gray-300 mb-4"
            />

            <h3 className="text-lg font-semibold text-gray-700">
              No Requests Yet
            </h3>

            <p className="text-gray-500 mt-2">
              Create your first Blood or Organ
              request from the My Requests page.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="border-b text-left text-gray-500">

                  <th className="py-3 pr-4">
                    Type
                  </th>

                  <th className="py-3 pr-4">
                    Detail
                  </th>

                  <th className="py-3 pr-4">
                    Urgency
                  </th>

                  <th className="py-3 pr-4">
                    Hospital
                  </th>

                  <th className="py-3">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {all
                  .slice(0, 10)
                  .map((r) => (
                    <tr
                      key={`${r.kind}-${r.id}`}
                      className="border-b last:border-0 hover:bg-gray-50 transition"
                    >
                      <td className="py-3 pr-4">

                        {r.kind}

                      </td>

                      <td className="py-3 pr-4">

                        {r.kind ===
                          "Blood" ? (
                          <BloodGroupTag
                            group={r.blood_group}
                          />
                        ) : (
                          <span className="capitalize">
                            {r.organ_type}
                          </span>
                        )}

                      </td>

                      <td className="py-3 pr-4">

                        <UrgencyBadge
                          urgency={r.urgency}
                        />

                      </td>

                      <td className="py-3 pr-4">

                        {r.hospital_name ||
                          "—"}

                      </td>

                      <td className="py-3">

                        <StatusBadge
                          status={r.status}
                        />

                      </td>

                    </tr>
                  ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}