import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans_Devanagari } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import MobileNav from "@/components/MobileNav";
import AuthButton from "@/components/AuthButton";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CookieConsent from "@/components/CookieConsent";
import { getAuthState } from "@/lib/auth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { JsonLd, getOrganizationSchema } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const SITE_URL = "https://www.vectorialdata.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : SITE_URL)
    ),
    title: t("title"),
    description: t("description"),
    openGraph: {
      images: [{ url: "/api/og/portfolio", width: 1200, height: 630 }],
      siteName: "Vectorial Data",
    },
    twitter: { card: "summary_large_image" },
    alternates: {
      canonical: SITE_URL,
      languages: {
        es: SITE_URL,
        en: SITE_URL,
        pt: SITE_URL,
        hi: SITE_URL,
      },
    },
    ...(process.env.GOOGLE_SITE_VERIFICATION && {
      verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
    }),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isMarketing = pathname.startsWith("/marketing");

  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations("Nav");
  const tFooter = await getTranslations("Footer");
  const { user, isSubscribed } = isMarketing
    ? { user: null, isSubscribed: false }
    : await getAuthState();

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoDevanagari.variable} antialiased bg-background text-foreground min-h-screen ${locale === "hi" ? "font-[var(--font-noto-devanagari)]" : ""}`}
      >
        <JsonLd data={getOrganizationSchema()} />
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            {/* Navigation — hidden on marketing dashboard */}
            {!isMarketing && (
              <nav className="border-b border-border sticky top-0 backdrop-blur-md z-50 relative" style={{ background: 'var(--nav-bg)' }}>
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                  <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Vectorial Data" width={32} height={32} className="hidden md:block" />
                    <Image src="/logo.png" alt="Vectorial Data" width={28} height={28} className="block md:hidden" />
                    <span className="font-semibold text-lg">Vectorial Data</span>
                  </Link>

                  {/* Desktop Nav */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <Link
                      href="/"
                      className="text-text-muted hover:text-foreground transition-colors"
                    >
                      {t("home")}
                    </Link>
                    <Link
                      href="/portfolio"
                      className="text-text-muted hover:text-foreground transition-colors"
                    >
                      {t("portfolio")}
                    </Link>
                    <Link
                      href="/stocks"
                      className="text-text-muted hover:text-foreground transition-colors"
                    >
                      {t("stocks")}
                    </Link>
                    <Link
                      href="/notifications"
                      className="text-text-muted hover:text-foreground transition-colors"
                    >
                      {t("noticias")}
                    </Link>
                    <Link
                      href="/developers"
                      className="text-text-muted hover:text-foreground transition-colors"
                    >
                      API
                    </Link>
                    <Link href="/verify" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors" title={t("verifyTooltip")}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    </Link>
                    <LanguageSwitcher />
                    <ThemeToggle />
                    <NotificationBell isSubscribed={isSubscribed} />
                    <AuthButton
                      userEmail={user?.email ?? null}
                      isSubscribed={isSubscribed}
                    />
                    {!isSubscribed && (
                      <Link
                        href="/join"
                        className="bg-brand hover:bg-brand-hover text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
                      >
                        {t("join")}
                      </Link>
                    )}
                  </div>

                  {/* Mobile Nav */}
                  <div className="flex md:hidden items-center gap-2">
                    <LanguageSwitcher />
                    <ThemeToggle />
                    <MobileNav
                      userEmail={user?.email ?? null}
                      isSubscribed={isSubscribed}
                    />
                  </div>
                </div>
              </nav>
            )}

            {isMarketing ? children : (
              <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
            )}

            {/* Footer — hidden on marketing dashboard */}
            {!isMarketing && (
              <footer className="border-t border-border mt-16">
                <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-text-faint">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Image src="/logo.png" alt="Vectorial Data" width={24} height={24} />
                    <span className="font-semibold text-text-muted">Vectorial Data</span>
                  </div>
                  <div className="flex items-center justify-center gap-3 mb-3 text-text-muted flex-wrap">
                    <Link href="/terms" className="hover:text-foreground transition-colors">{tFooter("terms")}</Link>
                    <span className="text-border">·</span>
                    <Link href="/privacy" className="hover:text-foreground transition-colors">{tFooter("privacy")}</Link>
                    <span className="text-border">·</span>
                    <Link href="/disclaimer" className="hover:text-foreground transition-colors">{tFooter("financialDisclaimer")}</Link>
                    <span className="text-border">·</span>
                    <Link href="/verify" className="hover:text-foreground transition-colors">{tFooter("verify")}</Link>
                  </div>
                  <div className="flex items-center justify-center gap-3 mb-3 text-text-muted flex-wrap text-xs">
                    <Link href="/lecciones" className="hover:text-foreground transition-colors">{tFooter("lecciones")}</Link>
                    <span className="text-border">·</span>
                    <Link href="/metodologia" className="hover:text-foreground transition-colors">{tFooter("methodology")}</Link>
                    <span className="text-border">·</span>
                    <Link href="/disclosures" className="hover:text-foreground transition-colors">{tFooter("disclosures")}</Link>
                    <span className="text-border">·</span>
                    <Link href="/risk-disclosure" className="hover:text-foreground transition-colors">{tFooter("riskDisclosure")}</Link>
                    <span className="text-border">·</span>
                    <Link href="/legal-status" className="hover:text-foreground transition-colors">{tFooter("legalStatus")}</Link>
                  </div>
                  <p>{tFooter("disclaimer")}</p>
                  <p className="mt-1">{tFooter("prices")}</p>
                  <p className="mt-1">{tFooter("copyright", { year: new Date().getFullYear() })}</p>
                </div>
              </footer>
            )}

            {!isMarketing && <CookieConsent />}
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
