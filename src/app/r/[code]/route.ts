import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Referral link: /r/<CODE> stores the code in a cookie and sends the visitor to
// the signup page. free-register reads the cookie to attribute the referral.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const clean = (code || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 16);

  // Optional ?to=/internal/path lets a shared pick link both attribute the
  // referral and land on the pick. Only same-origin paths (block open redirect).
  const to = new URL(request.url).searchParams.get("to");
  const dest = to && /^\/(?!\/)[A-Za-z0-9/._-]*$/.test(to) ? to : "/join";

  const res = NextResponse.redirect(new URL(dest, request.url));
  if (clean) {
    res.cookies.set("vd_ref", clean, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
  }
  return res;
}
