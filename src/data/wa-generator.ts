import { Stock } from "@/lib/types";

const REMINDERS = [
  "💡 Recuerda: tu presupuesto mensual ÷ 30 = lo que compras de cada pick. Siempre igual.",
  "💡 Mejor $3 por pick durante 3 años que $50 por pick y parar a los 2 meses. Consistencia > cantidad.",
  "💡 ¿Cuánto invertir? Lo que puedas mantener CADA MES. $90/mes = $3 por pick. $300/mes = $10 por pick.",
  "💡 No importa si compras $3 o $50 de cada acción. Lo que importa es que sea lo mismo siempre y que lo puedas sostener.",
];

function getReminder(pickNumber: number): string {
  return REMINDERS[(pickNumber - 1) % REMINDERS.length];
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

${getReminder(pickNumber)}`;
}

/**
 * Generates a WhatsApp message for a REBUY.
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

🔄 Recompra #${rebuyNumber}
🔗 https://vectorialdata.com/stocks/${stock.ticker}
✅ Certificado por blockchain → vectorialdata.com/verify/${stock.ticker}

${getReminder(rebuyNumber)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
