import { getEventBySlug, renderBriefMarkdown } from "@/lib/economic-events";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ev = await getEventBySlug(slug);
  if (!ev) {
    return new Response("# Event not found\n", {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  const md = renderBriefMarkdown(ev, "en");
  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control":
        "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      "X-Robots-Tag": "all",
    },
  });
}
