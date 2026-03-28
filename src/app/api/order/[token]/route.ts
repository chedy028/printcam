import db from "@/lib/db";
import { STREAM_BASE_URL } from "@/lib/config";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const result = await db.execute({
    sql: `SELECT o.*, d.name as design_name, d.preview_url,
          d.print_time_s, d.print_time_m, d.print_time_l,
          ps.stream_path, ps.progress, ps.started_at as print_started_at
          FROM orders o
          JOIN designs d ON o.design_id = d.id
          LEFT JOIN print_sessions ps ON ps.order_id = o.id AND ps.ended_at IS NULL
          WHERE o.token = ?`,
    args: [token],
  });

  if (result.rows.length === 0) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  const order = result.rows[0];

  // Calculate queue position
  let queuePosition = 0;
  if (order.status === "queued") {
    const posResult = await db.execute({
      sql: `SELECT COUNT(*) as pos FROM orders
            WHERE status = 'queued' AND created_at <= ?`,
      args: [order.created_at],
    });
    queuePosition = Number(posResult.rows[0].pos);
  }

  // Estimate print time based on size
  const printTimeKey = `print_time_${String(order.size).toLowerCase()}` as string;
  const printTimeMinutes = Number(
    order[printTimeKey as keyof typeof order] || order.print_time_m
  );

  // Build stream URL only if currently printing
  let streamUrl = null;
  if (order.status === "printing" && order.stream_path) {
    streamUrl = `${STREAM_BASE_URL}/${order.stream_path}/index.m3u8`;
  }

  return Response.json({
    token: order.token,
    status: order.status,
    designName: order.design_name,
    previewUrl: order.preview_url,
    color: order.color,
    size: order.size,
    queuePosition,
    printTimeMinutes,
    progress: order.progress || 0,
    streamUrl,
    trackingNumber: order.tracking_number,
    createdAt: order.created_at,
    printStartedAt: order.print_started_at,
  });
}
