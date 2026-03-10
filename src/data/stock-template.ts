import { Stock } from "@/lib/types";
import { stocks, transactions, cycles } from "./stocks";

/**
 * Creates a new stock entry with smart defaults.
 * Only ticker and name are required — everything else has defaults.
 */
export function createStock(
  overrides: Partial<Stock> & { ticker: string; name: string }
): Stock {
  const nextId =
    stocks.length > 0 ? Math.max(...stocks.map((s) => s.id)) + 1 : 1;
  const now = new Date().toISOString();
  const sixMonthsLater = new Date();
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

  return {
    id: nextId,
    sector: "",
    industry: "",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 0,
    pe_ratio: null,
    pe_forward: null,
    dividend_yield: null,
    market_cap_b: null,
    eps: null,
    summary_short: "",
    summary_what: "",
    summary_why: "",
    summary_risk: "",
    research_full: "",
    analyst_consensus: "Hold",
    analyst_target: null,
    analyst_upside: null,
    status: "active",
    first_researched_at: now,
    last_updated_at: now,
    next_review_at: sixMonthsLater.toISOString(),
    ...overrides,
  };
}

/**
 * Returns info about what the next pick should be.
 * Useful for Claude Code to quickly determine pick type and count.
 */
export function getNextPickInfo() {
  const activeCycle = cycles.find((c) => (c.status as string) === "active");
  if (!activeCycle) {
    return {
      cycleType: "new" as const,
      cycleNumber: cycles.length + 1,
      picksInCycle: 0,
      remaining: 5,
      totalStocks: stocks.filter((s) => s.status === "active").length,
      totalTransactions: transactions.length,
    };
  }

  const remaining = activeCycle.target_count - activeCycle.current_count;

  return {
    cycleType: activeCycle.type,
    cycleNumber: activeCycle.cycle_number,
    picksInCycle: activeCycle.current_count,
    remaining,
    totalStocks: stocks.filter((s) => s.status === "active").length,
    totalTransactions: transactions.length,
  };
}

/**
 * Returns the day's pick schedule.
 * Mon-Tue: 2 stocks, Wed-Fri: 1 stock
 */
export function getTodaySchedule() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon, ...
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const picksPerDay: Record<number, number> = {
    1: 2, // Monday
    2: 2, // Tuesday
    3: 1, // Wednesday
    4: 1, // Thursday
    5: 1, // Friday
  };

  const todayStr = today.toISOString().split("T")[0];
  const picksAlreadyToday = transactions.filter(
    (t) => t.date === todayStr
  ).length;
  const picksNeeded = picksPerDay[day] || 0;

  return {
    dayName: dayNames[day],
    date: todayStr,
    picksNeeded,
    picksAlreadyToday,
    remaining: Math.max(0, picksNeeded - picksAlreadyToday),
    isMarketDay: day >= 1 && day <= 5,
  };
}
