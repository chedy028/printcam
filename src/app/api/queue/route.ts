import db from "@/lib/db";
import { ADMIN_TOKEN } from "@/lib/config";

function checkAuth(request: Request): boolean {
  const url = new URL(request.url);
  const tokenParam = url.searchParams.get("token");
  const authHeader = request.headers.get("authorization");
  return (
    !!ADMIN_TOKEN &&
    (authHeader === `Bearer ${ADMIN_TOKEN}` || tokenParam === ADMIN_TOKEN)
  );
}

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db.execute(
    `SELECT o.*, d.name as design_name, d.slug as design_slug,
     ps.stream_path, ps.progress, ps.started_at as print_started_at
     FROM orders o
     JOIN designs d ON o.design_id = d.id
     LEFT JOIN print_sessions ps ON ps.order_id = o.id AND ps.ended_at IS NULL
     WHERE o.status IN ('queued', 'printing', 'done')
     ORDER BY
       CASE o.status
         WHEN 'printing' THEN 0
         WHEN 'queued' THEN 1
         WHEN 'done' THEN 2
       END,
       o.created_at ASC`
  );

  return Response.json({ orders: result.rows });
}
