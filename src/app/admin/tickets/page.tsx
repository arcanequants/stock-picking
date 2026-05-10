import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import { getAdminAuth } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Support tickets — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type TicketRow = {
  id: number;
  email: string;
  category: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string | null;
};

type SearchParams = Promise<{ status?: string }>;

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { user } = await getAuthState();
  if (!user) redirect("/login?next=/admin/tickets");
  const admin = await getAdminAuth();
  if (!admin) notFound();

  const sp = await searchParams;
  const filterStatus = sp.status === "closed" ? "closed" : sp.status === "all" ? null : "open";

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("support_tickets")
    .select("id, email, category, message, status, created_at, updated_at")
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (filterStatus) query = query.eq("status", filterStatus);

  const { data: tickets } = await query;
  const list = (tickets ?? []) as TicketRow[];

  const tabs: { key: string; label: string }[] = [
    { key: "open", label: "Open" },
    { key: "closed", label: "Closed" },
    { key: "all", label: "All" },
  ];
  const activeKey = sp.status === "closed" ? "closed" : sp.status === "all" ? "all" : "open";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Support tickets</h1>
        <p className="text-sm text-text-muted">Reply from here so users get a branded email.</p>
      </div>

      <div className="flex gap-2 mb-4 border-b border-border">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key === "open" ? "/admin/tickets" : `/admin/tickets?status=${t.key}`}
            className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
              activeKey === t.key
                ? "border-foreground text-foreground"
                : "border-transparent text-text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-text-muted py-8 text-center">No tickets.</p>
      ) : (
        <div className="space-y-2">
          {list.map((t) => (
            <Link
              key={t.id}
              href={`/admin/tickets/${t.id}`}
              className="block border border-border rounded-xl px-4 py-3 hover:bg-card-hover transition-colors"
            >
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-xs font-mono text-text-muted shrink-0">#{t.id}</span>
                  <span className="text-sm font-medium text-foreground truncate">{t.email}</span>
                  {t.category && (
                    <span className="text-[11px] uppercase tracking-wide text-text-faint shrink-0">
                      {t.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full ${
                      t.status === "open"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-zinc-500/15 text-text-muted"
                    }`}
                  >
                    {t.status}
                  </span>
                  <span className="text-[11px] text-text-faint">
                    {new Date(t.updated_at ?? t.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="text-sm text-text-secondary line-clamp-2">{t.message}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
