import db from "@/lib/db";

export async function GET() {
  const result = await db.execute(
    `SELECT d.*, GROUP_CONCAT(c.color_name || ':' || c.hex_code) as available_colors
     FROM designs d
     CROSS JOIN color_inventory c
     WHERE d.commercial_ok = 1 AND c.available = 1
     GROUP BY d.id
     ORDER BY d.category, d.name`
  );

  const designs = result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    preview_url: row.preview_url,
    category: row.category,
    print_times: {
      S: row.print_time_s,
      M: row.print_time_m,
      L: row.print_time_l,
    },
    available_colors: String(row.available_colors || "")
      .split(",")
      .map((c) => {
        const [name, hex] = c.split(":");
        return { name, hex };
      }),
  }));

  return Response.json(designs);
}
