"use client";

import { useEffect } from "react";
import { trackXPurchase } from "@/lib/ad-client";

/**
 * Fires the X purchase conversion once per checkout session when the user
 * lands on /welcome after Stripe. Meta's Purchase comes from the server
 * (Stripe webhook → CAPI), so only X fires here. Guarded by
 * sessionStorage so refreshes don't double-count on the client.
 */
export default function PurchasePing({ sessionId }: { sessionId: string }) {
  useEffect(() => {
    const key = `vd_purchase_pinged:${sessionId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage unavailable — fire anyway.
    }
    trackXPurchase(1);
  }, [sessionId]);
  return null;
}
