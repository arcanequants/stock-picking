import { getTranslations, getLocale } from "next-intl/server";
import { labSerif, labMono } from "@/lib/lab-fonts";
import { getAuthState } from "@/lib/auth";
import LabNav from "@/components/lab/LabNav";
import LabFooter from "@/components/lab/LabFooter";

const TERMINAL = "https://terminal.vectorialdata.com";

/**
 * Lab chrome for the sub-landings (/copy-trading, /outcomes): the lab nav
 * (section links point back to the homepage anchors) + the lab footer.
 * The homepage assembles its own chrome inline — its links are same-page
 * anchors. ChromeGate excludes these routes from the global product nav.
 */
export default async function LabShell({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("Lab");
  const locale = await getLocale();
  const { user } = await getAuthState();
  const home = locale === "es" ? "" : `/${locale}`;
  const stocksHref = user ? "/portfolio" : `${home}/estrategias/stocks`;

  const anchors: Array<[string, string]> = [
    ["que-hacemos", t("navWhat")],
    ["estrategias", t("navStrategies")],
    ["cuenta", t("navAccount")],
    ["seguridad", t("secLabel")],
    ["plataformas", t("navPlatforms")],
    ["registro", t("navRegistry")],
  ];

  return (
    <div className={`vlab ${labSerif.variable} ${labMono.variable}`}>
      <LabNav
        links={anchors.map(([id, label]) => ({ href: `${home || ""}/#${id}`, label }))}
        access={t("navAccess")}
        terminal={TERMINAL}
        accounts={{
          terminal: { title: t("accTerminalT"), desc: t("accTerminalD"), meta: "terminal.vectorialdata.com" },
          stocks: { title: t("accStocksT"), desc: t("accStocksD"), meta: "vectorialdata.com", href: stocksHref },
        }}
      />
      {children}
      <LabFooter />
    </div>
  );
}
