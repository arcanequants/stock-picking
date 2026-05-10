import { getAuthState } from "@/lib/auth";

export const ADMIN_EMAIL = "0138078@up.edu.mx";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export async function getAdminAuth(): Promise<{ email: string } | null> {
  const { user } = await getAuthState();
  if (!isAdminEmail(user?.email)) return null;
  return { email: user!.email };
}
