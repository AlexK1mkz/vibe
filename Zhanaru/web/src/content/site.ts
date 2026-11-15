// Общие данные клиники. Источник — действующий сайт (site/index.html, версия 28.10.2026).
// Всё, что клиника ещё не подтвердила, перечислено в TODO-CONTENT.md.

export const site = {
  name: 'ZhanaRu',
  nameKk: 'Жаңару',
  tagline: 'центр осознанного здоровья',
  city: 'Астана',

  address: {
    place: 'ЖК Manhattan',
    street: 'ул. Анет баба, 13',
    district: 'район Нура',
    postal: 'Z05T6G5',
    note: 'Остановка «Анет баба» в 150 м, рядом парковки',
  },
  hours: { label: 'Ежедневно, 08:00–20:00', opens: '08:00', closes: '20:00' },

  phone: '+77020660633',
  phoneLabel: '+7 702 066 06 33',
  /** Номер WhatsApp для заявок, только цифры. На встрече обсуждали смену номера. */
  whatsapp: '77020660633',
  instagram: { url: 'https://www.instagram.com/zhanaru.med/', label: '@zhanaru.med' },

  gis: {
    url: 'https://2gis.kz/astana/firm/70000001109795066',
    reviewsUrl: 'https://2gis.kz/astana/firm/70000001109795066/tab/reviews',
    rating: 4.8,
    ratings: 34,
    reviews: 32,
    checkedAt: '28.10.2026',
  },

  legal: {
    company: 'ТОО «NurKam med»',
    bin: '251140003556',
    license: '№ 26002112 от 23.01.2026',
  },
  disclaimer: 'Имеются противопоказания. Необходима консультация специалиста.',

  /** Срок ответа куратора — уточнить у клиники. */
  sla: 'в течение 10 минут в рабочее время',

  /** Серверный приём заявок. Если PHP на хостинге нет — поставить пустую строку: останется только WhatsApp. */
  leadEndpoint: '/api/lead.php',

  /**
   * Прямая запись заявок в Google-таблицу из браузера — только если PHP на хостинге нет.
   * Адрес веб-приложения Apps Script (см. google-sheets/README.md). При работающем lead.php
   * оставьте пустым: сервер сам пишет в таблицу, и адрес не виден в коде страницы.
   */
  sheetsWebhook: '',

  /** ID счётчиков. Пустая строка — счётчик не загружается. */
  analytics: { ga4: '', metaPixel: '', yandexMetrika: '' },

  labs: ['ОЛИМП', 'INVITRO'],
} as const;

export const waLink = (text: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;

export const waDefaultText = 'Здравствуйте! Хочу записаться на бесплатную встречу с куратором ZhanaRu.';
