// Единый источник контента OTRI (папка O3S.kz). ТЗ v2 от 15.10.2026, данные из КП заказчика.
// [подтвердить] — есть в КП, но требует сверки; [уточнить] — данных нет.

export const CONFIG = {
  brand: 'OTRI',
  domain: 'otri.kz', // [уточнить] otri.kz или o3s.kz
  showPrices: false, // true → показать цены на сайте (цены в моделях ниже сохранены); false → везде «Цена по запросу»
  rentReady: false,  // true → показывать калькулятор «Покупка vs аренда»
  showReviews: false, // отзывы скрыты, пока нет реальных
  showPilot: false,   // блок «Станьте пилотной клиникой» [уточнить оффер]
  ymId: null,         // номер счётчика Яндекс Метрики
};

export const CONTACT = {
  phone: '+7 771 001 07 44',
  tel: 'tel:+77710010744',
  email: 'info@otri.kz',
  site: 'www.otri.kz',
  address: 'г. Астана, 010000, пр. Кабанбай батыра, 11, нп 43',
  addressShort: 'Астана, пр. Кабанбай батыра, 11, нп 43',
  hours: 'Пн–Пт 9:00–18:00, Сб 10:00–14:00', // [уточнить]
  mapQuery: 'Астана, проспект Кабанбай батыра, 11',
};

export const LEGAL = {
  name: 'ТОО «OTRI»',
  bin: '180540019925',
  iik: 'KZ258562203152762594',
  bik: 'KCJBKZKX',
  bank: 'АО «Банк Центр Кредит»',
  license: '21017579',
  ruSterilizer: 'РК МИ (МТ)-0№026298 от 03.05.2023',
  ruRecirculator: 'РК-МТ-0№022741',
};

// Все заявки уходят в WhatsApp: сообщение собирается из полей формы и открывается чат с номером компании
export const WA_PHONE = '77710010744';
export const waText = (text) => 'https://wa.me/' + WA_PHONE + '?text=' + encodeURIComponent(text);
export const sendWA = (lines) => {
  const lang = (typeof window !== 'undefined' && window.OTRI_LANG === 'kz') ? ' (KZ)' : '';
  const text = ['Здравствуйте! Заявка с сайта otri.kz' + lang].concat(lines.filter(Boolean)).join('\n');
  const url = waText(text);
  try { const w = window.open(url, '_blank'); if (!w) window.location.href = url; } catch (e) { window.location.href = url; }
  return url;
};
export const wa = (text) => 'https://wa.me/77710010744?text=' + encodeURIComponent('Здравствуйте! Интересует ' + (text || 'оборудование OTRI'));
export const waFor = (m) => wa(m ? (m.category === 'recirculator' ? 'рециркулятор ' : 'стерилизатор ') + m.name : '');

export const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('ru-RU').replace(/\u00a0/g, ' ') + ' ₸' : n);
export const priceLabel = (m, from = true) => (CONFIG.showPrices && typeof m.price === 'number' ? (from && m.category === 'sterilizer' ? 'от ' : '') + fmt(m.price) : 'Цена по запросу');

const G = (f) => 'img/otri/' + f + '.webp';

// Цены стерилизаторов перенесены из КП 2025 года [подтвердить], НДС [уточнить]
export const MODELS = [
  { id: 's-16', category: 'sterilizer', name: 'OTRI S-16', short: 'S-16', vol: 16, cycle: 30, chamber: '30×20×27', chamberLen: 30, maxLen: 28, weight: '11 кг', price: 3565000,
    badge: 'Для стоматологии', img: G('otri-s-cube-34'), gallery: ['otri-s-cube-34', 'otri-s-cube-front', 'otri-ozonator-panel', 'otri-destructor', 'otri-s-cube-hospital'].map(G),
    use: 'Кабинет стоматологии или косметологии: наконечники, зеркала, мелкий инструмент',
    desc: 'Компактная модель для одного кабинета. Камера 16 литров, цикл 30 минут при температуре до 45 °C. Подходит для наконечников, зеркал и мелкого инструмента.' },
  { id: 's-36', category: 'sterilizer', name: 'OTRI S-36', short: 'S-36', vol: 36, cycle: 35, chamber: '35×35×35', chamberLen: 35, maxLen: 33, weight: '16 кг', price: 7245000,
    badge: '', img: G('otri-s-cube-front'), gallery: ['otri-s-cube-front', 'otri-s-cube-side', 'otri-ozonator-panel', 'otri-destructor', 'otri-s-cube-hospital'].map(G),
    use: 'Клиника на несколько кабинетов, смешанный инструмент, наборы в лотках',
    desc: 'Кубическая камера 36 литров для клиники на несколько кабинетов. Вмещает смешанный инструмент и наборы в лотках, цикл 35 минут.' },
  { id: 's-40', category: 'sterilizer', name: 'OTRI S-40', short: 'S-40', vol: 40, cycle: 40, chamber: '30×20×57', chamberLen: 57, maxLen: 55, weight: '16 кг', price: 9775000,
    badge: 'Рекомендуем', img: G('otri-s-long-34'), gallery: ['otri-s-long-34', 'otri-s-long-clinic', 'otri-ozonator-panel', 'otri-destructor', 'otri-s-long-cabinet'].map(G),
    use: 'Длинные изделия до 55 см: жёсткие эндоскопы, лапароскопический инструмент, оптика',
    desc: 'Камера длиной 57 см подходит для инструментов до 55 см. Объём 40 л, цикл 40 минут.' },
  { id: 's-85', category: 'sterilizer', name: 'OTRI S-85', short: 'S-85', vol: 85, cycle: 45, chamber: '70×35×35', chamberLen: 70, maxLen: 68, weight: '22 кг', price: 11500000,
    badge: '', img: G('otri-s-long-clinic'), gallery: ['otri-s-long-clinic', 'otri-s-long-hospital', 'otri-ozonator-panel', 'otri-destructor', 'otri-hoses'].map(G),
    use: 'Операционные блоки, хирургические наборы',
    desc: 'Камера 85 литров для операционных блоков: вмещает хирургические наборы. Цикл 45 минут.' },
  { id: 's-250', category: 'sterilizer', name: 'OTRI S-250', short: 'S-250', vol: 250, cycle: 70, chamber: '100×50×50', chamberLen: 100, maxLen: 98, weight: '70 кг', price: 18515000,
    badge: '', img: G('otri-s-long-hospital'), gallery: ['otri-s-long-hospital', 'otri-s-long-34', 'otri-ozonator-panel', 'otri-destructor', 'otri-hoses'].map(G),
    use: 'ЦСО, многопрофильные и хирургические центры',
    desc: 'Максимальный объём линейки — 250 литров. Для центральных стерилизационных отделений, многопрофильных и хирургических центров. Цикл 70 минут.' },
  { id: 'desktop-30', category: 'recirculator', name: 'OTRI Desktop 30', short: 'Desktop 30', area: 30, roomVol: '60–80 м³', lamps: 2, lampLife: '10 800 ч', indicator: 'есть', mount: 'настенная / напольная', price: 65000,
    img: G('otri-desktop-recirculator'), use: 'Кабинет до 30 м²' },
  { id: 'desktop-60', category: 'recirculator', name: 'OTRI Desktop 60', short: 'Desktop 60', area: 60, roomVol: '120–160 м³', lamps: 4, lampLife: '10 800 ч', indicator: 'есть', mount: 'настенная / напольная', price: 100000,
    img: G('otri-desktop-recirculator'), use: 'Помещение до 60 м²' },
];
export const STERILIZERS = MODELS.filter((m) => m.category === 'sterilizer');
export const RECIRCULATORS = MODELS.filter((m) => m.category === 'recirculator');
export const byId = (id) => MODELS.find((m) => m.id === id);

// Пороги подбора по длине изделия, см [подтвердить у Каната]
export const pickByLength = (cm) => STERILIZERS.find((m) => cm <= m.maxLen) || STERILIZERS[STERILIZERS.length - 1];
// Подбор рециркулятора: до 30 м² — Desktop 30, иначе Desktop 60 (по одному на каждые 60 м²)
export const pickByArea = (area) => {
  if (area <= 30) return { model: RECIRCULATORS[0], units: 1 };
  return { model: RECIRCULATORS[1], units: Math.max(1, Math.ceil(area / 60)) };
};

export const COMMON_SPECS = [
  ['Рабочая температура', 'до 45 °C'],
  ['Давление', 'атмосферное, без пара'],
  ['Потребляемая мощность', '70 Вт'],
  ['Камера', 'прозрачная, герметичная'],
  ['Остаточный озон', 'разлагает деструктор'],
  ['Кислородная сеть', 'компактным моделям не нужна'],
  ['Регистрационное удостоверение', 'РК МИ (МТ)-0№026298 от 03.05.2023'],
  ['Гарантия', 'не менее 37 месяцев'],
  ['Поставка', 'до 30 дней после оплаты'],
];

export const KIT = [
  { t: 'Озонатор', d: 'Вырабатывает озон. Дисплей и кнопки «− / + / Пуск».', img: G('otri-ozonator-panel') },
  { t: 'Камера', d: 'Прозрачная и герметичная, видно загрузку и процесс.', img: G('otri-s-cube-front') },
  { t: 'Деструктор', d: 'Разлагает остаточный озон перед открытием камеры.', img: G('otri-destructor') },
  { t: 'Соединительные элементы', d: 'Шланги между озонатором, камерой и деструктором.', img: G('otri-hoses') },
  { t: 'Индикаторы', d: 'Контроль прохождения цикла.', img: null },
];

export const RECIRC_TERMS = [
  ['Цена', 'без НДС, доставка включена'],
  ['Поставка', '10 рабочих дней'],
  ['Гарантия', '12 месяцев'],
  ['Инструктаж', 'обучение персонала включено'],
  ['Сервис', 'от производителя'],
  ['Регистрация', 'РК-МТ-0№022741'],
];

export const RECIRC_PROS = [
  { t: 'Безопасная закрытая конструкция', d: 'Полная защита от прямого ультрафиолета.' },
  { t: 'Подходит для разных помещений', d: 'Две модели: до 30 м² и до 60 м².' },
  { t: 'Гибкая установка', d: 'Настенная, передвижная или напольная, без дополнительной стойки.' },
  { t: 'Сервис от производителя', d: 'Обслуживание и инструктаж персонала.' },
];

// Ценность для клиники — 6 карточек из КП
export const VALUE = [
  { t: 'Быстрее вернуть в работу', d: 'Цикл 30–70 минут.' },
  { t: 'Сберечь дорогие изделия', d: 'До 45 °C, без высокого давления и высоких температур.' },
  { t: 'Стерилизовать сложные материалы', d: 'Оптика, полимеры, стекло, термочувствительные изделия.' },
  { t: 'Обойтись без сложной инфраструктуры', d: 'Компактным моделям не нужна кислородная сеть.' },
  { t: 'Контролировать процесс', d: 'Прозрачная камера показывает загрузку.' },
  { t: 'Защитить персонал', d: 'Герметичная конструкция, деструктор, простой цикл.' },
];

export const WHY = [
  { t: 'До 45 °C', d: 'Не перегревает пластик, стекло и оптику.' },
  { t: 'Без пара и высокого давления', d: 'Нет влаги и нагрузки на уплотнения.' },
  { t: '70 Вт', d: 'Против 2–3 кВт у автоклава.' },
  { t: 'Прозрачная камера', d: 'Видно загрузку и процесс.' },
  { t: 'Без сложной инфраструктуры', d: 'Компактным моделям не нужна кислородная сеть.' },
  { t: 'Деструктор', d: 'Разлагает остаточный озон перед открытием камеры.' },
];

export const CYCLE = [
  { t: 'Загрузка в камеру', d: 'Инструмент раскладывают на полках прозрачной камеры, крышка закрывается герметично.' },
  { t: 'Озонатор вырабатывает озон', d: 'Озон по шлангам подаётся в камеру.' },
  { t: 'Экспозиция', d: 'Время зависит от модели: 30–70 минут.' },
  { t: 'Деструктор', d: 'Разлагает остаточный озон, после этого камеру можно открывать.' },
];

export const TURNKEY = [
  { t: 'Комплект оборудования', d: 'Озонатор, камера, соединительные элементы, деструктор, индикаторы.' },
  { t: 'Доставка и монтаж', d: 'Привозим и устанавливаем в клинике.' },
  { t: 'Обучение на рабочем месте', d: 'Инструктаж персонала при запуске.' },
  { t: 'Гарантийная поддержка', d: 'Не менее 37 месяцев.' },
  { t: 'Поставка до 30 дней', d: 'После оплаты. Условия фиксируются договором.' },
];

export const COMPARE = [
  ['Температура', 'до 45 °C', '121–134 °C', '160–180 °C'],
  ['Время цикла', '30–70 мин', '45–90 мин', '60–150 мин'],
  ['Мощность', '70 Вт', '2–3 кВт', '1,5–2 кВт'],
  ['Давление', 'атмосферное', 'высокое', 'атмосферное'],
  ['Пластик и оптика', 'да', 'ограниченно', 'нет'],
  ['Вода и пар', 'не нужны', 'нужны', 'не нужны'],
];

// [сверить с областью применения в РУ]
export const SPHERES = ['Стоматология', 'Эндоскопия', 'Хирургия', 'Офтальмология', 'Гинекология', 'Косметология', 'Лаборатории'];
export const MATERIALS = ['Оптика', 'Полимеры', 'Стекло', 'Термочувствительные изделия', 'Эндоскопический инструмент'];

// Цены аренды — по запросу, пока Канат не даст цифры
export const RENT_PLANS = [
  { name: 'Кабинет', model: 's-16', price: null, for: 'Один кабинет, стоматология или косметология' },
  { name: 'Клиника', model: 's-36', price: null, for: 'Несколько кабинетов, смешанный инструмент', popular: true },
  { name: 'Эндо', model: 's-40', price: null, for: 'Длинные изделия до 55 см, эндоскопы и оптика' },
];
export const RENT_STEPS = ['Заявка', 'Подбор модели', 'Договор и гарантийный взнос', 'Доставка, монтаж и обучение', 'Ежемесячный платёж, сервис включён'];
export const RENT_INCLUDES = ['Доставка', 'Монтаж', 'Обучение на рабочем месте', 'Гарантийная поддержка'];

export const DOCS = [
  { t: 'Регистрационное удостоверение', n: 'РК МИ (МТ)-0№026298 от 03.05.2023', s: 'Озоновые стерилизаторы OTRI S' },
  { t: 'Регистрационное удостоверение', n: 'РК-МТ-0№022741', s: 'УФ-рециркуляторы OTRI Desktop' },
  { t: 'Медицинская лицензия', n: '№ 21017579', s: 'ТОО «OTRI»' },
];

export const FAQ = [
  { q: 'Безопасен ли озон для персонала?', a: 'Камера герметична, перед открытием деструктор разлагает остаточный озон. Персонал проходит инструктаж при запуске.' },
  { q: 'Какие изделия можно стерилизовать?', a: 'Термочувствительные изделия, оптику, полимеры, стекло, эндоскопический инструмент.' },
  { q: 'Чем отличается от автоклава?', a: 'Температура до 45 °C вместо 121–134 °C, нет пара и высокого давления, 70 Вт.' },
  { q: 'Есть ли регистрационное удостоверение РК?', a: 'Да. Стерилизаторы — РК МИ (МТ)-0№026298 от 03.05.2023, рециркуляторы — РК-МТ-0№022741. Медицинская лицензия № 21017579.' },
  { q: 'Как выбрать модель?', a: 'Сообщите максимальные габариты изделий, число циклов за смену и пиковую загрузку — подберём модель за одну консультацию. Для инструмента до 55 см рекомендуем S-40.' },
  { q: 'Сколько ждать поставку?', a: 'Стерилизаторы — до 30 дней после оплаты, рециркуляторы — 10 рабочих дней. Монтаж и обучение включены.' },
  { q: 'Какая гарантия?', a: 'На стерилизаторы — не менее 37 месяцев, на рециркуляторы — 12 месяцев.' },
  { q: 'Можно ли взять в аренду?', a: 'Да, стерилизаторы. Условия рассчитываем под загрузку клиники.' },
];

export const PRICE_NOTE = () => (CONFIG.showPrices ? 'Цены ориентировочные, точное предложение — после подбора.' : 'Цену и наличие назовём после подбора модели — напишите в WhatsApp или оставьте заявку.');
export const KP_FILES = { sterilizer: 'docs/kp-otri-s.pdf', recirculator: 'docs/kp-otri-recirculators.pdf' };

// Аналитика: цели для Яндекс Метрики и GA4
export const track = (goal, params) => {
  try {
    (window.dataLayer = window.dataLayer || []).push({ event: goal, ...(params || {}) });
    if (window.ym && CONFIG.ymId) window.ym(CONFIG.ymId, 'reachGoal', goal, params);
  } catch (e) {}
};

// Открыть форму подбора с подставленной моделью: событие слушает lead-form, страница прокручивается к #form
export const pick = (detail) => {
  window.dispatchEvent(new CustomEvent('otri:pick', { detail: detail || {} }));
  const f = document.getElementById('form');
  if (f) window.scrollTo({ top: f.getBoundingClientRect().top + window.scrollY - 84, behavior: 'smooth' });
};

export const getParam = (k) => { try { return new URLSearchParams(window.location.search).get(k); } catch (e) { return null; } };
