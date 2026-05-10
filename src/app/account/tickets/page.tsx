import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "My tickets — Vectorial Data",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://vectorialdata.com/account/tickets" },
};

export const dynamic = "force-dynamic";

type TicketRow = {
  id: number;
  category: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string | null;
};

export default async function MyTicketsPage() {
  const { user } = await getAuthState();
  if (!user) redirect("/login?next=/account/tickets");

  const supabase = getSupabaseAdmin();
  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, category, message, status, created_at, updated_at")
    .eq("email", user.email.toLowerCase())
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(50);

  const list = (tickets ?? []) as TicketRow[];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">Mis tickets</h1>
          <p className="text-sm text-text-muted">Conversaciones con el equipo de soporte.</p>
        </div>
        <Link href="/account" className="text-sm text-text-muted hover:text-foreground">
          ← Cuenta
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="border border-border rounded-xl p-8 text-center">
          <p className="text-sm text-text-muted">Aún no tienes tickets abiertos.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((t) => (
            <Link
              key={t.id}
              href={`/account/tickets/${t.id}`}
              className="block border border-border rounded-xl px-4 py-3 hover:bg-card-hover transition-colors"
            >
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-xs font-mono text-text-muted shrink-0">#{t.id}</span>
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
                    {t.status === "open" ? "abierto" : "cerrado"}
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
