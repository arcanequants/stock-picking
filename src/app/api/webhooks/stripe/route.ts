import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  sendWelcomeEmail,
  sendNewSubscriberAlertToAdmin,
  sendChurnAlertToAdmin,
  sendPaymentFailedAlertToAdmin,
  sendApiTopupAlertToAdmin,
} from "@/lib/resend";
import { grantCredits, centsToMicroUsdc } from "@/lib/api-keys";
import { getPack } from "@/lib/api-credit-packs";
import { buildTrackedWaUrl } from "@/lib/wa-track";
import { convertReferral } from "@/lib/referrals";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "0138078@up.edu.mx";

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://vectorialdata.com")
  );
}

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

        // API credit top-up branch — one-time payment, no subscription.
        // Identified by metadata.purpose set when we created the Checkout
        // session in /api/billing/topup.
        if (session.metadata?.purpose === "api_topup") {
          const accountId = session.metadata.account_id;
          const apiKeyId = session.metadata.api_key_id;
          const packId = session.metadata.pack_id;
          const pack = getPack(packId);
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null;

          if (!accountId || !apiKeyId || !pack || !paymentIntentId) {
            console.error("Topup session missing required metadata:", session.id);
            break;
          }

          // Credit the balance by the real dollars charged (USDC parity), not the
          // legacy "credits" field. $5 paid → 5_000_000 micro-USDC.
          const topupCents = session.amount_total ?? pack.priceUsdCents;
          try {
            const newBalance = await grantCredits({
              account_id: accountId,
              api_key_id: apiKeyId,
              micro_usdc: centsToMicroUsdc(topupCents),
              source: "topup_stripe",
              stripe_payment_intent_id: paymentIntentId,
              notes: `Stripe top-up · pack=${pack.id}`,
            });

            await sendApiTopupAlertToAdmin(ADMIN_EMAIL, {
              email: session.customer_details?.email ?? session.customer_email ?? null,
              accountId,
              apiKeyId,
              packId: pack.id,
              usdc: pack.usdc,
              amountCents: session.amount_total ?? pack.priceUsdCents,
              currency: session.currency ?? "usd",
              newBalance,
              stripePaymentIntentId: paymentIntentId,
            }).catch((e) => console.error("Topup admin alert failed:", e));

            console.log(`API top-up credited: ${apiKeyId} +${pack.usdc} USDC (balance=${newBalance})`);
          } catch (err) {
            console.error("Topup grantCredits failed:", err);
          }
          break;
        }

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
          .select("email, access_started_at")
          .eq("email", normalizedEmail)
          .maybeSingle();

        const nowIso = new Date().toISOString();

        if (existing) {
          // Update: do NOT touch delivery_channel (preserve user preference).
          // Set access_started_at only if it's still NULL — first-time access
          // wins, returning subs keep their original cutoff.
          const updatePayload: Record<string, unknown> = {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: subscriptionStatus,
            current_period_start: periodStart,
            current_period_end: periodEnd,
          };
          if (!existing.access_started_at) {
            updatePayload.access_started_at = nowIso;
          }
          const { error: updateError } = await supabase
            .from("subscribers")
            .update(updatePayload)
            .eq("email", normalizedEmail);

          if (updateError) {
            console.error("Subscriber update error:", updateError);
          }
        } else {
          // Insert: new user. access_started_at = now (this is the moment
          // they gained access — the iOS picks feed will count from here).
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
              access_started_at: nowIso,
            });

          if (insertError) {
            console.error("Subscriber insert error:", insertError);
          }
        }

        // Referral reward: this is a real subscription payment. If the payer was
        // referred, mark it converted and credit the referrer. Never throws.
        await convertReferral(normalizedEmail);

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

        const deliveryChannel = existing
          ? ((
              await supabase
                .from("subscribers")
                .select("delivery_channel")
                .eq("email", normalizedEmail)
                .maybeSingle()
            ).data?.delivery_channel as
              | "whatsapp"
              | "email"
              | "both"
              | null) ?? "whatsapp"
          : "whatsapp";

        let magicLinkUrl: string | null = null;
        try {
          const { data: linkData, error: linkError } =
            await supabase.auth.admin.generateLink({
              type: "magiclink",
              email: normalizedEmail,
            });
          if (!linkError && linkData?.properties?.action_link) {
            const actionUrl = new URL(linkData.properties.action_link);
            const tokenHash = actionUrl.searchParams.get("token");
            const type =
              actionUrl.searchParams.get("type") || "magiclink";
            magicLinkUrl = `${getSiteUrl()}/auth/callback?token_hash=${tokenHash}&type=${type}&next=/portfolio`;
          } else {
            console.error("Magic link generation failed:", linkError);
          }
        } catch (err) {
          console.error("Magic link generation error:", err);
        }

        const waGroupLink = process.env.WHATSAPP_GROUP_LINK
          ? buildTrackedWaUrl(normalizedEmail, getSiteUrl())
          : null;

        if (magicLinkUrl) {
          try {
            await sendWelcomeEmail(
              normalizedEmail,
              magicLinkUrl,
              waGroupLink,
              deliveryChannel,
              "es"
            );
          } catch (err) {
            console.error("Welcome email send error:", err);
          }
        }

        try {
          const amountCents =
            typeof session.amount_total === "number"
              ? session.amount_total
              : null;
          await sendNewSubscriberAlertToAdmin(ADMIN_EMAIL, {
            email: normalizedEmail,
            deliveryChannel,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            amountCents,
            currency: session.currency ?? null,
            country:
              session.customer_details?.address?.country ?? null,
          });
        } catch (err) {
          console.error("Admin new-subscriber alert error:", err);
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

        const { data: subRow, error } = await supabase
          .from("subscribers")
          .update({ subscription_status: "canceled" })
          .eq("stripe_customer_id", customerId)
          .select("email")
          .maybeSingle();

        if (error) console.error("Subscription delete error:", error);

        try {
          await sendChurnAlertToAdmin(ADMIN_EMAIL, {
            stripeCustomerId: customerId,
            email: subRow?.email ?? null,
            reason: subscription.cancellation_details?.reason ?? null,
          });
        } catch (err) {
          console.error("Admin churn alert error:", err);
        }

        console.log("Subscription canceled for customer:", customerId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: subRow, error } = await supabase
          .from("subscribers")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId)
          .select("email")
          .maybeSingle();

        if (error) console.error("Payment failed update error:", error);

        try {
          await sendPaymentFailedAlertToAdmin(ADMIN_EMAIL, {
            stripeCustomerId: customerId,
            email: subRow?.email ?? null,
            amountCents: invoice.amount_due ?? null,
            currency: invoice.currency ?? null,
          });
        } catch (err) {
          console.error("Admin payment-failed alert error:", err);
        }

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
