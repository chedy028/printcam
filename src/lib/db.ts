import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default db;

export async function initDb() {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS designs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      stl_path TEXT NOT NULL,
      preview_url TEXT NOT NULL,
      category TEXT NOT NULL,
      print_time_s INTEGER NOT NULL,
      print_time_m INTEGER NOT NULL,
      print_time_l INTEGER NOT NULL,
      license_source TEXT,
      commercial_ok INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS color_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      color_name TEXT NOT NULL,
      hex_code TEXT NOT NULL,
      available INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      design_id INTEGER NOT NULL REFERENCES designs(id),
      color TEXT NOT NULL,
      size TEXT NOT NULL CHECK(size IN ('S', 'M', 'L')),
      status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued', 'printing', 'done', 'shipped', 'failed', 'refunded')),
      stripe_session_id TEXT UNIQUE,
      email TEXT,
      tracking_number TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS print_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      stream_path TEXT NOT NULL,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT,
      progress INTEGER NOT NULL DEFAULT 0
    )`,
  ]);
}
