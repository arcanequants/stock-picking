import { NextResponse } from "next/server";
import { validateApiKey, incrementUsage, type ApiKeyInfo } from "@/lib/api-keys";

export type AuthResult =
  | { ok: true; auth: ApiKeyInfo }
  | { ok: false; response: NextResponse };

export async function withApiKey(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing API key. Get one at POST /api/v1/auth/register" },
        { status: 401 }
      ),
    };
  }

  const key = authHeader.slice(7);
  const info = await validateApiKey(key);

  if (!info) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid API key, inactive, expired, or rate limit exceeded" },
        { status: info === null ? 401 : 429 }
      ),
    };
  }

  // Increment usage (fire and forget for speed)
  incrementUsage(info.keyId).catch(() => {});

  return { ok: true, auth: info };
}

export function apiResponse<T>(
  data: T,
  auth: ApiKeyInfo,
  status = 200
): NextResponse {
  const body = {
    data,
    meta: {
      tier: auth.tier,
      requests_remaining: auth.remaining - 1,
      timestamp: new Date().toISOString(),
    },
  };

  const res = NextResponse.json(body, { status });
  res.headers.set("X-VD-Tier", auth.tier);
  res.headers.set("X-VD-Remaining", String(auth.remaining - 1));
  res.headers.set("X-VD-Version", "1");
  res.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600"
  );
  return res;
}
