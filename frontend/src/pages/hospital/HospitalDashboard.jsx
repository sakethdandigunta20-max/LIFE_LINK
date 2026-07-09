import React, { useEffect, useState } from "react";
import {
  Building2,
  HeartPulse,
  Droplet,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

import api from "../../lib/api";
import {
  StatCard,
  StatusBadge,
  BloodGroupTag,
} from "../../components/UI";

export default function HospitalDashboard() {
  const [data, setData] = useState({
    bloodRequests: [],
    organRequests: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await api.get(
          "/hospitals/me/patient-requests"
        );

        setData(
          res.data.data || {
            bloodRequests: [],
            organRequests: [],
          }
        );
      } catch (err) {
        console.error(
          "Failed to load hospital dashboard",
          err
        );

        setData({
          bloodRequests: [],
          organRequests: [],
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const all = [
    ...data.bloodRequests,
    ...data.organRequests,
  ];

  const pending = all.filter(
    (r) => r.status === "pending"
  ).length;

  const approved = all.filter(
    (r) =>
      r.status === "approved" ||
      r.status === "fulfilled"
  ).length;

  const rejected = all.filter(
    (r) => r.status === "rejected"
  ).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2
          className="animate-spin text-brand-600"
          size={40}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Hospital Dashboard
        </h1>

        <p className="text-gray-500 mt-2">
          Coordinate blood and organ requests.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">

        <StatCard
          icon={Droplet}
          label="Blood Requests"
          value={data.bloodRequests.length}
          color="brand"
        />

        <StatCard
          icon={HeartPulse}
          label="Organ Requests"
          value={data.organRequests.length}
          color="teal"
        />

        <StatCard
          icon={Clock}
          label="Pending"
          value={pending}
          color="amber"
        />

        <StatCard
          icon={CheckCircle2}
          label="Approved"
          value={approved}
          color="green"
        />

        <StatCard
          icon={XCircle}
          label="Rejected"
          value={rejected}
          color="red"
        />

      </div>

      {/* Blood Requests */}

      <div className="card">

        <div className="flex items-center gap-2 mb-4">
          <Droplet
            size={20}
            className="text-brand-600"
          />

          <h2 className="font-semibold">
            Recent Blood Requests
          </h2>
        </div>

        {data.bloodRequests.length === 0 ? (
          <p className="text-gray-400">
            No blood requests available.
          </p>
        ) : (
          <div className="space-y-3">
            {data.bloodRequests
              .slice(0, 5)
              .map((request) => (
                <div
                  key={request.id}
                  className="border rounded-xl p-4 flex justify-between items-center"
                >
                  <div>
                    <BloodGroupTag
                      group={request.blood_group}
                    />

                    <p className="text-sm mt-1">
                      {request.recipient_name}
                    </p>

                    <p className="text-xs text-gray-500">
                      {request.units_needed} Unit(s)
                    </p>
                  </div>

                  <StatusBadge
                    status={request.status}
                  />
                </div>
              ))}
          </div>
        )}

      </div>

      {/* Organ Requests */}

      <div className="card">

        <div className="flex items-center gap-2 mb-4">

          <Building2
            size={20}
            className="text-brand-600"
          />

          <h2 className="font-semibold">
            Recent Organ Requests
          </h2>

        </div>

        {data.organRequests.length === 0 ? (
          <p className="text-gray-400">
            No organ requests available.
          </p>
        ) : (
          <div className="space-y-3">

            {data.organRequests
              .slice(0, 5)
              .map((request) => (
                <div
                  key={request.id}
                  className="border rounded-xl p-4 flex justify-between items-center"
                >
                  <div>

                    <p className="font-medium">
                      {request.recipient_name}
                    </p>

                    <p className="capitalize text-sm text-gray-600">
                      {request.organ_type}
                    </p>

                  </div>

                  <StatusBadge
                    status={request.status}
                  />

                </div>
              ))}

          </div>
        )}

      </div>

    </div>
  );
}