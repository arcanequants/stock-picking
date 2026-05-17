import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import {
  SIGNALS_TERMS_LAST_UPDATED,
  getSignalsTerms,
} from "@/data/signals-terms";

const SITE_URL = "https://vectorialdata.com";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getSignalsTerms(locale);
  return {
    title: `${t.title} | Vectorial Data`,
    description: t.intro.slice(0, 200),
    alternates: { canonical: `${SITE_URL}/legal/signals-terms` },
    robots: { index: true, follow: true },
  };
}

export default async function SignalsTermsPage() {
  const locale = await getLocale();
  const t = getSignalsTerms(locale);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-sm text-text-faint">
          {t.lastUpdatedLabel}: {SIGNALS_TERMS_LAST_UPDATED}
        </p>
      </header>

      <p className="text-text-muted leading-relaxed">{t.intro}</p>

      <div className="space-y-8">
        {t.sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">
              {section.heading}
            </h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="text-sm text-text-muted leading-relaxed">
                {p}
              </p>
            ))}
            {section.bullets && (
              <ul className="text-sm text-text-muted leading-relaxed list-disc list-inside space-y-1.5">
                {section.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
