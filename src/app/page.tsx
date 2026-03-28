"use client";

import { useEffect, useState } from "react";
import DesignCard from "@/components/DesignCard";
import OrderReview from "@/components/OrderReview";

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

export default function Home() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<Selection | null>(null);

  useEffect(() => {
    fetch("/api/designs")
      .then((r) => r.json())
      .then((data) => {
        setDesigns(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (selection) {
    return (
      <OrderReview selection={selection} onBack={() => setSelection(null)} />
    );
  }

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="bg-indigo-600 text-white py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Pick a toy. Watch it print. Get it delivered.
        </h1>
        <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
          Choose a 3D design, watch it being made live on a real printer, and
          get it shipped to your door. $10 flat rate.
        </p>
        <div className="flex justify-center gap-8 text-sm md:text-base">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-2xl font-bold">
              1
            </div>
            <span>Pick a design</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-2xl font-bold">
              2
            </div>
            <span>Watch it print live</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-2xl font-bold">
              3
            </div>
            <span>Get it delivered</span>
          </div>
        </div>
      </section>

      {/* Design Gallery */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8">Choose your design</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm h-80 animate-pulse"
              />
            ))}
          </div>
        ) : designs.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No designs available right now. Check back soon!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                onSelect={(color, size) =>
                  setSelection({ design, color, size })
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Trust Footer */}
      <footer className="bg-white border-t py-8 px-4 text-center text-sm text-gray-500">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6">
          <span>Ships within 24 hours of printing</span>
          <span>USPS First Class (US only)</span>
          <span>Secure checkout via Stripe</span>
          <span>$10 flat rate, no hidden fees</span>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          PrintCam is a fun side project. Prints are made on a Bambu Lab H2D 3D
          printer.
        </p>
      </footer>
    </main>
  );
}
