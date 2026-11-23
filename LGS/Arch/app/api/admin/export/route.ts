import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listApplications, listLeads } from "@/lib/admin-stats";
import { ceilingName, sphereName } from "@/lib/content";

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
      ["created_at", "name", "whatsapp", "role", "education", "practice_hours", "weekly_hours", "utm_source", "utm_medium", "utm_campaign"],
      rows.map((a) => [a.createdAt, a.name, a.whatsapp, a.role, a.education, a.practiceHours, a.weeklyHours, a.utmSource, a.utmMedium, a.utmCampaign]),
      `specialists-${stamp}.csv`,
    );
  }

  const leads = await listLeads(
    {
      segment: params.get("segment") || undefined,
      ceiling: params.get("ceiling") || undefined,
      sphere: params.get("sphere") || undefined,
      priority: params.get("priority") || undefined,
      status: params.get("status") || undefined,
      utm: params.get("utm") || undefined,
    },
    null,
  );
  return csv(
    [
      "created_at", "public_id", "name", "whatsapp", "consent_at", "status", "segment", "priority",
      "result", "main_sphere", "main_belief", "scores", "sphere_scores", "sphere_a1", "cost", "goal", "goal_text",
      "occupation", "income_band", "paid_amount",
      "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "referrer",
      "getcourse_synced_at", "whatsapp_opt_out",
    ],
    leads.map((l) => [
      l.createdAt, l.publicId, l.name, l.whatsapp, l.consentAt, l.status, l.segment, l.priority,
      ceilingName(l.ceiling), sphereName(l.mainSphere), l.mainBelief, l.scores, l.sphereScores, l.sphere, l.cost, l.goal, l.goalText, l.occupation, l.incomeBand, l.paidAmount,
      l.utmSource, l.utmMedium, l.utmCampaign, l.utmContent, l.utmTerm, l.fbclid, l.referrer,
      l.getcourseSyncedAt, l.whatsappOptOut,
    ]),
    `leads-${stamp}.csv`,
  );
}
