// Отправка заявки. Основной путь — public/api/lead.php: он пересылает заявку в Telegram,
// на почту и в Google-таблицу (адрес таблицы и секрет хранятся на сервере).
// Если PHP на хостинге нет, заявку можно писать в таблицу напрямую: site.sheetsWebhook.
import { optionLabel, goalLabels, type Answers } from '../content/quiz';
import { focusById } from '../content/checkups';
import { directionById } from '../content/directions';
import { site } from '../content/site';
import { getUtm } from './analytics';
import { bmi, type QuizResult } from './scoring';
import { attentionText } from './whatsapp';

export interface LeadPayload {
  name: string;
  surname?: string;
  phone: string;
  source: string;
  /** Номер заявки: повторная отправка с тем же номером обновляет строку в таблице, а не добавляет новую. */
  leadId?: string;
  /** contact — оставил контакты и начал тест, done — прошёл тест до конца. */
  stage?: 'contact' | 'done';
  quiz?: Record<string, unknown>;
  /** Мс от открытия формы — защита от ботов. */
  elapsed: number;
  /** Honeypot: у людей пустой. */
  website?: string;
}

/** Короткий случайный номер заявки, например «ZR-7K3Q9A». */
export const newLeadId = () => 'ZR-' + Math.random().toString(36).slice(2, 8).toUpperCase();

/** Ответы и результат теста в виде, удобном для помощника врача и таблицы. */
export function quizPayload(a: Answers, r: QuizResult): Record<string, unknown> {
  const b = bmi(a.height, a.mass);
  return {
    segment: r.segment,
    index: r.index,
    goalIndex: r.goalIndex,
    goal: goalLabels[a.goal ?? 'check'],
    attention: attentionText(r),
    checkup: focusById(r.checkup).name,
    direction: directionById(r.direction).title,
    sex: optionLabel('sex', a.sex),
    age: optionLabel('age', a.age),
    height: a.height ?? '',
    mass: a.mass ?? '',
    bmi: b ?? '',
    energy: optionLabel('energy', a.energy),
    sleep: optionLabel('sleep', a.sleep),
    weightChange: optionLabel('weight', a.weight),
    symptoms: (a.symptoms ?? []).map((s) => optionLabel('symptoms', s)).join(', '),
    lastTests: optionLabel('lastTests', a.lastTests),
    format: optionLabel('format', a.format),
  };
}

/** true — заявка доставлена хотя бы по одному каналу. */
export async function sendLead(p: LeadPayload): Promise<boolean> {
  const body = {
    ...p,
    consent: true,
    utm: getUtm(),
    page: location.pathname,
    device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'телефон' : 'компьютер',
  };
  const jobs: Promise<boolean>[] = [];
  if (site.leadEndpoint) {
    jobs.push(
      fetch(site.leadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true, // заявка уйдёт, даже если посетитель сразу перейдёт в WhatsApp
      })
        .then(async (res) => res.ok && !!(await res.json().catch(() => null))?.ok)
        .catch(() => false),
    );
  }
  if (site.sheetsWebhook) {
    // Apps Script не отдаёт CORS-заголовки: отправляем «вслепую», ответ прочитать нельзя
    jobs.push(
      fetch(site.sheetsWebhook, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
        keepalive: true,
      })
        .then(() => true)
        .catch(() => false),
    );
  }
  if (!jobs.length) return false;
  return (await Promise.all(jobs)).some(Boolean);
}
