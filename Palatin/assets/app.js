/* Palatin Group — общий JS прототипа: шапка, подвал, город, WhatsApp, квиз, карточки. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const P = window.PRODUCTS || [];

  /* ---------- справочники ---------- */
  const CITIES = {
    almaty: { name: 'Алматы', phone: '+7 701 784 64 80', tel: '+77017846480', wa: '77017846480' },
    astana: { name: 'Астана', phone: '+7 701 721 58 97', tel: '+77017215897', wa: '77017215897' },
  };
  const CALL = { phone: '+7 771 705 17 47', tel: '+77717051747' };
  const SALONS = [
    { id: 'kazhymukana', city: 'almaty', title: 'Palatin Hill', addr: 'ул. Кажымукана, 39', note: 'Флагманский салон премиум-линейки', phones: ['+7 701 784 64 80', '+7 727 351 98 98'], wa: '77017846480', lines: ['hill', 'palatin'], img: 'img/p/mystic-ivory-i.webp', hours: [10, 19], sun: [11, 17] },
    { id: 'armada', city: 'almaty', title: 'ТК Armada', addr: 'ул. Кабдолова, 1/8, бутик 23, 3 ряд, линия D', note: 'Рядом с рынком отделочных материалов', phones: ['+7 771 758 05 01'], wa: '77717580501', lines: ['palatin', 'stock'], img: 'img/p/pro-stone-i.webp', hours: [9, 18], sun: [9, 16] },
    { id: 'auezova', city: 'almaty', title: 'Центр плитки и сантехники', addr: 'ул. М. Ауэзова, 1Д, 2 этаж', note: 'Керамогранит, плитка, сантехника', phones: ['+7 701 981 42 01', '+7 771 756 50 61'], wa: '77019814201', lines: ['palatin', 'hill'], img: 'img/p/etna-i.webp', hours: [10, 19], sun: [11, 17] },
    { id: 'astana', city: 'astana', title: 'Palatin Hill', addr: 'ул. Ш. Калдаякова, 11', note: 'Премиум-салон в Астане', phones: ['+7 701 721 58 97'], wa: '77017215897', lines: ['hill', 'palatin'], img: 'img/p/grande-golden-white-i.webp', hours: [10, 19], sun: [11, 17] },
  ];
  const LINES = {
    hill: { name: 'Palatin Hill', short: 'Hill', desc: 'Премиум. Италия · Испания · Германия' },
    palatin: { name: 'Palatin', short: 'Palatin', desc: 'Европейское качество за разумный бюджет' },
    stock: { name: 'Palatin Stock', short: 'Stock', desc: 'Остатки коллекций со скидкой' },
  };
  const CATS = {
    keramogranit: 'Керамогранит', plitka: 'Плитка', mozaika: 'Мозаика', santehnika: 'Сантехника', mebel: 'Мебель для ванной',
  };
  const BRANDS = {
    'Porcelanosa': { c: 'Испания', y: 1973, flag: '🇪🇸' },
    'Peronda': { c: 'Испания', y: 0, flag: '🇪🇸' },
    'Pamesa': { c: 'Испания', y: 1972, flag: '🇪🇸' },
    'Monopole': { c: 'Испания', y: 0, flag: '🇪🇸' },
    'Marazzi Italy': { c: 'Италия', y: 1935, flag: '🇮🇹' },
    'Sant’Agostino': { c: 'Италия', y: 1964, flag: '🇮🇹' },
    'Sbordoni': { c: 'Италия', y: 0, flag: '🇮🇹' },
    'Villeroy & Boch': { c: 'Германия', y: 1748, flag: '🇩🇪' },
    'Kerama Marazzi': { c: 'Россия', y: 1988, flag: '🇷🇺' },
  };
  const ALL_BRANDS = ['Porcelanosa', 'Peronda', 'Marazzi Italy', 'Sant’Agostino', 'Villeroy & Boch', 'Versace Home', 'Petracer’s', 'Frattini', 'Galassia', 'Pamesa', 'Monopole', 'Sbordoni', 'Ariostea', 'Gaia', 'Gentry Home', 'Bianchini', 'Fiore', 'Gardenia Orchidea', 'Hatria', 'Dune', 'Bagno & Associati', 'Gambarelli', 'Adex', 'Kerama Marazzi'];

  const fmt = n => n.toLocaleString('ru-RU').replace(/,/g, ' ');
  const tenge = n => fmt(n) + ' ₸';
  const sizeStr = p => p.w ? `${String(p.w).replace('.', ',')}×${String(p.h).replace('.', ',')}` : '';
  const slug = s => s.toLowerCase().replace(/[’']/g, '').replace(/&/g, 'and').replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-|-$/g, '');
  const brandBySlug = s => Object.keys(BRANDS).find(b => slug(b) === s);
  const img = (p, k = 'i') => `img/p/${p.id}-${k}.webp`;

  /* ---------- город ---------- */
  let city = 'almaty';
  try { city = localStorage.getItem('pl_city') || 'almaty'; } catch (e) { }
  const C = () => CITIES[city] || CITIES.almaty;
  function waLink(text) {
    const utm = new URLSearchParams(location.search).get('utm_source');
    const t = (text || 'Здравствуйте! Хочу подобрать плитку.') + `\n— со страницы: ${document.title}${utm ? ' · ' + utm : ''}`;
    return `https://wa.me/${C().wa}?text=${encodeURIComponent(t)}`;
  }
  function track(ev, data) { (window.dataLayer = window.dataLayer || []).push({ event: ev, ...data }); }

  /* ---------- иконки ---------- */
  const I = {
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3Z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    yt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10 9 5 3-5 3z" fill="currentColor"/></svg>',
    tt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M14 3v11a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.5 2.3 4 5 4"/></svg>',
  };

  /* ---------- шапка / подвал ---------- */
  const page = document.body.dataset.page || '';
  function header() {
    const nav = [['katalog.html', 'Каталог', 'katalog'], ['palatin-hill.html', 'Palatin Hill', 'hill'], ['dizayneram.html', 'Дизайнерам', 'dizayneram'], ['salony.html', 'Салоны', 'salony'], ['o-nas.html', 'О нас', 'onas']];
    const links = nav.map(([h, t, k]) => `<a href="${h}"${k === page ? ' aria-current="page"' : ''}>${t}</a>`).join('');
    return `<header class="hdr"><div class="wrap">
      <a class="logo" href="index.html" aria-label="Palatin Hill — на главную"><img src="img/ui/logo.webp" alt="Palatin Hill — территория безупречного вкуса" width="112" height="44"></a>
      <nav class="nav" aria-label="Основное меню">${links}</nav>
      <div class="hdr-r">
        <select class="city" aria-label="Город" data-city>${Object.entries(CITIES).map(([k, v]) => `<option value="${k}"${k === city ? ' selected' : ''}>${v.name}</option>`).join('')}</select>
        <a class="hdr-phone" data-phone href="tel:${C().tel}">${C().phone}</a>
        <a class="btn btn-sm wa-h" data-wa href="${waLink()}" target="_blank" rel="noopener" aria-label="Написать в WhatsApp">${I.wa}WhatsApp</a>
        <button class="btn btn-acc btn-sm" data-quiz-open>Подобрать</button>
        <button class="burger" aria-label="Меню" aria-expanded="false" data-burger><span></span><span></span><span></span></button>
      </div></div></header>
      <nav class="mnav" data-mnav aria-label="Мобильное меню"><a href="index.html">Главная</a>${links}<a href="stock.html">Palatin Stock</a><a href="podbor.html">Подбор за 1 минуту</a></nav>`;
  }
  function footer() {
    const cats = Object.entries(CATS).map(([k, v]) => `<li><a href="katalog.html?cat=${k}">${v}</a></li>`).join('');
    const br = Object.keys(BRANDS).map(b => `<li><a href="brand.html?b=${slug(b)}">${b}</a></li>`).join('');
    const sal = SALONS.map(s => `<li><b>${CITIES[s.city].name}</b>, ${s.addr}<br><span class="muted">${s.title} · ${hoursStr(s)}</span></li>`).join('');
    return `<footer class="ftr"><div class="wrap"><div class="ftr-g">
      <div><img src="img/ui/logo.webp" alt="Palatin Hill" width="140" height="55" style="height:55px;width:auto"><p class="muted" style="margin-top:14px;max-width:300px">Palatin Group — сеть салонов европейской плитки, керамогранита и сантехники. 28 лет в Казахстане.</p>
        <div class="soc"><a href="https://instagram.com/palatinhill_kz" target="_blank" rel="noopener" aria-label="Instagram Palatin Hill">${I.ig}</a><a href="#" aria-label="YouTube">${I.yt}</a><a href="#" aria-label="TikTok">${I.tt}</a></div></div>
      <div><h4>Каталог</h4><ul>${cats}<li><a href="stock.html">Palatin Stock</a></li></ul></div>
      <div><h4>Бренды</h4><ul>${br}</ul></div>
      <div><h4>Салоны</h4><ul>${sal}</ul><p style="margin-top:14px">Колл-центр: <a href="tel:${CALL.tel}">${CALL.phone}</a></p></div>
    </div><div class="ftr-b"><span>© 2026 Palatin Group. Территория безупречного вкуса.</span><span><a href="dizayneram.html">Дизайнерам</a> · <a href="dizayneram.html#obektam">Объектам</a> · <a href="o-nas.html">О компании</a> · Политика конфиденциальности</span></div></div></footer>
    <a class="fab" data-wa href="${waLink()}" target="_blank" rel="noopener" aria-label="Написать в WhatsApp">${I.wa.replace('currentColor', '#fff')}</a>
    <div class="mbar"><button class="pk" data-quiz-open>${I.spark}Подобрать</button><a class="wa" data-wa href="${waLink()}" target="_blank" rel="noopener">${I.wa}Написать</a><a href="salony.html">${I.pin}Салоны</a></div>
    <dialog class="mq" data-mq aria-label="Подбор плитки"><div class="c light"><button class="x" data-mq-close aria-label="Закрыть">×</button><div data-quiz="modal"></div></div></dialog>`;
  }
  function hoursStr(s) { return `Пн–Сб ${s.hours[0]}:00–${s.hours[1]}:00, Вс ${s.sun[0]}:00–${s.sun[1]}:00`; }
  function isOpen(s) {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Almaty' }));
    const h = d.getHours() + d.getMinutes() / 60, r = d.getDay() === 0 ? s.sun : s.hours;
    return h >= r[0] && h < r[1];
  }

  /* ---------- карточка товара ---------- */
  function statusHtml(p) {
    const m = { in: ['in', 'В наличии'], order: ['order', 'Под заказ 4–6 недель'], check: ['check', 'Наличие уточнять'] }[p.status];
    return `<span class="st ${m[0]}"><i></i>${m[1]}</span>`;
  }
  function priceHtml(p) {
    if (!p.price) return '<span class="pc-price" style="font-size:15px">Цена — в WhatsApp</span>';
    return `<span class="pc-price">${p.old ? `<s>${fmt(p.old)}</s>` : 'от '}${tenge(p.price)}/м²</span>`;
  }
  function card(p) {
    const b = BRANDS[p.brand] || {};
    const meta = [p.brand + (b.c ? ', ' + b.c : ''), sizeStr(p) && sizeStr(p) + ' см', p.sku && 'арт. ' + p.sku].filter(Boolean).join(' · ');
    return `<a class="pc rv" href="product.html?id=${p.id}">
      <div class="pc-img"><img src="${img(p)}" alt="${p.brand} ${p.name} ${sizeStr(p)} в интерьере" loading="lazy" width="500" height="425">
        <span class="tag ${p.line}"><i></i>${LINES[p.line].short}</span>
        ${p.tex ? `<img class="sw" src="${img(p, 't')}" alt="" loading="lazy" width="64" height="64">` : ''}</div>
      <div class="pc-b"><span class="cap" style="font-size:11px">${CATS[p.cat]}${p.note ? ' · ' + p.note : ''}</span><h3>${p.name}</h3><span class="pc-meta">${meta}</span>
        <div class="pc-row">${priceHtml(p)}${statusHtml(p)}</div></div></a>`;
  }

  /* ---------- квиз ---------- */
  const Q = [
    { k: 'obj', q: 'Что оформляем?', o: [['flat', 'Квартира', 'dual-white'], ['house', 'Дом', 'grande-taj-mahal'], ['biz', 'Коммерческий объект', 'evora-green'], ['pro', 'Я дизайнер / прораб', 'cosmo-pearl']] },
    { k: 'rooms', q: 'Какие помещения?', multi: true, o: [['ванная', 'Ванная', 'dahlia-white'], ['кухня', 'Кухня', 'torano-bianco'], ['гостиная', 'Пол в гостиной', 'hazel-marfil'], ['all', 'Весь объект', 'grande-golden-white'], ['терраса', 'Фасад / терраса', 'antic-pietra']] },
    { k: 'area', q: 'Примерная площадь', o: [[15, 'до 20 м²'], [40, '20–60 м²'], [100, '60–150 м²'], [200, 'больше 150 м²']] },
    { k: 'budget', q: 'Бюджет на м²', o: [['stock', 'до 15 000 ₸'], ['palatin', '15 000 – 40 000 ₸'], ['hill', '40 000 ₸ и выше'], ['unk', 'Пока не знаю']] },
    { k: 'style', q: 'Что ближе по стилю?', photo: true, o: [['мрамор', 'Мрамор', 'grande-golden-white', 't'], ['бетон', 'Бетон', 'slow-calce', 't'], ['дерево', 'Дерево', 'verbier-taupe', 't'], ['камень', 'Камень', 'linen-desert', 't']] },
  ];
  function quiz(root) {
    let st = { step: 0, a: {} };
    try { const s = JSON.parse(localStorage.getItem('pl_quiz')); if (s && s.a) st = s; } catch (e) { }
    if (st.step > Q.length) st.step = Q.length;
    const save = () => { try { localStorage.setItem('pl_quiz', JSON.stringify(st)); } catch (e) { } };
    let started = false;
    function segment() {
      const b = st.a.budget;
      if (b && b !== 'unk') return b;
      return st.a.obj === 'house' ? 'hill' : 'palatin';
    }
    function picks(seg) {
      const tiles = P.filter(p => p.price && !['santehnika', 'mebel'].includes(p.cat));
      const rooms = (st.a.rooms || []).filter(r => r !== 'all');
      const score = p => (p.line === seg ? 4 : 0) + (p.effect === st.a.style ? 3 : 0) + (rooms.some(r => p.rooms.includes(r)) ? 1 : 0) + (p.status === 'in' ? .5 : 0);
      return tiles.slice().sort((x, y) => score(y) - score(x)).slice(0, 3);
    }
    function render(dir) {
      const s = st.step;
      if (s >= Q.length) return result();
      const q = Q[s], val = st.a[q.k];
      const pct = Math.round(s / Q.length * 100);
      root.innerHTML = `<div class="quiz"><div class="qz-top"><span class="cap">Подбор · шаг ${s + 1} из ${Q.length}</span><span class="cap">${pct}%</span></div>
        <div class="qz-bar"><i style="width:${Math.max(pct, 4)}%"></i></div>
        <div class="qz-step"><div class="qz-q">${q.q}</div>
        <div class="qz-opts ${q.photo || q.o.length === 4 && q.o[0][2] ? 'g2' : ''}" role="group" aria-label="${q.q}">${q.o.map(([v, t, im, k]) => {
          const on = q.multi ? (val || []).includes(v) : val === v;
          const pic = im ? `<img src="img/p/${im}-${k || 'i'}.webp" alt="" loading="lazy">` : '';
          return `<button type="button" class="qz-opt${q.photo ? ' ph' : ''}" aria-pressed="${on}" data-v="${v}">${pic}<span>${t}</span>${q.multi ? '<span class="chk"></span>' : ''}</button>`;
        }).join('')}</div></div>
        <div class="qz-nav"><button class="qz-back" type="button" ${s ? '' : 'hidden'} data-back>← Назад</button>${q.multi ? `<button class="btn btn-dark" type="button" data-next ${(val || []).length ? '' : 'disabled style="opacity:.4"'}>Далее</button>` : '<span class="consent">Ответ — сразу к следующему шагу</span>'}</div></div>`;
      $$('.qz-opt', root).forEach(b => b.onclick = () => {
        if (!started) { started = true; track('quiz_start'); }
        let v = b.dataset.v; if (q.k === 'area') v = +v;
        if (q.multi) {
          let arr = st.a[q.k] || [];
          arr = arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
          st.a[q.k] = arr; save(); render();
        } else {
          st.a[q.k] = v; track('quiz_step_' + (s + 1), { value: v });
          if (q.k === 'obj' && (v === 'pro' || v === 'biz')) { save(); return redirect(v); }
          st.step++; save(); setTimeout(render, 140);
        }
      });
      const bk = $('[data-back]', root); if (bk) bk.onclick = () => { st.step--; save(); render(); };
      const nx = $('[data-next]', root); if (nx) nx.onclick = () => { track('quiz_step_' + (s + 1)); st.step++; save(); render(); };
    }
    function redirect(v) {
      const pro = v === 'pro';
      root.innerHTML = `<div class="quiz qz-step"><span class="cap">${pro ? 'Партнёрам' : 'Объектам'}</span>
        <div class="qz-q" style="margin-top:14px">${pro ? 'Для дизайнеров и прорабов у нас своя программа' : 'Для объектов готовим коммерческое предложение'}</div>
        <p class="muted">${pro ? 'Подборка по вашему проекту за 24 часа, личный процент, образцы для студии.' : 'Объёмы, сроки поставки из Европы, документы — менеджер B2B свяжется в течение дня.'}</p>
        <div class="qz-nav" style="flex-direction:column;align-items:stretch"><a class="btn btn-dark" href="dizayneram.html${pro ? '' : '#obektam'}">${pro ? 'Стать партнёром' : 'Запросить КП'}</a><button class="qz-back" type="button" data-back>← Назад к подбору</button></div></div>`;
      $('[data-back]', root).onclick = () => { st.a.obj = null; st.step = 0; save(); render(); };
    }
    function result() {
      const seg = segment(), L = LINES[seg], pk = picks(seg);
      const area = st.a.area || 40, prices = pk.map(p => p.price);
      const lo = Math.round(Math.min(...prices) * area * 1.1 / 1000) * 1000, hi = Math.round(Math.max(...prices) * area * 1.1 / 1000) * 1000;
      track('quiz_complete', { segment: seg });
      const roomsT = (st.a.rooms || []).map(r => r === 'all' ? 'весь объект' : r).join(', ');
      const msg = `Здравствуйте! Прошёл подбор на сайте.\nСегмент: ${L.name}\nОбъект: ${({ flat: 'квартира', house: 'дом' })[st.a.obj] || st.a.obj}\nПомещения: ${roomsT}\nПлощадь: ~${area} м²\nСтиль: ${st.a.style}\nПонравились: ${pk.map(p => p.brand + ' ' + p.name).join('; ')}`;
      root.innerHTML = `<div class="quiz qz-step qz-res"><div class="qz-top"><span class="cap">Ваш результат</span><span class="tag ${seg}"><i></i>${L.short}</span></div>
        <h3 style="margin-top:12px">Вам подходит ${L.name}</h3><p class="muted" style="font-size:15px;margin-top:6px">${L.desc}. Три коллекции под ваш стиль:</p>
        <div class="qz-picks">${pk.map(p => `<a href="product.html?id=${p.id}"><img src="${img(p, p.tex ? 't' : 'i')}" alt="${p.name}" loading="lazy"><span>${p.name}<br><span style="font-weight:400">${tenge(p.price)}/м²</span></span></a>`).join('')}</div>
        <div class="qz-est">На ~${area} м² с запасом 10%: <b>от ${tenge(lo)} до ${tenge(hi)}</b></div>
        <form class="form" style="margin-top:12px" novalidate data-lead="quiz"><input class="hp" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">
          <input class="fld" name="name" placeholder="Имя" autocomplete="given-name" required aria-label="Имя">
          <input class="fld" name="phone" type="tel" inputmode="tel" placeholder="+7 (___) ___-__-__" autocomplete="tel" required aria-label="Телефон" data-mask>
          <span class="err" data-err>Проверьте имя и номер телефона</span>
          <button class="btn btn-dark" type="submit" data-how="wa">${I.wa}Получить подборку в WhatsApp</button>
          <button class="btn" type="submit" data-how="call" style="border-color:#CFC7B9">Перезвоните мне</button>
          <span class="consent">Нажимая кнопку, вы соглашаетесь на обработку персональных данных.</span></form>
        <button class="qz-back" type="button" data-restart>↺ Пройти заново</button></div>`;
      $('[data-restart]', root).onclick = () => { st = { step: 0, a: {} }; save(); render(); };
      leadForm($('form', root), { msg, segment: seg });
    }
    render();
  }

  /* ---------- формы ---------- */
  function mask(inp) {
    inp.addEventListener('input', () => {
      let d = inp.value.replace(/\D/g, '');
      if (d.startsWith('8')) d = '7' + d.slice(1);
      if (!d.startsWith('7')) d = '7' + d;
      d = d.slice(0, 11);
      const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
      inp.value = '+7' + (p[0] ? ` (${p[0]}` : '') + (p[0].length === 3 ? ')' : '') + (p[1] ? ' ' + p[1] : '') + (p[2] ? '-' + p[2] : '') + (p[3] ? '-' + p[3] : '');
    });
    inp.addEventListener('focus', () => { if (!inp.value) inp.value = '+7 ('; });
  }
  function leadForm(form, ctx = {}) {
    const t0 = Date.now();
    $$('[data-mask]', form).forEach(mask);
    let how = 'call';
    $$('[type=submit]', form).forEach(b => b.addEventListener('click', () => how = b.dataset.how || 'call'));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(form);
      if (f.get('company') || Date.now() - t0 < 1500) return; // honeypot + тайминг
      const phone = (f.get('phone') || '').replace(/\D/g, ''), name = (f.get('name') || '').trim();
      const err = $('[data-err]', form);
      if (name.length < 2 || phone.length !== 11) { err && err.classList.add('on'); return; }
      const lead = { name, phone, city, page: location.pathname, utm: location.search, time: new Date().toISOString(), ...ctx, type: form.dataset.lead };
      track('lead_form', lead);
      console.info('[demo] заявка → CRM:', lead);
      if (how === 'wa') window.open(waLink(`${ctx.msg || 'Здравствуйте!'}\nИмя: ${name}`), '_blank', 'noopener');
      const near = SALONS.find(s => s.city === city);
      const wrap = form.closest('.c') && form.closest('.c').classList.contains('light') ? '' : ' dark';
      form.outerHTML = `<div class="ok qz-step${wrap}"><span class="tick"></span><h3 style="font-family:var(--serif);font-size:28px;font-weight:500">Спасибо, ${name}!</h3>
        <p>Менеджер ${how === 'wa' ? 'напишет' : 'перезвонит'} за 15 минут в рабочее время.</p>
        <p class="consent">Ближайший салон: ${near.title}, ${near.addr}</p>
        <a class="link" href="${routeUrl(near, 'g')}" target="_blank" rel="noopener" data-route>Построить маршрут ${I.arrow}</a>
        <span class="note-demo">Демо-версия: заявка не отправляется в CRM</span></div>`;
    });
  }
  function routeUrl(s, kind) {
    const q = encodeURIComponent(`${CITIES[s.city].name}, ${s.addr.split(',').slice(0, 2).join(',')}`);
    return kind === '2gis' ? `https://2gis.kz/${s.city}/search/${q}` : kind === 'y' ? `https://yandex.kz/maps/?text=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  /* ---------- салон-карточка ---------- */
  function salonCard(s, cls = 's6') {
    const op = isOpen(s);
    return `<article class="c photo salon ${cls} rv"><img src="${s.img}" alt="Салон ${s.title}, ${s.addr}" loading="lazy">
      <div class="ov"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="cap" style="color:#D8D1C6">${CITIES[s.city].name} · ${s.title}</span><span class="open ${op ? '' : 'closed'}"><i></i>${op ? 'Открыто сейчас' : 'Сейчас закрыто'}</span></div>
      <div class="addr">${s.addr}</div><div class="muted" style="font-size:14px;margin-top:4px">${hoursStr(s)} · <a href="tel:${s.phones[0].replace(/\s/g, '')}" data-call>${s.phones[0]}</a></div>
      <div class="acts"><a class="btn btn-acc btn-sm" href="${routeUrl(s, '2gis')}" target="_blank" rel="noopener" data-route>${I.pin}Маршрут</a><a class="btn btn-sm" style="color:#fff;border-color:rgba(255,255,255,.3)" href="https://wa.me/${s.wa}?text=${encodeURIComponent('Здравствуйте! Пишу с сайта, вопрос по салону ' + s.addr)}" target="_blank" rel="noopener" data-wa-raw>${I.wa}WhatsApp</a></div></div></article>`;
  }

  /* ---------- init ---------- */
  function init() {
    const h = $('[data-header]'); if (h) h.outerHTML = header();
    const f = $('[data-footer]'); if (f) f.outerHTML = footer();
    // город
    $$('[data-city]').forEach(sel => sel.onchange = () => {
      city = sel.value; try { localStorage.setItem('pl_city', city); } catch (e) { }
      $$('[data-phone]').forEach(a => { a.href = 'tel:' + C().tel; a.textContent = C().phone; });
      $$('[data-wa]').forEach(a => a.href = waLink(a.dataset.waText));
    });
    // меню
    const bg = $('[data-burger]'), mn = $('[data-mnav]');
    if (bg) bg.onclick = () => { const on = mn.classList.toggle('on'); bg.setAttribute('aria-expanded', on); document.body.style.overflow = on ? 'hidden' : ''; };
    // модалка квиза
    const dlg = $('[data-mq]');
    document.addEventListener('click', e => {
      const o = e.target.closest('[data-quiz-open]');
      if (o && dlg) { e.preventDefault(); if (mn) { mn.classList.remove('on'); document.body.style.overflow = ''; } quiz($('[data-quiz="modal"]', dlg)); dlg.showModal(); }
      if (e.target.closest('[data-mq-close]') || e.target === dlg) dlg.close();
      const w = e.target.closest('[data-wa],[data-wa-raw]'); if (w) track('whatsapp_click', { href: w.href });
      if (e.target.closest('[data-route]')) track('route_click');
      if (e.target.closest('a[href^="tel:"]')) track('phone_click');
    });
    $$('[data-wa]').forEach(a => a.href = waLink(a.dataset.waText));
    $$('[data-quiz]:not([data-quiz="modal"])').forEach(quiz);
    $$('form[data-lead]').forEach(fm => leadForm(fm));
    reveal();
  }
  function reveal() {
    const els = $$('.rv:not(.in)');
    if (!('IntersectionObserver' in window) || /Headless/.test(navigator.userAgent)) return els.forEach(e => e.classList.add('in'));
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -40px 0px' });
    els.forEach(e => io.observe(e));
  }

  window.PL = { P, CITIES, SALONS, LINES, CATS, BRANDS, ALL_BRANDS, card, salonCard, tenge, fmt, sizeStr, slug, brandBySlug, img, statusHtml, priceHtml, waLink, routeUrl, reveal, leadForm, track, I, $, $$, city: () => city, hoursStr, isOpen };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
