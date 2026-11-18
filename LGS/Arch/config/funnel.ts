/**
 * Конфиг воронки. Все цены, даты, пороги сегментации и ссылки лежат здесь
 * и меняются без правки остального кода (ТЗ, п. 0.4).
 */

export type IncomeBand = "lt250" | "250_500" | "500_1000" | "gte1000" | "na";
export type Segment = "A" | "B" | "specialist";
export type Product = "consult" | "intensive" | "vip";

export const funnel = {
  /** Часовой пояс для расписания сообщений */
  timezone: "Asia/Almaty",
  /** Смещение часового пояса от UTC в часах (Казахстан: единый UTC+5) */
  utcOffsetHours: 5,

  segmentation: {
    /**
     * Порог дохода для сегмента A, ₸ в месяц.
     * TODO(content): договорённость «доход от 1 000 $», эквивалент в тенге подтверждает заказчик.
     */
    incomeThreshold: 500_000,
    /** Нижняя граница каждого диапазона из вопроса D2. null = не ответил(а) */
    incomeBandMin: {
      lt250: 0,
      "250_500": 250_000,
      "500_1000": 500_000,
      gte1000: 1_000_000,
      na: null,
    } as Record<IncomeBand, number | null>,
    /** Правило сегмента specialist: D1 = occupation И A1 = job */
    specialist: { occupation: "people", job: "profession" },
  },

  products: {
    consult: {
      title: "Консультация с мастером",
      price: 2_000,
      /** TODO(content): длительность и состав консультации подтверждает заказчик */
      durationMin: 40,
      offerEnv: "GETCOURSE_OFFER_CONSULT",
      paidStatus: "consult_paid",
    },
    intensive: {
      title: "Интенсив «Структура человека»",
      price: 10_000,
      offerEnv: "GETCOURSE_OFFER_INTENSIVE",
      paidStatus: "intensive_paid",
    },
    vip: {
      title: "Интенсив «Структура человека», VIP",
      price: 50_000,
      offerEnv: "GETCOURSE_OFFER_VIP",
      paidStatus: "intensive_vip_paid",
    },
  },

  intensive: {
    name: "Структура человека",
    startDate: "2026-12-14",
    endDate: "2026-12-18",
    datesLabel: "14–18 декабря",
    evenings: 5,
    /** TODO(content): время начала эфиров */
    startTime: null as string | null,
    /**
     * Количество мест. null = не показываем. Остаток выводится только из реальных данных
     * (ТЗ, п. 7.3), поэтому до ответа заказчика счётчик мест выключен.
     */
    seatsTotal: null as number | null,
  },

  practitioner: {
    name: "НЛП Практик",
    startLabel: "11 января",
    months: 3,
    /** Цена Практика на сайте в первой версии не выводится (ТЗ, п. 7.2) */
    showPrice: false,
  },

  test: {
    minutes: 3,
    /** Экран «Считаем результат», мс. По ТЗ не дольше 2 секунд */
    calcScreenMs: 1400,
    /** Связка архетипов, если разница первого и второго не больше этого числа */
    pairMaxDiff: 1,
    maxScore: 8,
  },

  contacts: {
    phone: "+7 705 839 4717",
    phoneHref: "tel:+77058394717",
    whatsappHref: "https://wa.me/77058394717",
    email: "nlp@lgs.kz",
  },

  /** Реквизиты из подвала institutnlp.biz */
  legal: {
    company: "ТОО «LOGOS»",
    bin: "250540022237",
    address:
      "Республика Казахстан, Акмолинская область, г. Кокшетау, микрорайон Коктем, дом 7, кв/офис 1",
  },

  antiSpam: {
    /** Запросов на запись с одного IP за окно */
    maxRequests: 12,
    windowMs: 10 * 60 * 1000,
  },
} as const;

export const PAID_STATUSES = ["consult_paid", "intensive_paid", "intensive_vip_paid"] as const;
export type LeadStatus =
  | "test_done"
  | "contact_given"
  | "consult_paid"
  | "intensive_paid"
  | "intensive_vip_paid";

/** Порядок статусов: вебхук оплаты не понижает статус */
export const STATUS_RANK: Record<LeadStatus, number> = {
  test_done: 0,
  contact_given: 1,
  consult_paid: 2,
  intensive_paid: 3,
  intensive_vip_paid: 4,
};

export function formatPrice(value: number): string {
  return `${value.toLocaleString("ru-RU").replace(/ /g, " ")} ₸`;
}
