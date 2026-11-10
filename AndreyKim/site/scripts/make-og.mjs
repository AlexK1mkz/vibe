// Собирает public/og.jpg (1200×630): портрет + заголовок. Запуск: npm run og
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const font = readFileSync(
  new URL('../node_modules/@fontsource-variable/golos-text/files/golos-text-cyrillic-wght-normal.woff2', import.meta.url),
).toString('base64');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <style>
    @font-face { font-family: 'Golos'; src: url(data:font/woff2;base64,${font}); font-weight: 400 900; }
    text { font-family: 'Golos', 'Segoe UI', Arial, sans-serif; }
  </style>
  <rect width="1200" height="630" fill="#f5f1ea"/>
  <circle cx="930" cy="315" r="285" fill="none" stroke="#bf4a24" stroke-opacity=".45" stroke-width="2" stroke-dasharray="4 12" stroke-linecap="round"/>
  <text x="72" y="112" font-size="26" fill="#556070"><tspan font-weight="600" fill="#16202e">Андрей Ким</tspan> · Коуч, аналитик МКП (IMCP)</text>
  <text font-size="68" font-weight="600" fill="#16202e" letter-spacing="-1.5">
    <tspan x="72" y="270">Почему вы снова</tspan>
    <tspan x="72" y="350">оказываетесь</tspan>
    <tspan x="72" y="430">в той же точке?</tspan>
  </text>
  <rect x="72" y="448" width="498" height="6" rx="3" fill="#bf4a24"/>
  <text x="72" y="545" font-size="28" fill="#556070">Глубинный анализ личности по 5 методикам</text>
</svg>`;

const photo = await sharp('src/assets/andrey-portrait.jpg')
  .resize(400, 500, { fit: 'cover', position: 'top' })
  .composite([
    {
      input: Buffer.from('<svg width="400" height="500"><rect width="400" height="500" rx="40" fill="#fff"/></svg>'),
      blend: 'dest-in',
    },
  ])
  .png()
  .toBuffer();

await sharp(Buffer.from(svg))
  .composite([{ input: photo, left: 730, top: 65 }])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile('public/og.jpg');

console.log('public/og.jpg готов');
