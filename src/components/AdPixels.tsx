"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

/**
 * Ad platform pixels (Meta + X) and first-touch UTM capture.
 *
 * - Loads only when the corresponding NEXT_PUBLIC_* pixel id is set, and
 *   the visitor has NOT declined cookies (same localStorage flag as
 *   CookieConsent). Browser pixels fire PageView only — signup/purchase
 *   conversions are sent server-side (Meta CAPI) or on the success page
 *   (X), so client+server never double-count.
 * - First visit with utm_* params (or fbclid/twclid) stores them in the
 *   `vd_attr` cookie (90d, first-touch wins). /api/auth/free-register
 *   copies it into subscribers.attribution so we can tie paying users
 *   back to the campaign that brought them.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    twq?: (...args: unknown[]) => void;
  }
}

const ATTR_COOKIE = "vd_attr";
const ATTR_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "twclid",
];

function captureFirstTouch() {
  try {
    if (document.cookie.split(";").some((c) => c.trim().startsWith(`${ATTR_COOKIE}=`))) {
      return; // first touch already recorded
    }
    const params = new URLSearchParams(window.location.search);
    const attr: Record<string, string> = {};
    for (const k of ATTR_KEYS) {
      const v = params.get(k);
      if (v) attr[k] = v.slice(0, 200);
    }
    if (Object.keys(attr).length === 0) return;
    attr.landing = window.location.pathname.slice(0, 200);
    attr.ts = new Date().toISOString();
    const value = encodeURIComponent(JSON.stringify(attr));
    document.cookie = `${ATTR_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 90}; SameSite=Lax`;
  } catch {
    // Attribution must never break the page.
  }
}

export default function AdPixels() {
  const metaId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const xId = process.env.NEXT_PUBLIC_X_PIXEL_ID;

  // Decide after mount (avoids SSR/client hydration mismatch): pixels load
  // unless the visitor explicitly declined cookies.
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    captureFirstTouch();
    setEnabled(window.localStorage?.getItem("cookie-consent") !== "declined");
  }, []);
  if (!enabled) return null;

  return (
    <>
      {metaId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaId}');fbq('track','PageView');`}
        </Script>
      )}
      {xId && (
        <Script id="x-pixel" strategy="afterInteractive">
          {`!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');twq('config','${xId}');`}
        </Script>
      )}
    </>
  );
}
