import db from "@/lib/db";
import stripe from "@/lib/stripe";
import { generateToken } from "@/lib/tokens";
import { QUEUE_MAX, SITE_URL, PRICE_CENTS } from "@/lib/config";

export async function POST(request: Request) {
  const body = await request.json();
  const { designId, color, size } = body;

  if (!designId || !color || !size || !["S", "M", "L"].includes(size)) {
    return Response.json({ error: "Invalid order parameters" }, { status: 400 });
  }

  // Check queue depth
  const queueResult = await db.execute(
    "SELECT COUNT(*) as count FROM orders WHERE status IN ('queued', 'printing')"
  );
  const queueDepth = Number(queueResult.rows[0].count);
  if (queueDepth >= QUEUE_MAX) {
    return Response.json(
      { error: "Sold out for today! Come back tomorrow." },
      { status: 503 }
    );
  }

  // Verify design exists
  const designResult = await db.execute({
    sql: "SELECT * FROM designs WHERE id = ? AND commercial_ok = 1",
    args: [designId],
  });
  if (designResult.rows.length === 0) {
    return Response.json({ error: "Design not found" }, { status: 404 });
  }
  const design = designResult.rows[0];

  // Verify color available
  const colorResult = await db.execute({
    sql: "SELECT * FROM color_inventory WHERE color_name = ? AND available = 1",
    args: [color],
  });
  if (colorResult.rows.length === 0) {
    return Response.json({ error: "Color not available" }, { status: 400 });
  }

  const token = generateToken();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `PrintCam: ${design.name} (${size}, ${color})`,
            description: "3D printed object with live stream viewing",
          },
          unit_amount: PRICE_CENTS,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    shipping_address_collection: {
      allowed_countries: ["US"],
    },
    success_url: `${SITE_URL}/order/${token}?success=1`,
    cancel_url: `${SITE_URL}?cancelled=1`,
    metadata: {
      token,
      design_id: String(designId),
      color,
      size,
      design_name: String(design.name),
    },
  });

  return Response.json({ url: session.url, token });
}
