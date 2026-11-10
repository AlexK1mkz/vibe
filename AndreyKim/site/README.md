# Сайт «Андрей Ким — аналитик МКП»

Одностраничник + `/spasibo` + `/politika` + серверная функция `/api/lead`.
Astro (статика) · Tailwind CSS 4 · шрифт Golos Text · иконки Lucide · деплой на Vercel.

## Запуск

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # сборка под Vercel
npm run og       # пересобрать public/og.jpg
```

Локально без ключей форма работает: заявка печатается в консоль dev-сервера.

## Где что менять

| Что | Где |
|---|---|
| Тексты, контакты, цены, FAQ | `src/data/site.ts` |
| Видео (ID роликов YouTube), ссылки «Пока ждёте» | `src/data/site.ts` → `media` |
| Цвета, шрифт, кнопки | `src/styles/global.css` |
| Блоки главной | `src/pages/index.astro` |
| Цепочка «событие → результат» | `src/components/Chain.astro` |
| Форма и маска телефона | `src/components/LeadForm.astro` |
| Доставка заявок | `src/pages/api/lead.ts` |
| Фото | `src/assets/` |

Пустые данные = блок скрыт. Пока в `media` нет ID видео, кнопок видео и блока видео-отзывов на сайте нет.

## Заявки

Скопируйте `.env.example` в `.env` (локально) или внесите переменные в Vercel → Settings → Environment Variables.

- **Telegram.** Создайте бота у @BotFather → `TELEGRAM_BOT_TOKEN`. Андрей пишет боту `/start`; его `chat_id` → `TELEGRAM_CHAT_ID`.
- **Email.** Ключ Resend → `RESEND_API_KEY`, адрес отправителя с подтверждённого домена → `LEAD_EMAIL_FROM`.
- **Google Sheets.** В таблице: Расширения → Apps Script, вставьте код ниже, разверните как веб-приложение (доступ: все), URL → `GOOGLE_SHEETS_WEBHOOK_URL`.

```js
function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  SpreadsheetApp.getActiveSheet().appendRow([
    d.date, d.name, d.phone, d.channel, d.message,
    d.utm_source, d.utm_medium, d.utm_campaign, d.utm_content, d.referrer, d.page_url,
  ]);
  return ContentService.createTextOutput('ok');
}
```

Заявка считается принятой, если сработал хотя бы один канал. Защита: скрытое поле-ловушка и лимит 5 заявок за 10 минут с одного IP.

## Аналитика

`PUBLIC_YM_ID` и `PUBLIC_META_PIXEL_ID` — пока пусто, счётчики не грузятся.
События: `cta_click` (с id блока), `form_start`, `form_submit`, `whatsapp_click`, `lead` (на `/spasibo`; в Pixel уходит стандартное `Lead`).
В Метрике создайте JavaScript-цели с этими идентификаторами.

## Перед релизом

1. `SITE_URL` — домен сайта.
2. Ключи заявок и тест с реальным номером.
3. Заменить фото в `src/assets/` на съёмку (сейчас портрет вырезан из постера старого сайта), затем `npm run og`.
4. Согласовать с Андреем текст `/politika` и строки о стаже в `credentials`.
5. Согласие Веры, Марата и Айгуль на публикацию отзывов.
