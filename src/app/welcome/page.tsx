import { getTranslations } from "next-intl/server";
import Link from "next/link";

const WA_GROUP_LINK =
  "https://chat.whatsapp.com/IxkYFffrCc5EL9smXvDVwX?mode=gi_t";

export default async function WelcomePage() {
  const t = await getTranslations("Welcome");

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-8">
      {/* Success checkmark */}
      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="text-emerald-600 dark:text-emerald-400"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-text-muted text-lg">{t("subtitle")}</p>

      {/* Step 1: Join WhatsApp */}
      <div className="border border-border rounded-2xl p-6 text-left">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h2 className="font-semibold">{t("step1Title")}</h2>
        </div>
        <p className="text-sm text-text-muted mb-4">{t("step1Desc")}</p>
        <a
          href={WA_GROUP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.616l4.574-1.466A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.287 0-4.406-.744-6.13-2.004l-.428-.321-2.714.87.897-2.642-.353-.46A9.935 9.935 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
          </svg>
          {t("joinWhatsApp")}
        </a>
      </div>

      {/* Step 2: Login for premium content */}
      <div className="border border-border rounded-2xl p-6 text-left">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h2 className="font-semibold">{t("step2Title")}</h2>
        </div>
        <p className="text-sm text-text-muted mb-4">{t("step2Desc")}</p>
        <Link
          href="/portfolio"
          className="inline-block bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          {t("goToPortfolio")}
        </Link>
      </div>

      {/* Tip */}
      <p className="text-sm text-text-faint">{t("tip")}</p>
    </div>
  );
}
