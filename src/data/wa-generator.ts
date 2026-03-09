import { Stock } from "@/lib/types";

/**
 * Generates a WhatsApp message for a NEW stock pick.
 * Ready to copy-paste into the group.
 */
export function generateNewPickMessage(
  stock: Stock,
  pickNumber: number,
  totalInCycle: number = 5
): string {
  const upsideLine =
    stock.analyst_target != null
      ? `📈 Upside analistas: ${stock.analyst_upside && stock.analyst_upside > 0 ? "+" : ""}${stock.analyst_upside}% (target $${stock.analyst_target.toFixed(2)})`
      : null;

  return `📊 STOCK PICK #${pickNumber} — ${formatDate(new Date())}

🏢 ${stock.name} (${stock.ticker}) — $${stock.price?.toFixed(2)}
🔹 Qué hace: ${stock.summary_what}

💰 Dividendo: ${stock.dividend_yield || 0}%${upsideLine ? `\n${upsideLine}` : ""}
⭐ Por qué: ${stock.summary_why}
⚠️ Riesgo: ${stock.summary_risk}

🆕 COMPRA NUEVA — Posición #${pickNumber} de ${totalInCycle}

🔗 Research: https://vectorialdata.com/stocks/${stock.ticker}`;
}

/**
 * Generates a shorter WhatsApp message for a REBUY.
 */
export function generateRebuyMessage(
  stock: Stock,
  rebuyNumber: number,
  totalInCycle: number = 5
): string {
  return `🔄 RECOMPRA #${rebuyNumber} — ${formatDate(new Date())}

🏢 ${stock.name} (${stock.ticker}) — $${stock.price?.toFixed(2)}
💰 Div: ${stock.dividend_yield || 0}% | Target: $${stock.analyst_target?.toFixed(2)} (${stock.analyst_upside && stock.analyst_upside > 0 ? "+" : ""}${stock.analyst_upside}%)
📈 Seguimos acumulando: ${stock.summary_why?.split(".")[0]}.

🔄 Recompra ${rebuyNumber} de ${totalInCycle}

🔗 Research: https://vectorialdata.com/stocks/${stock.ticker}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
