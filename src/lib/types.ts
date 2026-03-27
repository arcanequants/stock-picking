export interface Stock {
  id: number;
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  country: string;
  region: string;
  currency: string;
  price: number;
  pe_ratio: number | null;
  pe_forward: number | null;
  dividend_yield: number | null;
  market_cap_b: number | null;
  eps: number | null;
  summary_short: string;
  summary_what: string;
  summary_why: string;
  summary_risk: string;
  research_full: string;
  analyst_consensus: string;
  analyst_target: number | null;
  analyst_upside: number | null;
  status: "active" | "watchlist" | "avoid";
  first_researched_at: string;
  last_updated_at: string;
  next_review_at: string | null;
}

export interface Transaction {
  id: number;
  stock_id: number;
  ticker: string;
  type: "new" | "rebuy";
  cycle_number: number;
  price: number;
  date: string;
  day_of_week: string;
  wa_message: string;
}

export interface Cycle {
  id: number;
  cycle_number: number;
  type: "new" | "rebuy";
  target_count: number;
  current_count: number;
  status: "active" | "completed";
}

export interface PortfolioSummary {
  ticker: string;
  name: string;
  sector: string;
  region: string;
  current_price: number;
  dividend_yield: number | null;
  analyst_upside: number | null;
  total_picks: number;
  new_picks: number;
  rebuys: number;
  first_pick_date: string;
  last_pick_date: string;
}

export interface SectorAllocation {
  sector: string;
  num_stocks: number;
  pct_of_portfolio: number;
}

export interface RegionAllocation {
  region: string;
  num_stocks: number;
  pct_of_portfolio: number;
}

export interface PositionReturn {
  ticker: string;
  name: string;
  buy_price: number;
  current_price: number;
  return_pct: number;
  days_held: number;
  date_bought: string;
}

// --- Notifications ---

export type EventType = "price_move" | "dividend" | "earnings" | "analyst" | "news";

export interface EventExplanation {
  meaning: string;
  action: string;
}

export type EventExplanations = Partial<Record<"en" | "es" | "pt" | "hi", EventExplanation>>;

export interface PortfolioEvent {
  id: string;
  ticker: string;
  event_type: EventType;
  title_key: string;
  params: Record<string, string>;
  explanations: EventExplanations;
  created_at: string;
}

export interface NotificationWithRead extends PortfolioEvent {
  is_read: boolean;
}
