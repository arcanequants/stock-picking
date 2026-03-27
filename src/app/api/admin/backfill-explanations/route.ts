import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateExplanations } from "@/lib/ai-explainer";
import { stocks } from "@/data/stocks";
import type { EventType, PortfolioEvent } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find events with empty explanations
    const { data: events, error } = await getSupabaseAdmin()
      .from("portfolio_events")
      .select("*")
      .or("explanations.is.null,explanations.eq.{}");

    if (error) throw error;
    if (!events?.length) {
      return NextResponse.json({ message: "No events need backfilling" });
    }

    let filled = 0;
    let failed = 0;

    for (const event of events as PortfolioEvent[]) {
      const stock = stocks.find((s) => s.ticker === event.ticker);
      const researchFull = stock?.research_full ?? "";

      if (!researchFull) {
        failed++;
        continue;
      }

      try {
        const explanations = await generateExplanations(
          event.ticker,
          event.event_type as EventType,
          event.params,
          researchFull
        );

        if (Object.keys(explanations).length > 0) {
          await getSupabaseAdmin()
            .from("portfolio_events")
            .update({ explanations })
            .eq("id", event.id);
          filled++;
        } else {
          failed++;
        }
      } catch (e) {
        console.error(`Backfill failed for event ${event.id}:`, e);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      total: events.length,
      filled,
      failed,
    });
  } catch (error) {
    console.error("Backfill error:", error);
    return NextResponse.json(
      { error: "Failed to backfill" },
      { status: 500 }
    );
  }
}
