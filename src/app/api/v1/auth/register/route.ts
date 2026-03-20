import { NextResponse } from "next/server";
import { createApiKey } from "@/lib/api-keys";

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
        tier: result.tier,
        daily_limit: result.daily_limit,
      },
      meta: {
        message: "API key created. Include it as: Authorization: Bearer <key>",
        docs: "https://vectorialdata.com/developers",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}
