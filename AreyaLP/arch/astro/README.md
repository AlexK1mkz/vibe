# Архитекторы будущего — лендинг Екатерины Ареи (Astro)

Пересборка экспорта из Claude Design на Astro: статический сайт без React-рантайма,
компоненты по секциям, данные вынесены в `src/data`, интерактив — ванильный TypeScript.

## Запуск

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # статика в dist/
npm run preview
```

## Структура

```
src/
  data/           # всё, что редактируется чаще всего
    site.ts       # ссылки (оплата, Telegram, Instagram, YouTube, оферта), даты сезона
    reviews.ts    # отзывы (аватар = photos/avatars/avatar_NN.jpg по порядку)
    faq.ts        # вопросы-ответы
    season.ts     # шесть вопросов сезона + фото для ленты
    masterForm.ts # шаги анкеты на Master
  components/     # Header, Hero, Marquee, Recognition, Manifesto, Season,
                  # Results, Tariffs, About, Faq, FinalCta, Footer, MasterForm
  layouts/Base.astro   # <head>, шрифты, глобальные стили, reveal-скрипт
  styles/global.css    # дизайн-токены (цвета, шрифты) и общие классы
  pages/index.astro    # сборка страницы
public/photos/         # фото (hero, manifesto, about, event_*, avatars/)
```

## Что подключить перед запуском

1. `src/data/site.ts` → реальные ссылки на оплату Community, Telegram службы заботы, соцсети, оферту и политику.
2. `astro.config.mjs` → `site: 'https://ваш-домен'` (используется для og:image).
3. Отправка анкеты Master: функция `submit()` в `src/components/MasterForm.astro` — сейчас показывает экран «Спасибо» и пишет ответы в консоль. Подключите fetch на ваш API / Telegram-бот / CRM.
4. Фото в `public/photos` большие (2–3.5 МБ). Для продакшена стоит сжать или перевести на `astro:assets` (`<Image />`).

## Деплой

Статический вывод (`dist/`) — подходит Vercel, Netlify, Cloudflare Pages, любой хостинг.
