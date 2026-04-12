import { headers } from "next/headers";

export async function isUkVisitor(): Promise<boolean> {
  const h = await headers();
  const country = h.get("x-vercel-ip-country") || h.get("cf-ipcountry") || "";
  return country === "GB";
}
