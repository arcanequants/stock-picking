import type { Metadata } from "next";
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
import "./globals.css";

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
        : "https://www.vectorialdata.com")
    ),
    title: t("title"),
    description: t("description"),
    openGraph: {
      images: [{ url: "/api/og/portfolio", width: 1200, height: 630 }],
      siteName: "Vectorial Data",
    },
    twitter: { card: "summary_large_image" },
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

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoDevanagari.variable} antialiased bg-background text-foreground min-h-screen ${locale === "hi" ? "font-[var(--font-noto-devanagari)]" : ""}`}
      >
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
                  <p>{tFooter("disclaimer")}</p>
                  <p className="mt-1">{tFooter("prices")}</p>
                  <p className="mt-1">{tFooter("copyright", { year: new Date().getFullYear() })}</p>
                </div>
              </footer>
            )}

            {!isMarketing && <CookieConsent />}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
