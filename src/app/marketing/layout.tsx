import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 border-r border-border min-h-screen p-4 hidden md:block">
          <h2 className="font-bold text-lg mb-1">Marketing</h2>
          <p className="text-text-faint text-xs mb-6">Vectorial Data</p>
          <nav className="space-y-1">
            <Link
              href="/marketing"
              className="block px-3 py-2 rounded-lg hover:bg-card text-sm"
            >
              Overview
            </Link>
            <Link
              href="/marketing/analytics"
              className="block px-3 py-2 rounded-lg hover:bg-card text-sm"
            >
              Analytics
            </Link>
            <Link
              href="/marketing/data"
              className="block px-3 py-2 rounded-lg hover:bg-card text-sm"
            >
              Data Entry
            </Link>
          </nav>
          <div className="mt-8 pt-4 border-t border-border">
            <form action="/api/marketing/auth/logout" method="POST">
              <button
                type="submit"
                className="text-text-faint hover:text-foreground text-xs transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        {/* Mobile header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <span className="font-bold">Marketing</span>
          <div className="flex gap-3 text-sm">
            <Link href="/marketing" className="text-text-muted">
              Overview
            </Link>
            <Link href="/marketing/analytics" className="text-text-muted">
              Analytics
            </Link>
            <Link href="/marketing/data" className="text-text-muted">
              Data
            </Link>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 p-6 md:p-8 max-w-5xl mt-14 md:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
