// События аналитики (ТЗ 9.6). Счётчики грузятся только после согласия на cookies
// и только если их ID заданы в src/content/site.ts.
import { site } from '../content/site';

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ym?: (...args: unknown[]) => void;
  }
}

const CONSENT_KEY = 'zr_cookie';
const UTM_KEY = 'zr_utm';
const LEAD_EVENTS = new Set(['lead_whatsapp', 'lead_callback']);

export function getConsent(): 'all' | 'necessary' | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'all' || v === 'necessary' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(v: 'all' | 'necessary') {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch { /* приватный режим */ }
  if (v === 'all') loadCounters();
}

/** Отправка события во все подключённые счётчики. До согласия события остаются только в dataLayer. */
export function track(event: string, params: Params = {}) {
  if (typeof window === 'undefined') return;
  (window.dataLayer ||= []).push({ event, ...params });
  window.gtag?.('event', event, params);
  if (site.analytics.yandexMetrika) window.ym?.(Number(site.analytics.yandexMetrika), 'reachGoal', event, params);
  if (window.fbq) {
    if (LEAD_EVENTS.has(event)) window.fbq('track', 'Lead', params);
    else window.fbq('trackCustom', event, params);
  }
}

let loaded = false;
const addScript = (src: string) => {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
};

export function loadCounters() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  const { ga4, metaPixel, yandexMetrika } = site.analytics;

  if (ga4) {
    window.dataLayer ||= [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', ga4);
    addScript(`https://www.googletagmanager.com/gtag/js?id=${ga4}`);
  }
  if (metaPixel) {
    const q: unknown[][] = [];
    const fbq = Object.assign((...args: unknown[]) => { q.push(args); }, { queue: q, loaded: true, version: '2.0' });
    window.fbq = fbq;
    (window as unknown as { _fbq: unknown })._fbq = fbq;
    addScript('https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', metaPixel);
    fbq('track', 'PageView');
  }
  if (yandexMetrika) {
    const a: unknown[][] = [];
    window.ym = Object.assign((...args: unknown[]) => { a.push(args); }, { a, l: Date.now() });
    addScript('https://mc.yandex.ru/metrika/tag.js');
    window.ym(Number(yandexMetrika), 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true });
  }
}

/** UTM-метки сохраняются на время сессии и прикладываются к заявке. */
export function captureUtm() {
  try {
    const q = new URLSearchParams(location.search);
    const utm: Record<string, string> = {};
    q.forEach((value, key) => {
      if (key.startsWith('utm_') && value) utm[key] = value.slice(0, 120);
    });
    if (Object.keys(utm).length) sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
  } catch { /* хранилище недоступно */ }
}

export function getUtm(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(UTM_KEY) || '{}');
  } catch {
    return {};
  }
}
