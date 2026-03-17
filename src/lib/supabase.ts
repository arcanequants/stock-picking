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

// Backwards compat
export const supabase = typeof window !== "undefined" ? null : null;
export const supabaseAdmin = null;
