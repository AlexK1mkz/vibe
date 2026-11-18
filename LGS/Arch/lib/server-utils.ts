import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { funnel } from "@/config/funnel";

export const newId = () => randomUUID();

/** Публичный идентификатор результата: 14 символов, не угадывается перебором */
export function newPublicId(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(14);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

export function siteUrl(): string {
  const explicit = process.env.SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "local";
}

/**
 * Ограничение частоты по IP в памяти процесса.
 * На Vercel память у каждого экземпляра своя, поэтому это защита от простых ботов,
 * а не точный лимит. Для точного нужен общий счётчик (Upstash, Vercel KV).
 */
const hits = new Map<string, number[]>();

export function rateLimited(key: string, max: number = funnel.antiSpam.maxRequests): boolean {
  if (process.env.DISABLE_RATE_LIMIT === "1") return false;
  const now = Date.now();
  const windowStart = now - funnel.antiSpam.windowMs;
  const list = (hits.get(key) || []).filter((t) => t > windowStart);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => t > windowStart)) hits.delete(k);
  }
  return list.length > max;
}

export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
  return trimmed || null;
}

export const LEAD_COOKIE = "lgs_lead";
