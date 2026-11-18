import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listApplications, listLeads } from "@/lib/admin-stats";
import { archetypeName, type ArchetypeCode } from "@/lib/content";

export const runtime = "nodejs";

/** Экранирует значение для CSV и не даёт таблице исполнить его как формулу */
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/^[=+\-@\t\r]/.test(text) && !/^\+7\d{10}$/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function csv(header: string[], rows: unknown[][], filename: string) {
  const body = [header, ...rows].map((row) => row.map(cell).join(";")).join("\r\n");
  // BOM, чтобы Excel открыл кириллицу без настройки
  return new NextResponse(`﻿${body}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const stamp = new Date().toISOString().slice(0, 10);

  if (params.get("type") === "specialists") {
    const rows = await listApplications(10000);
    return csv(
      ["created_at", "name", "whatsapp", "level", "education", "practice_hours", "weekly_hours", "utm_source", "utm_medium", "utm_campaign"],
      rows.map((a) => [a.createdAt, a.name, a.whatsapp, a.level, a.education, a.practiceHours, a.weeklyHours, a.utmSource, a.utmMedium, a.utmCampaign]),
      `specialists-${stamp}.csv`,
    );
  }

  const leads = await listLeads(
    {
      segment: params.get("segment") || undefined,
      archetype: params.get("archetype") || undefined,
      job: params.get("job") || undefined,
      status: params.get("status") || undefined,
      utm: params.get("utm") || undefined,
    },
    null,
  );
  return csv(
    [
      "created_at", "public_id", "name", "whatsapp", "consent_at", "status", "segment",
      "primary", "secondary", "is_pair", "scores", "job", "cost", "goal", "goal_text",
      "occupation", "income_band", "paid_amount",
      "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "referrer",
      "getcourse_synced_at", "whatsapp_opt_out",
    ],
    leads.map((l) => [
      l.createdAt, l.publicId, l.name, l.whatsapp, l.consentAt, l.status, l.segment,
      archetypeName(l.primary as ArchetypeCode), archetypeName(l.secondary as ArchetypeCode), l.isPair, l.scores,
      l.job, l.cost, l.goal, l.goalText, l.occupation, l.incomeBand, l.paidAmount,
      l.utmSource, l.utmMedium, l.utmCampaign, l.utmContent, l.utmTerm, l.fbclid, l.referrer,
      l.getcourseSyncedAt, l.whatsappOptOut,
    ]),
    `leads-${stamp}.csv`,
  );
}
