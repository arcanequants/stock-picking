import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendFreeSignupAlertToAdmin } from "@/lib/resend";
import { ADMIN_EMAIL } from "@/lib/admin";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { email, source } = (await request.json()) as { email?: string; source?: string };

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "invalid_email" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = getSupabaseAdmin();

    // Check if user already exists — return success (idempotent)
    const { data: allUsers } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    const userExists = allUsers?.users?.some(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (userExists) {
      return NextResponse.json({ success: true, already: true });
    }

    // Create Supabase Auth user (auto-confirmed, no password)
    const { error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
    });

    if (createError) {
      console.error("Free register error:", createError);
      return NextResponse.json(
        { error: "creation_failed" },
        { status: 500 }
      );
    }

    console.log("Free user registered:", normalizedEmail);

    // Fire-and-forget admin alert — never block signup on email failure
    const totalFreeUsers = (allUsers?.users?.length ?? 0) + 1;
    sendFreeSignupAlertToAdmin(ADMIN_EMAIL, {
      email: normalizedEmail,
      source: source ?? null,
      totalFreeUsers,
    }).catch((e) => console.error("Free signup admin alert failed:", e));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Free register error:", err);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }
}
