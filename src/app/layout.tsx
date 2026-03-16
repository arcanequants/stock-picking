import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import MobileNav from "@/components/MobileNav";
import ThemeToggle from "@/components/ThemeToggle";
import { ThemeProvider } from "@/components/ThemeProvider";
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
  title: "Vectorial Data — Portafolio de Acciones",
  description:
    "Picks de acciones enfocados en dividendos y apreciación de capital. Actualizado diariamente.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <ThemeProvider>
          {/* Navigation */}
          <nav className="border-b border-border sticky top-0 backdrop-blur-md z-50 relative" style={{ background: 'var(--nav-bg)' }}>
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-sm font-bold text-white">
                  VD
                </div>
                <span className="font-semibold text-lg">Vectorial Data</span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-6 text-sm">
                <Link
                  href="/"
                  className="text-text-muted hover:text-foreground transition-colors"
                >
                  Inicio
                </Link>
                <Link
                  href="/portfolio"
                  className="text-text-muted hover:text-foreground transition-colors"
                >
                  Portafolio
                </Link>
                <Link
                  href="/stocks"
                  className="text-text-muted hover:text-foreground transition-colors"
                >
                  Acciones
                </Link>
                <ThemeToggle />
                <Link
                  href="/join"
                  className="bg-brand hover:bg-brand-hover text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
                >
                  Únete $1/mes
                </Link>
              </div>

              {/* Mobile Nav */}
              <div className="flex md:hidden items-center gap-2">
                <ThemeToggle />
                <MobileNav />
              </div>
            </div>
          </nav>

          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>

          {/* Footer */}
          <footer className="border-t border-border mt-16">
            <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-text-faint">
              <p>
                Vectorial Data — Portafolio de Acciones. Esto no es asesoría financiera.
              </p>
              <p className="mt-1">Todos los precios en USD.</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
