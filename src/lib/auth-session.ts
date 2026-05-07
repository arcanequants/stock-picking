// 60 days — outlives a browser close so users stay logged in.
// Refresh-token validity is controlled in the Supabase Dashboard
// (Auth → Sessions → Inactivity timeout) and must also be ≥ 60d.
export const AUTH_SESSION_MAX_AGE = 60 * 24 * 60 * 60;

// Cookie option overrides applied on top of whatever Supabase SSR sends.
// Critical: `secure: true` — Safari ITP demotes non-Secure cookies to
// session-only on HTTPS, which is exactly the "logs out on tab close" bug.
// Supabase's defaults omit `secure`, so we force it in production.
export function authCookieOverrides(isDelete: boolean) {
  if (isDelete) return {} as const;
  return {
    maxAge: AUTH_SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}
