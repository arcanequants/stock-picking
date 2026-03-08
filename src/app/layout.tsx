import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import MobileNav from "@/components/MobileNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vectorial Data — Stock Picking Portfolio",
  description:
    "Curated stock picks focused on dividends and capital appreciation. Updated daily.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-white min-h-screen`}
      >
        {/* Navigation */}
        <nav className="border-b border-zinc-800 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-50 relative">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
                VD
              </div>
              <span className="font-semibold text-lg">Vectorial Data</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <Link
                href="/"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                href="/portfolio"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Portfolio
              </Link>
              <Link
                href="/stocks"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Stocks
              </Link>
              <Link
                href="/join"
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
              >
                Join $1.99/mo
              </Link>
            </div>

            {/* Mobile Nav */}
            <MobileNav />
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>

        {/* Footer */}
        <footer className="border-t border-zinc-800 mt-16">
          <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-zinc-500">
            <p>
              Vectorial Data — Stock Picking Portfolio. Not financial advice.
            </p>
            <p className="mt-1">All prices in USD.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
