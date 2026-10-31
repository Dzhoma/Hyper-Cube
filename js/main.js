/*
 * Точка входа аркады Hyper-Cube: каталог игр + hash-роутинг (ADR-0008).
 * Новая игра = модуль в js/games/<id>/ + одна строка в реестре (js/games/registry.js).
 */
import { t, currentLang, setLang } from './i18n.js';
import { applyStaticI18n, wireSeg } from './ui.js';
import { startRouter } from './router.js';
import registry from './games/registry.js';
import CATALOG_HTML from './catalog.html?raw';

function renderCatalog(container) {
  container.innerHTML = CATALOG_HTML;
  document.getElementById('catalog').innerHTML = registry
    .map(
      (g) => `
    <a class="card" data-accent="${g.accent}" href="#/${g.id}">
      <span class="card-name">${t(g.nameKey)}</span>
      <span class="card-tag">${t(g.tagKey)}</span>
      <span class="card-play">${t('cat.play')}</span>
    </a>`,
    )
    .join('');
  document.querySelectorAll('#cat-lang .seg-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.value === currentLang());
  });
  wireSeg('#cat-lang', (l) => {
    setLang(l);
    document.documentElement.lang = l;
    renderCatalog(container);
  });
  document.documentElement.lang = currentLang();
  document.title = t('title.catalog');
  applyStaticI18n();
}

startRouter(document.getElementById('app'), registry, renderCatalog);
