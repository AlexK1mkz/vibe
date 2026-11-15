// Вырезает женскую и мужскую фигуры из scripts/src/body-source.jpg на прозрачный фон.
// Запуск: node scripts/make-figures.mjs  →  public/img/body-f.webp, body-m.webp
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, 'scripts/src/body-source.jpg');
const OUT_H = 1400;

const meta = await sharp(src).metadata();
const W = meta.width, H = meta.height;
const k = W / 1744; // координаты ниже заданы для исходника 1744×2000

// Мужская фигура: смягчаем область паха (на сайте — без анатомических деталей)
const patch = { left: Math.round(1195 * k), top: Math.round(1060 * k), width: Math.round(110 * k), height: Math.round(130 * k) };
const blurred = await sharp(src).extract(patch).blur(16 * k).toBuffer();
const feather = Buffer.from(
  `<svg width="${patch.width}" height="${patch.height}"><defs><radialGradient id="g"><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill="url(#g)"/></svg>`,
);
const patchImg = await sharp(blurred).composite([{ input: feather, blend: 'dest-in' }]).png().toBuffer();
const base = await sharp(src).composite([{ input: patchImg, left: patch.left, top: patch.top }]).removeAlpha().raw().toBuffer();

const figures = [
  { name: 'body-f', x0: 190, x1: 820 },
  { name: 'body-m', x0: 900, x1: 1585 },
];
const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

for (const f of figures) {
  const x0 = Math.round(f.x0 * k), x1 = Math.round(f.x1 * k), w = x1 - x0;
  const alpha = new Float32Array(w * H);
  const sats = new Uint8Array(w * H);
  const rgb = new Uint8Array(w * H * 3);
  // фон: медиана по краям полосы
  const bg = [0, 1, 2].map((c) => base[((Math.round(H / 2)) * W + Math.round(870 * k)) * 3 + c]);
  const bgL = (bg[0] + bg[1] + bg[2]) / 3;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * W + x + x0) * 3, o = y * w + x;
      const r = base[i], g = base[i + 1], b = base[i + 2];
      rgb[o * 3] = r; rgb[o * 3 + 1] = g; rgb[o * 3 + 2] = b;
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      sats[o] = sat;
      const dark = bgL - (r + g + b) / 3;
      // тёмные, но бесцветные пиксели — это тень на полу, а не тело
      alpha[o] = Math.max(smooth(30, 78, sat), smooth(28, 80, dark) * smooth(16, 34, sat));
      if (y > H * 0.925 && sat < 46) alpha[o] = 0; // бледная тень и отражение на полу у стоп
    }
  // заливаем «дыры» внутри тела: всё, до чего не дотянулся фон снаружи, непрозрачно
  const outside = new Uint8Array(w * H);
  const stack = [];
  const push = (x, y) => { const o = y * w + x; if (!outside[o] && alpha[o] < 0.2) { outside[o] = 1; stack.push(o); } };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const o = stack.pop(), x = o % w, y = (o - x) / w;
    if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1); if (y < H - 1) push(x, y + 1);
  }
  // просвет между ногами замкнут стопами: крупные светлые области в нижней половине — тоже фон
  const seen = new Uint8Array(w * H);
  for (let start = Math.round(H * 0.5) * w; start < w * H; start++) {
    if (seen[start] || outside[start] || alpha[start] >= 0.2) continue;
    const comp = [start]; seen[start] = 1;
    for (let n = 0; n < comp.length; n++) {
      const o = comp[n], x = o % w, y = (o - x) / w;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= H) continue;
        const q = ny * w + nx;
        if (!seen[q] && !outside[q] && alpha[q] < 0.2) { seen[q] = 1; comp.push(q); }
      }
    }
    if (comp.length > 3000 * k * k) for (const o of comp) outside[o] = 1;
  }
  const out = Buffer.alloc(w * H * 4);
  let top = H, bottom = 0, left = w, right = 0;
  for (let o = 0; o < w * H; o++) {
    let a = alpha[o];
    if (!outside[o]) a = Math.max(a, 1);
    else a = a < 0.22 ? 0 : (a - 0.22) / 0.78; // слабые остатки тени под стопами убираем совсем
    let r = rgb[o * 3], g = rgb[o * 3 + 1], b = rgb[o * 3 + 2];
    if (a > 0.02 && a < 1) { // убираем примесь светлого фона на полупрозрачных краях
      r = Math.min(255, Math.max(0, (r - (1 - a) * bg[0]) / a));
      g = Math.min(255, Math.max(0, (g - (1 - a) * bg[1]) / a));
      b = Math.min(255, Math.max(0, (b - (1 - a) * bg[2]) / a));
    }
    out[o * 4] = r; out[o * 4 + 1] = g; out[o * 4 + 2] = b; out[o * 4 + 3] = Math.round(a * 255);
    if (a > 0.5) { const x = o % w, y = (o - x) / w; if (y < top) top = y; if (y > bottom) bottom = y; if (x < left) left = x; if (x > right) right = x; }
  }
  const pad = Math.round(14 * k);
  const box = { left: Math.max(0, left - pad), top: Math.max(0, top - pad) };
  box.width = Math.min(w, right + pad) - box.left; box.height = Math.min(H, bottom + pad) - box.top;
  const file = path.join(root, 'public/img', f.name + '.webp');
  const info = await sharp(out, { raw: { width: w, height: H, channels: 4 } })
    .extract(box).resize({ height: OUT_H }).webp({ quality: 80, alphaQuality: 90 }).toFile(file);
  console.log(f.name, info.width + 'x' + info.height, Math.round(info.size / 1024) + ' KB', 'bg', bg.join(','));
}
