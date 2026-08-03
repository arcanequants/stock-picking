import { getSignalSnapshot, renderBriefMarkdown } from "@/lib/signals";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snapshot = await getSignalSnapshot(id);
  if (!snapshot) {
    return new Response("# Signal not found\n", {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  const md = renderBriefMarkdown(snapshot, "en");
  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      "X-Robots-Tag": "all",
    },
  });
}
