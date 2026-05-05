// 60 days — outlives a browser close so users stay logged in.
// Refresh-token validity is controlled in the Supabase Dashboard
// (Auth → Sessions → Inactivity timeout) and must also be ≥ 60d.
export const AUTH_SESSION_MAX_AGE = 60 * 24 * 60 * 60;
