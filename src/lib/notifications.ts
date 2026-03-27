import { getSupabaseAdmin } from "@/lib/supabase";
import { generateExplanations } from "@/lib/ai-explainer";
import { stocks } from "@/data/stocks";
import type { EventType, EventExplanations, PortfolioEvent } from "@/lib/types";

// --- Create event (admin/cron use) ---

export async function createEvent(event: {
  ticker: string;
  event_type: EventType;
  title_key: string;
  params: Record<string, string>;
  explanations?: EventExplanations;
}) {
  const { error } = await getSupabaseAdmin()
    .from("portfolio_events")
    .insert({
      ticker: event.ticker,
      event_type: event.event_type,
      title_key: event.title_key,
      params: event.params,
      explanations: event.explanations ?? {},
    });

  if (error) throw new Error(`Failed to create event: ${error.message}`);
}

// --- Create event with AI-generated explanations ---

export async function createEventWithExplanations(event: {
  ticker: string;
  event_type: EventType;
  title_key: string;
  params: Record<string, string>;
}) {
  const stock = stocks.find((s) => s.ticker === event.ticker);
  const researchFull = stock?.research_full ?? "";

  let explanations: EventExplanations = {};
  if (researchFull) {
    try {
      explanations = await generateExplanations(
        event.ticker,
        event.event_type,
        event.params,
        researchFull
      );
    } catch (e) {
      console.error(`AI explanation failed for ${event.ticker}:`, e);
    }
  }

  await createEvent({ ...event, explanations });
}

// --- Public events (no auth needed) ---

export async function getPublicEvents(limit = 20): Promise<PortfolioEvent[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("portfolio_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch public events: ${error.message}`);
  return (data ?? []) as PortfolioEvent[];
}

// --- Read events ---

export async function getRecentEvents(limit = 20): Promise<PortfolioEvent[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("portfolio_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch events: ${error.message}`);
  return (data ?? []) as PortfolioEvent[];
}

export async function getEventsForDigest(since: Date): Promise<PortfolioEvent[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("portfolio_events")
    .select("*")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch digest events: ${error.message}`);
  return (data ?? []) as PortfolioEvent[];
}

// --- Unread count for a user ---

export async function getUnreadCount(userId: string): Promise<number> {
  // Count events that don't have a read entry for this user
  const { count, error } = await getSupabaseAdmin()
    .from("portfolio_events")
    .select("id", { count: "exact", head: true })
    .not(
      "id",
      "in",
      `(SELECT event_id FROM notification_reads WHERE user_id = '${userId}')`
    );

  if (error) {
    // Fallback: use separate queries
    const { data: events } = await getSupabaseAdmin()
      .from("portfolio_events")
      .select("id");
    const { data: reads } = await getSupabaseAdmin()
      .from("notification_reads")
      .select("event_id")
      .eq("user_id", userId);

    const readIds = new Set((reads ?? []).map((r) => r.event_id));
    return (events ?? []).filter((e) => !readIds.has(e.id)).length;
  }

  return count ?? 0;
}

// --- Get events with read status for a user ---

export async function getEventsWithReadStatus(
  userId: string,
  limit = 20,
  offset = 0
): Promise<{ events: (PortfolioEvent & { is_read: boolean })[]; total: number }> {
  // Get total count
  const { count } = await getSupabaseAdmin()
    .from("portfolio_events")
    .select("id", { count: "exact", head: true });

  // Get events
  const { data: events, error } = await getSupabaseAdmin()
    .from("portfolio_events")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch events: ${error.message}`);

  // Get read status
  const eventIds = (events ?? []).map((e) => e.id);
  const { data: reads } = await getSupabaseAdmin()
    .from("notification_reads")
    .select("event_id")
    .eq("user_id", userId)
    .in("event_id", eventIds);

  const readIds = new Set((reads ?? []).map((r) => r.event_id));

  const result = (events ?? []).map((e) => ({
    ...(e as PortfolioEvent),
    is_read: readIds.has(e.id),
  }));

  return { events: result, total: count ?? 0 };
}

// --- Mark as read ---

export async function markAsRead(userId: string, eventIds: string[]) {
  const rows = eventIds.map((event_id) => ({
    user_id: userId,
    event_id,
  }));

  const { error } = await getSupabaseAdmin()
    .from("notification_reads")
    .upsert(rows, { onConflict: "user_id,event_id" });

  if (error) throw new Error(`Failed to mark as read: ${error.message}`);
}

// --- Mark all as read ---

export async function markAllAsRead(userId: string) {
  const { data: events } = await getSupabaseAdmin()
    .from("portfolio_events")
    .select("id");

  if (!events?.length) return;

  const { data: existing } = await getSupabaseAdmin()
    .from("notification_reads")
    .select("event_id")
    .eq("user_id", userId);

  const readIds = new Set((existing ?? []).map((r) => r.event_id));
  const unread = events.filter((e) => !readIds.has(e.id));

  if (!unread.length) return;

  const rows = unread.map((e) => ({
    user_id: userId,
    event_id: e.id,
  }));

  await getSupabaseAdmin()
    .from("notification_reads")
    .insert(rows);
}
