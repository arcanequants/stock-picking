import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyWaTrackToken } from "@/lib/wa-track";

export const dynamic = "force-dynamic";

// Click-tracked redirect to the WhatsApp group.
// The user sees a ~50ms rebound; we stamp wa_click_at on the subscriber row.
// If anything goes wrong, we still redirect — never leave the user stranded.
export async function GET(request: Request) {
  const waLink = process.env.WHATSAPP_GROUP_LINK;
  if (!waLink) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("t");

  if (token) {
    const email = verifyWaTrackToken(token);
    if (email) {
      try {
        await getSupabaseAdmin()
          .from("subscribers")
          .update({ wa_click_at: new Date().toISOString() })
          .eq("email", email)
          .is("wa_click_at", null);
      } catch (err) {
        console.error("wa click log failed:", err);
      }
    }
  }

  return NextResponse.redirect(waLink, 302);
}
