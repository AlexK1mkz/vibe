import { NextResponse } from "next/server";
import { retryPendingSpecialists } from "@/integrations/sheets";
import { retryPendingLeadSheets, runFunnel } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Крон цепочки сообщений. Vercel Cron передаёт Authorization: Bearer <CRON_SECRET>. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const result = await runFunnel();
  const sheetsSpecialists = await retryPendingSpecialists();
  const sheetsLeads = await retryPendingLeadSheets();
  return NextResponse.json({ ok: true, ...result, sheetsSpecialists, sheetsLeads });
}
