export interface MarketingAdmin {
  id: string;
  username: string;
  display_name: string | null;
}

export interface MarketingSession {
  adminId: string;
  username: string;
  displayName: string | null;
}

export interface WeeklyAnalytics {
  id: string;
  week_start: string;
  platform: "twitter" | "instagram";
  followers: number;
  followers_gained: number;
  impressions: number;
  engagements: number;
  engagement_rate: number;
  link_clicks: number;
  profile_visits: number;
  posts_count: number;
  top_post_url: string | null;
  top_post_impressions: number;
  extra: Record<string, unknown>;
  notes: string | null;
}

export interface BudgetEntry {
  id: string;
  month: string;
  category: string;
  planned: number;
  spent: number;
  notes: string | null;
}

export interface StrategyNote {
  id: string;
  week_start: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
}
