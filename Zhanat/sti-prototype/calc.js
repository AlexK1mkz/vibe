// Классический скрипт (без ES-модулей), чтобы работать и по file://, и на статическом хостинге.
(function () {
// Расчётное ядро диагностики (methodology.md v2, разделы 1–3). Тексты — в report-texts.json.
const reduce = n => { while (n > 9) n = String(n).split('').reduce((a, d) => a + +d, 0); return n; };

const LETTERS = { A:1,I:1,J:1,Q:1,Y:1,B:2,K:2,R:2,C:3,L:3,S:3,G:3,D:4,M:4,T:4,E:5,H:5,N:5,X:5,U:6,V:6,W:6,O:7,Z:7,F:8,P:8 };
const cleanName = s => (s || '').toUpperCase().replace(/[^A-Z]/g, '');
const nameSum = latin => cleanName(latin).split('').reduce((a, c) => a + (LETTERS[c] || 0), 0);

function mask(v) { let d = (v || '').replace(/\D/g, '').slice(0, 8); if (d.length === 7 && d[0] > '3') d = '0' + d; let out = d.slice(0, 2); if (d.length > 2) out += '.' + d.slice(2, 4); if (d.length > 4) out += '.' + d.slice(4, 8); return out; }
function parseDate(str) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(str || '');
  if (!m) return null;
  const d = +m[1], mo = +m[2], y = +m[3];
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return { d, mo, y };
}
function age(b, now = new Date()) {
  let a = now.getFullYear() - b.y;
  if (now.getMonth() + 1 < b.mo || (now.getMonth() + 1 === b.mo && now.getDate() < b.d)) a--;
  return a;
}

const ASPECTS = [
  { k: 'status', t: 'Статус' },
  { k: 'relations', t: 'Отношения', sub: 'на работе, в бизнесе, с близкими, в семье' },
  { k: 'planning', t: 'Анализ и планирование' },
  { k: 'goals', t: 'Цели и приоритеты' },
  { k: 'image', t: 'Имидж' },
  { k: 'comfort', t: 'Комфорт, любовь' },
  { k: 'energy', t: 'Энергия' },
  { k: 'finance', t: 'Финансы' },
  { k: 'safety', t: 'Безопасность и здоровье' }
];
const INCOME = [['<1k', 'до $1 000'], ['1k-3k', '$1 000–3 000'], ['3k-10k', '$3 000–10 000'], ['10k-30k', '$10 000–30 000'], ['30k+', 'свыше $30 000'], ['na', 'не буду указывать']];
const CONSULT_INCOMES = ['1k-3k', '3k-10k', '10k-30k', '30k+'];
const GRID = [[3, 6, 9], [2, 5, 8], [1, 4, 7]];

function calc({ birth, latin, aspects, income, now = new Date() }) {
  const { d, mo, y } = birth;
  const digits = `${String(d).padStart(2, '0')}${String(mo).padStart(2, '0')}${y}`.split('').map(Number);
  const person = reduce(d);
  const mission = reduce(digits.reduce((a, b) => a + b, 0));
  const year = now.getFullYear();
  const py = reduce(reduce(d) + reduce(mo) + reduce(year));
  const matrix = {}; for (let k = 1; k <= 9; k++) matrix[k] = digits.filter(x => x === k).length;
  const present = [1,2,3,4,5,6,7,8,9].filter(k => matrix[k] > 0).map(k => ({ k, n: matrix[k], level: Math.min(matrix[k], 3) }));
  const missing = [1,2,3,4,5,6,7,8,9].filter(k => !matrix[k]);
  const a = age(birth, now);
  const ns = nameSum(latin);
  return { person, mission, missionActive: a >= 33, missionIn: Math.max(0, 33 - a), py, year, nameSum: ns, nameNumber: ns ? reduce(ns) : null, matrix, present, missing, age: a,
    wheel: ASPECTS.map(x => ({ k: x.k, t: x.t, v: aspects[x.k] || 0, red: (aspects[x.k] || 0) < 6 })), showConsult: CONSULT_INCOMES.includes(income) };
}

  window.STI_CALC = { reduce, cleanName, nameSum, mask, parseDate, age, ASPECTS, INCOME, CONSULT_INCOMES, GRID, calc };
})();
