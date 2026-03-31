import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function BlockchainBadge({
  ticker,
  attestationUid,
}: {
  ticker: string;
  attestationUid?: string;
}) {
  if (!attestationUid) return null;

  const t = await getTranslations("Verify");

  return (
    <Link
      href={`/verify/${ticker}`}
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full
                 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400
                 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors"
    >
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      {t("badgeText")}
    </Link>
  );
}
