import { ImageResponse } from "next/og";
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

  const daysHeld = Math.ceil(
    (Date.now() - new Date(tx.date + "T00:00:00").getTime()) / 86400000
  );
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
          <div style={{ fontSize: "72px", fontWeight: 800, lineHeight: 1 }}>
            {upperTicker}
          </div>
          <div style={{ fontSize: "28px", color: "#a1a1aa" }}>
            {stock.name}
          </div>
        </div>

        {/* Teaser — days held + lock icon hint */}
        <div style={{ display: "flex", gap: "60px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "16px", color: "#71717a" }}>Days held</div>
            <div style={{ fontSize: "36px", fontWeight: 600, color: "#d4d4d8" }}>
              {daysHeld}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "16px", color: "#71717a" }}>Return</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "120px",
                  height: "20px",
                  borderRadius: "10px",
                  backgroundColor: "#27272a",
                  overflow: "hidden",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: "75%",
                    height: "100%",
                    borderRadius: "10px",
                    backgroundColor: "#34d399",
                  }}
                />
              </div>
              <div style={{ fontSize: "24px", color: "#71717a" }}>
                🔒
              </div>
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
            $1/mo · daily stock picks
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
