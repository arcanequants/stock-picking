import { NextResponse } from "next/server";
import { verifyRegistration } from "@/lib/marketing/webauthn";
import { createSession } from "@/lib/marketing/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { adminId, response } = await request.json();

    await verifyRegistration(adminId, response);
    await createSession(adminId);

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("Registration verify error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 400 }
    );
  }
}
