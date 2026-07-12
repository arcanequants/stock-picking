import Link from "next/link";
import { useTranslations } from "next-intl";

export default function HowToCopy({
  leadDetailsUrl,
  referralUrl,
}: {
  leadDetailsUrl: string;
  referralUrl: string | null;
}) {
  const t = useTranslations("QuantLabCopy");
  return (
    <div className="border border-border rounded-2xl p-5">
      <h2 className="font-semibold mb-1">{t("title")}</h2>
      <p className="text-xs text-text-muted mb-5">{t("intro")}</p>

      <div className="space-y-5 text-sm">
        <Door
          step="1"
          title={t("path1Title")}
          body={t("path1Body")}
          cta={
            <a
              href={leadDetailsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              {t("openBinance")}
            </a>
          }
        />

        <Door
          step="2"
          title={t("path2Title")}
          body={
            <>
              <ol className="list-decimal pl-4 space-y-1 text-text-secondary">
                <li>{t("path2Step1")}</li>
                <li>{t("path2Step2")}</li>
                <li>{t("path2Step3")}</li>
              </ol>
              <a
                href={leadDetailsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 border border-border px-3 py-1.5 rounded-lg text-xs hover:border-foreground/40"
              >
                {t("openBinance")}
              </a>
            </>
          }
        />

        <Door
          step="3"
          title={t("path3Title")}
          body={
            <div className="flex flex-wrap gap-2 text-xs">
              {referralUrl && (
                <a
                  href={referralUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-border px-3 py-1.5 rounded-lg hover:border-foreground/40"
                >
                  {t("createAccount")}
                </a>
              )}
              <Link
                href="/quant-lab/guia-copy-trading-binance"
                className="border border-border px-3 py-1.5 rounded-lg hover:border-foreground/40"
              >
                {t("stepGuide")}
              </Link>
            </div>
          }
        />
      </div>

      <p className="text-xs text-text-faint mt-5 leading-relaxed">{t("disclaimer")}</p>
    </div>
  );
}

function Door({
  step,
  title,
  body,
  cta,
}: {
  step: string;
  title: string;
  body: React.ReactNode;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-7 h-7 rounded-full border border-border flex items-center justify-center text-xs font-semibold text-text-muted">
        {step}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium mb-1">{title}</p>
        <div className="text-text-muted">{body}</div>
        {cta && <div className="mt-2">{cta}</div>}
      </div>
    </div>
  );
}
