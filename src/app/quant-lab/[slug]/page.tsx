import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllBots, getBotView } from "@/lib/quant-lab";
import DisclosureBanner from "./_components/DisclosureBanner";
import BotHero from "./_components/BotHero";
import EquityCurve from "./_components/EquityCurve";
import SimulatedCopierCard from "./_components/SimulatedCopierCard";
import HowToCopy from "./_components/HowToCopy";
import RisksSection from "./_components/RisksSection";
import AlertSubscribeForm from "./_components/AlertSubscribeForm";

export const revalidate = 600;

export async function generateStaticParams() {
  const bots = await getAllBots();
  return bots.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const view = await getBotView(slug);
  if (!view) return { title: "Quant Lab — Vectorial Data" };
  const roi = view.latest?.roi != null ? Number(view.latest.roi) : null;
  const roiStr = roi != null ? `${roi >= 0 ? "+" : ""}${roi.toFixed(2)}%` : "—";
  return {
    title: `${view.bot.name} — Quant Lab`,
    description: `Performance público del bot ${view.bot.name}. ROI 30 días: ${roiStr}.`,
  };
}

export default async function BotDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const view = await getBotView(slug);
  if (!view) notFound();

  const roi = view.latest?.roi != null ? Number(view.latest.roi) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <nav className="text-sm text-text-muted">
        <Link href="/quant-lab" className="hover:text-foreground">
          ← Quant Lab
        </Link>
      </nav>

      <BotHero bot={view.bot} latest={view.latest} daysLive={view.daysLive} />
      <DisclosureBanner />
      <EquityCurve series={view.equityCurve} benchmark={view.benchmark} />
      <SimulatedCopierCard roi={roi} />
      <HowToCopy
        leadDetailsUrl={view.bot.lead_details_url}
        referralUrl={view.bot.referral_url}
      />
      <RisksSection />
      <AlertSubscribeForm slug={view.bot.slug} />
    </div>
  );
}
