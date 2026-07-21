/**
 * Model selection for the news pipeline (enrichment + per-news chat).
 *
 * `OPENAI_NEWS_MODEL` overrides the default — that's the rollback lever: set
 * it to "gpt-4o" in Vercel if gpt-5.6-luna misbehaves, no code change needed.
 * Translations are NOT covered here (they stay on gpt-4o-mini in
 * translate-content.ts).
 */
export const DEFAULT_NEWS_MODEL = "gpt-5.6-luna";

export function newsModel(): string {
  return process.env.OPENAI_NEWS_MODEL ?? DEFAULT_NEWS_MODEL;
}

/**
 * gpt-5.x / o-series take `reasoning_effort` + `max_completion_tokens` and
 * reject `temperature`; gpt-4.x is the reverse. Reasoning tokens bill as
 * output, so max_completion_tokens needs headroom above the visible answer
 * or the reply comes back empty.
 */
export function isReasoningModel(model: string): boolean {
  return /^(gpt-5|o\d)/.test(model);
}
