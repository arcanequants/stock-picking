import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware replacements for next/link and next/navigation.
 *
 * Public pages must import Link/redirect from here: a plain
 * `<Link href="/picks">` rendered inside /pt/stocks/NU would send the reader
 * back to the Spanish page. These wrappers prefix the active locale (and emit
 * no prefix for Spanish, per the as-needed strategy).
 *
 * Pages that live outside the [locale] segment — /account, /admin,
 * /marketing, /login — keep using next/link directly; they have no localized
 * URL to point at.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
