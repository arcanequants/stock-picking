import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSupabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: subscriber } = await getSupabaseAdmin()
    .from("subscribers")
    .select("stripe_customer_id")
    .eq("email", user.email.toLowerCase())
    .single();

  if (!subscriber?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No subscription found" },
      { status: 404 }
    );
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: subscriber.stripe_customer_id,
    return_url: "https://vectorialdata.com/portfolio",
  });

  return NextResponse.json({ url: session.url });
}
