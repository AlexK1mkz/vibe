// Проверка текстов обоих сайтов по разделу 3 ТЗ v2 (запреты).
// Запуск: npm run check:texts. Тот же список проверяется в npm test (tests/banned.test.ts).
// Проверяйте этим скриптом и тексты, которые присылает заказчик: положите их в content/ и запустите.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Где лежат тексты, которые видит посетитель */
const SCAN = ["content", "dictionaries", "app", "components", "lib/og.tsx", "config/funnel.ts"];
const SKIP = [/^app[\\/]admin/, /^app[\\/]api/, /^content[\\/]funnel/];

/**
 * Запреты. Каждый пункт: номер правила раздела 3, пояснение и шаблон.
 * Шаблоны написаны по основам слов, чтобы ловить все формы.
 */
export const RULES = [
  { rule: "1. Здоровье", re: /здоров|болезн|болеть|исцел|излеч|вылеч|лечени|лечит|лечим|фоби|паническ|депресс|аллерг|зависимост|похуд|лишн\S* вес/giu },
  { rule: "1. Терапия, гипноз, транс", re: /психотерап|терапи|гипноз|(?<![а-яё])транс(?:а|е|у|ом|ы|ов)?(?![а-яё])/giu },
  { rule: "2. Управление другими", re: /скрыт\S* управлен|управлять (?:людьми|другими|собеседником)|управлени\S* (?:людьми|другими)|подчин|манипул|внуш|вас будут бояться|заставить|заставите/giu },
  { rule: "3. Гарантии дохода и результата", re: /гарант|доход (?:до|от) \d|заработаете|удвоите|утроите|вырастет доход|результат обеспечен/giu },
  { rule: "4. Исключительные права и представительство", re: /официальн\S* представител|представительств|эксклюзивн|исключительн\S* прав|единственн\S* (?:в|школа|институт)/giu },
  { rule: "5. Счётчики и таймеры", re: /осталось \d+ мест|до конца акции|только сегодня|успейте/giu },
  { rule: "7. Тест называется самооценкой, а не диагностикой", re: /диагност|диагноз/giu },
  { rule: "Раздел 1 ТЗ. Слово «архетип» убрано из интерфейса", re: /архетип|archetype/giu },
];

/**
 * Разрешённые формулировки. Это не общее послабление, а точные фразы:
 * отрицание («не диагностика», «со здоровьем мы не работаем») и защитная рамка
 * («распознавать манипуляцию»), которые ТЗ прямо предписывает (разделы 3, 5, 5.2).
 */
export const ALLOWED = [
  /это психологический диагноз\?/giu,
  /не ставит диагнозов/giu,
  /(?:а не|не является|не является психологической|не психологическая|, не|не) (?:психологическ\S+ )?диагностик\S*/giu,
  /самооценк\S*,? а не диагностик\S*/giu,
  /нлп является манипуляцией\?/giu,
  /распознавать манипуляцию/giu,
  /это про здоровье\?/giu,
  /со здоровьем мы не работаем/giu,
  /с вопросами о здоровье обращайтесь к врачу или клиническому психологу/giu,
  // Технические имена, а не текст для посетителя
  /lgs-archetype|lgs_archetype/giu,
];

function walk(target) {
  const full = path.join(ROOT, target);
  let stat;
  try {
    stat = statSync(full);
  } catch {
    return [];
  }
  if (stat.isFile()) return [target];
  return readdirSync(full).flatMap((name) => walk(path.join(target, name)));
}

/** Оставляет от исходника только то, что может попасть на экран: строки и текст JSX */
function visibleText(file, source) {
  if (file.endsWith(".json")) return source;
  // Комментарии разработчика посетитель не видит
  return source.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/(^|[^:])\/\/.*$/gm, (m, p) => p + " ".repeat(m.length - p.length));
}

export function scan() {
  const findings = [];
  const files = SCAN.flatMap(walk).filter((f) => /\.(json|ts|tsx)$/.test(f) && !SKIP.some((re) => re.test(f)));
  for (const file of files) {
    let text = visibleText(file, readFileSync(path.join(ROOT, file), "utf8"));
    // Поля todo и note в JSON: пометки для команды, на сайт не выводятся
    if (file.endsWith(".json")) text = text.replace(/"(?:todo|note|\w+Todo)"\s*:\s*"(?:[^"\\]|\\.)*"/g, (m) => m.replace(/[^\n]/g, " "));
    for (const allowed of ALLOWED) text = text.replace(allowed, (m) => " ".repeat(m.length));
    const lines = text.split("\n");
    for (const { rule, re } of RULES) {
      lines.forEach((line, i) => {
        for (const match of line.matchAll(re)) {
          findings.push({ file: file.replace(/\\/g, "/"), line: i + 1, rule, word: match[0], context: line.trim().slice(0, 140) });
        }
      });
    }
  }
  return findings;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const findings = scan();
  if (findings.length === 0) {
    console.log("Запрещённых слов не найдено.");
  } else {
    for (const f of findings) console.log(`${f.file}:${f.line}  [${f.rule}]  «${f.word}»\n    ${f.context}`);
    console.log(`\nНайдено: ${findings.length}. Исправьте текст или, если формулировка прямо разрешена ТЗ, добавьте точную фразу в ALLOWED.`);
    process.exit(1);
  }
}
