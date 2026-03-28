import { NextResponse } from "next/server";
import { verifySession } from "@/lib/marketing/session";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");
  const weeks = parseInt(searchParams.get("weeks") || "12", 10);

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("marketing_analytics")
    .select("*")
    .order("week_start", { ascending: false })
    .limit(weeks * 2);

  if (platform) {
    query = query.eq("platform", platform);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
