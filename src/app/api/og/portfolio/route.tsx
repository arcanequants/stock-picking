import { ImageResponse } from "next/og";
import { getSupabase } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";

export const dynamic = "force-dynamic";

export async function GET() {
  // Get latest prices
  const { data: snapshots } = await getSupabase()
    .from("portfolio_snapshots")
    .select("prices")
    .order("date", { ascending: false })
    .limit(1);

  const latestPrices: Record<string, number> =
    (snapshots?.[0]?.prices as Record<string, number>) ?? {};

  // Calculate per-position returns
  const INVESTMENT_PER_POSITION = 50;
  let totalInvested = 0;
  let totalValue = 0;

  const positions = transactions.map((tx) => {
    const stock = stocks.find((s) => s.ticker === tx.ticker);
    const currentPrice = latestPrices[tx.ticker] ?? stock?.price ?? tx.price;
    const returnPct = ((currentPrice - tx.price) / tx.price) * 100;
    const shares = INVESTMENT_PER_POSITION / tx.price;
    totalInvested += INVESTMENT_PER_POSITION;
    totalValue += shares * currentPrice;
    return {
      ticker: tx.ticker,
      return_pct: Math.round(returnPct * 100) / 100,
    };
  });

  positions.sort((a, b) => b.return_pct - a.return_pct);

  const totalReturnPct =
    totalInvested > 0
      ? Math.round((((totalValue - totalInvested) / totalInvested) * 100) * 100) / 100
      : 0;

  const isPositive = totalReturnPct >= 0;
  const top5 = positions.slice(0, 5);
  const remaining = positions.length - 5;
  const since = transactions.length > 0 ? transactions[0].date : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          backgroundColor: "#09090b",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "#818cf8",
            }}
          >
            VECTORIAL DATA
          </div>
        </div>

        {/* Main return */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              fontSize: "96px",
              fontWeight: 800,
              color: isPositive ? "#34d399" : "#f87171",
              lineHeight: 1,
            }}
          >
            {isPositive ? "+" : ""}
            {totalReturnPct.toFixed(1)}%
          </div>
          <div style={{ fontSize: "22px", color: "#a1a1aa" }}>
            {positions.length} posiciones · desde {since}
          </div>
        </div>

        {/* Position bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {top5.map((pos) => {
            const posPositive = pos.return_pct > 0;
            const barWidth = Math.min(Math.abs(pos.return_pct) * 8, 400);
            return (
              <div
                key={pos.ticker}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#d4d4d8",
                  }}
                >
                  {pos.ticker}
                </div>
                <div
                  style={{
                    height: "16px",
                    width: `${Math.max(barWidth, 8)}px`,
                    borderRadius: "8px",
                    backgroundColor: posPositive ? "#34d399" : "#f87171",
                  }}
                />
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: posPositive ? "#34d399" : "#f87171",
                  }}
                >
                  {posPositive ? "+" : ""}
                  {pos.return_pct.toFixed(1)}%
                </div>
              </div>
            );
          })}
          {remaining > 0 && (
            <div style={{ fontSize: "16px", color: "#71717a", marginTop: "4px" }}>
              ... y {remaining} posiciones mas
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "18px", color: "#71717a" }}>
            vectorialdata.com
          </div>
          <div
            style={{
              fontSize: "16px",
              color: "#818cf8",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid rgba(129, 140, 248, 0.3)",
            }}
          >
            $1.99/mo · stock picks diarios
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
