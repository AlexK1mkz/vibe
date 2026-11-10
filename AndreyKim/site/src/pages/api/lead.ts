import type { APIRoute } from 'astro';

export const prerender = false;

// Ключи читаются в рантайме (Vercel) либо из .env при локальной разработке
const env = (key: string): string =>
  (typeof process !== 'undefined' && process.env?.[key]) || (import.meta.env[key] as string) || '';

// Простой rate-limit по IP: не больше 5 заявок за 10 минут с одного адреса
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_HITS;
}

const clean = (value: unknown, max: number) =>
  String(value ?? '')
    .replace(/[\u0000-\u0008\u000B-\u001F]/g, '')
    .trim()
    .slice(0, max);

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// КЗ/РФ: +7 и 10 цифр
function normalizePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, '');
  if (d.length === 11 && (d[0] === '7' || d[0] === '8')) d = d.slice(1);
  if (d.length !== 10) return null;
  return `+7${d}`;
}

const CHANNELS: Record<string, string> = { whatsapp: 'WhatsApp', telegram: 'Telegram', call: 'Звонок' };

interface Lead {
  name: string;
  phone: string;
  channel: string;
  message: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  referrer: string;
  page_url: string;
  date: string;
}

async function sendTelegram(lead: Lead) {
  const token = env('TELEGRAM_BOT_TOKEN');
  const chatId = env('TELEGRAM_CHAT_ID');
  if (!token || !chatId) return false;
  const utm = [lead.utm_source, lead.utm_medium, lead.utm_campaign, lead.utm_content].filter(Boolean).join(' / ');
  const text = [
    '<b>Новая заявка на ознакомительную встречу</b>\n',
    `<b>Имя:</b> ${esc(lead.name)}`,
    `<b>Телефон:</b> ${esc(lead.phone)}`,
    `<b>Связаться:</b> ${esc(lead.channel)}`,
    lead.message && `<b>Запрос:</b> ${esc(lead.message)}`,
    utm && `<b>UTM:</b> ${esc(utm)}`,
    lead.referrer && `<b>Откуда:</b> ${esc(lead.referrer)}`,
  ]
    .filter(Boolean)
    .join('\n');
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[{ text: 'Написать в WhatsApp', url: `https://wa.me/${lead.phone.slice(1)}` }]],
      },
    }),
  });
  if (!res.ok) throw new Error(`telegram ${res.status}`);
  return true;
}

async function sendEmail(lead: Lead) {
  const key = env('RESEND_API_KEY');
  const from = env('LEAD_EMAIL_FROM');
  const to = env('LEAD_EMAIL_TO') || 'human@eltec.kz';
  if (!key || !from) return false;
  const rows: [string, string][] = [
    ['Имя', lead.name],
    ['Телефон', lead.phone],
    ['Как связаться', lead.channel],
    ['Запрос', lead.message],
    ['utm_source', lead.utm_source],
    ['utm_medium', lead.utm_medium],
    ['utm_campaign', lead.utm_campaign],
    ['utm_content', lead.utm_content],
    ['Откуда пришёл', lead.referrer],
    ['Страница', lead.page_url],
    ['Время', lead.date],
  ];
  const html =
    '<table cellpadding="6" style="font:15px/1.4 sans-serif;border-collapse:collapse">' +
    rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td style="color:#667">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`)
      .join('') +
    '</table>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject: `Заявка на встречу: ${lead.name}, ${lead.phone}`, html }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}`);
  return true;
}

async function sendSheets(lead: Lead) {
  const url = env('GOOGLE_SHEETS_WEBHOOK_URL');
  if (!url) return false;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  if (!res.ok) throw new Error(`sheets ${res.status}`);
  return true;
}

export const POST: APIRoute = async ({ request, clientAddress, redirect }) => {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const fail = (status: number, error: string) =>
    wantsJson
      ? new Response(JSON.stringify({ ok: false, error }), {
          status,
          headers: { 'Content-Type': 'application/json' },
        })
      : redirect(`/?error=${error}#zayavka`, 303);
  const done = () =>
    wantsJson
      ? new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
      : redirect('/spasibo', 303);

  let data: Record<string, unknown>;
  try {
    const type = request.headers.get('content-type') || '';
    data = type.includes('application/json')
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());
  } catch {
    return fail(400, 'bad_request');
  }

  // Honeypot: бот заполнил скрытое поле — отвечаем «успехом» и ничего не шлём
  if (clean(data.company, 100)) return done();

  let ip = 'unknown';
  try {
    ip = clientAddress;
  } catch {}
  if (limited(ip)) return fail(429, 'too_many');

  const name = clean(data.name, 80);
  const phone = normalizePhone(clean(data.phone, 40));
  if (name.length < 2) return fail(422, 'name');
  if (!phone) return fail(422, 'phone');

  const lead: Lead = {
    name,
    phone,
    channel: CHANNELS[clean(data.channel, 20)] || 'WhatsApp',
    message: clean(data.message, 1000),
    utm_source: clean(data.utm_source, 300),
    utm_medium: clean(data.utm_medium, 300),
    utm_campaign: clean(data.utm_campaign, 300),
    utm_content: clean(data.utm_content, 300),
    referrer: clean(data.referrer, 300),
    page_url: clean(data.page_url, 300),
    date: new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' }),
  };

  const results = await Promise.allSettled([sendTelegram(lead), sendEmail(lead), sendSheets(lead)]);
  results.forEach((r) => r.status === 'rejected' && console.error('[lead] канал не сработал:', r.reason));
  const delivered = results.some((r) => r.status === 'fulfilled' && r.value === true);

  if (!delivered) {
    // Локально без ключей — показываем заявку в консоли, чтобы можно было проверить форму
    if (import.meta.env.DEV) {
      console.log('[lead] каналы не настроены, заявка (dev):', lead);
      return done();
    }
    console.error('[lead] заявка не доставлена ни по одному каналу');
    return fail(502, 'delivery');
  }

  return done();
};
