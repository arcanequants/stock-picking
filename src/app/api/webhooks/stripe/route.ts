import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email =
          session.customer_details?.email ?? session.customer_email;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!email) {
          console.error("No email in checkout session:", session.id);
          break;
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Fetch subscription details for period dates
        let subscriptionStatus = "active";
        let periodStart: string | null = null;
        let periodEnd: string | null = null;

        if (subscriptionId) {
          const subscription =
            await getStripe().subscriptions.retrieve(subscriptionId);
          subscriptionStatus = subscription.status;
          // In Stripe SDK v20+, period dates are on items.data[0]
          const item = subscription.items?.data?.[0];
          if (item) {
            periodStart = new Date(
              item.current_period_start * 1000
            ).toISOString();
            periodEnd = new Date(
              item.current_period_end * 1000
            ).toISOString();
          }
        }

        // Check if subscriber exists to avoid clobbering delivery_channel preference
        const { data: existing } = await supabase
          .from("subscribers")
          .select("email")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (existing) {
          // Update: do NOT touch delivery_channel (preserve user preference)
          const { error: updateError } = await supabase
            .from("subscribers")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: subscriptionStatus,
              current_period_start: periodStart,
              current_period_end: periodEnd,
            })
            .eq("email", normalizedEmail);

          if (updateError) {
            console.error("Subscriber update error:", updateError);
          }
        } else {
          // Insert: default delivery_channel to 'whatsapp' for new users
          const { error: insertError } = await supabase
            .from("subscribers")
            .insert({
              email: normalizedEmail,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: subscriptionStatus,
              current_period_start: periodStart,
              current_period_end: periodEnd,
              delivery_channel: "whatsapp",
            });

          if (insertError) {
            console.error("Subscriber insert error:", insertError);
          }
        }

        // Create Supabase Auth user if they don't exist (auto-confirmed)
        const { data: existingUsers } =
          await supabase.auth.admin.listUsers();
        const userExists = existingUsers?.users?.some(
          (u) => u.email?.toLowerCase() === normalizedEmail
        );

        if (!userExists) {
          const { error: createError } =
            await supabase.auth.admin.createUser({
              email: normalizedEmail,
              email_confirm: true,
            });
          if (createError) {
            console.error("Auth user creation error:", createError);
          }
        }

        console.log("Checkout completed for:", normalizedEmail);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const updatedItem = subscription.items?.data?.[0];

        const updateData: Record<string, unknown> = {
          subscription_status: subscription.status,
        };
        if (updatedItem) {
          updateData.current_period_start = new Date(
            updatedItem.current_period_start * 1000
          ).toISOString();
          updateData.current_period_end = new Date(
            updatedItem.current_period_end * 1000
          ).toISOString();
        }

        const { error } = await supabase
          .from("subscribers")
          .update(updateData)
          .eq("stripe_customer_id", customerId);

        if (error) console.error("Subscription update error:", error);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { error } = await supabase
          .from("subscribers")
          .update({ subscription_status: "canceled" })
          .eq("stripe_customer_id", customerId);

        if (error) console.error("Subscription delete error:", error);
        console.log("Subscription canceled for customer:", customerId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { error } = await supabase
          .from("subscribers")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);

        if (error) console.error("Payment failed update error:", error);
        console.log("Payment failed for customer:", customerId);
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
