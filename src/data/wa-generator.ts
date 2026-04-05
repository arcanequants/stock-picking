import { Stock } from "@/lib/types";
import { tips } from "@/data/stocks";

function getTip(stock: Stock, pickNumber: number): string {
  const ctx = {
    name: stock.name,
    ticker: stock.ticker,
    dividend_yield: stock.dividend_yield ?? 0,
    price: stock.price,
    sector: stock.sector,
    country: stock.country,
  };
  return `💡 ${tips[(pickNumber - 1) % tips.length](ctx)}`;
}

/**
 * Generates a WhatsApp message for a NEW stock pick (with dividend).
 * Simple, clear format for non-expert audience.
 */
export function generateNewPickMessage(
  stock: Stock,
  pickNumber: number,
  _totalInCycle: number = 5,
  options?: { brands?: string; presence?: string }
): string {
  const incomeLine =
    stock.dividend_yield && stock.dividend_yield > 0
      ? `💵 *Tu nuevo ingreso*: Esta empresa te paga *${stock.dividend_yield}% anual* solo por ser dueño.${options?.brands ? ` Cada vez que alguien compra ${options.brands} — parte de ese dinero llega a ti como dividendo.` : ""}`
      : `💵 *Tu participación*: ${stock.name} no paga dividendo todavía, pero tu ganancia viene del crecimiento del negocio.`;

  return `📊 *STOCK PICK #${pickNumber}* — ${formatDate(new Date())}

🏢 *${stock.name}* (${stock.ticker}) — $${stock.price?.toFixed(2)}
${options?.brands ? `\n🛍️ *Sus marcas*: ${options.brands}\n` : ""}
🌍 *Presencia*: ${options?.presence || stock.country}

${incomeLine}

⚠️ *El riesgo*: ${stock.summary_risk?.split(".")[0]}.

🆕 Posición #${pickNumber}
🔗 https://vectorialdata.com/stocks/${stock.ticker}
✅ Certificado por blockchain → vectorialdata.com/verify/${stock.ticker}

${getTip(stock, pickNumber)}`;
}

/**
 * Generates a WhatsApp message for a REBUY.
 * Includes conviction narrative for existing users + context for new subscribers.
 */
export function generateRebuyMessage(
  stock: Stock,
  rebuyNumber: number,
  _totalInCycle: number = 5,
  options?: { brands?: string; presence?: string }
): string {
  const incomeLine =
    stock.dividend_yield && stock.dividend_yield > 0
      ? `💵 Seguimos acumulando ingreso del *${stock.dividend_yield}% anual*.`
      : `💵 Seguimos acumulando participación en el crecimiento.`;

  return `🔄 *RECOMPRA* — ${formatDate(new Date())}

🏢 *${stock.name}* (${stock.ticker}) — $${stock.price?.toFixed(2)}
${options?.brands ? `🛍️ ${options.brands}` : ""}

${incomeLine}
💪 *¿Por qué recompramos?* Nuestra convicción es tan alta que estamos aumentando la posición. Comprar a diferentes precios reduce tu riesgo promedio.

🔄 Recompra #${rebuyNumber}
🔗 https://vectorialdata.com/stocks/${stock.ticker}
✅ Certificado por blockchain → vectorialdata.com/verify/${stock.ticker}

🆕 *¿Nuevo en el portafolio?* Esta puede ser tu primera posición en ${stock.ticker}. Ve el research completo: vectorialdata.com/stocks/${stock.ticker}

${getTip(stock, rebuyNumber)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
