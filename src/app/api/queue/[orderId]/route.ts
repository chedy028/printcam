import db from "@/lib/db";
import { ADMIN_TOKEN } from "@/lib/config";
import { generateStreamPath } from "@/lib/tokens";

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return !!ADMIN_TOKEN && authHeader === `Bearer ${ADMIN_TOKEN}`;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (!checkAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;
  const body = await request.json();
  const { action, trackingNumber, progress } = body;

  switch (action) {
    case "start_print": {
      // Ensure no other order is currently printing
      const activePrint = await db.execute(
        "SELECT id FROM orders WHERE status = 'printing'"
      );
      if (activePrint.rows.length > 0) {
        return Response.json(
          { error: "Another print is already in progress" },
          { status: 409 }
        );
      }

      const streamPath = generateStreamPath();
      await db.batch([
        {
          sql: "UPDATE orders SET status = 'printing', updated_at = datetime('now') WHERE id = ?",
          args: [Number(orderId)],
        },
        {
          sql: `INSERT INTO print_sessions (order_id, stream_path) VALUES (?, ?)`,
          args: [Number(orderId), streamPath],
        },
      ]);

      return Response.json({ status: "printing", streamPath });
    }

    case "update_progress": {
      if (typeof progress === "number") {
        await db.execute({
          sql: `UPDATE print_sessions SET progress = ?
                WHERE order_id = ? AND ended_at IS NULL`,
          args: [progress, Number(orderId)],
        });
      }
      return Response.json({ updated: true });
    }

    case "complete_print": {
      await db.batch([
        {
          sql: "UPDATE orders SET status = 'done', updated_at = datetime('now') WHERE id = ?",
          args: [Number(orderId)],
        },
        {
          sql: `UPDATE print_sessions SET ended_at = datetime('now')
                WHERE order_id = ? AND ended_at IS NULL`,
          args: [Number(orderId)],
        },
      ]);
      return Response.json({ status: "done" });
    }

    case "mark_shipped": {
      if (!trackingNumber) {
        return Response.json(
          { error: "Tracking number required" },
          { status: 400 }
        );
      }
      await db.execute({
        sql: `UPDATE orders SET status = 'shipped', tracking_number = ?, updated_at = datetime('now')
              WHERE id = ?`,
        args: [trackingNumber, Number(orderId)],
      });
      return Response.json({ status: "shipped" });
    }

    case "mark_failed": {
      await db.batch([
        {
          sql: "UPDATE orders SET status = 'failed', updated_at = datetime('now') WHERE id = ?",
          args: [Number(orderId)],
        },
        {
          sql: `UPDATE print_sessions SET ended_at = datetime('now')
                WHERE order_id = ? AND ended_at IS NULL`,
          args: [Number(orderId)],
        },
      ]);
      return Response.json({ status: "failed" });
    }

    default:
      return Response.json({ error: "Unknown action" }, { status: 400 });
  }
}
