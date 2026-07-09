import React, { useEffect, useState } from "react";
import {
  Droplet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import api from "../../lib/api";
import {
  StatCard,
  BloodGroupTag,
  UrgencyBadge,
} from "../../components/UI";

export default function BloodBankDashboard() {
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [invRes, reqRes] = await Promise.all([
          api.get("/bloodbanks/me/inventory"),
          api.get("/blood-requests", {
            params: { status: "pending" },
          }),
        ]);

        setInventory(invRes.data.data || []);

        setRequests(
          reqRes.data.data?.requests || []
        );
      } catch (err) {
        console.error(
          "Failed to load Blood Bank Dashboard",
          err
        );

        setInventory([]);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const totalUnits = inventory.reduce(
    (sum, item) => sum + Number(item.units_available),
    0
  );

  const lowStock = inventory.filter(
    (item) => item.units_available < 5
  );

  const healthyStock = inventory.filter(
    (item) => item.units_available >= 5
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2
          size={40}
          className="animate-spin text-brand-600"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}

      <div>

        <h1 className="text-3xl font-bold">
          Blood Bank Dashboard
        </h1>

        <p className="text-gray-500 mt-2">
          Monitor blood inventory and pending
          requests.
        </p>

      </div>

      {/* Statistics */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

        <StatCard
          icon={Droplet}
          label="Total Units"
          value={totalUnits}
          color="brand"
        />

        <StatCard
          icon={AlertTriangle}
          label="Low Stock"
          value={lowStock.length}
          color="amber"
        />

        <StatCard
          icon={CheckCircle2}
          label="Healthy Stock"
          value={healthyStock.length}
          color="green"
        />

        <StatCard
          icon={Droplet}
          label="Pending Requests"
          value={requests.length}
          color="teal"
        />

      </div>

      {/* Inventory */}

      <div className="card">

        <h2 className="text-lg font-semibold mb-5">
          Blood Inventory
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {inventory.map((item) => (
            <div
              key={item.blood_group}
              className={`rounded-xl border p-4 transition-all ${item.units_available < 5
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50"
                }`}
            >

              <BloodGroupTag
                group={item.blood_group}
              />

              <p className="mt-3 text-2xl font-bold">
                {item.units_available}
              </p>

              <p className="text-gray-500 text-sm">
                Units Available
              </p>

            </div>
          ))}

        </div>

      </div>

      {/* Pending Requests */}

      <div className="card">

        <h2 className="text-lg font-semibold mb-5">
          Pending Blood Requests
        </h2>

        {requests.length === 0 ? (
          <div className="text-center py-10">

            <Droplet
              size={50}
              className="mx-auto text-gray-300"
            />

            <p className="mt-3 text-gray-500">
              No pending requests.
            </p>

          </div>
        ) : (
          <div className="space-y-3">

            {requests.slice(0, 10).map((request) => (
              <div
                key={request.id}
                className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-gray-50 transition"
              >

                <div>

                  <p className="font-semibold">
                    {request.recipient_name}
                  </p>

                  <div className="flex items-center gap-2 mt-2">

                    <BloodGroupTag
                      group={request.blood_group}
                    />

                    <span className="text-sm text-gray-500">
                      {request.units_needed} Unit(s)
                    </span>

                  </div>

                </div>

                <UrgencyBadge
                  urgency={request.urgency}
                />

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}