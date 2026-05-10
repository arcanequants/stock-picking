import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import { getAdminAuth } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase";
import AdminReplyForm from "./AdminReplyForm";

export const metadata: Metadata = {
  title: "Ticket — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Message = {
  id: number;
  sender_type: "user" | "admin";
  sender_email: string;
  body: string;
  created_at: string;
};

type Ticket = {
  id: number;
  email: string;
  category: string | null;
  status: string;
  created_at: string;
};

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await getAuthState();
  if (!user) redirect(`/login?next=/admin/tickets/${id}`);
  const admin = await getAdminAuth();
  if (!admin) notFound();

  const ticketId = Number(id);
  if (!Number.isInteger(ticketId) || ticketId <= 0) notFound();

  const supabase = getSupabaseAdmin();

  const [{ data: ticket }, { data: messages }] = await Promise.all([
    supabase
      .from("support_tickets")
      .select("id, email, category, status, created_at")
      .eq("id", ticketId)
      .single(),
    supabase
      .from("support_ticket_messages")
      .select("id, sender_type, sender_email, body, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }),
  ]);

  if (!ticket) notFound();
  const t = ticket as Ticket;
  const msgs = (messages ?? []) as Message[];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-4">
        <Link href="/admin/tickets" className="text-sm text-text-muted hover:text-foreground">
          ← All tickets
        </Link>
      </div>

      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h1 className="text-2xl font-bold">Ticket #{t.id}</h1>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            t.status === "open"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-zinc-500/15 text-text-muted"
          }`}
        >
          {t.status}
        </span>
      </div>
      <p className="text-sm text-text-muted mb-6">
        {t.email}
        {t.category && <span className="ml-2 text-text-faint">· {t.category}</span>}
      </p>

      <div className="space-y-3 mb-6">
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`border rounded-xl p-4 ${
              m.sender_type === "admin"
                ? "border-brand/30 bg-brand/5 ml-8"
                : "border-border bg-card mr-8"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-text-muted">
                {m.sender_type === "admin" ? "You" : m.sender_email}
              </span>
              <span className="text-[11px] text-text-faint">
                {new Date(m.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap text-foreground">{m.body}</p>
          </div>
        ))}
      </div>

      <AdminReplyForm ticketId={t.id} />
    </div>
  );
}
