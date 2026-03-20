const API_BASE = process.env.VD_API_BASE || "https://vectorialdata.com/api/v1";
const API_KEY = process.env.VD_API_KEY || "";

interface ApiResponse<T> {
  data: T;
  meta: {
    tier: string;
    requests_remaining: number;
    timestamp: string;
  };
}

async function fetchApi<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(
      `API error ${response.status}: ${(error as { error?: string }).error || response.statusText}`
    );
  }

  const json = await response.json();

  // Handle both envelope and non-envelope responses
  if (json.data !== undefined) {
    return json.data as T;
  }
  return json as T;
}

export async function getLatestPicks(count?: number): Promise<unknown[]> {
  const query = count ? `?limit=${count}` : "";
  return fetchApi<unknown[]>(`/picks${query}`);
}

export async function getResearch(ticker: string): Promise<unknown> {
  return fetchApi<unknown>(`/research/${ticker}`);
}

export async function getPortfolioPerformance(): Promise<unknown> {
  return fetchApi<unknown>("/portfolio");
}

export async function getStocks(params?: {
  sector?: string;
  region?: string;
}): Promise<unknown[]> {
  const searchParams = new URLSearchParams();
  if (params?.sector) searchParams.set("sector", params.sector);
  if (params?.region) searchParams.set("region", params.region);
  const query = searchParams.toString() ? `?${searchParams}` : "";
  return fetchApi<unknown[]>(`/stocks${query}`);
}

export async function getStockInfo(ticker: string): Promise<unknown> {
  const stocks = await fetchApi<unknown[]>(`/stocks?ticker=${ticker}`);
  return Array.isArray(stocks) && stocks.length > 0 ? stocks[0] : null;
}
