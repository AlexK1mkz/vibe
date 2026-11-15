<?php
// Образец настроек приёма заявок. Скопируйте в config.php (рядом) или, лучше,
// в файл zhanaru-config.php на уровень выше веб-корня. В репозиторий config.php не коммитится.
return [
    // Токен бота от @BotFather и ID чата клиники (бот должен быть добавлен в чат)
    'telegram_token' => '',
    'telegram_chat_id' => '',

    // Дубль заявки на почту. Пусто — без письма.
    'email_to' => '',
    'email_from' => '', // например no-reply@домен; пусто — подставится автоматически

    // Google-таблица заявок: адрес веб-приложения Apps Script (…/exec) и секрет,
    // совпадающий со свойством SECRET в скрипте. Инструкция — google-sheets/README.md.
    'sheets_webhook' => '',
    'sheets_secret' => '',

    // С каких адресов сайт может отправлять заявки (без слэша в конце)
    'allowed_origins' => ['https://zhanaru.kz'],

    'timezone' => 'Asia/Almaty',
    // Любая случайная строка: «соль» для хешей IP в лимите заявок
    'salt' => 'change-me',
];
