import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import UserReplyForm from "./UserReplyForm";

export const metadata: Metadata = {
  title: "Ticket — Vectorial Data",
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

export default async function UserTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await getAuthState();
  const { id } = await params;
  if (!user) redirect(`/login?next=/account/tickets/${id}`);

  const ticketId = Number(id);
  if (!Number.isInteger(ticketId) || ticketId <= 0) notFound();

  const supabase = getSupabaseAdmin();
  const userEmail = user.email.toLowerCase();

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, email, category, status, created_at")
    .eq("id", ticketId)
    .single();

  if (!ticket || (ticket as Ticket).email.toLowerCase() !== userEmail) notFound();
  const t = ticket as Ticket;

  const { data: messages } = await supabase
    .from("support_ticket_messages")
    .select("id, sender_type, sender_email, body, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  const msgs = (messages ?? []) as Message[];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-4">
        <Link href="/account/tickets" className="text-sm text-text-muted hover:text-foreground">
          ← Mis tickets
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
          {t.status === "open" ? "abierto" : "cerrado"}
        </span>
      </div>
      {t.category && <p className="text-sm text-text-muted mb-6">{t.category}</p>}

      <div className="space-y-3 mb-6">
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`border rounded-xl p-4 ${
              m.sender_type === "admin"
                ? "border-brand/30 bg-brand/5 mr-8"
                : "border-border bg-card ml-8"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-text-muted">
                {m.sender_type === "admin" ? "Vectorial Data" : "Tú"}
              </span>
              <span className="text-[11px] text-text-faint">
                {new Date(m.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap text-foreground">{m.body}</p>
          </div>
        ))}
      </div>

      <UserReplyForm ticketId={t.id} />
    </div>
  );
}
