# data-model.md — Данные, интеграции, события

## 1. Объект результата (JSON)

Единый объект, который хранится на сервере, отдаётся приложению по `cid` и передаётся в ИИ для генерации отчёта.

```json
{
  "cid": "9f1c2a0e-…",
  "created_at": "2026-09-21T13:58:00Z",
  "status": "incomplete|lead|application|subscriber",
  "segment": "hot|warm|cold",
  "input": {
    "name_input": "Анна",
    "name_latin": "ANNA",
    "birth_date": "1989-07-18",
    "age": 37,
    "aspects": {
      "people": 7, "family": 6, "planning": 6, "goals": 7, "image": 7,
      "status": 6, "comfort": 7, "energy": 4, "finance": 5, "health": 5
    },
    "income_band": "3k-10k|<1k|1k-3k|10k-30k|30k+|na"
  },
  "calc": {
    "cs": 9, "cs_name": "Социальная поддержка",
    "mission": 7, "mission_name": "Перфекционизм", "mission_active": true, "mission_activates_in": 0,
    "personal_year": 8, "personal_year_name": "Реализация и урожай", "year": 2026,
    "name_number": 3, "name_planet": "Юпитер",
    "matrix": {"1":2,"2":0,"3":0,"4":0,"5":0,"6":0,"7":1,"8":2,"9":2},
    "matrix_missing": [2,3,4,5,6],
    "matrix_excess": [],
    "lines": {
      "1-4-7": false, "2-5-8": false, "3-6-9": false,
      "1-2-3": false, "4-5-6": false, "7-8-9": true
    },
    "aspects_avg": 6.0,
    "aspects_min": {"key": "energy", "value": 4},
    "start_here_cell": 9
  },
  "report": {
    "generated_at": "…",
    "model": "…",
    "blocks": {
      "mind": "…", "mission": "…", "matrix": "…",
      "year": "…", "name": "…", "aspects": "…", "start": ["…","…","…"]
    }
  },
  "contact": {
    "phone": "+7…", "email": "…", "consent": true, "consent_at": "…"
  },
  "attribution": {
    "utm_source": "instagram", "utm_medium": "bot", "utm_campaign": "stambul_oct",
    "utm_content": "КОД", "referrer": "…", "landing": "/diagnostika"
  },
  "app": {
    "user_id": null, "plan": null, "paid_at": null, "provider": null
  }
}
```

`input.name_input`, `input.name_latin`, `input.birth_date`, `contact.*` — персональные данные. В аналитику и в Telegram-карточку для сегмента `cold` не уходят.

## 2. Google Sheets, лист `leads`

| Колонка | Тип | Заполняется |
|---|---|---|
| A `cid` | текст | старт теста |
| B `created_at` | дата-время | старт |
| C `status` | incomplete / lead / application / subscriber | по событиям |
| D `segment` | hot / warm / cold | шаг 14 |
| E `name_input` | текст, как ввёл | шаг 1 |
| E2 `name_latin` | текст, по чему считали | шаг 1 |
| F `birth_date` | дата | шаг 2 |
| G `age` | число | шаг 2 |
| H `cs` | 1–9 | расчёт |
| I `mission` | 1–9 | расчёт |
| J `mission_active` | да/нет | расчёт |
| K `personal_year` | 1–9 | расчёт |
| L `name_number` | 1–9 | расчёт |
| M `matrix` | строка вида `1×2,7×1,8×2,9×2` | расчёт |
| N `matrix_missing` | `2,3,4,5,6` | расчёт |
| O–X | десять аспектов, по колонке | шаги 3–12 |
| Y `aspects_avg` | число | расчёт |
| Z `income_band` | текст | шаг 13 |
| AA `phone` | текст | шаг 14 |
| AB `email` | текст | шаг 14 |
| AC `consent_at` | дата-время | шаг 14 |
| AD `utm_source` | текст | старт |
| AE `utm_medium` | текст | старт |
| AF `utm_campaign` | текст | старт |
| AG `utm_content` | текст | старт |
| AH `report_sent_at` | дата-время | письмо |
| AI `app_user_id` | текст | регистрация в приложении |
| AJ `plan` | month/half/year | оплата |
| AK `paid_at` | дата-время | оплата |
| AL `application_event` | текст | заявка на школу |
| AM `sales_owner` | текст | вручную, отдел продаж |
| AN `sales_status` | new / contacted / call_scheduled / prepaid / paid / lost | вручную |
| AO `notes` | текст | вручную |

Колонки AM–AO редактирует отдел продаж; всё остальное пишет система. Доступ к листу — по ролям.

## 3. Telegram-карточка лида

Группа отдела продаж. Формат для `hot` и `application`:

```
🔴 ГОРЯЧИЙ · заявка на школу
Анна, 37 лет · Стамбул, октябрь

Сознание 9 — Социальная поддержка
Миссия 7 — Перфекционизм (активна)
Личный год 8 — Реализация
Матрица: есть 1,7,8,9 · нет 2,3,4,5,6
Линии: денег ✗ · отношений ✗ · действия ✗

Аспекты: средний 6.0 · минимум — энергия 4
Доход: $3–10k

Источник: instagram / bot / КОД
Телефон: +7…  Почта: …
Открыть в Sheets: <ссылка на строку>

Позвонить в течение 15 минут
```

Для `warm` — почасовой дайджест: список строк «Имя · возраст · CS/M/PY · средний · доход · источник». Без телефонов в дайджесте; телефон — по ссылке в Sheets.

`cold` в Telegram не отправляется.

## 4. События аналитики

Названия событий, одинаковые для GA4/пикселя и внутренней статистики. Персональные данные в параметрах запрещены.

| Событие | Когда | Параметры |
|---|---|---|
| `diag_view` | открыта страница | utm_* |
| `diag_start` | нажата «Начать» | cid, utm_* |
| `diag_step` | переход на шаг | cid, step |
| `diag_complete` | шаг 14 отправлен | cid, segment, cs, mission, personal_year, aspects_avg, income_band |
| `diag_report_view` | отчёт показан | cid, ai_ready (true/false) |
| `diag_email_sent` | письмо ушло | cid |
| `diag_cta_app` | клик «Открыть доступ» | cid, plan |
| `diag_cta_school` | клик «Разобрать на школе» | cid |
| `diag_application` | форма школы отправлена | cid, event |
| `app_register` | регистрация в приложении с cid | cid |
| `app_paid` | оплата | cid, plan, amount |
| `app_cancelled` | отмена | cid |

Воронка для дашборда: `diag_view → diag_start → diag_complete → diag_report_view → diag_cta_app → app_register → app_paid`.

## 5. Настройки (админка)

| Ключ | Значение по умолчанию |
|---|---|
| `price_month` | 24 |
| `price_half` | по решению |
| `price_year` | по решению |
| `seg_hot_income_min` | 3000 |
| `seg_hot_avg_max` | 5 |
| `seg_warm_income_min` | 1000 |
| `seg_warm_avg_max` | 6 |
| `ai_timeout_sec` | 8 |
| `tg_sales_chat_id` | — |
| `sheet_id` | — |
| `personal_year_mode` | calendar / birthday |
| `email_delay_1h`, `_24h`, `_72h` | вкл |

## 6. Безопасность и данные

- `sig` в URL — HMAC-SHA256 от `cid|seg|cs|m|py|plan` с серверным секретом
- Результат по API отдаётся только по `cid` + внутреннему токену приложения
- Персональные данные: хранение на одном сервере, доступ по ролям, удаление по запросу пользователя (кнопка в письме или обращение в поддержку)
- Согласие на обработку: текст, версия, дата — сохраняются в записи лида
- Бэкап Sheets — ежедневно
