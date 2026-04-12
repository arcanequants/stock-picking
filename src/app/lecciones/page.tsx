import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { isUkVisitor } from "@/lib/geo";
import {
  selectCurrentLessons,
  getLessonContent,
  type LessonEntry,
} from "@/lib/lessons";
import {
  JsonLd,
  getGenericArticleSchema,
  getGenericFaqSchema,
} from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 min stale-while-revalidate

const SITE_URL = "https://www.vectorialdata.com";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Lecciones");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `${SITE_URL}/lecciones`,
      languages: {
        es: `${SITE_URL}/lecciones`,
        en: `${SITE_URL}/lecciones`,
        pt: `${SITE_URL}/lecciones`,
        hi: `${SITE_URL}/lecciones`,
      },
    },
    robots: { index: true, follow: true },
  };
}

async function loadLatestPrices(): Promise<Record<string, number>> {
  try {
    const { data } = await getSupabase()
      .from("portfolio_snapshots")
      .select("prices")
      .order("date", { ascending: false })
      .limit(1);
    return (data?.[0]?.prices as Record<string, number>) ?? {};
  } catch {
    return {};
  }
}

export default async function LeccionesPage() {
  const t = await getTranslations("Lecciones");
  const tLegal = await getTranslations("Legal");

  const prices = await loadLatestPrices();
  const lessons = selectCurrentLessons(prices);
  const now = new Date();
  const timestamp = now.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  });

  // UK geo-targeted banner
  const showUkBanner = await isUkVisitor();

  // Schema.org
  const articleSchema = getGenericArticleSchema({
    headline: t("pageTitle"),
    description: t("metaDescription"),
    datePublished: "2026-04-10",
    dateModified: now.toISOString(),
    url: `${SITE_URL}/lecciones`,
  });

  const faqSchema = getGenericFaqSchema([
    { question: t("faq1Q"), answer: t("faq1A") },
    { question: t("faq2Q"), answer: t("faq2A") },
    { question: t("faq3Q"), answer: t("faq3A") },
    { question: t("faq4Q"), answer: t("faq4A") },
    { question: t("faq5Q"), answer: t("faq5A") },
  ]);

  return (
    <div className="max-w-3xl mx-auto">
      <JsonLd data={articleSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      {/* UK Geo-Banner */}
      {showUkBanner && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 mb-6">
          <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">
            {tLegal("ukBannerTitle")}
          </p>
          <p className="mt-2 text-xs text-text-muted">{tLegal("ukBannerBody")}</p>
        </div>
      )}

      {/* H1 + subtitle */}
      <h1 className="text-3xl sm:text-4xl font-bold mb-2">{t("pageTitle")}</h1>
      <p className="text-text-muted mb-2">{t("pageSubtitle")}</p>
      <p className="text-sm text-text-faint mb-8">
        {t("lastUpdated", { timestamp })}
      </p>

      {/* Above-the-fold disclaimer (same prominence as H1) */}
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 mb-8">
        <p className="font-semibold text-amber-700 dark:text-amber-400">
          ⚠ {t("noticeTitle")}
        </p>
        <p className="mt-2 text-sm text-text-muted">{t("noticeBody")}</p>
        <p className="mt-2 text-sm">
          <Link
            href="/metodologia"
            className="text-brand hover:text-brand-hover transition-colors"
          >
            {t("noticeMethodologyLink")}
          </Link>
        </p>
      </div>

      {/* How we chose */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">{t("howWeChoseTitle")}</h2>
        <p className="text-text-muted">{t("howWeChoseBody")}</p>
        <p className="text-sm text-text-faint mt-3 mb-1">
          {t("howWeChoseCriteriaTitle")}:
        </p>
        <ul className="text-sm text-text-muted space-y-1 list-disc list-inside">
          <li>{t("howWeChoseC1")}</li>
          <li>{t("howWeChoseC2")}</li>
          <li>{t("howWeChoseC3")}</li>
          <li>{t("howWeChoseC4")}</li>
          <li>{t("howWeChoseC5")}</li>
        </ul>
      </section>

      {/* Lessons */}
      {lessons.length === 0 ? (
        <div className="rounded-lg border border-border bg-background-subtle p-6 mb-10">
          <h2 className="text-lg font-semibold mb-2">{t("emptyTitle")}</h2>
          <p className="text-text-muted">{t("emptyBody")}</p>
        </div>
      ) : (
        <div className="space-y-10 mb-12">
          {lessons.map((lesson, idx) => (
            <LessonCard key={lesson.ticker} lesson={lesson} index={idx + 1} />
          ))}
        </div>
      )}

      {/* Portfolio context */}
      <section className="rounded-lg border border-border bg-background-subtle p-6 mb-10">
        <h2 className="text-xl font-semibold mb-3">{t("contextTitle")}</h2>
        <p className="text-text-muted">
          {t.rich("contextBody", {
            portfolioLink: (chunks) => (
              <Link
                href="/portfolio"
                className="text-brand hover:text-brand-hover underline underline-offset-2"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">{t("faqTitle")}</h2>
        <div className="space-y-4">
          <FaqItem q={t("faq1Q")} a={t("faq1A")} />
          <FaqItem q={t("faq2Q")} a={t("faq2A")} />
          <FaqItem q={t("faq3Q")} a={t("faq3A")} />
          <FaqItem q={t("faq4Q")} a={t("faq4A")} />
          <FaqItem q={t("faq5Q")} a={t("faq5A")} />
        </div>
      </section>

      {/* Extended disclosures footer */}
      <section className="rounded-lg border border-border p-6 mb-8 text-sm text-text-muted">
        <h2 className="text-base font-semibold mb-3 text-foreground">
          {t("disclosuresFooterTitle")}
        </h2>
        <ol className="list-decimal list-inside space-y-1.5">
          <li>{t("disclosuresF1")}</li>
          <li>{t("disclosuresF2")}</li>
          <li>{t("disclosuresF3")}</li>
          <li>{t("disclosuresF4")}</li>
          <li>{t("disclosuresF5")}</li>
          <li>{t("disclosuresF6")}</li>
          <li>{t("disclosuresF7")}</li>
        </ol>
        <p className="mt-3">
          <Link
            href="/disclosures"
            className="text-brand hover:text-brand-hover transition-colors"
          >
            {t("disclosuresF8Link")}
          </Link>
        </p>
        <p className="mt-3 text-xs text-text-faint">
          {tLegal("lastUpdated", { date: "2026-04-10" })}
        </p>
      </section>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="rounded-lg border border-border p-4">
      <summary className="cursor-pointer font-medium text-foreground">
        {q}
      </summary>
      <p className="mt-2 text-text-muted text-sm">{a}</p>
    </details>
  );
}

async function LessonCard({
  lesson,
  index,
}: {
  lesson: LessonEntry;
  index: number;
}) {
  const t = await getTranslations("Lecciones");
  const content = getLessonContent(lesson.ticker);
  const returnDisplay = `${lesson.return_pct > 0 ? "+" : ""}${lesson.return_pct.toFixed(2)}`;
  const price = lesson.avg_price.toFixed(2);

  return (
    <article className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <header className="p-5 border-b border-border bg-background-subtle">
        <p className="text-xs font-mono uppercase tracking-wide text-text-faint">
          {t("lessonLabel", { number: index })}
        </p>
        <h3 className="text-xl font-semibold mt-1">
          {lesson.ticker} · {lesson.name}
        </h3>
        <p className="text-sm text-text-muted mt-2">
          {t("lessonBoughtAt", { date: lesson.first_bought, price })}
          {lesson.buys > 1 && (
            <>
              {" · "}
              {t("lessonBuysCount", { count: lesson.buys })}
            </>
          )}
        </p>
        <p className="text-sm mt-2">
          <span className="font-semibold text-rose-600 dark:text-rose-400">
            {t("lessonReturn", { pct: returnDisplay })}
          </span>
          <span className="text-text-faint">
            {" * "}
          </span>
        </p>
        <p className="text-xs text-text-faint mt-1">
          {t("lessonRealtimeNote")}
        </p>
      </header>

      {/* Body: thesis / what happened / lesson */}
      <div className="p-5 space-y-5">
        {content ? (
          <>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-text-faint mb-1">
                {t("sectionThesis")}
              </h4>
              <p className="text-sm text-text-muted">{content.thesis}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-text-faint mb-1">
                {t("sectionWhatHappened")}
              </h4>
              <p className="text-sm text-text-muted">{content.whatHappened}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-text-faint mb-1">
                {t("sectionLesson")}
              </h4>
              <p className="text-sm text-text-muted">{content.lesson}</p>
            </div>
          </>
        ) : (
          <p className="text-sm italic text-text-faint">{t("pendingContent")}</p>
        )}

        {/* Attestations link */}
        {lesson.attestation_uids.length > 0 && (
          <div className="pt-4 border-t border-border">
            <Link
              href={`/verify/${lesson.ticker}`}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              🔗 {t("verifyAttestations")}
            </Link>
            <p className="text-xs text-text-faint mt-1">
              {t("verifyCount", { count: lesson.attestation_uids.length })}
            </p>
          </div>
        )}

        {/* Per-pick footnote */}
        <p className="text-xs text-text-faint pt-3 border-t border-border">
          * {t("perPickFootnote")}
        </p>
      </div>
    </article>
  );
}
