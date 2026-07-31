import Link from "next/link";
import { getTranslations } from "next-intl/server";

/**
 * Shared tail for every /acciones/* page: how picks are chosen (links to the
 * methodology), the subscription CTA, and the standing disclaimer. Kept in one
 * place so the legal line can never drift between list pages.
 */
export default async function ListPageExtras({
  showHubLink = false,
}: {
  showHubLink?: boolean;
}) {
  const t = await getTranslations("StockLists");

  return (
    <>
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">{t("methodTitle")}</h2>
        <p className="text-text-muted">
          {t.rich("methodBody", {
            methodologyLink: (chunks) => (
              <Link
                href="/metodologia"
                className="text-brand hover:text-brand-hover underline underline-offset-2"
              >
                {chunks}
              </Link>
            ),
            lessonsLink: (chunks) => (
              <Link
                href="/lecciones"
                className="text-brand hover:text-brand-hover underline underline-offset-2"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </section>

      <section className="rounded-lg border border-border bg-background-subtle p-6 mb-10">
        <h2 className="text-xl font-semibold mb-2">{t("ctaTitle")}</h2>
        <p className="text-text-muted mb-4">{t("ctaBody")}</p>
        <Link
          href="/join"
          className="inline-block rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-hover transition-colors"
        >
          {t("ctaButton")}
        </Link>
      </section>

      <nav className="mb-10 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {showHubLink && (
          <Link
            href="/acciones"
            className="text-brand hover:text-brand-hover transition-colors"
          >
            ← {t("backToHub")}
          </Link>
        )}
        <Link
          href="/stocks"
          className="text-brand hover:text-brand-hover transition-colors"
        >
          {t("allStocksLabel")}
        </Link>
        <Link
          href="/portfolio"
          className="text-brand hover:text-brand-hover transition-colors"
        >
          {t("portfolioLabel")}
        </Link>
      </nav>

      <p className="text-xs text-text-faint border-t border-border pt-6 mb-10">
        {t("disclaimer")}
      </p>
    </>
  );
}
