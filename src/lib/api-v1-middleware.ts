import { NextResponse } from "next/server";
import {
  debitApiKey,
  DEFAULT_REQUEST_COST_CREDITS,
  type ApiKeyInfo,
} from "@/lib/api-keys";

export type AuthResult =
  | { ok: true; auth: ApiKeyInfo }
  | { ok: false; response: NextResponse };

export async function withApiKey(
  request: Request,
  costCredits: number = DEFAULT_REQUEST_COST_CREDITS
): Promise<AuthResult> {
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
  const endpoint = new URL(request.url).pathname;

  const info = await debitApiKey(key, endpoint, costCredits);
  if (!info) {
    // 402 is the right code for "valid key, no credits". Invalid keys also
    // land here — we don't distinguish to avoid leaking key validity.
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Invalid API key or insufficient credits. Top up at https://vectorialdata.com/api-keys",
        },
        { status: 402 }
      ),
    };
  }

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
      credits_remaining: auth.credits_remaining,
      timestamp: new Date().toISOString(),
    },
  };

  const res = NextResponse.json(body, { status });
  res.headers.set("X-VD-Tier", auth.tier);
  res.headers.set("X-VD-Credits-Remaining", String(auth.credits_remaining));
  res.headers.set("X-VD-Version", "1");
  res.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600"
  );
  return res;
}
