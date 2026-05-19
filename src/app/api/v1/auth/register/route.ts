import { NextResponse } from "next/server";
import { createApiKey, SIGNUP_GRANT_CREDITS } from "@/lib/api-keys";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, wallet_address, name } = body as {
      email?: string;
      wallet_address?: string;
      name?: string;
    };

    const result = await createApiKey({ email, wallet_address, name });

    return NextResponse.json({
      data: {
        api_key: result.key,
        credits_remaining: result.credits_remaining,
      },
      meta: {
        message: `API key created with ${SIGNUP_GRANT_CREDITS} free credits. Include it as: Authorization: Bearer <key>`,
        docs: "https://vectorialdata.com/developers",
        topup: "https://vectorialdata.com/api-keys",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}
