/* OTRI: русская / казахская версия.
   Язык задаётся адресом: ?lang=kz — казахский, без параметра — русский.
   Казахский текст подставляется поверх русских шаблонов по словарю i18n-kz.js
   (собирается из _build/kz_dict.py). Фраза без перевода остаётся на русском. */
(function () {
  var q = null;
  try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  var KZ = q === 'kz';
  window.OTRI_LANG = KZ ? 'kz' : 'ru';

  function withLang(href, kz) {
    try {
      var u = new URL(href, location.href);
      if (u.origin !== location.origin) return href;
      if (kz) u.searchParams.set('lang', 'kz'); else u.searchParams.delete('lang');
      var out = u.pathname.split('/').pop() + u.search + u.hash;
      return out || './' + u.search + u.hash;
    } catch (e) { return href; }
  }
  window.OTRI_SET_LANG = function (lang) {
    try { localStorage.setItem('otri_lang', lang); } catch (e) {}
    location.href = withLang(location.href, lang === 'kz');
  };
  if (!KZ) return;
  document.documentElement.lang = 'kk';
  // Словарь и перевод грузим только для казахской версии
  document.write('<script src="i18n-kz.js"><\/script>');
})();
