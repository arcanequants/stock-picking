import { createBrowserClient } from "@supabase/ssr";
import { AUTH_SESSION_MAX_AGE } from "@/lib/supabase";

let _browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (_browserClient) return _browserClient;

  _browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: AUTH_SESSION_MAX_AGE,
        sameSite: "lax",
        path: "/",
      },
    }
  );

  return _browserClient;
}
