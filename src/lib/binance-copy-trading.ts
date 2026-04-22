export type BinanceTimeRange = "30D" | "90D" | "180D" | "365D";

export interface BinanceLeadDetail {
  leadPortfolioId: string;
  nickname: string;
  description: string | null;
  avatarUrl: string | null;
  status: string;
  currentCopyCount: number;
  maxCopyCount: number;
  totalCopyCount: number;
  closeLeadCount: number;
  marginBalance: string;
  aumAmount: string;
  copierPnl: string;
  copierPnlAsset: string;
  profitSharingRate: string;
  startTime: number;
  endTime: number | null;
  sharpRatio: string;
  tag: string[];
  rebateFee: string | null;
  lastTradeTime: number | null;
  futuresType: string;
}

export interface BinanceLeadPerformance {
  timeRange: BinanceTimeRange;
  roi: number;
  pnl: number;
  mdd: number;
  copierPnl: number;
  winRate: number;
  winOrders: number;
  totalOrder: number;
  sharpRatio: string;
}

interface BinanceEnvelope<T> {
  code: string;
  message: string | null;
  data: T | null;
  success: boolean;
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Binance returns HTTP 451 for US-region IPs (Vercel's iad1 default).
// When we hit that, fall back through a non-US proxy.
const PROXY_PREFIX = "https://api.codetabs.com/v1/proxy/?quest=";

async function tryFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
  });
}

async function fetchEnvelope<T>(url: string): Promise<T> {
  let res = await tryFetch(url);
  if (res.status === 451 || res.status === 403) {
    res = await tryFetch(`${PROXY_PREFIX}${encodeURIComponent(url)}`);
  }
  if (!res.ok) {
    throw new Error(`Binance ${res.status}: ${url}`);
  }
  const body = (await res.json()) as BinanceEnvelope<T>;
  if (!body.success || !body.data) {
    throw new Error(`Binance error ${body.code}: ${body.message ?? "unknown"}`);
  }
  return body.data;
}

export async function fetchLeadDetail(portfolioId: string): Promise<BinanceLeadDetail> {
  const url = `https://www.binance.com/bapi/futures/v1/friendly/future/copy-trade/lead-portfolio/detail?portfolioId=${encodeURIComponent(portfolioId)}`;
  return fetchEnvelope<BinanceLeadDetail>(url);
}

export async function fetchLeadPerformance(
  portfolioId: string,
  timeRange: BinanceTimeRange = "30D"
): Promise<BinanceLeadPerformance> {
  const url = `https://www.binance.com/bapi/composite/v1/public/future/copy-trade/lead-portfolio/performance?portfolioId=${encodeURIComponent(portfolioId)}&timeRange=${timeRange}`;
  return fetchEnvelope<BinanceLeadPerformance>(url);
}
