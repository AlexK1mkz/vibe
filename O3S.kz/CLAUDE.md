# O3S.kz — правила проекта

Публикация: GitHub Pages, репозиторий alexk1mkz/vibe, ветка main, папка O3S.kz → https://alexk1mkz.github.io/vibe/O3S.kz/
Источник истины — файлы в репозитории (подключённая локальная папка O3S.kz), не память чата.

1. Главная — `index.html` в корне. Никогда не создавать `index.dc.html` и не переименовывать `index.html`. Если `index.dc.html` появился — перенести содержимое в `index.html` и удалить его.
2. Ссылки на главную — `./`, на якоря — `./#tech`, `./#about` и т.п. Никаких ссылок на `index.dc.html` (ни в href, ни в массивах меню в скриптах).
3. Остальные файлы: `header.dc.html`, `footer.dc.html`, `lead-form.dc.html`, `catalog.dc.html`, `contacts.dc.html`, `dental.dc.html`, `rent.dc.html`, `o3s-16.dc.html` — имена строчными, не переименовывать, не перемещать, не объединять без прямого запроса.
4. `support.js`, `image-slot.js`, `o3s-data.js` — в корне. Картинки — `img/`, загрузки — `uploads/`. Пути только относительные.
5. Новая страница — новый `*.dc.html` в корне + ссылка в `header.dc.html` и `footer.dc.html`.
6. После каждого изменения выписывать список изменённых, добавленных и удалённых файлов.
