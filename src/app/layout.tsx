import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans_Devanagari } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import MobileNav from "@/components/MobileNav";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
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
    title: t("title"),
    description: t("description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations("Nav");
  const tFooter = await getTranslations("Footer");

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoDevanagari.variable} antialiased bg-background text-foreground min-h-screen ${locale === "hi" ? "font-[var(--font-noto-devanagari)]" : ""}`}
      >
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            {/* Navigation */}
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
                  <LanguageSwitcher />
                  <ThemeToggle />
                  <Link
                    href="/join"
                    className="bg-brand hover:bg-brand-hover text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    {t("join")}
                  </Link>
                </div>

                {/* Mobile Nav */}
                <div className="flex md:hidden items-center gap-2">
                  <LanguageSwitcher />
                  <ThemeToggle />
                  <MobileNav />
                </div>
              </div>
            </nav>

            <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>

            {/* Footer */}
            <footer className="border-t border-border mt-16">
              <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-text-faint">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Image src="/logo.png" alt="Vectorial Data" width={24} height={24} />
                  <span className="font-semibold text-text-muted">Vectorial Data</span>
                </div>
                <p>{tFooter("disclaimer")}</p>
                <p className="mt-1">{tFooter("prices")}</p>
              </div>
            </footer>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
