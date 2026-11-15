<?php
/**
 * Приём заявок с сайта ZhanaRu: JSON → Telegram + email.
 * Единственный серверный файл проекта. Совместим с PHP 7.4+.
 *
 * Настройки лежат в config.php (в репозиторий не попадает). Порядок поиска:
 *   1) на уровень выше веб-корня: ../../zhanaru-config.php  — предпочтительно;
 *   2) api/private/config.php — папка закрыта через .htaccess.
 * Образец — api/private/config.example.php.
 *
 * Ответы теста — сведения о здоровье: здесь они только пересылаются клинике
 * и нигде не логируются.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function respond(int $code, array $body): void
{
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function clean($value, int $max = 200): string
{
    if (!is_scalar($value)) {
        return '';
    }
    $s = trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', (string) $value) ?? '');
    return mb_substr($s, 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'method']);
}

// ---------- настройки ----------
$config = null;
foreach ([dirname(__DIR__, 2) . '/zhanaru-config.php', __DIR__ . '/private/config.php'] as $path) {
    if (is_file($path)) {
        $config = require $path;
        break;
    }
}
if (!is_array($config)) {
    respond(503, ['ok' => false, 'error' => 'config']);
}

// ---------- проверка Origin ----------
$origin = rtrim($_SERVER['HTTP_ORIGIN'] ?? '', '/');
$allowed = array_map(static function ($o) {
    return rtrim((string) $o, '/');
}, $config['allowed_origins'] ?? []);
if ($origin === '' || !in_array($origin, $allowed, true)) {
    respond(403, ['ok' => false, 'error' => 'origin']);
}

// ---------- тело запроса ----------
$raw = file_get_contents('php://input', false, null, 0, 16384);
$data = json_decode($raw ?: '', true);
if (!is_array($data)) {
    respond(400, ['ok' => false, 'error' => 'json']);
}

// Honeypot и время заполнения: ботам отвечаем «успехом», заявку не отправляем
$isBot = clean($data['website'] ?? '') !== '' || (int) ($data['elapsed'] ?? 0) < 3000;
if ($isBot) {
    respond(200, ['ok' => true]);
}

// ---------- лимит: 5 заявок с IP в час ----------
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rateDir = __DIR__ . '/private/rate';
if (!is_dir($rateDir)) {
    @mkdir($rateDir, 0700, true);
}
// в файле только хеш IP и метки времени — никаких данных заявки
$rateFile = $rateDir . '/' . hash('sha256', $ip . ($config['salt'] ?? 'zhanaru')) . '.json';
$now = time();
$hits = [];
if (is_file($rateFile)) {
    $hits = array_filter((array) json_decode((string) file_get_contents($rateFile), true), static function ($t) use ($now) {
        return is_int($t) && $t > $now - 3600;
    });
}
if (count($hits) >= 5) {
    respond(429, ['ok' => false, 'error' => 'rate']);
}
$hits[] = $now;
@file_put_contents($rateFile, json_encode(array_values($hits)), LOCK_EX);
// изредка чистим старые файлы лимита
if (mt_rand(1, 50) === 1) {
    foreach (glob($rateDir . '/*.json') ?: [] as $f) {
        if (filemtime($f) < $now - 7200) {
            @unlink($f);
        }
    }
}

// ---------- валидация ----------
$name = clean($data['name'] ?? '', 60);
$surname = clean($data['surname'] ?? '', 60);
$leadId = preg_replace('/[^A-Z0-9-]/', '', strtoupper(clean($data['leadId'] ?? '', 20)));
$stage = ($data['stage'] ?? '') === 'contact' ? 'contact' : 'done';
$phone = preg_replace('/\D+/', '', (string) ($data['phone'] ?? ''));
if (mb_strlen($name) < 2 || !preg_match('/^7\d{10}$/', $phone) || empty($data['consent'])) {
    respond(422, ['ok' => false, 'error' => 'validation']);
}

$segmentLabels = ['A' => 'A · приоритет', 'B' => 'B · приоритет', 'C' => 'C', 'D' => 'D · авто'];
$quiz = is_array($data['quiz'] ?? null) ? $data['quiz'] : [];
$utm = is_array($data['utm'] ?? null) ? $data['utm'] : [];
$ua = clean($_SERVER['HTTP_USER_AGENT'] ?? '', 300);
$device = preg_match('/Mobi|Android|iPhone|iPad/i', $ua) ? 'телефон' : 'компьютер';

$tz = new DateTimeZone($config['timezone'] ?? 'Asia/Almaty');
$time = (new DateTime('now', $tz))->format('d.m.Y H:i');

$titles = [
    'contact' => 'Новый лид: оставил контакты и начал тест',
    'done' => $quiz ? 'Тест пройден' : 'Новая заявка с сайта ZhanaRu',
];
$lines = [
    $titles[$stage] . ($leadId !== '' ? ' · ' . $leadId : ''),
    'Имя: ' . trim($name . ' ' . $surname),
    'Телефон: +' . $phone,
    'Источник: ' . clean($data['source'] ?? 'сайт', 40),
];
if ($quiz) {
    $segment = clean($quiz['segment'] ?? '', 1);
    $lines[] = '';
    $lines[] = 'Сегмент: ' . ($segmentLabels[$segment] ?? '—');
    $lines[] = 'Индекс энергии: ' . (int) ($quiz['index'] ?? 0) . '/100';
    $lines[] = 'Цель: ' . clean($quiz['goal'] ?? '', 60);
    $lines[] = 'Зоны внимания: ' . clean($quiz['attention'] ?? '', 200);
    $lines[] = 'Рекомендованный чекап: ' . clean($quiz['checkup'] ?? '', 80);
    $lines[] = 'Направление: ' . clean($quiz['direction'] ?? '', 80);
    if (!empty($quiz['bmi'])) {
        $lines[] = 'Рост / вес: ' . (int) $quiz['height'] . ' см / ' . (int) $quiz['mass'] . ' кг, ИМТ ' . clean($quiz['bmi'], 6);
    }
}
$lines[] = '';
$utmParts = [];
foreach ($utm as $key => $value) {
    if (is_string($key) && strpos($key, 'utm_') === 0) {
        $utmParts[] = clean($key, 30) . '=' . clean($value, 120);
    }
}
$lines[] = 'UTM: ' . ($utmParts ? implode(', ', array_slice($utmParts, 0, 8)) : '—');
$lines[] = 'Время: ' . $time;
$lines[] = 'Устройство: ' . $device;
$lines[] = 'Страница: ' . clean($data['page'] ?? '/', 120);
$text = implode("\n", $lines);

// ---------- Telegram ----------
$sentTelegram = false;
if (!empty($config['telegram_token']) && !empty($config['telegram_chat_id'])) {
    $url = 'https://api.telegram.org/bot' . $config['telegram_token'] . '/sendMessage';
    $payload = http_build_query([
        'chat_id' => $config['telegram_chat_id'],
        'text' => $text,
        'disable_web_page_preview' => 'true',
    ]);
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8,
        ]);
        $result = curl_exec($ch);
        $sentTelegram = $result !== false && curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200;
        curl_close($ch);
    } else {
        $context = stream_context_create(['http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => $payload,
            'timeout' => 8,
        ]]);
        $sentTelegram = @file_get_contents($url, false, $context) !== false;
    }
}

// ---------- дубль на email ----------
$sentMail = false;
if (!empty($config['email_to'])) {
    $from = $config['email_from'] ?? 'no-reply@' . preg_replace('/^www\./', '', $_SERVER['SERVER_NAME'] ?? 'localhost');
    $headers = [
        'From: ZhanaRu <' . $from . '>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: 8bit',
    ];
    $subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта: ' . $name) . '?=';
    $sentMail = @mail($config['email_to'], $subject, $text, implode("\r\n", $headers));
}

// ---------- Google-таблица (веб-приложение Apps Script, см. google-sheets/README.md) ----------
$sentSheets = false;
if (!empty($config['sheets_webhook'])) {
    $row = [
        'secret' => (string) ($config['sheets_secret'] ?? ''),
        'leadId' => $leadId,
        'stage' => $stage,
        'time' => $time,
        'name' => $name,
        'surname' => $surname,
        'phone' => '+' . $phone,
        'source' => clean($data['source'] ?? 'сайт', 40),
        'utm' => $utmParts ? implode(', ', array_slice($utmParts, 0, 8)) : '',
        'page' => clean($data['page'] ?? '/', 120),
        'device' => $device,
        'quiz' => [],
    ];
    $quizKeys = ['segment' => 2, 'index' => 4, 'goalIndex' => 4, 'goal' => 60, 'attention' => 200, 'checkup' => 80,
        'direction' => 80, 'sex' => 20, 'age' => 20, 'height' => 4, 'mass' => 4, 'bmi' => 6, 'energy' => 80,
        'sleep' => 80, 'weightChange' => 80, 'symptoms' => 300, 'lastTests' => 40, 'format' => 80];
    foreach ($quizKeys as $key => $max) {
        $row['quiz'][$key] = clean($quiz[$key] ?? '', $max);
    }
    $json = json_encode($row, JSON_UNESCAPED_UNICODE);
    if (function_exists('curl_init')) {
        $ch = curl_init($config['sheets_webhook']);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $json,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true, // Apps Script отвечает редиректом на googleusercontent.com
            CURLOPT_TIMEOUT => 10,
        ]);
        $result = curl_exec($ch);
        $sentSheets = $result !== false && strpos((string) $result, '"ok":true') !== false;
        curl_close($ch);
    } else {
        $context = stream_context_create(['http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => $json,
            'timeout' => 10,
        ]]);
        $result = @file_get_contents($config['sheets_webhook'], false, $context);
        $sentSheets = $result !== false && strpos((string) $result, '"ok":true') !== false;
    }
}

if (!$sentTelegram && !$sentMail && !$sentSheets) {
    respond(502, ['ok' => false, 'error' => 'delivery']);
}
respond(200, ['ok' => true]);
