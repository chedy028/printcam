import { headers } from "next/headers";
import stripe from "@/lib/stripe";
import db from "@/lib/db";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: Request) {
  const body = await request.text();
  const headerList = await headers();
  const sig = headerList.get("stripe-signature");

  if (!sig) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { token, design_id, color, size } = session.metadata || {};

    if (!token || !design_id || !color || !size) {
      console.error("Missing metadata in checkout session:", session.id);
      return Response.json({ error: "Missing metadata" }, { status: 400 });
    }

    // Idempotency: check if order already exists for this stripe session
    const existing = await db.execute({
      sql: "SELECT id FROM orders WHERE stripe_session_id = ?",
      args: [session.id],
    });

    if (existing.rows.length > 0) {
      console.log("Duplicate webhook for session:", session.id);
      return Response.json({ received: true });
    }

    const email = session.customer_details?.email || null;

    // Re-check queue capacity at insert time to prevent oversubscription
    const queueResult = await db.execute(
      "SELECT COUNT(*) as count FROM orders WHERE status IN ('queued', 'printing')"
    );
    const queueDepth = Number(queueResult.rows[0].count);
    if (queueDepth >= 10) {
      console.error("Queue full at webhook time, order cannot be created:", session.id);
      // TODO: auto-refund via Stripe API
      return Response.json({ received: true, warning: "queue_full" });
    }

    let inserted = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await db.execute({
          sql: `INSERT INTO orders (token, design_id, color, size, status, stripe_session_id, email)
                VALUES (?, ?, ?, ?, 'queued', ?, ?)`,
          args: [token, Number(design_id), color, size, session.id, email],
        });
        console.log("Order created:", token, "design:", design_id, "color:", color, "size:", size);
        inserted = true;
        break;
      } catch (err) {
        console.error(`Insert attempt ${attempt + 1} failed:`, err);
      }
    }

    if (!inserted) {
      console.error("All insert attempts failed for session:", session.id);
      return Response.json(
        { error: "Failed to create order after retries" },
        { status: 500 }
      );
    }
  }

  return Response.json({ received: true });
}
