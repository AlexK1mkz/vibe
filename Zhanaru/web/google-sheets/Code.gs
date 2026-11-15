/**
 * Приём заявок сайта ZhanaRu в Google-таблицу.
 * Скрипт привязан к таблице «ZhanaRu — заявки с сайта» (Расширения → Apps Script).
 * Инструкция по установке — google-sheets/README.md.
 *
 * Свойство скрипта SECRET (Настройки проекта → Свойства скрипта) должно совпадать
 * с 'sheets_secret' в config.php на хостинге. Если заявки пишутся прямо из браузера
 * (site.sheetsWebhook), SECRET оставьте пустым: секрет в коде страницы не скрыть.
 */

var SHEET_NAME = 'Заявки';

// Порядок колонок = заголовки в первой строке таблицы
var COLUMNS = [
  ['Дата и время', function (d) { return d.time || Utilities.formatDate(new Date(), 'Asia/Almaty', 'dd.MM.yyyy HH:mm'); }],
  ['Имя', function (d) { return d.name; }],
  ['Фамилия', function (d) { return d.surname; }],
  ['Телефон', function (d) { return d.phone; }],
  ['Источник', function (d) { return d.source; }],
  ['Сегмент', function (d, q) { return q.segment; }],
  ['Индекс энергии', function (d, q) { return q.index; }],
  ['Цель индекса', function (d, q) { return q.goalIndex; }],
  ['Цель', function (d, q) { return q.goal; }],
  ['Зоны внимания', function (d, q) { return q.attention; }],
  ['Чекап', function (d, q) { return q.checkup; }],
  ['Направление', function (d, q) { return q.direction; }],
  ['Пол', function (d, q) { return q.sex; }],
  ['Возраст', function (d, q) { return q.age; }],
  ['Рост, см', function (d, q) { return q.height; }],
  ['Вес, кг', function (d, q) { return q.mass; }],
  ['ИМТ', function (d, q) { return q.bmi; }],
  ['Энергия', function (d, q) { return q.energy; }],
  ['Сон', function (d, q) { return q.sleep; }],
  ['Вес за год', function (d, q) { return q.weightChange; }],
  ['Симптомы', function (d, q) { return q.symptoms; }],
  ['Анализы сдавали', function (d, q) { return q.lastTests; }],
  ['Формат', function (d, q) { return q.format; }],
  ['UTM', function (d) { return typeof d.utm === 'string' ? d.utm : utmText(d.utm); }],
  ['Страница', function (d) { return d.page; }],
  ['Устройство', function (d) { return d.device; }],
  ['Статус', function () { return 'Новая'; }],
];

function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var secret = PropertiesService.getScriptProperties().getProperty('SECRET') || '';
    if (secret && data.secret !== secret) return reply({ ok: false, error: 'secret' });
    if (data.website) return reply({ ok: true }); // honeypot
    if (!data.name || !/^7\d{10}$/.test(String(data.phone || '').replace(/\D/g, ''))) {
      return reply({ ok: false, error: 'validation' });
    }
    var quiz = data.quiz || {};
    var row = COLUMNS.map(function (c) {
      var v = c[1](data, quiz);
      // защита от формул в ячейках: строки, начинающиеся с = + - @, пишем как текст
      if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
      return v === undefined || v === null ? '' : v;
    });
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sheet().appendRow(row);
    } finally {
      lock.releaseLock();
    }
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

function doGet() {
  return reply({ ok: true, service: 'zhanaru-leads' });
}

function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(COLUMNS.map(function (c) { return c[0]; }));
  return sh;
}

function utmText(utm) {
  if (!utm || typeof utm !== 'object') return '';
  return Object.keys(utm).filter(function (k) { return k.indexOf('utm_') === 0; })
    .map(function (k) { return k + '=' + utm[k]; }).join(', ');
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
