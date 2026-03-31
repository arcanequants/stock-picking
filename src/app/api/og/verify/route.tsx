import { ImageResponse } from "next/og";
import { transactions } from "@/data/stocks";

export const runtime = "edge";

export async function GET() {
  const totalPicks = transactions.length;
  const certifiedCount = transactions.filter((t) => !!t.attestation_uid).length;
  const since = transactions[0]?.date ?? "";

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
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "18px",
              color: "#34d399",
              padding: "6px 16px",
              borderRadius: "9999px",
              border: "1px solid rgba(52, 211, 153, 0.3)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            BLOCKCHAIN VERIFIED
          </div>
        </div>

        {/* Main title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "64px", fontWeight: 800, lineHeight: 1 }}>
            Registro Verificable
          </div>
          <div style={{ fontSize: "28px", color: "#a1a1aa", maxWidth: "800px" }}>
            No te pedimos que confíes. Te pedimos que verifiques.
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "60px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "16px", color: "#71717a" }}>Picks</div>
            <div style={{ fontSize: "48px", fontWeight: 800, color: "#fafafa", lineHeight: 1 }}>
              {totalPicks}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "16px", color: "#71717a" }}>Certificados</div>
            <div style={{ fontSize: "48px", fontWeight: 800, color: "#34d399", lineHeight: 1 }}>
              {certifiedCount}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "16px", color: "#71717a" }}>Desde</div>
            <div style={{ fontSize: "36px", fontWeight: 600, color: "#d4d4d8", lineHeight: 1.2 }}>
              {since}
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
              vectorialdata.com/verify
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
