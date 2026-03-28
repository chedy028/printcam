import { ADMIN_TOKEN } from "@/lib/config";

// Home server reports its health status
let lastHealthReport: { timestamp: number; status: string } | null = null;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!ADMIN_TOKEN || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  lastHealthReport = {
    timestamp: Date.now(),
    status: body.status || "ok",
  };

  return Response.json({ received: true });
}

export async function GET() {
  if (!lastHealthReport) {
    return Response.json({ online: false, lastReport: null });
  }

  const ageMs = Date.now() - lastHealthReport.timestamp;
  const online = ageMs < 120_000; // Consider offline if no report in 2 minutes

  return Response.json({
    online,
    lastReport: lastHealthReport,
    ageSeconds: Math.round(ageMs / 1000),
  });
}
