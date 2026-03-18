import { ImageResponse } from "next/og";
import { getSupabase } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const upperTicker = ticker.toUpperCase();

  const tx = transactions.find((t) => t.ticker === upperTicker);
  const stock = stocks.find((s) => s.ticker === upperTicker);

  if (!tx || !stock) {
    return new Response("Not found", { status: 404 });
  }

  // Get latest price
  const { data: snapshots } = await getSupabase()
    .from("portfolio_snapshots")
    .select("prices")
    .order("date", { ascending: false })
    .limit(1);

  const latestPrices: Record<string, number> =
    (snapshots?.[0]?.prices as Record<string, number>) ?? {};

  const currentPrice = latestPrices[upperTicker] ?? stock.price;
  const returnPct = ((currentPrice - tx.price) / tx.price) * 100;
  const daysHeld = Math.ceil(
    (Date.now() - new Date(tx.date + "T00:00:00").getTime()) / 86400000
  );
  const isPositive = returnPct >= 0;
  const pickNumber = transactions.indexOf(tx) + 1;

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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
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
          <div
            style={{
              fontSize: "18px",
              color: "#a1a1aa",
              padding: "6px 16px",
              borderRadius: "9999px",
              border: "1px solid #3f3f46",
            }}
          >
            PICK #{pickNumber}
          </div>
        </div>

        {/* Stock info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "64px", fontWeight: 800, lineHeight: 1 }}>
            {upperTicker}
          </div>
          <div style={{ fontSize: "28px", color: "#a1a1aa" }}>
            {stock.name}
          </div>
        </div>

        {/* Returns */}
        <div style={{ display: "flex", gap: "60px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "16px", color: "#71717a" }}>Comprado</div>
            <div style={{ fontSize: "36px", fontWeight: 600, color: "#d4d4d8" }}>
              ${tx.price.toFixed(2)}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "16px", color: "#71717a" }}>Actual</div>
            <div style={{ fontSize: "36px", fontWeight: 600, color: "#fafafa" }}>
              ${currentPrice.toFixed(2)}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "16px", color: "#71717a" }}>Return</div>
            <div
              style={{
                fontSize: "48px",
                fontWeight: 800,
                color: isPositive ? "#34d399" : "#f87171",
                lineHeight: 1,
              }}
            >
              {isPositive ? "+" : ""}
              {returnPct.toFixed(1)}%
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "16px", color: "#71717a" }}>Dias</div>
            <div style={{ fontSize: "36px", fontWeight: 600, color: "#d4d4d8" }}>
              {daysHeld}
            </div>
          </div>
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
            vectorialdata.com/stocks/{upperTicker}
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
