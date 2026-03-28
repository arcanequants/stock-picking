import { NextResponse } from "next/server";
import { verifySession } from "@/lib/marketing/session";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("marketing_analytics")
      .upsert(
        {
          ...body,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "week_start,platform" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
