// Обложка для предпросмотра ссылки (Facebook, Instagram, WhatsApp, Telegram, VK, Яндекс, Google).
// Соцсети понимают только растровые картинки, поэтому HTML со шрифтами сайта снимается в JPG 1200×630.
// Запуск: node scripts/make-og.mjs  (нужен Chromium от Playwright: npx playwright install chromium)
import { chromium } from '@playwright/test';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// всё встраивается в HTML как data: — страница из setContent не может читать локальные файлы
const file = (p) => {
  const ext = path.extname(p).slice(1);
  const type = ext === 'woff2' ? 'font/woff2' : ext === 'jpg' ? 'image/jpeg' : 'image/' + ext;
  return `data:${type};base64,${readFileSync(path.join(root, p)).toString('base64')}`;
};
const out = path.join(root, 'public/og/zhanaru-cover.jpg');

const logo = readFileSync(path.join(root, 'src/components/ui/Logo.astro'), 'utf8')
  .match(/<svg[\s\S]*?<\/svg>/)[0]
  .replace(/\{light \? '#fff' : 'var\(--brand\)'\}/, '"#fff"')
  .replace(/\{light \? 'var\(--brand\)' : '#fff'\}/, '"#1F6F5C"')
  .replace('width="40" height="40"', 'width="64" height="64"')
  .replace(/ class="[^"]*"/, '');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Manrope; src: url(${file('node_modules/@fontsource-variable/manrope/files/manrope-cyrillic-wght-normal.woff2')}) format('woff2'); font-weight: 200 800; unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: Manrope; src: url(${file('node_modules/@fontsource-variable/manrope/files/manrope-cyrillic-ext-wght-normal.woff2')}) format('woff2'); font-weight: 200 800; unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F; }
@font-face { font-family: Manrope; src: url(${file('node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2')}) format('woff2'); font-weight: 200 800; }
@font-face { font-family: Inter; src: url(${file('node_modules/@fontsource-variable/inter/files/inter-cyrillic-wght-normal.woff2')}) format('woff2'); font-weight: 100 900; unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: Inter; src: url(${file('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')}) format('woff2'); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; font-family: Inter, sans-serif; color: #fff;
  background:
    radial-gradient(520px 380px at 70% 0%, rgb(37 194 180 / .45), transparent 65%),
    radial-gradient(460px 360px at 0% 100%, rgb(224 162 59 / .32), transparent 62%),
    linear-gradient(140deg, #06221F 0%, #0D3B36 55%, #14594E 100%);
  display: grid; grid-template-columns: 1fr 430px; gap: 40px; padding: 48px 48px 48px 64px; }
.text { display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 16px; }
.brand b { font-family: Manrope; font-size: 34px; font-weight: 800; letter-spacing: .01em; display: block; line-height: 1; }
.brand small { display: block; margin-top: 6px; font-size: 17px; color: rgb(255 255 255 / .72); letter-spacing: .04em; }
h1 { font-family: Manrope; font-weight: 800; font-size: 52px; line-height: 1.08; letter-spacing: -.02em; margin-top: 44px; }
h1 .accent { background: linear-gradient(100deg, #F7C566, #8FF0DE); -webkit-background-clip: text; color: transparent; display: block; }
p.lead { margin-top: 20px; font-size: 25px; line-height: 1.35; color: rgb(255 255 255 / .84); max-width: 600px; }
.row { margin-top: auto; display: flex; align-items: center; gap: 14px; }
.cta { font-family: Manrope; font-weight: 700; font-size: 24px; color: #1B1405; padding: 16px 30px; border-radius: 999px;
  background: linear-gradient(135deg, #F7C566, #F2A93B); box-shadow: 0 10px 28px rgb(242 169 59 / .35); }
.chip { font-size: 19px; padding: 12px 18px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .2); background: rgb(255 255 255 / .1); }
.photo { position: relative; border-radius: 34px; overflow: hidden; box-shadow: 0 30px 60px rgb(0 0 0 / .35); }
.photo img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 42%; }
.photo span { position: absolute; left: 16px; bottom: 16px; font-size: 17px; padding: 9px 15px; border-radius: 999px;
  background: rgb(6 34 31 / .7); border: 1px solid rgb(255 255 255 / .18); }
</style></head><body>
<div class="text">
  <div class="brand">${logo}<div><b>ZhanaRu</b><small>центр осознанного здоровья · Астана</small></div></div>
  <h1><span class="accent">Нет сил уже к обеду?</span>За один визит найдём причину и вернём энергию</h1>
  <p class="lead">Анализы, врач и план восполнения дефицитов — в одном месте, без очередей.</p>
  <div class="row"><span class="cta">Тест за 2 минуты →</span><span class="chip">★ 4,8 в 2ГИС</span></div>
</div>
<div class="photo"><img src="${file('src-photos/moss-wall.jpg')}"><span>ЖК Manhattan, ул. Анет баба, 13</span></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: 'png' });
await browser.close();
// JPEG до 300 КБ: WhatsApp и Telegram не показывают слишком тяжёлые обложки
await sharp(png).jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(out);
console.log(path.relative(root, out), Math.round(statSync(out).size / 1024) + ' KB');
