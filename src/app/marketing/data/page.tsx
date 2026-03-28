import { verifySession } from "@/lib/marketing/session";
import { redirect } from "next/navigation";
import DataEntryForm from "./DataEntryForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Data Entry — Marketing Dashboard" };

export default async function DataEntryPage() {
  const session = await verifySession();
  if (!session) redirect("/marketing/login");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Data Entry</h1>
      <p className="text-text-muted text-sm mb-6">
        Enter weekly analytics for each platform
      </p>
      <DataEntryForm />
    </div>
  );
}
