"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SIGNAL_VIEW_COOKIE, type SignalView } from "@/lib/signals";

export async function getSignalView(): Promise<SignalView> {
  const store = await cookies();
  const raw = store.get(SIGNAL_VIEW_COOKIE)?.value;
  return raw === "pro" ? "pro" : "casual";
}

export async function setSignalView(view: SignalView, returnPath = "/signals") {
  const store = await cookies();
  store.set(SIGNAL_VIEW_COOKIE, view, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath(returnPath);
}
