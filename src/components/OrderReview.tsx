"use client";

import { useState } from "react";

interface Design {
  id: number;
  name: string;
  slug: string;
  preview_url: string;
  category: string;
  print_times: { S: number; M: number; L: number };
  available_colors: { name: string; hex: string }[];
}

interface Selection {
  design: Design;
  color: { name: string; hex: string };
  size: "S" | "M" | "L";
}

interface Props {
  selection: Selection;
  onBack: () => void;
}

export default function OrderReview({ selection, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { design, color, size } = selection;
  const printTime = design.print_times[size];

  async function handleCheckout() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designId: design.id,
          color: color.name,
          size,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Failed to create checkout session");
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600 mb-4 text-sm"
        >
          &larr; Back to designs
        </button>

        <h2 className="text-2xl font-bold mb-6">Review your order</h2>

        {/* Design Preview */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center">
          <div className="text-6xl mb-3">
            {design.category === "Animals" ? "🦕" : "🚀"}
          </div>
          <h3 className="font-semibold text-lg">{design.name}</h3>
        </div>

        {/* Order Details */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-500">Color</span>
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full border border-gray-200"
                style={{ backgroundColor: color.hex }}
              />
              <span className="font-medium">{color.name}</span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Size</span>
            <span className="font-medium">
              {size === "S" ? "Small" : size === "M" ? "Medium" : "Large"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Print time</span>
            <span className="font-medium">~{printTime} minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Shipping</span>
            <span className="font-medium">USPS First Class (US only)</span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="font-bold">Total</span>
            <span className="font-bold text-indigo-600 text-xl">$10.00</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Redirecting to checkout..." : "Pay $10.00"}
        </button>

        <p className="text-xs text-gray-400 text-center mt-3">
          Secure checkout powered by Stripe. You&apos;ll enter your shipping
          address on the next page.
        </p>
      </div>
    </main>
  );
}
