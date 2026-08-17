import { getSupabaseAdmin } from "@/lib/supabase";
import {
  sendBriefingEmail,
  type BriefingPayload,
} from "@/lib/briefing-email";

/**
 * Single entry point for publishing the daily marketing briefing: email first,
 * archive second.
 *
 * History (2026-07-29): the "Briefing diario" cloud routine used to build the
 * payload and PUT it to briefings/YYYY-MM-DD.json through the GitHub Contents
 * API, letting a Vercel cron read the file and send the email. Two things were
 * broken:
 *   1. The routine sandbox lost egress to api.github.com on 2026-06-23 — 35
 *      days of briefings were generated and thrown away.
 *   2. The cron ran at 12:30 UTC while the routine writes at ~14:10 UTC, so it
 *      looked for the file 100 minutes before it existed. It had never sent a
 *      single briefing.
 * Now the routine calls the `publish_briefing` MCP tool (same connector the
 * news and econ routines already use, so no GitHub and no token in the prompt)
 * and this function does the work in-request.
 *
 * The email is what matters, so a failed archive never fails the publish — it
 * comes back as `archived: false` with the reason.
 */

export type PublishBriefingResult = {
  ok: true;
  date: string;
  drafts: number;
  emailId?: string;
  archived: boolean;
  archiveError?: string;
};

export type PublishBriefingError = {
  ok: false;
  error: string;
};

/** Basic shape + sanity validation. Rejects rather than emailing garbage. */
function validate(payload: BriefingPayload): string | null {
  if (!payload?.date || !/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
    return "date is required, format YYYY-MM-DD";
  }
  if (!Array.isArray(payload.drafts) || payload.drafts.length === 0) {
    return "drafts[] is required and must not be empty";
  }
  const bad = payload.drafts.findIndex(
    (d) => typeof d?.text !== "string" || d.text.trim().length === 0,
  );
  if (bad !== -1) return `drafts[${bad}] has no text`;
  return null;
}

export async function publishBriefing(
  payload: BriefingPayload,
): Promise<PublishBriefingResult | PublishBriefingError> {
  const invalid = validate(payload);
  if (invalid) return { ok: false, error: invalid };

  let emailId: string | undefined;
  try {
    const sent = await sendBriefingEmail(payload);
    emailId = sent.id;
  } catch (e) {
    return {
      ok: false,
      error: `email_failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // Archive is best-effort: the briefing already reached the inbox.
  let archived = false;
  let archiveError: string | undefined;
  try {
    const { error } = await getSupabaseAdmin()
      .from("briefings")
      .upsert(
        {
          date: payload.date,
          summary: payload.summary ?? null,
          causal_chain: payload.causalChain ?? null,
          drafts: payload.drafts,
          table_rows: payload.table ?? null,
          email_id: emailId ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "date" },
      );
    if (error) archiveError = error.message;
    else archived = true;
  } catch (e) {
    archiveError = e instanceof Error ? e.message : String(e);
  }

  return {
    ok: true,
    date: payload.date,
    drafts: payload.drafts.length,
    emailId,
    archived,
    ...(archiveError ? { archiveError } : {}),
  };
}
