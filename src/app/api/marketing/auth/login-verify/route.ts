import { NextResponse } from "next/server";
import { verifyAuthentication } from "@/lib/marketing/webauthn";
import { createSession } from "@/lib/marketing/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { response } = await request.json();
    const { admin } = await verifyAuthentication(response);

    await createSession(admin.id);

    return NextResponse.json({ verified: true, username: admin.username });
  } catch (error) {
    console.error("Login verify error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Authentication failed" },
      { status: 401 }
    );
  }
}
