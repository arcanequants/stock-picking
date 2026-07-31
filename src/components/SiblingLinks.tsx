import Link from "next/link";
import { getTranslations, getMessages } from "next-intl/server";
import { getSectorGroups, getCountryGroups } from "@/lib/stock-lists";

/**
 * Lateral links between list pages of the same kind. Without these, each list
 * page is a dead end that only points down into ticker pages.
 */
export default async function SiblingLinks({
  kind,
  currentSlug,
  titleKey,
}: {
  kind: "sector" | "country";
  /** Empty string lists every group (used on pages that aren't one of them). */
  currentSlug: string;
  titleKey?: "exploreSectorsTitle" | "exploreCountriesTitle";
}) {
  const t = await getTranslations("StockLists");
  const messages = (await getMessages()) as Record<string, unknown>;
  const labels = (messages.Labels ?? {}) as Record<
    string,
    Record<string, string>
  >;

  const groups = kind === "sector" ? getSectorGroups() : getCountryGroups();
  const others = groups.filter((g) => g.slug !== currentSlug);
  if (others.length === 0) return null;

  const dict = kind === "sector" ? "sector" : "country";
  const base = kind === "sector" ? "/acciones/sector" : "/acciones/pais";

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold mb-3">
        {titleKey
          ? t(titleKey)
          : kind === "sector"
            ? t("otherSectorsTitle")
            : t("otherCountriesTitle")}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {others.map((g) => (
          <li key={g.slug}>
            <Link
              href={`${base}/${g.slug}`}
              className="inline-block rounded-full border border-border px-3 py-1 text-sm text-text-muted hover:border-brand hover:text-brand transition-colors"
            >
              {labels[dict]?.[g.value] ?? g.value}
              <span className="ml-1.5 text-text-faint tabular-nums">
                {g.stocks.length}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
