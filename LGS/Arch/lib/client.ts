"use client";

/** Клиентские помощники: UTM, идентификатор сессии, события воронки, счётчики. */

type AnyFn = (...args: unknown[]) => void;
type Fbq = AnyFn & { queue?: unknown[]; loaded?: boolean; version?: string; push?: AnyFn; callMethod?: AnyFn };
declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: unknown;
    dataLayer?: unknown[];
    gtag?: AnyFn;
    ym?: AnyFn & { a?: unknown[]; l?: number };
    __lgsCounters?: { meta?: string; ga4?: string; ym?: string; loaded: boolean };
  }
}

const UTM_KEY = "lgs_utm";
const SID_KEY = "lgs_sid";
export const CONSENT_KEY = "lgs_cookie_consent";
export const TEST_STATE_KEY = "lgs_test_v1";
export const LAST_RESULT_KEY = "lgs_last_result";

export function storageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function storageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* приватный режим: работаем без сохранения */
  }
}
export function storageRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* нет доступа к хранилищу */
  }
}

export type UtmData = Record<string, string>;

/** UTM и fbclid сохраняются при первом заходе и передаются до оплаты (ТЗ, п. 10) */
export function captureUtm(): void {
  if (storageGet(UTM_KEY)) return;
  const params = new URLSearchParams(window.location.search);
  const data: UtmData = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"]) {
    const value = params.get(key);
    if (value) data[key] = value.slice(0, 300);
  }
  if (document.referrer && !document.referrer.startsWith(window.location.origin)) {
    data.referrer = document.referrer.slice(0, 500);
  }
  storageSet(UTM_KEY, JSON.stringify(data));
}

export function getUtm(): UtmData {
  try {
    return JSON.parse(storageGet(UTM_KEY) || "{}") as UtmData;
  } catch {
    return {};
  }
}

export function sessionId(): string {
  let id = storageGet(SID_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    storageSet(SID_KEY, id);
  }
  return id;
}

const META_EVENTS: Record<string, string> = {
  test_start: "ViewContent",
  test_complete: "CompleteRegistration",
  contact_submit: "Lead",
  cta_consult_click: "InitiateCheckout",
  cta_intensive_click: "InitiateCheckout",
  purchase_consult: "Purchase",
  purchase_intensive: "Purchase",
  purchase_vip: "Purchase",
  specialist_submit: "Lead",
};
/** События, которые по ТЗ уходят только в GA4 и Метрику */
const NO_META = /^(test_question_\d+|result_view)$/;

export interface TrackOptions {
  leadId?: string | null;
  /** Не отправлять повторно в этой вкладке (ключ запоминается в sessionStorage) */
  onceKey?: string;
  /** Только в счётчики, без записи в нашу базу (покупки пишет вебхук) */
  countersOnly?: boolean;
}

export function track(name: string, payload: Record<string, unknown> = {}, options: TrackOptions = {}): void {
  if (typeof window === "undefined") return;
  if (options.onceKey) {
    try {
      const key = `lgs_once_${options.onceKey}`;
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      /* без sessionStorage допускаем повтор */
    }
  }

  if (!options.countersOnly) {
    const body = JSON.stringify({ name, payload, leadId: options.leadId ?? null, sessionId: sessionId() });
    try {
      if (!navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }))) {
        void fetch("/api/events", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
      }
    } catch {
      /* аналитика не должна ломать страницу */
    }
  }

  const ids = window.__lgsCounters;
  if (!ids?.loaded) return;
  try {
    if (name === "page_view") {
      window.fbq?.("track", "PageView");
      window.gtag?.("event", "page_view", { page_location: window.location.href, page_title: document.title });
      if (ids.ym) window.ym?.(Number(ids.ym), "hit", window.location.href);
      return;
    }
    window.gtag?.("event", name, payload);
    if (ids.ym) window.ym?.(Number(ids.ym), "reachGoal", name, payload);
    if (!NO_META.test(name)) {
      const metaName = META_EVENTS[name];
      const metaPayload =
        name === "specialist_submit" ? { ...payload, content_category: "specialist" } : payload;
      if (metaName) window.fbq?.("track", metaName, metaPayload);
      else window.fbq?.("trackCustom", name, metaPayload);
    }
  } catch {
    /* счётчик заблокирован */
  }
}

function addScript(src: string): void {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

/** Загружает счётчики. Вызывается только после согласия в баннере cookie. */
export function loadCounters(ids: { meta?: string; ga4?: string; ym?: string }): void {
  if (window.__lgsCounters?.loaded) return;
  window.__lgsCounters = { ...ids, loaded: true };

  if (ids.meta) {
    const fbq: Fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue!.push(args);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
    addScript("https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", ids.meta);
  }

  if (ids.ga4) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      // gtag ожидает именно объект arguments
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", ids.ga4, { send_page_view: false });
    addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids.ga4)}`);
  }

  if (ids.ym) {
    const ym: NonNullable<Window["ym"]> = function (...args: unknown[]) {
      (ym.a = ym.a || []).push(args);
    };
    ym.l = Date.now();
    window.ym = ym;
    addScript("https://mc.yandex.ru/metrika/tag.js");
    ym(Number(ids.ym), "init", { defer: true, clickmap: true, trackLinks: true, accurateTrackBounce: true });
  }
}
