import db from "@/lib/db";
import { ADMIN_TOKEN } from "@/lib/config";

export async function GET(request: Request) {
  // Auth check: home server must provide admin token
  const authHeader = request.headers.get("authorization");
  if (!ADMIN_TOKEN || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the next queued order
  const result = await db.execute(
    `SELECT o.*, d.name as design_name, d.stl_path, d.slug as design_slug
     FROM orders o
     JOIN designs d ON o.design_id = d.id
     WHERE o.status = 'queued'
     ORDER BY o.created_at ASC
     LIMIT 1`
  );

  if (result.rows.length === 0) {
    return Response.json({ job: null });
  }

  const order = result.rows[0];

  return Response.json({
    job: {
      orderId: order.id,
      token: order.token,
      designName: order.design_name,
      designSlug: order.design_slug,
      stlPath: order.stl_path,
      color: order.color,
      size: order.size,
    },
  });
}
