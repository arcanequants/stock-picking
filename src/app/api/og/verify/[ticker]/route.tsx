import { ImageResponse } from "next/og";
import { transactions, stocks } from "@/data/stocks";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const upperTicker = ticker.toUpperCase();

  const txIndex = transactions.findIndex((t) => t.ticker === upperTicker);
  const stock = stocks.find((s) => s.ticker === upperTicker);

  if (txIndex === -1 || !stock) {
    return new Response("Not found", { status: 404 });
  }

  const tx = transactions[txIndex];
  const pickNumber = txIndex + 1;
  const hasAttestation = !!tx.attestation_uid;

  const name = stock.name.replace(
    / (PLC|Inc\.|Ltd\.|S\.A\.|AG|N\.V\.|Corporation|Company)\.?$/i,
    ""
  );

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
              fontSize: "14px",
              letterSpacing: "0.15em",
              color: "#71717a",
              textTransform: "uppercase" as const,
            }}
          >
            Certificado Digital
          </div>
        </div>

        {/* Pick info */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              fontSize: "18px",
              color: "#818cf8",
              padding: "4px 16px",
              borderRadius: "9999px",
              border: "1px solid rgba(129, 140, 248, 0.3)",
            }}
          >
            PICK #{pickNumber}
          </div>
          <div style={{ fontSize: "80px", fontWeight: 800, lineHeight: 1 }}>
            {upperTicker}
          </div>
          <div style={{ fontSize: "28px", color: "#a1a1aa" }}>
            {name}
          </div>
        </div>

        {/* Price + Date + Status */}
        <div style={{ display: "flex", justifyContent: "center", gap: "60px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div style={{ fontSize: "16px", color: "#71717a" }}>Precio</div>
            <div style={{ fontSize: "36px", fontWeight: 700, lineHeight: 1 }}>
              ${tx.price.toFixed(2)}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div style={{ fontSize: "16px", color: "#71717a" }}>Fecha</div>
            <div style={{ fontSize: "36px", fontWeight: 700, lineHeight: 1 }}>
              {tx.date}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div style={{ fontSize: "16px", color: "#71717a" }}>Estado</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "28px",
                fontWeight: 700,
                color: hasAttestation ? "#34d399" : "#fbbf24",
                lineHeight: 1,
              }}
            >
              {hasAttestation ? (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  Verificado
                </>
              ) : (
                "Pendiente"
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "18px", color: "#71717a" }}>
              vectorialdata.com/verify/{upperTicker}
            </div>
            <div
              style={{
                fontSize: "16px",
                color: "#34d399",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(52, 211, 153, 0.3)",
              }}
            >
              Base (Ethereum L2) · EAS
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "#52525b" }}>
            Fecha y precio certificados en blockchain · Retornos no certificados
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
