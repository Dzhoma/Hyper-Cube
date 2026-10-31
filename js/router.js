/*
 * Hash-роутер аркады (ADR-0008): '#/' — каталог, '#/<gameId>' — экран игры из реестра.
 * Роутер игр не знает — только контракт mount/unmount из реестра.
 */
let active = null; // активная игра: дескриптор с unmount()

export function startRouter(container, games, renderCatalog) {
  function onHash() {
    const id = (location.hash || '#/').replace(/^#\/?/, '');
    if (active) {
      active.unmount();
      active = null;
    }
    container.innerHTML = '';
    if (!id) {
      renderCatalog(container);
      return;
    }
    const game = games.find((g) => g.id === id);
    if (!game) {
      location.hash = '#/'; // неизвестный маршрут — в каталог (hashchange довершит)
      return;
    }
    game.mount(container);
    active = game;
  }
  window.addEventListener('hashchange', onHash);
  onHash();
}
