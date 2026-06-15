import { NextResponse } from "next/server";
import {
  debitApiKey,
  DEFAULT_REQUEST_COST_MICRO_USDC,
  type ApiKeyInfo,
} from "@/lib/api-keys";
import { costForPath } from "@/lib/api-pricing";

export type AuthResult =
  | { ok: true; auth: ApiKeyInfo }
  | { ok: false; response: NextResponse };

export async function withApiKey(
  request: Request,
  costMicroUsdc?: number
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

  // Explicit cost wins; otherwise price by pathname (x402 parity), falling back
  // to the flat default for unknown/legacy paths.
  const cost =
    costMicroUsdc ?? costForPath(endpoint, DEFAULT_REQUEST_COST_MICRO_USDC);

  const info = await debitApiKey(key, endpoint, cost);
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
      balance_micro_usdc: auth.balance_micro,
      balance_usdc: auth.balance_micro / 1_000_000,
      timestamp: new Date().toISOString(),
    },
  };

  const res = NextResponse.json(body, { status });
  res.headers.set("X-VD-Tier", auth.tier);
  res.headers.set("X-VD-Balance-Micro-USDC", String(auth.balance_micro));
  res.headers.set("X-VD-Version", "1");
  res.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600"
  );
  return res;
}
