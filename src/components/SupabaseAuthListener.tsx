"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

// Public pages that should redirect a user to /portfolio when they log in
// from another tab (magic-link click). Anything else just refreshes server
// components in place so the UI reflects the new session.
const PUBLIC_REDIRECT_PATHS = ["/", "/join", "/lecciones", "/stocks", "/news", "/quant-lab", "/api-docs"];

export default function SupabaseAuthListener() {
  const router = useRouter();
  const initialized = useRef(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      // The first emission after mount is the existing session being replayed
      // (INITIAL_SESSION, or SIGNED_IN with the prior session). It is not a
      // real cross-tab login, so skip it.
      if (!initialized.current) {
        initialized.current = true;
        return;
      }

      if (event === "SIGNED_IN" && session) {
        const path = window.location.pathname;
        const isPublic = PUBLIC_REDIRECT_PATHS.some(
          (p) => path === p || path.startsWith(p + "/"),
        );
        if (isPublic) {
          window.location.href = "/portfolio";
        } else {
          router.refresh();
        }
      } else if (event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
