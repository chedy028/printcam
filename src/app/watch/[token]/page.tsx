"use client";

import { useEffect, useState, useRef, use } from "react";

interface OrderData {
  token: string;
  status: string;
  designName: string;
  previewUrl: string;
  color: string;
  size: string;
  queuePosition: number;
  printTimeMinutes: number;
  progress: number;
  streamUrl: string | null;
  trackingNumber: string | null;
  printStartedAt: string | null;
}

export default function WatchPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/order/${token}`);
        if (!res.ok) {
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
    const interval = setInterval(fetchOrder, 10_000);
    return () => clearInterval(interval);
  }, [token]);

  // HLS player setup
  useEffect(() => {
    if (!order?.streamUrl || !videoRef.current) return;

    let destroyed = false;

    async function setupHls() {
      const Hls = (await import("hls.js")).default;
      if (destroyed || !videoRef.current) return;

      if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 10,
          maxMaxBufferLength: 20,
          liveSyncDurationCount: 2,
        });
        hls.loadSource(order!.streamUrl!);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.error("HLS fatal error:", data);
            setTimeout(() => {
              if (!destroyed) {
                hls.loadSource(order!.streamUrl!);
              }
            }, 5000);
          }
        });
        hlsRef.current = hls;
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.current.src = order!.streamUrl!;
      }
    }

    setupHls();

    return () => {
      destroyed = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [order?.streamUrl]);

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h1>
          <p className="text-gray-500">{error}</p>
        </div>
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

  return (
    <main className="flex-1 flex flex-col items-center p-4 pt-8">
      <div className="max-w-2xl w-full">
        {/* Status-dependent content */}
        {order.status === "queued" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold mb-2">
              Your {order.designName} is in the queue!
            </h1>
            <p className="text-gray-500 mb-4">
              You&apos;re #{order.queuePosition} in line. We&apos;ll start
              printing soon!
            </p>
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-sm text-indigo-700">
                Estimated print time: ~{order.printTimeMinutes} minutes
              </p>
              <p className="text-xs text-indigo-500 mt-1">
                We&apos;ll email you when printing starts
              </p>
            </div>
          </div>
        )}

        {order.status === "printing" && (
          <div className="bg-black rounded-2xl shadow-lg overflow-hidden">
            {/* Stream */}
            <div className="relative aspect-video bg-gray-900">
              {order.streamUrl ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white text-center">
                    <div className="animate-spin text-4xl mb-2">⟳</div>
                    <p>Connecting to stream...</p>
                  </div>
                </div>
              )}

              {/* Progress Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex justify-between items-center text-white mb-2">
                  <span className="font-semibold">{order.designName}</span>
                  <span className="text-sm">{order.progress}% complete</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${order.progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-4 text-white text-center text-sm">
              <span className="text-green-400 mr-2">● LIVE</span>
              Printing your {order.color} {order.designName} ({order.size})
            </div>
          </div>
        )}

        {order.status === "done" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold mb-2">
              Your {order.designName} is finished!
            </h1>
            <p className="text-gray-500 mb-4">
              We&apos;re packing it up and will ship it out soon.
            </p>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm text-green-700">
                You&apos;ll get an email with tracking info once it ships.
              </p>
            </div>
          </div>
        )}

        {order.status === "shipped" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h1 className="text-2xl font-bold mb-2">
              Your {order.designName} is on its way!
            </h1>
            {order.trackingNumber && (
              <p className="text-gray-500">
                Tracking: {order.trackingNumber}
              </p>
            )}
          </div>
        )}

        {order.status === "failed" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🔧</div>
            <h1 className="text-2xl font-bold mb-2">
              Your print had a hiccup!
            </h1>
            <p className="text-gray-500">
              We&apos;re reprinting it now. You&apos;ll get an email when it
              starts again.
            </p>
          </div>
        )}

        {/* Order info card */}
        <div className="mt-6 bg-white rounded-xl p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-gray-400">Design</div>
              <div className="font-medium">{order.designName}</div>
            </div>
            <div>
              <div className="text-gray-400">Color</div>
              <div className="font-medium">{order.color}</div>
            </div>
            <div>
              <div className="text-gray-400">Size</div>
              <div className="font-medium">{order.size}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
