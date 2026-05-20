import Link from "next/link";

type Variant = "compact" | "footer";

const COPY = {
  compact: {
    headline: "Get alerts on WhatsApp",
    sub: "When any signal crosses its alert threshold. $1/mo.",
    cta: "Join WhatsApp",
  },
  footer: {
    headline: "Signal alerts, delivered on WhatsApp",
    sub: "We watch the signals so you don't have to. A short message when something actually moves. $1/mo.",
    cta: "Subscribe — $1/mo",
  },
} as const;

export function SignalsWhatsAppCta({
  variant = "compact",
  href,
}: {
  variant?: Variant;
  href?: string;
}) {
  // Default to the click-tracked redirect endpoint — it stamps wa_click_at
  // when token is present and 302s to the WhatsApp group regardless. Falls
  // back to /pricing if the redirect itself is unconfigured.
  const link = href ?? "/api/go/wa";
  const copy = COPY[variant];
  const isExternal = link.startsWith("http");

  const inner = (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-strong">
          {copy.headline}
        </p>
        <p className="text-xs text-text-muted mt-0.5">{copy.sub}</p>
      </div>
      <span className="inline-flex items-center justify-center rounded-md bg-signals-accent text-white text-xs font-semibold px-3 py-2 whitespace-nowrap hover:bg-signals-accent-hover transition-colors">
        {copy.cta} →
      </span>
    </div>
  );

  const wrapperClass =
    variant === "footer"
      ? "rounded-2xl border border-signals-accent-border bg-signals-accent-subtle p-5"
      : "rounded-xl border border-signals-accent-border/60 bg-signals-accent-subtle/60 p-4 mt-3";

  if (isExternal) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className={`block ${wrapperClass}`}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={link} className={`block ${wrapperClass}`}>
      {inner}
    </Link>
  );
}
