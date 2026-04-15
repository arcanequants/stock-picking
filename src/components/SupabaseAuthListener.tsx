"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

/**
 * Invisible component that keeps the Supabase session alive.
 * onAuthStateChange() sets up an internal timer that refreshes
 * the access token before it expires — without this, the token
 * silently dies after JWT expiry (default 1h) and the user gets
 * logged out on their next request.
 */
export default function SupabaseAuthListener() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // The listener itself is what triggers the refresh mechanism.
      // No action needed here — Supabase JS handles token refresh
      // automatically once onAuthStateChange is subscribed.
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
