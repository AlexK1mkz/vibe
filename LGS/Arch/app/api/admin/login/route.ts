import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken, passwordMatches } from "@/lib/admin-auth";
import { clientIp, rateLimited } from "@/lib/server-utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const fail = NextResponse.redirect(new URL("/admin?error=1", request.url), 303);
  if (rateLimited(`admin:${clientIp(request.headers)}`, 8)) return fail;
  const form = await request.formData().catch(() => null);
  if (!form || !passwordMatches(String(form.get("password") ?? ""))) return fail;

  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
  response.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  return response;
}
