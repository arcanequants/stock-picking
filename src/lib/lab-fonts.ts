import { Source_Serif_4, IBM_Plex_Mono } from "next/font/google";

/**
 * The Quant Lab surface pairs an editorial serif (display) with a mono for
 * data, over the site's existing Geist sans. Self-hosted via next/font.
 */
export const labSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-lab-serif",
  display: "swap",
});

export const labMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-lab-mono",
  display: "swap",
});
