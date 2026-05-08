import { getSupabaseAdmin } from "@/lib/supabase";
import { generateEventInsight } from "@/lib/ai-explainer";
import { stocks } from "@/data/stocks";
import type {
  EventType,
  EventExplanations,
  EventSeverity,
  HumanSummaries,
  PortfolioEvent,
} from "@/lib/types";

// Severity at or above this threshold is what humans see by default.
// Everything else lives in the firehose for AI/API consumers.
export const HUMAN_SEVERITY_THRESHOLD: EventSeverity = 4;

// --- Create event (admin/cron use) ---

export async function createEvent(event: {
  ticker: string;
  event_type: EventType;
  title_key: string;
  params: Record<string, string>;
  explanations?: EventExplanations;
  severity?: EventSeverity;
  affects_thesis?: boolean;
  summaries?: HumanSummaries;
}) {
  const { error } = await getSupabaseAdmin()
    .from("portfolio_events")
    .insert({
      ticker: event.ticker,
      event_type: event.event_type,
      title_key: event.title_key,
      params: event.params,
      explanations: event.explanations ?? {},
      severity: event.severity ?? 3,
      affects_thesis: event.affects_thesis ?? false,
      human_summary_en: event.summaries?.en ?? null,
      human_summary_es: event.summaries?.es ?? null,
      human_summary_pt: event.summaries?.pt ?? null,
      human_summary_hi: event.summaries?.hi ?? null,
    });

  if (error) throw new Error(`Failed to create event: ${error.message}`);
}

// --- Create event with AI-generated insight (severity + summary + details) ---

export async function createEventWithExplanations(event: {
  ticker: string;
  event_type: EventType;
  title_key: string;
  params: Record<string, string>;
}) {
  const stock = stocks.find((s) => s.ticker === event.ticker);
  const researchFull = stock?.research_full ?? "";

  if (!researchFull) {
    await createEvent(event);
    return;
  }

  try {
    const insight = await generateEventInsight(
      event.ticker,
      event.event_type,
      event.params,
      researchFull
    );
    await createEvent({
      ...event,
      severity: insight.severity,
      affects_thesis: insight.affects_thesis,
      summaries: insight.summaries,
      explanations: insight.explanations,
    });
  } catch (e) {
    console.error(`AI insight failed for ${event.ticker}:`, e);
    await createEvent(event);
  }
}

// --- Public events: humans get the curated cut by default ---

export async function getPublicEvents(limit = 20): Promise<PortfolioEvent[]> {
  return getCuratedEvents(limit);
}

// Curated feed: severity ≥ HUMAN_SEVERITY_THRESHOLD only. Used by /notifications
// and the dropdown — the human-facing surface.
export async function getCuratedEvents(limit = 20): Promise<PortfolioEvent[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("portfolio_events")
    .select("*")
    .gte("severity", HUMAN_SEVERITY_THRESHOLD)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch curated events: ${error.message}`);
  return (data ?? []) as PortfolioEvent[];
}

// Firehose: every event regardless of severity. Used by the API for AI/bots
// and by the optional /notifications/all power-user surface.
export async function getAllEvents(
  limit = 100,
  offset = 0
): Promise<PortfolioEvent[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("portfolio_events")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch all events: ${error.message}`);
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

// --- Unread count for a user (curated only — humans never see noise) ---

export async function getUnreadCount(userId: string): Promise<number> {
  const { data: events } = await getSupabaseAdmin()
    .from("portfolio_events")
    .select("id")
    .gte("severity", HUMAN_SEVERITY_THRESHOLD);
  const { data: reads } = await getSupabaseAdmin()
    .from("notification_reads")
    .select("event_id")
    .eq("user_id", userId);

  const readIds = new Set((reads ?? []).map((r) => r.event_id));
  return (events ?? []).filter((e) => !readIds.has(e.id)).length;
}

// --- Get events with read status for a user (curated only) ---

export async function getEventsWithReadStatus(
  userId: string,
  limit = 20,
  offset = 0
): Promise<{ events: (PortfolioEvent & { is_read: boolean })[]; total: number }> {
  const { count } = await getSupabaseAdmin()
    .from("portfolio_events")
    .select("id", { count: "exact", head: true })
    .gte("severity", HUMAN_SEVERITY_THRESHOLD);

  const { data: events, error } = await getSupabaseAdmin()
    .from("portfolio_events")
    .select("*")
    .gte("severity", HUMAN_SEVERITY_THRESHOLD)
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
