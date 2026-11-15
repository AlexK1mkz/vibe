// Готовит фото клиники для сайта. Запуск: node scripts/make-photos.mjs
//  - name-480/800/1600.webp — исходное соотношение сторон (слайдер на десктопе, галерея);
//  - name-wide-480/800.webp — кадр 4:3 по центру для слайдера на телефоне: меньше пикселей, без лишнего.
import sharp from 'sharp';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// исходники лежат вне public/, чтобы тяжёлые JPG не попадали на хостинг
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const srcDir = path.join(root, 'src-photos');
const dir = path.join(root, 'public/img');
const kb = (n) => Math.round(n / 1024) + ' KB';
for (const file of readdirSync(srcDir).filter((f) => f.endsWith('.jpg'))) {
  const name = file.replace('.jpg', '');
  const src = path.join(srcDir, file);
  const meta = await sharp(src).metadata();
  for (const w of [480, 800, 1600]) {
    const info = await sharp(src).resize({ width: Math.min(w, meta.width) }).webp({ quality: w === 1600 ? 78 : 70 }).toFile(path.join(dir, `${name}-${w}.webp`));
    console.log(`${name}-${w}`, info.width + 'x' + info.height, kb(info.size));
  }
  for (const w of [480, 800]) {
    const info = await sharp(src).resize({ width: w, height: Math.round((w * 3) / 4), fit: 'cover', position: 'centre' }).webp({ quality: 66 }).toFile(path.join(dir, `${name}-wide-${w}.webp`));
    console.log(`${name}-wide-${w}`, info.width + 'x' + info.height, kb(info.size));
  }
}
