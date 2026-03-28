import { NextResponse } from "next/server";
import { createAuthenticationOptions } from "@/lib/marketing/webauthn";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const options = await createAuthenticationOptions();
    return NextResponse.json({ options });
  } catch (error) {
    console.error("Login options error:", error);
    return NextResponse.json(
      { error: "Failed to generate login options" },
      { status: 500 }
    );
  }
}
