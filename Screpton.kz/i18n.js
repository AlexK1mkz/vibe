// SCREPTON — словари RU / KZ / EN. KZ и EN — черновик для дизайна, перед запуском вычитывает носитель.
export const LANGS = ['ru', 'kz', 'en'];
export function getLang() { try { return localStorage.getItem('screpton-lang') || 'ru'; } catch (e) { return 'ru'; } }
export function setLang(l) { try { localStorage.setItem('screpton-lang', l); } catch (e) {} }

const common = {
  ru: {
    nav: [['index.html', 'Главная'], ['Project.dc.html', 'Объекты'], ['Technology.dc.html', 'Технология'], ['Documents.dc.html', 'Документы'], ['Contacts.dc.html', 'Контакты']],
    cta: 'Запросить расчёт', cta2: 'Смотреть объекты', more: 'Подробнее', all: 'Все объекты', download: 'Скачать PDF',
    tagline: 'стабилизатор грунта',
    footer_about: 'Стабилизаторы грунта для дорожного строительства. Казахстанский производитель, эксклюзивное право на технологию. ТОО «Green Roads», БИН 201240012669.',
    footer_sections: 'Разделы', footer_contacts: 'Контакты', footer_addr: 'Адреса', hours: 'Пн–Пт 09:00–18:00',
    addr1: 'Астана, ЖМ Железнодорожный, ул. Ж. Жабаева, 76', addr2: 'Темиртау, ул. Мичурина, 1А — производство',
    copy: '© 2010–2026 ТОО «Green Roads» · SCREPTON®',
    cookie: 'Сайт использует cookie для аналитики. Продолжая, вы соглашаетесь с обработкой данных.', cookie_ok: 'Понятно',
    wa: 'Написать в WhatsApp', wa_msg: 'Здравствуйте! Нужен расчёт SCREPTON для участка',
    form_title: 'Пришлём расчёт по вашему участку за один рабочий день',
    form_lead: 'Опишите объект: регион, тип грунта, площадь или километраж. Инженер подберёт конструкцию и норму расхода, менеджер — цену и логистику.',
    f_name: 'Имя', f_org: 'Организация', f_phone: 'Телефон', f_mail: 'Почта для сметы', f_type: 'Тип объекта', f_vol: 'Регион и объём (м² или км)',
    f_types: ['Автодорога общего пользования', 'Промысловая / технологическая дорога', 'Alatau City — улицы и инфраструктура', 'Площадка, паркинг, склад', 'Карьер / ГОК', 'Другое'],
    f_send: 'Отправить', f_legal: 'Нажимая кнопку, вы соглашаетесь с обработкой персональных данных.', f_done: 'Заявка принята', f_done2: 'Инженер свяжется с вами в течение рабочего дня.',
    f_fast: 'Быстрее — в WhatsApp:'
  },
  kz: {
    nav: [['index.html', 'Басты бет'], ['Project.dc.html', 'Нысандар'], ['Technology.dc.html', 'Технология'], ['Documents.dc.html', 'Құжаттар'], ['Contacts.dc.html', 'Байланыс']],
    cta: 'Есептеу сұрату', cta2: 'Нысандарды көру', more: 'Толығырақ', all: 'Барлық нысандар', download: 'PDF жүктеу',
    tagline: 'топырақ тұрақтандырғыш',
    footer_about: 'Жол құрылысына арналған топырақ тұрақтандырғыштар. Қазақстандық өндіруші, технологияға айрықша құқық. «Green Roads» ЖШС, БСН 201240012669.',
    footer_sections: 'Бөлімдер', footer_contacts: 'Байланыс', footer_addr: 'Мекенжайлар', hours: 'Дс–Жм 09:00–18:00',
    addr1: 'Астана, Железнодорожный ТМ, Ж. Жабаев к-сі, 76', addr2: 'Теміртау, Мичурин к-сі, 1А — өндіріс',
    copy: '© 2010–2026 «Green Roads» ЖШС · SCREPTON®',
    cookie: 'Сайт аналитика үшін cookie қолданады. Жалғастыра отырып, деректерді өңдеуге келісесіз.', cookie_ok: 'Түсінікті',
    wa: 'WhatsApp-қа жазу', wa_msg: 'Сәлеметсіз бе! Учаскеге SCREPTON есебі керек',
    form_title: 'Учаскеңіз бойынша есепті бір жұмыс күнінде жібереміз',
    form_lead: 'Нысанды сипаттаңыз: аймақ, топырақ түрі, аумақ немесе километраж. Инженер конструкция мен шығын нормасын, менеджер баға мен логистиканы таңдайды.',
    f_name: 'Аты', f_org: 'Ұйым', f_phone: 'Телефон', f_mail: 'Смета үшін пошта', f_type: 'Нысан түрі', f_vol: 'Аймақ және көлем (м² немесе км)',
    f_types: ['Жалпы пайдаланымдағы автожол', 'Кәсіпшілік / технологиялық жол', 'Alatau City — көшелер мен инфрақұрылым', 'Алаң, тұрақ, қойма', 'Карьер / КБК', 'Басқа'],
    f_send: 'Жіберу', f_legal: 'Түймені басу арқылы дербес деректерді өңдеуге келісесіз.', f_done: 'Өтінім қабылданды', f_done2: 'Инженер жұмыс күні ішінде хабарласады.',
    f_fast: 'Жылдамырақ — WhatsApp:'
  },
  en: {
    nav: [['index.html', 'Home'], ['Project.dc.html', 'Projects'], ['Technology.dc.html', 'Technology'], ['Documents.dc.html', 'Documents'], ['Contacts.dc.html', 'Contacts']],
    cta: 'Request an estimate', cta2: 'See the projects', more: 'Learn more', all: 'All projects', download: 'Download PDF',
    tagline: 'soil stabilizer',
    footer_about: 'Soil stabilizers for road construction. Made in Kazakhstan, exclusive rights to the technology. Green Roads LLP, BIN 201240012669.',
    footer_sections: 'Sections', footer_contacts: 'Contacts', footer_addr: 'Addresses', hours: 'Mon–Fri 09:00–18:00',
    addr1: 'Astana, Zheleznodorozhny, 76 Zh. Zhabayev St.', addr2: 'Temirtau, 1A Michurin St. — production',
    copy: '© 2010–2026 Green Roads LLP · SCREPTON®',
    cookie: 'This site uses cookies for analytics. By continuing you agree to data processing.', cookie_ok: 'Got it',
    wa: 'Message on WhatsApp', wa_msg: 'Hello! I need a SCREPTON estimate for a site',
    form_title: 'We will send an estimate for your site within one working day',
    form_lead: 'Describe the site: region, soil type, area or length. An engineer selects the pavement structure and dosage, a manager handles price and logistics.',
    f_name: 'Name', f_org: 'Organization', f_phone: 'Phone', f_mail: 'Email for the estimate', f_type: 'Site type', f_vol: 'Region and volume (m² or km)',
    f_types: ['Public road', 'Haul / field road', 'Alatau City — streets and infrastructure', 'Yard, parking, warehouse', 'Quarry / mining', 'Other'],
    f_send: 'Send', f_legal: 'By clicking you agree to the processing of personal data.', f_done: 'Request received', f_done2: 'An engineer will contact you within one working day.',
    f_fast: 'Faster on WhatsApp:'
  }
};

const home = {
  ru: {
    hero_kicker: 'Стабилизатор грунта · Произведено в Казахстане',
    hero_h1: 'Дорога из грунта, который уже лежит под ногами',
    hero_lead: 'SCREPTON связывает местный грунт в основание прочностью до 21,7 МПа. Казахстанский производитель, объекты с 2009 года',
    slides: [['img/hero.jpg', 'Готовая дорога'], ['img/grader.jpg', 'Укладка смеси автогрейдером'], ['img/plant.jpg', 'Производство, Темиртау']],
    intro_h: 'SCREPTON — стабилизатор грунта. Казахстанское производство с 2009 года',
    intro_p1: 'Неорганическое вяжущее SCREPTON и полимерная эмульсия SCREPTON-M превращают местный грунт в монолитное основание дороги. Привозной щебень, три слоя основания и битумные проливки больше не нужны.',
    intro_p2: 'Производство — Темиртау. Технология описана в рекомендациях КаздорНИИ Р РК 218-133-2016, материалы сертифицированы по СТ РК и прошли гигиеническую экспертизу.',
    nums: [['68 км', 'дорог в 4 областях'], ['−53 млн ₸', 'на 10 км трассы'], ['21,7 МПа', 'прочность через 29 месяцев']],
    trust: ['Р РК 218-133-2016 · КаздорНИИ', 'Сертификат соответствия СТ РК', 'Комитет автомобильных дорог МИР РК', 'Производство · Темиртау'],
    sph_k: 'Где применяется', sph_h: 'Четыре сферы, один материал',
    spheres: [
      ['Автомобильные дороги', 'Основания дорог I–IV категорий, обочины, разделительные полосы. Реконструкция без вывоза старого основания.', 'Трасса Актобе — Атырау, 2016', '#1B5E3B'],
      ['Промысловые и карьерные дороги', 'Подъезды к месторождениям, дороги в карьерах, вахтовые городки. Работают без асфальта под тяжёлым транспортом.', 'Тайпак — Сатимола, 30,8 км', '#2B2B2B'],
      ['Площадки, логистика, аэродромы', 'Стоянки, склады, терминалы, вертолётные площадки и ВПП. Твёрдое покрытие там, где щебень далеко.', 'Нормы расхода в техкарте', '#F5C400'],
      ['Городская инфраструктура и новые города', 'Улицы, промзоны и подъезды на новых грунтах. Типовые конструкции под категории улиц для Alatau City.', 'Предложение пилота 2026–2027', '#1B5E3B']
    ],
    map_k: 'География', map_h: 'Четыре объекта с 2009 года. Следующий — Алатау',
    points: [
      { x: 31, y: 47, year: '2016', name: 'Актобе — Атырау', val: '10 км' },
      { x: 15, y: 50, year: '2013', name: 'Тайпак — Сатимола', val: '30,8 км' },
      { x: 56, y: 30, year: '2010', name: 'Семизбай', val: '27,3 км' },
      { x: 51, y: 70, year: '2009', name: 'Шиели', val: '7 000 м²' }
    ],
    next_point: { x: 84, y: 80, year: '2027', name: 'Alatau City', val: 'следующий объект' },
    cases_k: 'Объекты', cases_h: 'Четыре региона, 68 км дорог',
    cases: [
      ['img/grader.jpg', '2016', 'Актюбинская область', 'Трасса Актобе — Атырау — Астрахань', '10 км · −53 млн ₸', 'Стабилизация верхнего слоя основания на международной трассе. Пять слоёв вместо девяти.'],
      ['img/water.jpg', '2013', 'Западно-Казахстанская область', 'Промысловая дорога Тайпак — Сатимола', '30,8 км · без асфальта', 'Дорога для тяжёлого транспорта к месторождению. Щебень был далеко — основание сделали из местного грунта.'],
      ['img/case-semizbay.jpg', '2010', 'Акмолинская область', 'Подъезд к месторождению «Семизбай»', '27,3 км', 'Капремонт разбитой подъездной дороги: ресайклирование верхнего слоя со SCREPTON.'],
      ['img/case-shieli.jpg', '2009', 'Кызылординская область', 'Автодорога в районе Шиели', '7 000 м² · 17 лет службы', 'Первый объект. Средний ремонт проблемного участка с пучением — стоит без капремонта.']
    ],
    photo_req: 'Фото объекта — запросить у клиента',
    econ_k: 'Экономика', econ_h: 'Девять слоёв против пяти. Одна и та же дорога категории А3',
    econ_lead: 'Расчёт по методике раздела 14 рекомендаций КаздорНИИ для участка трассы Актобе — Атырау.',
    econ_a: 'По существующему проекту', econ_b: 'С применением SCREPTON',
    layers_a: [['Мелкозернистый асфальтобетон', '5 см', 5, '#3a3a37'], ['Пористый крупнозернистый асфальтобетон', '7 см', 7, '#4a4a46'], ['Чёрный щебень', '11 см', 11, '#5c5b56'], ['Щебень фр. 40×70 / 20×40', '19 см', 19, '#7a776f'], ['ПГС С4', '5 см', 5, '#9a968c'], ['Геотекстиль Геолен М-150', '—', 1.5, '#bcb8ad'], ['+ 3 битумные проливки', '0,2 л/м²', 0, '']],
    layers_b: [['Мелкозернистый асфальтобетон', '5 см', 5, '#3a3a37'], ['Смесь, укреплённая SCREPTON 7%', '15 см', 15, '#1B5E3B'], ['Подстилающий слой из дресвы', '30 см', 30, '#9a968c'], ['+ 1 битумная проливка', '0,7 л/м²', 0, '']],
    price_a: '181,8 млн ₸', price_b: '128,8 млн ₸', price_note: 'сметная стоимость дорожной одежды, 10 км',
    diff: '−53 млн ₸', diff_p: 'Минус 4 слоя, минус привозной щебень, минус 2 проливки. Асфальт сверху остаётся тем же. Источник: буклет SCREPTON, расчёт по рекомендациям КаздорНИИ.',
    diff_cta: 'Расчёт по моей ПСД',
    str_k: 'Набор прочности', str_h: 'От 1,3 до 21,7 МПа за 29 месяцев', str_note: 'Данные испытаний КаздорНИИ, 2014–2017',
    str_x: ['3 суток', '7 суток', '28 суток', '10 мес', '21 мес', '29 мес'],
    tech_k: 'Технология', tech_h: 'Стандартная техника. Восемь шагов, один проход ресайклера',
    tech_lead: 'Смесь готовят на дороге (Wirtgen WR, ДС-152, ДС-72) или в установке (ДС-50, КМА 220). Ничего специального покупать не нужно.',
    steps: [['Подготовка', 'Снятие растительного слоя, уплотнение кулачковыми катками, разбивка ширины и уклонов.'], ['Распределение', 'Порошок SCREPTON вносят цементораспределителем ДС-72 или Wirtgen SW 16 TC.'], ['Смешивание', 'Ресайклер за один проход перемешивает грунт, порошок и водный раствор SCREPTON-M.'], ['Укладка', 'Автогрейдер со следящей системой или укладчик. Коэффициент запаса 1,2–1,3.'], ['Уплотнение', 'Пневмокатки и виброкатки от краёв к середине, перекрытие следа 20–30 см, до 0,98 плотности.'], ['Доувлажнение', 'Поливомоечная машина с гребёнкой держит влажность на 1–2% выше оптимальной.'], ['Уход за слоем', 'Влажное твердение или сразу верхний конструктивный слой — и движение открыто.'], ['Контроль', 'Отбор проб методом лунок и режущего кольца, прочность по СТ РК 973-2015.']],
    tech_cta: 'Скачать техкарту',
    docs_k: 'Нормативная база', docs_h: 'Всё, что нужно проектировщику, чтобы заложить SCREPTON в ПСД',
    docs: [['img/rek.jpg', 'Нормативный документ', 'Р РК 218-133-2016. Рекомендации по применению материалов, обработанных SCREPTON', 'RU · 2016'], ['img/cert.jpg', 'Сертификат', 'Сертификат соответствия СТ РК на SCREPTON и SCREPTON-M', 'RU/KZ · 2017'], ['img/protocol.jpg', 'Протоколы испытаний', 'Лаборатория КаздорНИИ: прочность, водостойкость, морозостойкость', 'RU · 2016–2017'], ['img/otzyv.jpg', 'Отзывы', 'Отзывы подрядчиков по объектам Актобе — Атырау и Сатимола', 'RU · 2016']],
    docs_cta: 'Скачать пакет',
    alatau_k: 'Alatau City · Алматинская область', alatau_h: 'Дорожная сеть нового города — из грунта предгорья',
    alatau_lead: 'Alatau City строится с 2027 года по мастер-плану до 2055-го. Сотни километров улиц, промзон и подъездных дорог на новых грунтах. SCREPTON позволяет не везти щебень в предгорье, а связывать то, что уже на участке.',
    alatau_cta: 'Запросить ТЭО для дистрикта',
    alatau_facts: [['−30%', 'к смете дорожной одежды — методика раздела 14 Р РК 218-133-2016'], ['×1,5', 'быстрее: один проход ресайклера вместо трёх слоёв основания'], ['0 т', 'привозного щебня для основания — инертные берутся на месте'], ['KZ', 'казахстанский производитель, сертификат СТ РК, производство в Темиртау']],
    calc_k: 'Калькулятор', calc_h: 'Сколько материала нужно на ваш участок',
    calc_lead: 'Нормы расхода на 1 м² из технологической карты. Расчёт ориентировочный — точный состав подбирает лаборатория по пробе грунта.',
    c_area: 'Площадь участка', c_h: 'Толщина слоя', c_soil: 'Материал слоя', c_s1: 'Щебёночно-песчаная смесь', c_s2: 'Супесь / суглинок',
    c_need: 'Потребуется', c_p: 'SCREPTON, порошок 7%', c_e: 'SCREPTON-M, эмульсия', c_l: 'Длина дороги при ширине 7 м',
    c_note: 'Цены на материалы и доставку в ваш регион пришлём сметой на почту в течение рабочего дня.', c_cta: 'Получить смету'
  },
  kz: {
    hero_kicker: 'Топырақ тұрақтандырғыш · Қазақстанда өндірілген',
    hero_h1: 'Аяқ астындағы топырақтан салынған жол',
    hero_lead: 'SCREPTON жергілікті топырақты беріктігі 21,7 МПа-ға дейінгі негізге айналдырады. Қазақстандық өндіруші, 2009 жылдан бергі нысандар',
    slides: [['img/hero.jpg', 'Дайын жол'], ['img/grader.jpg', 'Автогрейдермен қоспа төсеу'], ['img/plant.jpg', 'Өндіріс, Теміртау']],
    intro_h: 'SCREPTON — топырақ тұрақтандырғыш. 2009 жылдан бергі қазақстандық өндіріс',
    intro_p1: 'SCREPTON бейорганикалық тұтқыр заты мен SCREPTON-M полимер эмульсиясы жергілікті топырақты жолдың монолитті негізіне айналдырады. Сырттан әкелінетін қиыршық тас, үш қабат негіз және битум құю енді қажет емес.',
    intro_p2: 'Өндіріс — Теміртау. Технология ҚазжолҒЗИ-дің Р РК 218-133-2016 ұсынымдарында сипатталған, материалдар СТ РК бойынша сертификатталған және гигиеналық сараптамадан өткен.',
    nums: [['68 км', '4 облыста жол'], ['−53 млн ₸', '10 км жолға'], ['21,7 МПа', '29 айдан кейінгі беріктік']],
    trust: ['Р РК 218-133-2016 · ҚазжолҒЗИ', 'СТ РК сәйкестік сертификаты', 'ҚР ИДМ Автожол комитеті', 'Өндіріс · Теміртау'],
    sph_k: 'Қолдану салалары', sph_h: 'Төрт сала, бір материал',
    spheres: [
      ['Автомобиль жолдары', 'I–IV санаттағы жол негіздері, жол жиектері, бөлу жолақтары. Ескі негізді шығармай реконструкциялау.', 'Ақтөбе — Атырау жолы, 2016', '#1B5E3B'],
      ['Кәсіпшілік және карьер жолдары', 'Кен орындарына кірме жолдар, карьер жолдары, вахталық қалашықтар. Ауыр көлік астында асфальтсыз жұмыс істейді.', 'Тайпақ — Сатимола, 30,8 км', '#2B2B2B'],
      ['Алаңдар, логистика, аэродромдар', 'Тұрақтар, қоймалар, терминалдар, тікұшақ алаңдары мен ҰҚЖ. Қиыршық тас алыс жерде қатты жабын.', 'Техкартадағы шығын нормалары', '#F5C400'],
      ['Қала инфрақұрылымы және жаңа қалалар', 'Жаңа топырақтағы көшелер, өнеркәсіп аймақтары мен кірме жолдар. Alatau City үшін көше санаттары бойынша үлгілік конструкциялар.', '2026–2027 пилот ұсынысы', '#1B5E3B']
    ],
    map_k: 'География', map_h: '2009 жылдан бергі төрт нысан. Келесісі — Алатау',
    points: [
      { x: 31, y: 47, year: '2016', name: 'Ақтөбе — Атырау', val: '10 км' },
      { x: 15, y: 50, year: '2013', name: 'Тайпақ — Сатимола', val: '30,8 км' },
      { x: 56, y: 30, year: '2010', name: 'Семізбай', val: '27,3 км' },
      { x: 51, y: 70, year: '2009', name: 'Шиелі', val: '7 000 м²' }
    ],
    next_point: { x: 84, y: 80, year: '2027', name: 'Alatau City', val: 'келесі нысан' },
    cases_k: 'Нысандар', cases_h: 'Төрт облыс, 68 км жол',
    cases: [
      ['img/grader.jpg', '2016', 'Ақтөбе облысы', 'Ақтөбе — Атырау — Астрахань жолы', '10 км · −53 млн ₸', 'Халықаралық жолдағы негіздің жоғарғы қабатын тұрақтандыру. Тоғыз қабаттың орнына бесеу.'],
      ['img/water.jpg', '2013', 'Батыс Қазақстан облысы', 'Тайпақ — Сатимола кәсіпшілік жолы', '30,8 км · асфальтсыз', 'Кен орнына ауыр көлікке арналған жол. Қиыршық тас алыс болды — негізді жергілікті топырақтан жасады.'],
      ['img/case-semizbay.jpg', '2010', 'Ақмола облысы', '«Семізбай» кен орнына кірме жол', '27,3 км', 'Бұзылған кірме жолды күрделі жөндеу: SCREPTON-мен жоғарғы қабатты ресайклингтеу.'],
      ['img/case-shieli.jpg', '2009', 'Қызылорда облысы', 'Шиелі ауданындағы автожол', '7 000 м² · 17 жыл қызмет', 'Алғашқы нысан. Ісінетін проблемалы учаскені орташа жөндеу — күрделі жөндеусіз тұр.']
    ],
    photo_req: 'Нысан фотосы — клиенттен сұрау',
    econ_k: 'Экономика', econ_h: 'Тоғыз қабатқа қарсы бес. Бір ғана А3 санатты жол',
    econ_lead: 'Ақтөбе — Атырау жолының учаскесі үшін ҚазжолҒЗИ ұсынымдарының 14-бөлімі әдістемесі бойынша есеп.',
    econ_a: 'Қолданыстағы жоба бойынша', econ_b: 'SCREPTON қолданумен',
    layers_a: [['Ұсақ түйіршікті асфальтбетон', '5 см', 5, '#3a3a37'], ['Кеуекті ірі түйіршікті асфальтбетон', '7 см', 7, '#4a4a46'], ['Қара қиыршық тас', '11 см', 11, '#5c5b56'], ['Қиыршық тас фр. 40×70 / 20×40', '19 см', 19, '#7a776f'], ['ҚҚҚ С4', '5 см', 5, '#9a968c'], ['Геотекстиль Геолен М-150', '—', 1.5, '#bcb8ad'], ['+ 3 битум құю', '0,2 л/м²', 0, '']],
    layers_b: [['Ұсақ түйіршікті асфальтбетон', '5 см', 5, '#3a3a37'], ['SCREPTON 7% бекітілген қоспа', '15 см', 15, '#1B5E3B'], ['Дресвадан төсеме қабат', '30 см', 30, '#9a968c'], ['+ 1 битум құю', '0,7 л/м²', 0, '']],
    price_a: '181,8 млн ₸', price_b: '128,8 млн ₸', price_note: 'жол төсемінің сметалық құны, 10 км',
    diff: '−53 млн ₸', diff_p: 'Минус 4 қабат, минус әкелінген қиыршық тас, минус 2 құю. Үстіңгі асфальт сол күйінде қалады. Дереккөз: SCREPTON буклеті, ҚазжолҒЗИ ұсынымдары бойынша есеп.',
    diff_cta: 'Менің ЖСҚ бойынша есеп',
    str_k: 'Беріктік жинау', str_h: '29 айда 1,3-тен 21,7 МПа-ға дейін', str_note: 'ҚазжолҒЗИ сынақ деректері, 2014–2017',
    str_x: ['3 тәулік', '7 тәулік', '28 тәулік', '10 ай', '21 ай', '29 ай'],
    tech_k: 'Технология', tech_h: 'Стандартты техника. Сегіз қадам, ресайклердің бір жүрісі',
    tech_lead: 'Қоспаны жолда (Wirtgen WR, ДС-152, ДС-72) немесе қондырғыда (ДС-50, КМА 220) дайындайды. Арнайы ештеңе сатып алу қажет емес.',
    steps: [['Дайындық', 'Өсімдік қабатын алу, жұдырықшалы катоктармен тығыздау, ен мен еңісті бөлу.'], ['Тарату', 'SCREPTON ұнтағын ДС-72 немесе Wirtgen SW 16 TC цемент таратқышымен енгізеді.'], ['Араластыру', 'Ресайклер бір жүрісте топырақты, ұнтақты және SCREPTON-M су ерітіндісін араластырады.'], ['Төсеу', 'Бақылау жүйесі бар автогрейдер немесе төсегіш. Қор коэффициенті 1,2–1,3.'], ['Тығыздау', 'Пневмо- және вибро катоктар жиектен ортаға қарай, із қабаттасуы 20–30 см, 0,98 тығыздыққа дейін.'], ['Қосымша ылғалдау', 'Тарақты су себу машинасы ылғалдылықты оңтайлыдан 1–2% жоғары ұстайды.'], ['Қабат күтімі', 'Ылғалды қату немесе бірден жоғарғы конструктивті қабат — және қозғалыс ашық.'], ['Бақылау', 'Шұңқыр және кесу сақинасы әдісімен сынама алу, СТ РК 973-2015 бойынша беріктік.']],
    tech_cta: 'Техкартаны жүктеу',
    docs_k: 'Нормативтік база', docs_h: 'Жобалаушыға SCREPTON-ды ЖСҚ-ға енгізу үшін қажеттінің бәрі',
    docs: [['img/rek.jpg', 'Нормативтік құжат', 'Р РК 218-133-2016. SCREPTON-мен өңделген материалдарды қолдану жөніндегі ұсынымдар', 'RU · 2016'], ['img/cert.jpg', 'Сертификат', 'SCREPTON және SCREPTON-M үшін СТ РК сәйкестік сертификаты', 'RU/KZ · 2017'], ['img/protocol.jpg', 'Сынақ хаттамалары', 'ҚазжолҒЗИ зертханасы: беріктік, суға төзімділік, аязға төзімділік', 'RU · 2016–2017'], ['img/otzyv.jpg', 'Пікірлер', 'Ақтөбе — Атырау және Сатимола нысандары бойынша мердігерлердің пікірлері', 'RU · 2016']],
    docs_cta: 'Пакетті жүктеу',
    alatau_k: 'Alatau City · Алматы облысы', alatau_h: 'Жаңа қаланың жол желісі — тау бөктеріндегі топырақтан',
    alatau_lead: 'Alatau City 2027 жылдан бастап 2055 жылға дейінгі бас жоспар бойынша салынады. Жаңа топырақтағы жүздеген километр көшелер, өнеркәсіп аймақтары мен кірме жолдар. SCREPTON тау бөктеріне қиыршық тас тасымауға, учаскедегі барды байланыстыруға мүмкіндік береді.',
    alatau_cta: 'Дистрикт үшін ТЭН сұрату',
    alatau_facts: [['−30%', 'жол төсемі сметасына — Р РК 218-133-2016 14-бөлім әдістемесі'], ['×1,5', 'жылдамырақ: үш қабат негіздің орнына ресайклердің бір жүрісі'], ['0 т', 'негізге әкелінетін қиыршық тас — инертті материал орнында алынады'], ['KZ', 'қазақстандық өндіруші, СТ РК сертификаты, Теміртаудағы өндіріс']],
    calc_k: 'Калькулятор', calc_h: 'Учаскеңізге қанша материал қажет',
    calc_lead: 'Технологиялық картадан 1 м²-ге шығын нормалары. Есеп болжамды — нақты құрамды зертхана топырақ сынамасы бойынша таңдайды.',
    c_area: 'Учаске ауданы', c_h: 'Қабат қалыңдығы', c_soil: 'Қабат материалы', c_s1: 'Қиыршық тас-құм қоспасы', c_s2: 'Құмайт / саздақ',
    c_need: 'Қажет болады', c_p: 'SCREPTON, ұнтақ 7%', c_e: 'SCREPTON-M, эмульсия', c_l: 'Ені 7 м болғандағы жол ұзындығы',
    c_note: 'Материалдар мен аймағыңызға жеткізу бағасын жұмыс күні ішінде поштаға сметамен жібереміз.', c_cta: 'Смета алу'
  },
  en: {
    hero_kicker: 'Soil stabilizer · Made in Kazakhstan',
    hero_h1: 'A road built from the ground already beneath your feet',
    hero_lead: 'SCREPTON binds local soil into a road base of up to 21.7 MPa. Made in Kazakhstan, projects since 2009',
    slides: [['img/hero.jpg', 'Finished road'], ['img/grader.jpg', 'Grader spreading the mix'], ['img/plant.jpg', 'Production, Temirtau']],
    intro_h: 'SCREPTON is a soil stabilizer. Made in Kazakhstan since 2009',
    intro_p1: 'The inorganic binder SCREPTON and the polymer emulsion SCREPTON-M turn local soil into a monolithic road base. No imported crushed stone, no three-layer base, no bitumen sprays.',
    intro_p2: 'Produced in Temirtau. The technology is described in KazdorNII guidelines R RK 218-133-2016; the materials are certified to ST RK and have passed hygienic assessment.',
    nums: [['68 km', 'of roads in 4 regions'], ['−53 M ₸', 'per 10 km of highway'], ['21.7 MPa', 'strength after 29 months']],
    trust: ['R RK 218-133-2016 · KazdorNII', 'ST RK certificate of conformity', 'Roads Committee, Ministry of Industry', 'Production · Temirtau'],
    sph_k: 'Applications', sph_h: 'Four fields, one material',
    spheres: [
      ['Public roads', 'Bases for category I–IV roads, shoulders, medians. Reconstruction without hauling away the old base.', 'Aktobe — Atyrau highway, 2016', '#1B5E3B'],
      ['Haul and quarry roads', 'Access roads to fields, quarry roads, camp sites. Carry heavy traffic without asphalt.', 'Taipak — Satimola, 30.8 km', '#2B2B2B'],
      ['Yards, logistics, airfields', 'Parking, warehouses, terminals, helipads and runways. A hard surface where stone is far away.', 'Dosage in the technical sheet', '#F5C400'],
      ['Urban infrastructure and new cities', 'Streets, industrial zones and access roads on new ground. Standard structures per street category for Alatau City.', 'Pilot proposal 2026–2027', '#1B5E3B']
    ],
    map_k: 'Geography', map_h: 'Four projects since 2009. Next: Alatau',
    points: [
      { x: 31, y: 47, year: '2016', name: 'Aktobe — Atyrau', val: '10 km' },
      { x: 15, y: 50, year: '2013', name: 'Taipak — Satimola', val: '30.8 km' },
      { x: 56, y: 30, year: '2010', name: 'Semizbay', val: '27.3 km' },
      { x: 51, y: 70, year: '2009', name: 'Shieli', val: '7,000 m²' }
    ],
    next_point: { x: 84, y: 80, year: '2027', name: 'Alatau City', val: 'next project' },
    cases_k: 'Projects', cases_h: 'Four regions, 68 km of roads',
    cases: [
      ['img/grader.jpg', '2016', 'Aktobe region', 'Aktobe — Atyrau — Astrakhan highway', '10 km · −53 M ₸', 'Stabilized upper base layer on an international highway. Five layers instead of nine.'],
      ['img/water.jpg', '2013', 'West Kazakhstan region', 'Taipak — Satimola haul road', '30.8 km · no asphalt', 'Road for heavy traffic to an oil field. Stone was far away, so the base was made from local soil.'],
      ['img/case-semizbay.jpg', '2010', 'Akmola region', 'Access road to the Semizbay deposit', '27.3 km', 'Overhaul of a broken access road: cold recycling of the top layer with SCREPTON.'],
      ['img/case-shieli.jpg', '2009', 'Kyzylorda region', 'Road near Shieli', '7,000 m² · 17 years in service', 'The first project. Repair of a frost-heave section, still standing without overhaul.']
    ],
    photo_req: 'Site photo — request from client',
    econ_k: 'Economics', econ_h: 'Nine layers versus five. The same category A3 road',
    econ_lead: 'Calculated per section 14 of the KazdorNII guidelines for a section of the Aktobe — Atyrau highway.',
    econ_a: 'Existing design', econ_b: 'With SCREPTON',
    layers_a: [['Fine-grained asphalt concrete', '5 cm', 5, '#3a3a37'], ['Porous coarse asphalt concrete', '7 cm', 7, '#4a4a46'], ['Bitumen-coated crushed stone', '11 cm', 11, '#5c5b56'], ['Crushed stone 40×70 / 20×40', '19 cm', 19, '#7a776f'], ['Sand-gravel mix C4', '5 cm', 5, '#9a968c'], ['Geotextile Geolen M-150', '—', 1.5, '#bcb8ad'], ['+ 3 bitumen sprays', '0.2 l/m²', 0, '']],
    layers_b: [['Fine-grained asphalt concrete', '5 cm', 5, '#3a3a37'], ['Mix stabilized with 7% SCREPTON', '15 cm', 15, '#1B5E3B'], ['Decomposed-rock sub-base', '30 cm', 30, '#9a968c'], ['+ 1 bitumen spray', '0.7 l/m²', 0, '']],
    price_a: '181.8 M ₸', price_b: '128.8 M ₸', price_note: 'estimated pavement cost, 10 km',
    diff: '−53 M ₸', diff_p: 'Four layers fewer, no imported stone, two sprays fewer. The asphalt on top stays the same. Source: SCREPTON brochure, calculation per KazdorNII guidelines.',
    diff_cta: 'Estimate for my design docs',
    str_k: 'Strength gain', str_h: 'From 1.3 to 21.7 MPa in 29 months', str_note: 'KazdorNII test data, 2014–2017',
    str_x: ['3 days', '7 days', '28 days', '10 mo', '21 mo', '29 mo'],
    tech_k: 'Technology', tech_h: 'Standard machinery. Eight steps, one pass of the recycler',
    tech_lead: 'The mix is made in place (Wirtgen WR, DS-152, DS-72) or in a plant (DS-50, KMA 220). Nothing special to buy.',
    steps: [['Preparation', 'Strip topsoil, compact with padfoot rollers, set out width and grades.'], ['Spreading', 'SCREPTON powder is spread by a DS-72 or Wirtgen SW 16 TC binder spreader.'], ['Mixing', 'The recycler mixes soil, powder and SCREPTON-M water solution in one pass.'], ['Laying', 'Grader with automatic levelling or a paver. Allowance factor 1.2–1.3.'], ['Compaction', 'Pneumatic and vibratory rollers from edges to centre, 20–30 cm overlap, to 0.98 density.'], ['Re-wetting', 'A water truck with a spray bar keeps moisture 1–2% above optimum.'], ['Curing', 'Moist curing or the next structural layer right away, and the road is open.'], ['Quality control', 'Sampling by pit and cutting-ring methods, strength per ST RK 973-2015.']],
    tech_cta: 'Download the technical sheet',
    docs_k: 'Regulatory base', docs_h: 'Everything a designer needs to put SCREPTON into design documents',
    docs: [['img/rek.jpg', 'Regulatory document', 'R RK 218-133-2016. Guidelines for materials treated with SCREPTON', 'RU · 2016'], ['img/cert.jpg', 'Certificate', 'ST RK certificate of conformity for SCREPTON and SCREPTON-M', 'RU/KZ · 2017'], ['img/protocol.jpg', 'Test reports', 'KazdorNII laboratory: strength, water and frost resistance', 'RU · 2016–2017'], ['img/otzyv.jpg', 'References', 'Contractor references for Aktobe — Atyrau and Satimola', 'RU · 2016']],
    docs_cta: 'Download the package',
    alatau_k: 'Alatau City · Almaty region', alatau_h: 'A new city\u2019s road network from foothill soil',
    alatau_lead: 'Alatau City is built from 2027 under a master plan running to 2055. Hundreds of kilometres of streets, industrial zones and access roads on new ground. SCREPTON binds what is already on site instead of hauling stone into the foothills.',
    alatau_cta: 'Request a feasibility study for a district',
    alatau_facts: [['−30%', 'on the pavement estimate — section 14 method, R RK 218-133-2016'], ['×1.5', 'faster: one recycler pass instead of three base layers'], ['0 t', 'of imported stone for the base — aggregates come from the site'], ['KZ', 'made in Kazakhstan, ST RK certificate, production in Temirtau']],
    calc_k: 'Calculator', calc_h: 'How much material your site needs',
    calc_lead: 'Dosage per m² from the technical sheet. Indicative only; the exact mix is set by a laboratory from a soil sample.',
    c_area: 'Site area', c_h: 'Layer thickness', c_soil: 'Layer material', c_s1: 'Crushed stone-sand mix', c_s2: 'Sandy loam / loam',
    c_need: 'Required', c_p: 'SCREPTON powder, 7%', c_e: 'SCREPTON-M emulsion', c_l: 'Road length at 7 m width',
    c_note: 'Material prices and delivery to your region come as an estimate by email within one working day.', c_cta: 'Get an estimate'
  }
};

const project = {
  ru: {
    crumb: 'Объекты', year: '2016 · Актюбинская область · реконструкция',
    h1: 'Трасса Актобе — Атырау — Астрахань: 10 км за 128,8 млн ₸ вместо 181,8',
    lead: 'Международная трасса категории А3. Проект предусматривал девять слоёв дорожной одежды; со SCREPTON их стало пять, а основание сделали из грунта, который уже лежал на участке.',
    facts: [['10 км', 'длина участка'], ['−53 млн ₸', 'экономия сметы'], ['5 слоёв', 'вместо 9'], ['№ 359-16', 'протокол КаздорНИИ']],
    task_k: 'Задача', task_h: 'Реконструкция без карьера под боком',
    task_p: 'Генподрядчик «Аларыктасстрой» реконструировал участок международной трассы. Проектная конструкция требовала 19 см щебня фракции 40×70 и 11 см чёрного щебня — всё привозное, за сотни километров. Срок и смета упирались в логистику инертных.',
    why_k: 'Почему не традиционно', why_h: 'Щебень дороже дороги',
    why_p: 'Доля привозных материалов в смете основания превышала половину. Каждый слой — отдельный цикл доставки, укладки и уплотнения. При этом местный грунт по пробам подходил для укрепления вяжущим.',
    did_k: 'Что сделали', did_h: 'Верхний слой основания — из укреплённого грунта',
    did_steps: [['img/grader.jpg', 'Распределение порошка SCREPTON 7% и планировка автогрейдером'], ['img/water.jpg', 'Доувлажнение раствором SCREPTON-M, уплотнение катками'], ['img/base-done.jpg', 'Готовое основание перед укладкой асфальта']],
    did_p: 'Смесь готовили на дороге ресайклером за один проход. Слой 15 см укреплённого грунта заменил чёрный щебень, щебень двух фракций, ПГС и геотекстиль. Сверху — те же 5 см мелкозернистого асфальтобетона.',
    econ_k: 'Цифры', econ_h: 'Расчёт по методике КаздорНИИ',
    docs_k: 'Документы по объекту', docs: [['img/protocol.jpg', 'Протокол испытаний № 359-16', 'КаздорНИИ · 2016'], ['img/doc2017.jpg', 'Протокол испытаний № 240-17', 'КаздорНИИ · 2017'], ['img/otzyv.jpg', 'Отзыв генподрядчика', 'Аларыктасстрой · 2016']],
    today_k: 'Сегодня', today_h: 'Дорога работает десятый год', today_p: 'Участок эксплуатируется с 2016 года под международным трафиком. Фото состояния дороги и имя заказчика — запросить у клиента до запуска сайта.',
    cta_h: 'Такой же расчёт для моего участка', cta_p: 'Пришлите ПСД или описание участка — инженер посчитает конструкцию со SCREPTON и разницу в смете.',
    others_k: 'Другие объекты'
  },
  kz: {
    crumb: 'Нысандар', year: '2016 · Ақтөбе облысы · реконструкция',
    h1: 'Ақтөбе — Атырау — Астрахань жолы: 181,8 орнына 128,8 млн ₸-ге 10 км',
    lead: 'А3 санатты халықаралық жол. Жоба жол төсемінің тоғыз қабатын қарастырған; SCREPTON-мен бесеу болды, ал негіз учаскеде жатқан топырақтан жасалды.',
    facts: [['10 км', 'учаске ұзындығы'], ['−53 млн ₸', 'смета үнемі'], ['5 қабат', '9 орнына'], ['№ 359-16', 'ҚазжолҒЗИ хаттамасы']],
    task_k: 'Міндет', task_h: 'Жанында карьерсіз реконструкция',
    task_p: '«Аларыктасстрой» бас мердігері халықаралық жол учаскесін реконструкциялады. Жобалық конструкция 40×70 фракциялы 19 см қиыршық тас пен 11 см қара қиыршық тасты талап етті — бәрі жүздеген километрден әкелінетін. Мерзім мен смета инертті материал логистикасына тірелді.',
    why_k: 'Неге дәстүрлі емес', why_h: 'Қиыршық тас жолдан қымбат',
    why_p: 'Негіз сметасындағы әкелінетін материалдардың үлесі жартысынан асты. Әр қабат — жеткізу, төсеу және тығыздаудың жеке циклі. Ал жергілікті топырақ сынамалар бойынша тұтқыр затпен бекітуге жарамды болды.',
    did_k: 'Не істелді', did_h: 'Негіздің жоғарғы қабаты — бекітілген топырақтан',
    did_steps: [['img/grader.jpg', 'SCREPTON 7% ұнтағын тарату және автогрейдермен тегістеу'], ['img/water.jpg', 'SCREPTON-M ерітіндісімен ылғалдау, катоктармен тығыздау'], ['img/base-done.jpg', 'Асфальт төсеу алдындағы дайын негіз']],
    did_p: 'Қоспаны жолда ресайклермен бір жүрісте дайындады. 15 см бекітілген топырақ қабаты қара қиыршық тасты, екі фракциялы қиыршық тасты, ҚҚҚ мен геотекстильді алмастырды. Үстінде — сол 5 см ұсақ түйіршікті асфальтбетон.',
    econ_k: 'Сандар', econ_h: 'ҚазжолҒЗИ әдістемесі бойынша есеп',
    docs_k: 'Нысан бойынша құжаттар', docs: [['img/protocol.jpg', '№ 359-16 сынақ хаттамасы', 'ҚазжолҒЗИ · 2016'], ['img/doc2017.jpg', '№ 240-17 сынақ хаттамасы', 'ҚазжолҒЗИ · 2017'], ['img/otzyv.jpg', 'Бас мердігер пікірі', 'Аларыктасстрой · 2016']],
    today_k: 'Бүгін', today_h: 'Жол оныншы жыл жұмыс істейді', today_p: 'Учаске 2016 жылдан бері халықаралық трафик астында пайдаланылады. Жол күйінің фотосы мен тапсырыс берушінің атауы — сайтты іске қосқанға дейін клиенттен сұрау.',
    cta_h: 'Менің учаскеме дәл осындай есеп', cta_p: 'ЖСҚ немесе учаске сипаттамасын жіберіңіз — инженер SCREPTON-мен конструкцияны және сметадағы айырманы есептейді.',
    others_k: 'Басқа нысандар'
  },
  en: {
    crumb: 'Projects', year: '2016 · Aktobe region · reconstruction',
    h1: 'Aktobe — Atyrau — Astrakhan highway: 10 km for 128.8 M ₸ instead of 181.8',
    lead: 'An international category A3 highway. The design called for nine pavement layers; with SCREPTON there were five, and the base was made from soil already on site.',
    facts: [['10 km', 'section length'], ['−53 M ₸', 'estimate saved'], ['5 layers', 'instead of 9'], ['No. 359-16', 'KazdorNII report']],
    task_k: 'The task', task_h: 'Reconstruction with no quarry nearby',
    task_p: 'General contractor Alaryktasstroy was reconstructing a section of the international highway. The design required 19 cm of 40×70 crushed stone and 11 cm of bitumen-coated stone, all hauled hundreds of kilometres. Schedule and budget hinged on aggregate logistics.',
    why_k: 'Why not the usual way', why_h: 'Stone costs more than the road',
    why_p: 'Imported materials made up more than half of the base estimate. Each layer meant a separate cycle of delivery, laying and compaction. Meanwhile, samples showed the local soil was suitable for binder stabilization.',
    did_k: 'What was done', did_h: 'Upper base layer from stabilized soil',
    did_steps: [['img/grader.jpg', 'Spreading 7% SCREPTON powder and grading'], ['img/water.jpg', 'Wetting with SCREPTON-M solution, compaction with rollers'], ['img/base-done.jpg', 'Finished base before asphalt']],
    did_p: 'The mix was made in place by a recycler in one pass. A 15 cm layer of stabilized soil replaced the coated stone, two stone fractions, sand-gravel mix and geotextile. On top: the same 5 cm of fine-grained asphalt.',
    econ_k: 'Numbers', econ_h: 'Calculated per the KazdorNII method',
    docs_k: 'Project documents', docs: [['img/protocol.jpg', 'Test report No. 359-16', 'KazdorNII · 2016'], ['img/doc2017.jpg', 'Test report No. 240-17', 'KazdorNII · 2017'], ['img/otzyv.jpg', 'Contractor reference', 'Alaryktasstroy · 2016']],
    today_k: 'Today', today_h: 'The road is in its tenth year', today_p: 'The section has carried international traffic since 2016. Current photos and the client name are to be requested before launch.',
    cta_h: 'The same estimate for my site', cta_p: 'Send design documents or a site description; an engineer will calculate the SCREPTON structure and the difference in the estimate.',
    others_k: 'Other projects'
  }
};

const tech = {
  ru: {
    h1: 'Два продукта, стандартная техника, восемь шагов',
    lead: 'Порошок связывает, эмульсия усиливает. Смесь готовят на дороге ресайклером или в установке; специальных машин не требуется.',
    prod_k: 'Продукты',
    p1: ['SCREPTON', 'Неорганическое вяжущее', ['Совместный помол портландцемента и шлака с активаторами', 'Серый тонкодисперсный порошок, негорюч, стоек к воде и морозу', 'Расход 4–7% от массы грунта', 'Не токсичен — гигиеническая экспертиза']],
    p2: ['SCREPTON-M', 'Полимерная эмульсия', ['Акрил, винилацетат, стирол в водной среде', 'Вводится с водой при смешивании', 'Повышает водостойкость и эластичность слоя', 'Расход 0,10–0,33 л на м²']],
    mach_k: 'Техника', mach_h: 'Всё это уже есть у дорожного подрядчика',
    mach: [['Ресайклеры', 'Wirtgen WR 2000/2400, ДС-152, ДС-72'], ['Распределители вяжущего', 'ДС-72, Wirtgen SW 16 TC'], ['Смесительные установки', 'ДС-50, КМА 220'], ['Планировка', 'Автогрейдер со следящей системой, укладчик'], ['Уплотнение', 'Пневмокатки, виброкатки, кулачковые катки'], ['Увлажнение', 'Поливомоечная машина с гребёнкой']],
    dose_k: 'Нормы расхода', dose_h: 'На 1 м² при толщине слоя 1 см',
    dose: [['Щебёночно-песчаная смесь', '1,33 кг', '0,010 л'], ['Супесь / суглинок', '1,47 кг', '0,011 л']],
    dose_cols: ['Грунт', 'SCREPTON', 'SCREPTON-M'],
    struct_k: 'Конструкции дорожных одежд', struct_h: 'Три типовые конструкции из рекомендаций',
    structs: [
      ['Дорога I–II категории', [['Асфальтобетон', 12, '#3a3a37'], ['Укреплённый грунт SCREPTON', 20, '#1B5E3B'], ['Подстилающий слой', 30, '#9a968c']]],
      ['Дорога III–IV категории', [['Асфальтобетон', 5, '#3a3a37'], ['Укреплённый грунт SCREPTON', 15, '#1B5E3B'], ['Подстилающий слой', 30, '#9a968c']]],
      ['Промысловая дорога без асфальта', [['Укреплённый грунт SCREPTON', 20, '#1B5E3B'], ['Местный грунт', 30, '#9a968c']]]
    ],
    cm: 'см'
  },
  kz: {
    h1: 'Екі өнім, стандартты техника, сегіз қадам',
    lead: 'Ұнтақ байланыстырады, эмульсия күшейтеді. Қоспаны жолда ресайклермен немесе қондырғыда дайындайды; арнайы машиналар қажет емес.',
    prod_k: 'Өнімдер',
    p1: ['SCREPTON', 'Бейорганикалық тұтқыр зат', ['Портландцемент пен шлакты активаторлармен бірге ұнтақтау', 'Сұр ұсақ дисперсті ұнтақ, жанбайды, суға және аязға төзімді', 'Шығыны топырақ массасының 4–7%', 'Улы емес — гигиеналық сараптама']],
    p2: ['SCREPTON-M', 'Полимер эмульсиясы', ['Су ортасындағы акрил, винилацетат, стирол', 'Араластыру кезінде сумен енгізіледі', 'Қабаттың суға төзімділігі мен серпімділігін арттырады', 'Шығыны 1 м²-ге 0,10–0,33 л']],
    mach_k: 'Техника', mach_h: 'Мұның бәрі жол мердігерінде бар',
    mach: [['Ресайклерлер', 'Wirtgen WR 2000/2400, ДС-152, ДС-72'], ['Тұтқыр зат таратқыштар', 'ДС-72, Wirtgen SW 16 TC'], ['Араластыру қондырғылары', 'ДС-50, КМА 220'], ['Тегістеу', 'Бақылау жүйесі бар автогрейдер, төсегіш'], ['Тығыздау', 'Пневмо-, вибро-, жұдырықшалы катоктар'], ['Ылғалдау', 'Тарақты су себу машинасы']],
    dose_k: 'Шығын нормалары', dose_h: 'Қабат қалыңдығы 1 см болғанда 1 м²-ге',
    dose: [['Қиыршық тас-құм қоспасы', '1,33 кг', '0,010 л'], ['Құмайт / саздақ', '1,47 кг', '0,011 л']],
    dose_cols: ['Топырақ', 'SCREPTON', 'SCREPTON-M'],
    struct_k: 'Жол төсемі конструкциялары', struct_h: 'Ұсынымдардағы үш үлгілік конструкция',
    structs: [
      ['I–II санатты жол', [['Асфальтбетон', 12, '#3a3a37'], ['SCREPTON бекітілген топырақ', 20, '#1B5E3B'], ['Төсеме қабат', 30, '#9a968c']]],
      ['III–IV санатты жол', [['Асфальтбетон', 5, '#3a3a37'], ['SCREPTON бекітілген топырақ', 15, '#1B5E3B'], ['Төсеме қабат', 30, '#9a968c']]],
      ['Асфальтсыз кәсіпшілік жол', [['SCREPTON бекітілген топырақ', 20, '#1B5E3B'], ['Жергілікті топырақ', 30, '#9a968c']]]
    ],
    cm: 'см'
  },
  en: {
    h1: 'Two products, standard machinery, eight steps',
    lead: 'The powder binds, the emulsion reinforces. The mix is made in place by a recycler or in a plant; no special machines required.',
    prod_k: 'Products',
    p1: ['SCREPTON', 'Inorganic binder', ['Co-ground Portland cement and slag with activators', 'Grey fine powder, non-flammable, water- and frost-resistant', 'Dosage 4–7% of soil mass', 'Non-toxic — hygienic assessment passed']],
    p2: ['SCREPTON-M', 'Polymer emulsion', ['Acrylic, vinyl acetate, styrene in water', 'Added with water during mixing', 'Improves water resistance and elasticity of the layer', 'Dosage 0.10–0.33 l per m²']],
    mach_k: 'Machinery', mach_h: 'Every road contractor already has this',
    mach: [['Recyclers', 'Wirtgen WR 2000/2400, DS-152, DS-72'], ['Binder spreaders', 'DS-72, Wirtgen SW 16 TC'], ['Mixing plants', 'DS-50, KMA 220'], ['Grading', 'Grader with automatic levelling, paver'], ['Compaction', 'Pneumatic, vibratory and padfoot rollers'], ['Wetting', 'Water truck with spray bar']],
    dose_k: 'Dosage', dose_h: 'Per 1 m² at 1 cm layer thickness',
    dose: [['Crushed stone-sand mix', '1.33 kg', '0.010 l'], ['Sandy loam / loam', '1.47 kg', '0.011 l']],
    dose_cols: ['Soil', 'SCREPTON', 'SCREPTON-M'],
    struct_k: 'Pavement structures', struct_h: 'Three standard structures from the guidelines',
    structs: [
      ['Category I–II road', [['Asphalt concrete', 12, '#3a3a37'], ['SCREPTON stabilized soil', 20, '#1B5E3B'], ['Sub-base', 30, '#9a968c']]],
      ['Category III–IV road', [['Asphalt concrete', 5, '#3a3a37'], ['SCREPTON stabilized soil', 15, '#1B5E3B'], ['Sub-base', 30, '#9a968c']]],
      ['Haul road without asphalt', [['SCREPTON stabilized soil', 20, '#1B5E3B'], ['Local soil', 30, '#9a968c']]]
    ],
    cm: 'cm'
  }
};

const docs = {
  ru: {
    h1: 'Документы', lead: 'Рекомендации, сертификаты, протоколы и отзывы — по категориям. PDF на языке оригинала.',
    cats: ['Все', 'Нормативные', 'Сертификаты', 'Протоколы', 'Отзывы и заключения'],
    items: [
      ['img/rek.jpg', 1, 'Р РК 218-133-2016. Рекомендации по применению материалов, обработанных SCREPTON', 'Комитет автодорог МИР РК, КаздорНИИ', '2016', 'RU'],
      ['img/rek.jpg', 1, 'Р РК 218-133-2016, казахская версия', 'ҚР ИДМ Автожол комитеті, ҚазжолҒЗИ', '2016', 'KZ'],
      ['img/cert.jpg', 2, 'Сертификат соответствия СТ РК на SCREPTON', 'Орган по сертификации', '2017', 'RU/KZ'],
      ['img/cert.jpg', 2, 'Сертификат соответствия СТ РК на SCREPTON-M', 'Орган по сертификации', '2017', 'RU/KZ'],
      ['img/doc2017.jpg', 2, 'Санитарно-эпидемиологическое заключение', 'Гигиеническая экспертиза', '2017', 'RU'],
      ['img/protocol.jpg', 3, 'Протокол испытаний № 359-16', 'Лаборатория КаздорНИИ', '2016', 'RU'],
      ['img/protocol.jpg', 3, 'Протокол испытаний № 240-17', 'Лаборатория КаздорНИИ', '2017', 'RU'],
      ['img/protocol.jpg', 3, 'Протокол испытаний образцов, Сатимола', 'Лаборатория заказчика', '2013', 'RU'],
      ['img/zak.jpg', 4, 'Заключение НИИ по результатам испытаний', 'КаздорНИИ', '2014', 'RU'],
      ['img/otzyv.jpg', 4, 'Отзыв генподрядчика «Аларыктасстрой»', 'Актобе — Атырау', '2016', 'RU'],
      ['img/otzyv.jpg', 4, 'Отзыв проектной организации', 'Проектный институт', '2016', 'RU']
    ],
    pack_h: 'Пакет проектировщика одним архивом', pack_p: 'Рекомендации, сертификаты, протоколы, заключения, техкарта и нормы расхода — по запросу на почту.', pack_cta: 'Запросить пакет',
    lang_l: 'Язык файла', year_l: 'Год'
  },
  kz: {
    h1: 'Құжаттар', lead: 'Ұсынымдар, сертификаттар, хаттамалар мен пікірлер — санаттар бойынша. PDF түпнұсқа тілінде.',
    cats: ['Барлығы', 'Нормативтік', 'Сертификаттар', 'Хаттамалар', 'Пікірлер мен қорытындылар'],
    items: [
      ['img/rek.jpg', 1, 'Р РК 218-133-2016. SCREPTON-мен өңделген материалдарды қолдану ұсынымдары', 'ҚР ИДМ Автожол комитеті, ҚазжолҒЗИ', '2016', 'RU'],
      ['img/rek.jpg', 1, 'Р РК 218-133-2016, қазақша нұсқасы', 'ҚР ИДМ Автожол комитеті, ҚазжолҒЗИ', '2016', 'KZ'],
      ['img/cert.jpg', 2, 'SCREPTON үшін СТ РК сәйкестік сертификаты', 'Сертификаттау органы', '2017', 'RU/KZ'],
      ['img/cert.jpg', 2, 'SCREPTON-M үшін СТ РК сәйкестік сертификаты', 'Сертификаттау органы', '2017', 'RU/KZ'],
      ['img/doc2017.jpg', 2, 'Санитарлық-эпидемиологиялық қорытынды', 'Гигиеналық сараптама', '2017', 'RU'],
      ['img/protocol.jpg', 3, '№ 359-16 сынақ хаттамасы', 'ҚазжолҒЗИ зертханасы', '2016', 'RU'],
      ['img/protocol.jpg', 3, '№ 240-17 сынақ хаттамасы', 'ҚазжолҒЗИ зертханасы', '2017', 'RU'],
      ['img/protocol.jpg', 3, 'Үлгілерді сынау хаттамасы, Сатимола', 'Тапсырыс беруші зертханасы', '2013', 'RU'],
      ['img/zak.jpg', 4, 'Сынақ нәтижелері бойынша ҒЗИ қорытындысы', 'ҚазжолҒЗИ', '2014', 'RU'],
      ['img/otzyv.jpg', 4, '«Аларыктасстрой» бас мердігерінің пікірі', 'Ақтөбе — Атырау', '2016', 'RU'],
      ['img/otzyv.jpg', 4, 'Жобалау ұйымының пікірі', 'Жобалау институты', '2016', 'RU']
    ],
    pack_h: 'Жобалаушы пакеті бір архивпен', pack_p: 'Ұсынымдар, сертификаттар, хаттамалар, қорытындылар, техкарта және шығын нормалары — поштаға сұрау бойынша.', pack_cta: 'Пакетті сұрату',
    lang_l: 'Файл тілі', year_l: 'Жыл'
  },
  en: {
    h1: 'Documents', lead: 'Guidelines, certificates, test reports and references by category. PDFs are in their original language.',
    cats: ['All', 'Regulatory', 'Certificates', 'Test reports', 'References and conclusions'],
    items: [
      ['img/rek.jpg', 1, 'R RK 218-133-2016. Guidelines for materials treated with SCREPTON', 'Roads Committee, KazdorNII', '2016', 'RU'],
      ['img/rek.jpg', 1, 'R RK 218-133-2016, Kazakh edition', 'Roads Committee, KazdorNII', '2016', 'KZ'],
      ['img/cert.jpg', 2, 'ST RK certificate of conformity for SCREPTON', 'Certification body', '2017', 'RU/KZ'],
      ['img/cert.jpg', 2, 'ST RK certificate of conformity for SCREPTON-M', 'Certification body', '2017', 'RU/KZ'],
      ['img/doc2017.jpg', 2, 'Sanitary-epidemiological conclusion', 'Hygienic assessment', '2017', 'RU'],
      ['img/protocol.jpg', 3, 'Test report No. 359-16', 'KazdorNII laboratory', '2016', 'RU'],
      ['img/protocol.jpg', 3, 'Test report No. 240-17', 'KazdorNII laboratory', '2017', 'RU'],
      ['img/protocol.jpg', 3, 'Sample test report, Satimola', 'Client laboratory', '2013', 'RU'],
      ['img/zak.jpg', 4, 'Research institute conclusion on test results', 'KazdorNII', '2014', 'RU'],
      ['img/otzyv.jpg', 4, 'Reference from general contractor Alaryktasstroy', 'Aktobe — Atyrau', '2016', 'RU'],
      ['img/otzyv.jpg', 4, 'Reference from a design organization', 'Design institute', '2016', 'RU']
    ],
    pack_h: 'The designer\u2019s package in one archive', pack_p: 'Guidelines, certificates, test reports, conclusions, technical sheet and dosage tables, sent by email on request.', pack_cta: 'Request the package',
    lang_l: 'File language', year_l: 'Year'
  }
};

const contacts = {
  ru: { h1: 'Контакты', lead: 'Офис в Астане, производство в Темиртау. Быстрее всего — WhatsApp.', office: 'Офис', plant: 'Производство', req_k: 'Реквизиты', req: [['Юрлицо', 'ТОО «Green Roads»'], ['БИН', '201240012669'], ['Бренд', 'SCREPTON® — зарегистрированный товарный знак'], ['Режим', 'Пн–Пт 09:00–18:00']], phone_l: 'Телефоны', mail_l: 'Почта', map_l: 'Карта: Астана · Темиртау' },
  kz: { h1: 'Байланыс', lead: 'Кеңсе Астанада, өндіріс Теміртауда. Ең жылдамы — WhatsApp.', office: 'Кеңсе', plant: 'Өндіріс', req_k: 'Деректемелер', req: [['Заңды тұлға', '«Green Roads» ЖШС'], ['БСН', '201240012669'], ['Бренд', 'SCREPTON® — тіркелген тауар белгісі'], ['Жұмыс уақыты', 'Дс–Жм 09:00–18:00']], phone_l: 'Телефондар', mail_l: 'Пошта', map_l: 'Карта: Астана · Теміртау' },
  en: { h1: 'Contacts', lead: 'Office in Astana, production in Temirtau. WhatsApp is fastest.', office: 'Office', plant: 'Production', req_k: 'Company details', req: [['Legal entity', 'Green Roads LLP'], ['BIN', '201240012669'], ['Brand', 'SCREPTON® — registered trademark'], ['Hours', 'Mon–Fri 09:00–18:00']], phone_l: 'Phones', mail_l: 'Email', map_l: 'Map: Astana · Temirtau' }
};

export function dict(page, lang) {
  const l = common[lang] ? lang : 'ru';
  return Object.assign({}, common[l], ({ home, project, tech, docs, contacts }[page] || {})[l] || {});
}
