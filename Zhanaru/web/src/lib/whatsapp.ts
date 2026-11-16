// Предзаполненное сообщение в WhatsApp по результату теста (ТЗ 6.5).
import { focusById } from '../content/checkups';
import { goalLabels, type Answers } from '../content/quiz';
import { waLink } from '../content/site';
import type { QuizResult, ScaleId } from './scoring';

export const scaleNames: Record<ScaleId, { full: string; short: string; inText: string }> = {
  energy: { full: 'Энергия', short: 'Энергия', inText: 'энергия' },
  sleep: { full: 'Сон', short: 'Сон', inText: 'сон' },
  weight: { full: 'Вес и состав тела', short: 'Вес', inText: 'вес и состав тела' },
  hormones: { full: 'Гормональный баланс', short: 'Гормоны', inText: 'гормональный баланс' },
  skin: { full: 'Кожа и волосы', short: 'Кожа', inText: 'кожа и волосы' },
  stress: { full: 'Стресс', short: 'Стресс', inText: 'стресс' },
};

export const attentionText = (r: QuizResult) => r.attention.map((id) => scaleNames[id].inText).join(', ');

const closing: Record<QuizResult['segment'], string> = {
  A: 'Желаю обсудить результат с помощником врача.',
  B: 'Желаю обсудить результат с помощником врача.',
  C: 'Хочу записаться на чекап.',
  D: 'Пришлите, пожалуйста, памятку «Какие анализы сдавать раз в год».',
};

export function resultMessage(
  a: Answers,
  r: QuizResult,
  opts: { discuss?: boolean; name?: string } = {},
): string {
  const passed = a.sex === 'm' ? 'Прошёл' : a.sex === 'f' ? 'Прошла' : 'Прошёл(ла)';
  const hello = opts.name ? `Здравствуйте! Меня зовут ${opts.name}. ${passed} тест на сайте ZhanaRu.` : `Здравствуйте! ${passed} тест на сайте ZhanaRu.`;
  return [
    hello,
    `Индекс энергии: ${r.index}/100`,
    `Цель: ${goalLabels[a.goal ?? 'check']}`,
    `Зоны внимания: ${attentionText(r)}`,
    `Рекомендованный чекап: «${focusById(r.checkup).name}»`,
    opts.discuss ? closing.A : closing[r.segment],
  ].join('\n');
}

export const resultWaLink = (a: Answers, r: QuizResult, opts?: { discuss?: boolean; name?: string }) =>
  waLink(resultMessage(a, r, opts));
