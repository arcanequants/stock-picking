import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAuthState } from "@/lib/auth";

export async function GET() {
  const { isSubscribed, user } = await getAuthState();

  if (!isSubscribed || !user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("subscribers")
    .select("delivery_channel")
    .eq("email", user.email.toLowerCase())
    .single();

  if (error) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  return NextResponse.json({
    channel: data?.delivery_channel ?? "whatsapp",
  });
}

export async function POST(request: Request) {
  const { isSubscribed, user } = await getAuthState();

  if (!isSubscribed || !user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const email = user.email;

  const body = (await request.json()) as { channel?: string };
  const channel = body.channel;

  if (!channel || !["whatsapp", "email", "both"].includes(channel)) {
    return NextResponse.json({ error: "invalid_channel" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("subscribers")
    .update({ delivery_channel: channel })
    .eq("email", email.toLowerCase());

  if (error) {
    console.error("Failed to update delivery preference:", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, channel });
}
