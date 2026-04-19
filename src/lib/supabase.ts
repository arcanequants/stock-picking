import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ===== Existing clients (data queries, cron jobs) =====

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

// Public client (for client-side reads)
export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase env vars not configured");
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Admin client (for server-side writes — cron jobs, API routes)
export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase admin env vars not configured");
    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
}

// ===== SSR-compatible server client for auth =====

// Server Component / Route Handler client — reads auth session from cookies
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component where cookies are read-only
          }
        },
      },
    }
  );
}

/**
 * Resolves the authenticated user for an API route.
 *
 * Accepts two auth mechanisms (in order):
 *   1. `Authorization: Bearer <jwt>` — used by the iOS app, JWTs from
 *      Supabase's verifyOtp flow.
 *   2. Supabase SSR session cookie — used by the web.
 *
 * Returns `null` if neither yields a valid user.
 */
export async function getAuthedUser(
  request: Request
): Promise<{ id: string; email: string } | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const jwt = authHeader.slice(7).trim();
    if (jwt) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && anon) {
        const bearerClient = createClient(url, anon, {
          global: { headers: { Authorization: `Bearer ${jwt}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await bearerClient.auth.getUser(jwt);
        if (!error && data.user?.email) {
          return { id: data.user.id, email: data.user.email.toLowerCase() };
        }
      }
    }
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email) {
    return { id: user.id, email: user.email.toLowerCase() };
  }
  return null;
}

// Backwards compat
export const supabase = typeof window !== "undefined" ? null : null;
export const supabaseAdmin = null;
