import { NextResponse } from "next/server";
import { runFunnel } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Крон цепочки сообщений. Vercel Cron передаёт Authorization: Bearer <CRON_SECRET>. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const result = await runFunnel();
  return NextResponse.json({ ok: true, ...result });
}
