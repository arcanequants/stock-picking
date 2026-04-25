import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import LoginForm from "@/components/LoginForm";
import { getAuthState } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Iniciar sesión — Vectorial Data",
  robots: { index: false, follow: false },
};

const SAFE_NEXT_PREFIXES = ["/account", "/portfolio", "/metodo", "/welcome"];

function sanitizeNext(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !value.startsWith("/")) return "/portfolio";
  if (SAFE_NEXT_PREFIXES.some((p) => value === p || value.startsWith(p + "/"))) {
    return value;
  }
  return "/portfolio";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next: rawNext } = await searchParams;
  const next = sanitizeNext(rawNext);

  const { user } = await getAuthState();
  if (user) redirect(next);

  const t = await getTranslations("Auth");

  return (
    <div className="max-w-sm mx-auto py-12 px-4">
      <div className="border border-border rounded-2xl p-8 bg-surface">
        <h1 className="text-2xl font-bold mb-2 text-center">
          {t("loginPageTitle")}
        </h1>
        <p className="text-sm text-text-muted mb-6 text-center">
          {t("magicLinkPrompt")}
        </p>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
