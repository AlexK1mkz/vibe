import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { deleteLead } from "@/lib/leads";

export const runtime = "nodejs";

/** Удаление лида по запросу человека (ТЗ, п. 12). Ответы и события удаляются каскадом. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await context.params;
  await deleteLead(id);
  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
