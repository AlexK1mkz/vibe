// Архив для выкладки на хостинг (Hoster.kz и любой Apache/LiteSpeed с PHP).
// Запуск: npm run pack  →  deploy/zhanaru-site-ГГГГ-ММ-ДД.zip
// Внутри — содержимое dist/ (вместе с .htaccess). Секреты (config.php) в архив не попадают.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');
const outDir = path.join(root, 'deploy');
const date = new Date().toISOString().slice(0, 10);
const out = path.join(outDir, `zhanaru-site-${date}.zip`);

if (!existsSync(path.join(dist, 'index.html'))) {
  console.error('Нет dist/ — сначала npm run build');
  process.exit(1);
}
for (const secret of ['api/private/config.php', 'api/private/rate']) {
  if (existsSync(path.join(dist, secret))) rmSync(path.join(dist, secret), { recursive: true, force: true });
}
mkdirSync(outDir, { recursive: true });
rmSync(out, { force: true });

if (process.platform === 'win32') {
  // tar.exe из Windows 10+ (bsdtar) умеет zip; берём именно его, а не GNU tar из Git Bash
  const tar = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe');
  execFileSync(tar, ['-a', '-c', '-f', out, '.'], { cwd: dist, stdio: 'inherit' });
} else if (process.platform === 'darwin') {
  execFileSync('tar', ['-a', '-c', '-f', out, '.'], { cwd: dist, stdio: 'inherit' });
} else {
  execFileSync('zip', ['-r', '-q', out, '.'], { cwd: dist, stdio: 'inherit' });
}
console.log(`${path.relative(root, out)} — ${Math.round(statSync(out).size / 1024)} KB`);
console.log('Дальше — DEPLOY-HOSTER.md');
