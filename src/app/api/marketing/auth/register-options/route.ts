import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createRegistrationOptions } from "@/lib/marketing/webauthn";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { username, setupSecret } = await request.json();

    if (setupSecret !== process.env.MARKETING_SESSION_SECRET) {
      return NextResponse.json({ error: "Invalid setup secret" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    let { data: admin } = await supabase
      .from("marketing_admins")
      .select("*")
      .eq("username", username)
      .single();

    if (!admin) {
      const { data: newAdmin, error } = await supabase
        .from("marketing_admins")
        .insert({ username, display_name: username })
        .select()
        .single();
      if (error) throw error;
      admin = newAdmin;
    }

    const options = await createRegistrationOptions(admin.id, admin.username);
    return NextResponse.json({ options, adminId: admin.id });
  } catch (error) {
    console.error("Registration options error:", error);
    return NextResponse.json(
      { error: "Failed to generate registration options" },
      { status: 500 }
    );
  }
}
