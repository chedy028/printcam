"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

interface Order {
  id: number;
  token: string;
  design_name: string;
  design_slug: string;
  color: string;
  size: string;
  status: string;
  email: string | null;
  tracking_number: string | null;
  stream_path: string | null;
  progress: number | null;
  created_at: string;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading dashboard...</div></div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const adminToken = searchParams.get("token") || "";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [trackingInput, setTrackingInput] = useState<Record<number, string>>({});

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue?token=${adminToken}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  async function doAction(orderId: number, action: string, extra?: Record<string, string>) {
    setActionLoading(orderId);
    try {
      await fetch(`/api/queue/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ action, ...extra }),
      });
      await fetchOrders();
    } finally {
      setActionLoading(null);
    }
  }

  if (!adminToken) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <p className="text-gray-500">
          Access denied. Add ?token=YOUR_ADMIN_TOKEN to the URL.
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">PrintCam Dashboard</h1>

      {loading ? (
        <div className="animate-pulse text-gray-400">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          No orders in the queue. Time to relax!
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${
                order.status === "printing"
                  ? "border-green-500"
                  : order.status === "queued"
                    ? "border-yellow-500"
                    : "border-blue-500"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">
                    {order.design_name}{" "}
                    <span className="text-sm text-gray-400">#{order.id}</span>
                  </h3>
                  <div className="flex gap-4 text-sm text-gray-500 mt-1">
                    <span
                      className="font-medium px-2 py-0.5 rounded"
                      style={{
                        backgroundColor:
                          order.status === "printing"
                            ? "#dcfce7"
                            : order.status === "queued"
                              ? "#fef9c3"
                              : "#dbeafe",
                      }}
                    >
                      {order.status}
                    </span>
                    <span>Color: <strong>{order.color}</strong></span>
                    <span>Size: <strong>{order.size}</strong></span>
                  </div>
                </div>
                {order.progress !== null && order.status === "printing" && (
                  <span className="text-2xl font-bold text-green-600">
                    {order.progress}%
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                {order.status === "queued" && (
                  <button
                    onClick={() => doAction(order.id, "start_print")}
                    disabled={actionLoading === order.id}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading === order.id
                      ? "Starting..."
                      : "Start Print"}
                  </button>
                )}

                {order.status === "printing" && (
                  <>
                    <button
                      onClick={() => doAction(order.id, "complete_print")}
                      disabled={actionLoading === order.id}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={() => doAction(order.id, "mark_failed")}
                      disabled={actionLoading === order.id}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      Print Failed
                    </button>
                  </>
                )}

                {order.status === "done" && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Tracking number"
                      value={trackingInput[order.id] || ""}
                      onChange={(e) =>
                        setTrackingInput((prev) => ({
                          ...prev,
                          [order.id]: e.target.value,
                        }))
                      }
                      className="border rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() =>
                        doAction(order.id, "mark_shipped", {
                          trackingNumber: trackingInput[order.id] || "",
                        })
                      }
                      disabled={
                        actionLoading === order.id ||
                        !trackingInput[order.id]
                      }
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Mark Shipped
                    </button>
                  </div>
                )}
              </div>

              {order.email && (
                <p className="text-xs text-gray-400 mt-2">
                  Customer: {order.email}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
