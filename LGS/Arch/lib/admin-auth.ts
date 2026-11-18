import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "lgs_admin";

export function adminEnabled(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function adminToken(): string {
  return createHmac("sha256", process.env.ADMIN_PASSWORD || "").update("lgs-admin-session-v1").digest("hex");
}

export function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = createHmac("sha256", "cmp").update(input).digest();
  const b = createHmac("sha256", "cmp").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  if (!adminEnabled()) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(adminToken());
  return a.length === b.length && timingSafeEqual(a, b);
}
