# O3S.kz — правила проекта

Публикация: GitHub Pages, репозиторий alexk1mkz/vibe, ветка main, папка O3S.kz → https://alexk1mkz.github.io/vibe/O3S.kz/
Источник истины — файлы в репозитории (подключённая локальная папка O3S.kz), не память чата.

1. Главная — `index.html` в корне. Никогда не создавать `index.dc.html` и не переименовывать `index.html`. Если `index.dc.html` появился — перенести содержимое в `index.html` и удалить его.
2. Ссылки на главную — `./`, на якоря — `./#tech`, `./#about` и т.п. Никаких ссылок на `index.dc.html` (ни в href, ни в массивах меню в скриптах).
3. Остальные файлы: `header.dc.html`, `footer.dc.html`, `lead-form.dc.html`, `catalog.dc.html`, `contacts.dc.html`, `dental.dc.html`, `rent.dc.html`, `o3s-16.dc.html` — имена строчными, не переименовывать, не перемещать, не объединять без прямого запроса.
4. `support.js`, `image-slot.js`, `o3s-data.js` — в корне. Картинки — `img/`, загрузки — `uploads/`. Пути только относительные.
5. Новая страница — новый `*.dc.html` в корне + ссылка в `header.dc.html` и `footer.dc.html`.
6. После каждого изменения выписывать список изменённых, добавленных и удалённых файлов.

## Прод (otri.kz, hoster.kz)

7. Прод-домен — `https://otri.kz/`, эта папка — корень сайта. `.htaccess`, `robots.txt`, `sitemap.xml`, иконки и `site.webmanifest` лежат в корне.
8. Страницы собраны скриптом `_build/build_prod.py`: статичный `<head>` с SEO и Open Graph, готовый снимок контента (`<!--ssr:start-->…<!--ssr:end-->`), шаблон в `<!--tpl:start-->…<!--tpl:end-->` и загрузка React (`<!--boot:start-->…<!--boot:end-->`). Эти блоки вручную не править.
9. Перед правками в Claude Design: `python3 _build/build_prod.py . --strip` — страницы вернутся в исходный вид с `<x-dc>`. После правок: `python3 _build/build_prod.py .` — пересобрать прод (снимки, `_prerender/`, `sitemap.xml`).
10. Title, description и картинки превью задаются в `_build/build_prod.py` (словарь страниц), а не в `<helmet>`. В `<helmet>` — только `<style>`. Google Fonts не подключать: шрифты локальные, `fonts/`.
11. Картинки превью для ссылок — только JPG 1200×630 в `img/og/` (SVG мессенджеры и поисковики не показывают).
12. React грузится из `vendor/`, не с unpkg. Новые картинки — WebP до 1200 px, с `loading="lazy"` (кроме первой на экране).
