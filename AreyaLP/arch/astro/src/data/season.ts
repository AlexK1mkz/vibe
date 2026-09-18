/** Шесть вопросов сезона */
export const QUESTIONS = [
  'Кем мне нужно стать?',
  'Что перестать делать?',
  'На чём сфокусироваться?',
  'Какую ценность создавать?',
  'Как изменить свою роль?',
  'Какая денежная модель соответствует моему масштабу?',
].map((t, i) => ({ n: '0' + (i + 1), t }));

/** Фото для бегущей ленты (лежат в public/photos) */
export const MARQUEE_PHOTOS = [
  ...[1, 2, 3, 8, 9, 10, 11].map((n) => `/photos/event_${String(n).padStart(2, '0')}.jpg`),
  '/photos/event_04.png',
  '/photos/event_05.png',
  '/photos/event_06.png',
  '/photos/event_07.png',
];
