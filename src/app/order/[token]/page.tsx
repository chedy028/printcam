"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface OrderData {
  token: string;
  status: string;
  designName: string;
  color: string;
  size: string;
  queuePosition: number;
  printTimeMinutes: number;
  progress: number;
  trackingNumber: string | null;
  createdAt: string;
}

export default function OrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/order/${token}`);
        if (!res.ok) {
          // Don't persist 404 — webhook may not have arrived yet
          if (!order) setError("Your order is being processed... hang tight!");
          return;
        }
        setError("");
        setOrder(await res.json());
      } catch {
        if (!order) setError("Connecting...");
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 30_000);
    return () => clearInterval(interval);
  }, [token]);

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <p className="text-gray-500">{error}</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </main>
    );
  }

  const statusSteps = ["queued", "printing", "done", "shipped"];
  const currentStep = statusSteps.indexOf(order.status);

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
        <h1 className="text-2xl font-bold mb-6">Order Status</h1>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {statusSteps.map((step, i) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${
                  i <= currentStep
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {i <= currentStep ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs capitalize ${
                  i <= currentStep ? "text-indigo-600" : "text-gray-400"
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* Status Message */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          {order.status === "queued" && (
            <div>
              <p className="font-medium">
                Your {order.designName} is #{order.queuePosition} in the queue
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Estimated print time: ~{order.printTimeMinutes} minutes
              </p>
            </div>
          )}
          {order.status === "printing" && (
            <div>
              <p className="font-medium">
                Your {order.designName} is printing now! ({order.progress}%)
              </p>
              <Link
                href={`/watch/${token}`}
                className="text-sm text-indigo-600 hover:underline mt-1 inline-block"
              >
                Watch it live →
              </Link>
            </div>
          )}
          {order.status === "done" && (
            <p className="font-medium">
              Your {order.designName} is done! Packing it up now.
            </p>
          )}
          {order.status === "shipped" && (
            <div>
              <p className="font-medium">Your {order.designName} is on its way!</p>
              {order.trackingNumber && (
                <p className="text-sm text-gray-500 mt-1">
                  Tracking: {order.trackingNumber}
                </p>
              )}
            </div>
          )}
          {order.status === "failed" && (
            <p className="font-medium text-amber-600">
              Your print had a hiccup. We&apos;re reprinting it!
            </p>
          )}
        </div>

        {/* Order Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Design</span>
            <span>{order.designName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Color</span>
            <span>{order.color}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Size</span>
            <span>{order.size}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
