import { NextResponse } from "next/server";

// Yahoo Finance chart endpoint — used elsewhere in this repo for benchmarks.
// We return only the freshest minute-bar so the Hormuz map can render a
// live-moving Brent/WTI ticker over the satellite imagery.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Quote = {
  symbol: string;
  label: string;
  price: number | null;
  change_pct: number | null;
  observed_at: string | null;
};

async function fetchQuote(symbol: string, label: string): Promise<Quote> {
  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    if (!res.ok) {
      return { symbol, label, price: null, change_pct: null, observed_at: null };
    }
    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
            chartPreviousClose?: number;
            regularMarketTime?: number;
          };
          timestamp?: number[];
          indicators?: { quote?: Array<{ close?: Array<number | null> }> };
        }>;
      };
    };
    const r = json.chart?.result?.[0];
    if (!r) return { symbol, label, price: null, change_pct: null, observed_at: null };
    const meta = r.meta;
    const price = meta?.regularMarketPrice ?? null;
    const prevClose = meta?.chartPreviousClose ?? null;
    const change_pct =
      price !== null && prevClose !== null && prevClose !== 0
        ? ((price - prevClose) / prevClose) * 100
        : null;
    const observed_at = meta?.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : null;
    return { symbol, label, price, change_pct, observed_at };
  } catch {
    return { symbol, label, price: null, change_pct: null, observed_at: null };
  }
}

export async function GET() {
  const [brent, wti] = await Promise.all([
    fetchQuote("BZ=F", "Brent"),
    fetchQuote("CL=F", "WTI"),
  ]);
  return NextResponse.json(
    { brent, wti, fetched_at: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60",
      },
    }
  );
}
