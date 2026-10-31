# Hyper-Cube

A cyberpunk arcade. The first game is tic-tac-toe in four-dimensional space;
the catalog is built to grow. No frameworks — plain ES modules;
[Vite](https://vite.dev) serves development and builds the static bundle for
GitHub Pages.

[По-русски ниже](#hyper-cube-по-русски)

## Games

### Hyper-Cube — 4D tic-tac-toe

- **Hypercube field** — 4×4×4×4 (256 cells), 4 in a row wins.
- **520 winning lines** — axes, slice diagonals, cube diagonals and
  hypercube diagonals across 4D space.
- **Opponents** — hot-seat for two players, online P2P (WebRTC: the host opens
  a room and shares a short code or an invite link; no accounts, no server),
  or AI with three levels:
  - _Script Kiddie_ — noise and randomness;
  - _Netrunner_ — greedy heuristic;
  - _Corporate AI_ — alpha-beta search with incremental line evaluation and
    iterative deepening, ~1 second thinking budget.
- **Match scoring** — X/O/draw counters; the starting player alternates every round.
- **Post-game analysis** — the winning line stays highlighted on the board and
  the victory window can be collapsed.

### Snake

- Neon canvas serpent: eat, grow, survive; the speed ramps up with every meal.
- Keyboard (arrows / WASD) and touch swipe; local best score.

## Arcade shell

- **Main menu** — a catalog of game cards with a language switcher (English by
  default, Russian available), hash-routed: `#/` is the catalog,
  `#/hypercube` and `#/snake` are the games, so direct links and reloads work.
- **Adding a game** — create `js/games/<id>/` with a default-exported
  descriptor `{ id, nameKey, tagKey, accent, mount, unmount }` (mount builds
  the screen from `screen.html`, unmount stops timers/network) and add one
  line to `js/games/registry.js`. That's the whole protocol — see
  [ADR-0008](docs/adr/0008-katalog-igr-reestr-hash-routing.md).

## Run locally

Requires Node 20.19+ / 22.12+ (tested on Node 24):

```
npm install
npm run dev       # dev server with HMR
npm run build     # production build into dist/
npm run preview   # serve the production build locally
npm test          # node:test suites (no dependencies needed)
npm run lint      # oxlint
npm run format    # oxfmt
```

## Tests

`npm test` runs `node --test` — no dependencies required beyond Node itself.

The suites cover the 4D core (line generation, wins), all three AI levels
(deterministic via an injected RNG), the match state machine (fake AI adapter),
the network session (host/guest over a fake transport pair) and the snake core
(movement, growth, collisions, victory).

## Deploy to GitHub Pages

The repository ships with a ready deployment pipeline:

1. Push the project to GitHub.
2. In the repository, open **Settings → Pages → Build and deployment → Source**
   and select **GitHub Actions**.
3. On every push to `main` the workflow
   [.github/workflows/deploy.yml](.github/workflows/deploy.yml) installs
   dependencies, runs the Vite build and publishes `dist/`.
4. The arcade will be available at `https://<username>.github.io/<repository>/`.

To build locally: `npm run build` — the ready-to-publish copy appears in
`dist/`; `npm run preview` serves it.

## Project structure

```
index.html                  shell: fx layers, app container
css/style.css               cyberpunk styling (neon, scanlines, glitch)
css/arcade.css              catalog grid and snake screen styling
js/main.js                  entry: catalog renderer + router boot
js/catalog.html             catalog markup (inlined via Vite ?raw)
js/router.js                hash router: '#/' catalog, '#/<game>' screen
js/ui.js                    shared UI helpers (i18n render, seg switches)
js/i18n.js                  UI dictionary (EN/RU) and language state
js/audio.js                 synthesized WebAudio sounds
js/games/registry.js        game registry — one line per game
js/games/hypercube/         4D tic-tac-toe: game, ai, match, net, session,
                            screen.js (UI layer), screen.html
js/games/snake/             Snake: core.js (pure logic), index.js (canvas UI),
                            screen.html
vite.config.js              Vite config: relative base for Pages subpath
package.json                npm scripts: dev / build / preview / test
tests/                      node:test suites: core, AI, match, session, snake
docs/adr/                   architecture decision records
CONTEXT.md                  project glossary
```

## Hyper-Cube (по-русски)

Киберпанк-аркада. Первая игра — крестики-нолики в четырёхмерном пространстве;
каталог рассчитан на рост. Без фреймворков — чистые ES-модули; [Vite](https://vite.dev)
обслуживает разработку и собирает статику для GitHub Pages.

**Гиперкуб** — поле 4×4×4×4 (256 клеток), победа — 4 в ряд (520 линий).
Соперники: хот-сит на двоих, онлайн-режим по прямой P2P-связи (WebRTC: хост
открывает комнату и передаёт короткий код или ссылку-приглашение; без аккаунтов
и сервера) или ИИ трёх уровней — «Скрип-кидди», «Нетраннер», «Корпоративный ИИ».
Счёт ведётся между раундами, стартёр чередуется, выигрышную линию можно
разобрать, свернув окно победы.

**Змейка** — неоновая змея на канвасе: ешь, расти, выживай; скорость растёт с
каждой добычей. Управление — стрелки/WASD и свайп; рекорд хранится локально.

**Оболочка** — главное меню с каталогом игр и выбором языка (по умолчанию
английский, доступен русский), навигация по хешу: `#/` — каталог,
`#/hypercube` и `#/snake` — игры. Добавить игру: модуль `js/games/<id>/` с
дескриптором `{ id, nameKey, tagKey, accent, mount, unmount }` и одна строка в
`js/games/registry.js` (см. [ADR-0008](docs/adr/0008-katalog-igr-reestr-hash-routing.md)).

Запуск: `npm install`, затем `npm run dev` — сборка и сервер берутся из Vite.
Логика покрыта тестами: `npm test` (ядро, ИИ, матч, сетевая сессия, змейка).

## License

Released under the
[Creative Commons Attribution 4.0 International license (CC BY 4.0)](./LICENSE).
