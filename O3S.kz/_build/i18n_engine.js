/* Сгенерировано _build/build_prod.py из _build/kz_dict.py + _build/i18n_engine.js — не править вручную. */
(function () {
  var withLang = function (href, kz) {
    try {
      var u = new URL(href, location.href);
      if (u.origin !== location.origin) return href;
      if (kz) u.searchParams.set('lang', 'kz'); else u.searchParams.delete('lang');
      var out = u.pathname.split('/').pop() + u.search + u.hash;
      return out || './' + u.search + u.hash;
    } catch (e) { return href; }
  };
  var D = window.OTRI_KZ || {}, RULES = (window.OTRI_KZ_RULES || []).map(function (r) { return [new RegExp(r[0], 'g'), r[1]]; });
  var L = 'А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІіA-Za-z';
  var keys = Object.keys(D).filter(function (k) { return k.length >= 4 && D[k] !== k; }).sort(function (a, b) { return b.length - a.length; });
  var esc = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
  var PHRASE = keys.length ? new RegExp('(^|[^' + L + '])(' + keys.map(esc).join('|') + ')(?![' + L + '])', 'g') : null;

  function tr(s) {
    var t = s.trim();
    if (!t || !/[А-Яа-яЁё]/.test(t)) return s;
    if (Object.prototype.hasOwnProperty.call(D, t)) return s.replace(t, D[t]);
    var out = PHRASE ? s.replace(PHRASE, function (m, pre, k) { return pre + D[k]; }) : s;
    for (var i = 0; i < RULES.length; i++) out = out.replace(RULES[i][0], RULES[i][1]);
    return out;
  }
  var ATTRS = ['alt', 'placeholder', 'aria-label', 'title'];
  function fixEl(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var v = el.getAttribute(ATTRS[i]);
      if (v) { var n = tr(v); if (n !== v) el.setAttribute(ATTRS[i], n); }
    }
    if (el.tagName === 'A') {
      var h = el.getAttribute('href');
      if (h && !/^(#|mailto:|tel:|javascript:|https?:\/\/(?!otri\.kz))/i.test(h) && !/[?&]lang=kz/.test(h) && !/\.(pdf|jpe?g|png|webp)(#|$)/i.test(h)) {
        el.setAttribute('href', withLang(h, true));
      }
    }
  }
  function walk(root) {
    if (root.nodeType === 3) {
      var p = root.parentNode && root.parentNode.nodeName;
      if (p === 'SCRIPT' || p === 'STYLE') return;
      var n = tr(root.nodeValue); if (n !== root.nodeValue) root.nodeValue = n;
      return;
    }
    if (root.nodeType !== 1 || root.nodeName === 'SCRIPT' || root.nodeName === 'STYLE') return;
    fixEl(root);
    var w = document.createTreeWalker(root, 5, null), node;
    while ((node = w.nextNode())) {
      if (node.nodeType === 1) { if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE') continue; fixEl(node); }
      else { var pn = node.parentNode && node.parentNode.nodeName; if (pn !== 'SCRIPT' && pn !== 'STYLE') { var x = tr(node.nodeValue); if (x !== node.nodeValue) node.nodeValue = x; } }
    }
  }
  var mo = new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (m.type === 'characterData') walk(m.target);
      else if (m.type === 'attributes') fixEl(m.target);
      else for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]);
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS.concat(['href']) });
  if (document.body) walk(document.body);
  document.addEventListener('DOMContentLoaded', function () { walk(document.body); });
})();
