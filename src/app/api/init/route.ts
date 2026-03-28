import { initDb } from "@/lib/db";
import db from "@/lib/db";
import { ADMIN_TOKEN } from "@/lib/config";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!ADMIN_TOKEN || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDb();

  // Seed with sample designs if table is empty
  const designCount = await db.execute("SELECT COUNT(*) as c FROM designs");
  if (Number(designCount.rows[0].c) === 0) {
    await db.batch([
      // Sample designs
      {
        sql: `INSERT INTO designs (name, slug, stl_path, preview_url, category, print_time_s, print_time_m, print_time_l, license_source, commercial_ok)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: ["T-Rex", "t-rex", "/stl/t-rex.3mf", "/previews/t-rex.gif", "Animals", 45, 90, 135, "MakerWorld CC-BY", 1],
      },
      {
        sql: `INSERT INTO designs (name, slug, stl_path, preview_url, category, print_time_s, print_time_m, print_time_l, license_source, commercial_ok)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: ["Rocket Ship", "rocket-ship", "/stl/rocket.3mf", "/previews/rocket.gif", "Vehicles", 30, 60, 90, "MakerWorld CC-BY", 1],
      },
      {
        sql: `INSERT INTO designs (name, slug, stl_path, preview_url, category, print_time_s, print_time_m, print_time_l, license_source, commercial_ok)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: ["Cat", "cat", "/stl/cat.3mf", "/previews/cat.gif", "Animals", 35, 70, 105, "MakerWorld CC-BY", 1],
      },
      {
        sql: `INSERT INTO designs (name, slug, stl_path, preview_url, category, print_time_s, print_time_m, print_time_l, license_source, commercial_ok)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: ["Race Car", "race-car", "/stl/racecar.3mf", "/previews/racecar.gif", "Vehicles", 40, 80, 120, "MakerWorld CC-BY", 1],
      },
      {
        sql: `INSERT INTO designs (name, slug, stl_path, preview_url, category, print_time_s, print_time_m, print_time_l, license_source, commercial_ok)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: ["Elephant", "elephant", "/stl/elephant.3mf", "/previews/elephant.gif", "Animals", 50, 100, 150, "MakerWorld CC-BY", 1],
      },
      // Sample colors
      { sql: `INSERT INTO color_inventory (color_name, hex_code, available) VALUES (?, ?, ?)`, args: ["Red", "#EF4444", 1] },
      { sql: `INSERT INTO color_inventory (color_name, hex_code, available) VALUES (?, ?, ?)`, args: ["Blue", "#3B82F6", 1] },
      { sql: `INSERT INTO color_inventory (color_name, hex_code, available) VALUES (?, ?, ?)`, args: ["Green", "#22C55E", 1] },
      { sql: `INSERT INTO color_inventory (color_name, hex_code, available) VALUES (?, ?, ?)`, args: ["Yellow", "#EAB308", 1] },
      { sql: `INSERT INTO color_inventory (color_name, hex_code, available) VALUES (?, ?, ?)`, args: ["White", "#F5F5F5", 1] },
      { sql: `INSERT INTO color_inventory (color_name, hex_code, available) VALUES (?, ?, ?)`, args: ["Black", "#1F2937", 1] },
    ]);
  }

  return Response.json({ initialized: true });
}
