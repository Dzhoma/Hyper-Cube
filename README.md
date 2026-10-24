# Hyper-Cube

Tic-tac-toe in four-dimensional space with a cyberpunk aesthetic. Play against
another human (hot-seat or online over a direct P2P link) or against the AI.
Pure static site — no frameworks, no build step, no dependencies: just open
`index.html`.

[По-русски ниже](#hyper-cube-по-русски)

## Features

- **Hypercube field** — 4×4×4×4 (256 cells), 4 in a row wins.
- **520 winning lines** — axes, slice diagonals, cube diagonals and
  hypercube diagonals across 4D space.
- **Opponents** — hot-seat for two players, online P2P (WebRTC: the host opens
  a room and shares a short code or an invite link; no accounts, no server),
  or AI with three levels:
  - *Script Kiddie* — noise and randomness;
  - *Netrunner* — greedy heuristic;
  - *Corporate AI* — alpha-beta search with incremental line evaluation and
    iterative deepening, ~1 second thinking budget.
- **Match scoring** — X/O/draw counters; the starting player alternates every round.
- **Post-game analysis** — the winning line stays highlighted on the board and
  the victory window can be collapsed.
- **Cyberpunk UI** — neon on black, scanlines, glitch effects; synthesized
  WebAudio sound with a mute toggle; English/Russian interface (English by
  default, switchable in the menu).

## Run locally

Open `index.html` in any modern browser. That's it — no server, no build.

## Tests

Requires Node 18+:

```
node --test tests/
```

The suites cover the 4D core (line generation, wins), all three AI levels
(deterministic via an injected RNG), the match state machine (fake AI adapter)
and the network session (host/guest over a fake transport pair).

## Deploy to GitHub Pages

The repository ships with a ready deployment pipeline:

1. Push the project to GitHub.
2. In the repository, open **Settings → Pages → Build and deployment → Source**
   and select **GitHub Actions**.
3. On every push to `main` the workflow
   [.github/workflows/deploy.yml](.github/workflows/deploy.yml) runs
   `scripts/build.sh`, which assembles the site into `dist/`, and publishes it.
4. The game will be available at `https://<username>.github.io/<repository>/`.

To build locally: `bash scripts/build.sh` (on Windows: `scripts\build.cmd`) —
the ready-to-publish copy appears in `dist/`.

## Project structure

```
index.html            markup: menu, game screen, overlays
css/style.css         cyberpunk styling (neon, scanlines, glitch)
js/game.js            core: 4D board, line generation, win detection
js/ai.js              three AI levels (random / heuristic / alpha-beta)
js/match.js           match logic: rounds, starter alternation, scoring
js/net.js             P2P transport adapter over PeerJS (WebRTC)
js/session.js         network protocol: host-authoritative sync, snapshots
js/audio.js           synthesized WebAudio sounds
js/app.js             i18n (EN/RU), menu, rendering
tests/                node:test suites: core, AI, match, network session
scripts/build.sh      assembles dist/ for GitHub Pages
scripts/build.cmd     the same for Windows
docs/adr/             architecture decision records
CONTEXT.md            project glossary
```

## Hyper-Cube (по-русски)

Крестики-нолики в четырёхмерном пространстве в киберпанк-стилистике. Поле —
«Гиперкуб»: 4×4×4×4, победа — 4 в ряд (520 линий). Соперники: хот-сит на двоих,
онлайн-режим по прямой P2P-связи (WebRTC: хост открывает комнату и передаёт
короткий код или ссылку-приглашение; без аккаунтов и сервера) или ИИ трёх
уровней — «Скрип-кидди», «Нетраннер», «Корпоративный ИИ». Счёт ведётся между
раундами, стартёр чередуется. Интерфейс — русский и английский (по умолчанию
английский, выбор в меню). Для запуска просто откройте `index.html` в браузере.
Логика покрыта тестами: `node --test tests/` (ядро, ИИ, матч, сетевая сессия).

## License

Released under the
[Creative Commons Attribution 4.0 International license (CC BY 4.0)](./LICENSE).
