/**
 * Server-side compactors that turn the verbose research blobs in
 * `stocks.ts` into "average-mom" short fields the iOS app can render
 * verbatim — no client-side parsing.
 *
 * Backend research uses inline numbered enumerations like
 * `(1) ... (2) ... (3) ...` all in one paragraph with no `\n\n`
 * separators. Splitting on `\n\n` therefore returns the whole body.
 * These helpers handle that pattern explicitly.
 *
 * Also strips markdown `**bold**` so the short text reads as prose.
 */

const ONE_LINER_MAX = 220;
const SHORT_MAX = 280;

/** Strip `**bold**` and `__bold__` while keeping the inner text. */
function stripBold(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1");
}

/**
 * Cut at the earliest "(1)" enumeration marker if present. When the
 * intro before "(1)" is rich (>= 60 chars), keep just the intro — that's
 * the lede. When the intro is a tease like "Los riesgos son medibles:",
 * keep the intro AND the first enumerated item (cut at "(2)") so we
 * actually deliver one concrete point.
 */
function cutAtFirstEnum(s: string): string {
  const m1 = s.match(/\s*\(1\)/);
  if (!m1 || m1.index === undefined || m1.index <= 0) return s;

  const intro = s.slice(0, m1.index).trim();
  const introHasPayload = intro.length >= 60 && /[.!?]/.test(intro);
  if (introHasPayload) return intro;

  // Intro is just a tease — keep the first enumerated item too.
  const m2 = s.slice(m1.index + 3).match(/\s*\(2\)/);
  if (m2 && m2.index !== undefined) {
    return s.slice(0, m1.index + 3 + m2.index).trim();
  }
  return s;
}

/**
 * Strip teaser endings like "Razones específicas:" or "Los riesgos son
 * medibles:" — anything ending in a colon followed by no payload. Also
 * removes trailing dashes/em-dashes / open parens that signal a cut
 * mid-sentence after the enum was lopped.
 */
function stripDanglingTease(s: string): string {
  let out = s.trim();
  // Drop a trailing ":" plus the preceding short clause if it has no payload
  // (it was just teasing the enumeration we just cut).
  out = out.replace(/([.!?])\s+[^.!?]{0,80}:\s*$/u, "$1");
  out = out.replace(/[\s,;:—-]+$/u, "");
  return out;
}

/** Trim to a word boundary near `max` and add an ellipsis. */
function hardCap(s: string, max: number): string {
  if (s.length <= max) return s;
  const end = Math.min(max, s.length);
  let cut = s.slice(0, end);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > max * 0.6) cut = cut.slice(0, lastSpace);
  return cut.replace(/[.,;:—-]\s*$/, "") + "…";
}

/**
 * One-liner: take the first natural clause (em-dash / period / newline)
 * past a 30-char floor so we don't cut tiny fragments. Falls back to a
 * hard cap if the source is one giant sentence.
 */
export function compactOneLiner(text: string | null | undefined): string {
  if (!text) return "";
  let s = stripBold(text).trim();
  s = cutAtFirstEnum(s);

  const separators = [" — ", ". ", "\n"];
  let earliest: number | null = null;
  for (const sep of separators) {
    const i = s.indexOf(sep, 30);
    if (i > 0 && (earliest === null || i < earliest)) earliest = i;
  }

  let cut = earliest !== null ? s.slice(0, earliest).trim() : s.trim();
  cut = stripDanglingTease(cut);
  if (cut.length > ONE_LINER_MAX) cut = hardCap(cut, ONE_LINER_MAX);
  else if (earliest !== null && !/[.!?…]$/.test(cut)) cut += ".";
  return cut;
}

/**
 * Short paragraph: keep the intro that precedes the `(1)(2)(3)` dump
 * if present. Hard cap at 280 chars on a word boundary so the accordion
 * stays one screen tall even on small phones.
 */
export function compactShort(text: string | null | undefined): string {
  if (!text) return "";
  let s = stripBold(text).trim();
  s = cutAtFirstEnum(s);
  // When we kept "(1) Foo" as the first enumerated item, drop the "(1)"
  // marker — readers don't need to see the list number when it's the
  // only item. Replace "...: (1) Foo" with "...: Foo".
  s = s.replace(/(:\s*)\(1\)\s*/u, "$1");
  s = stripDanglingTease(s);

  if (s.length <= SHORT_MAX) return s;
  return hardCap(s, SHORT_MAX);
}

// ---------- LO IMPORTANTE pills (plain-language vital signs) ----------

export interface WhatsImportantPill {
  emoji: string;
  text: string;
}

/** "¿Paga dividendo?" — yes (with annual $) or no. */
function dividendPill(
  dividendYield: number | null | undefined,
  price: number | null | undefined,
): WhatsImportantPill | null {
  if (dividendYield == null) return null;
  if (dividendYield <= 0) {
    return { emoji: "🚫", text: "No paga dividendo" };
  }
  if (price != null && price > 0) {
    const annualPerShare = (dividendYield / 100) * price;
    return {
      emoji: "💸",
      text: `Te paga ~$${annualPerShare.toFixed(2)}/año por acción`,
    };
  }
  return { emoji: "💸", text: `Paga ${dividendYield.toFixed(1)}% al año` };
}

/** "¿Qué dice Wall Street?" — translate the analyst consensus word. */
function analystPill(consensus: string | null | undefined): WhatsImportantPill | null {
  if (!consensus) return null;
  const c = consensus.toLowerCase().trim();
  if (c.includes("strong buy")) {
    return { emoji: "🚀", text: "Wall Street dice: compra fuerte" };
  }
  if (c === "buy" || c.includes("buy")) {
    return { emoji: "👍", text: "Wall Street dice: cómprala" };
  }
  if (c.includes("hold") || c.includes("neutral")) {
    return { emoji: "🤔", text: "Wall Street dice: mantenla, sin prisa" };
  }
  if (c.includes("sell")) {
    return { emoji: "👎", text: "Wall Street dice: no la compres" };
  }
  return null;
}

/** "¿Qué tan grande es?" — bucket by market cap, plain Spanish. */
function sizePill(marketCapB: number | null | undefined): WhatsImportantPill | null {
  if (marketCapB == null || marketCapB <= 0) return null;
  let bucket: string;
  if (marketCapB >= 1000) bucket = "Empresa gigante";
  else if (marketCapB >= 200) bucket = "Empresa muy grande";
  else if (marketCapB >= 50) bucket = "Empresa grande";
  else if (marketCapB >= 10) bucket = "Empresa mediana";
  else bucket = "Empresa chica";

  const size =
    marketCapB >= 1000
      ? `$${(marketCapB / 1000).toFixed(1)}T`
      : `$${Math.round(marketCapB)}B`;
  return { emoji: "🏢", text: `${bucket} (${size})` };
}

/**
 * Build the 3-pill "LO IMPORTANTE" array for a stock. Order is
 * deliberate: dividend first (mom cares about cash), then Wall Street
 * (social proof), then size (gut check). Nulls dropped.
 */
export function buildWhatsImportant(stock: {
  dividend_yield: number | null;
  price: number | null;
  analyst_consensus: string | null;
  market_cap_b: number | null;
}): WhatsImportantPill[] {
  const out: (WhatsImportantPill | null)[] = [
    dividendPill(stock.dividend_yield, stock.price),
    analystPill(stock.analyst_consensus),
    sizePill(stock.market_cap_b),
  ];
  return out.filter((p): p is WhatsImportantPill => p !== null);
}
