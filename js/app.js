'use strict';

/*
 * Сборка приложения: локализация, меню, рендер, оверлеи, звук.
 * Логика матча живёт в модуле Match (js/match.js), ядро — в GameCore (js/game.js),
 * ИИ — в AI (js/ai.js). Здесь только UI-слой: DOM, таймеры, звуки, строки.
 */
(() => {
  const N = 4; // гиперкуб 4×4×4×4 (ADR-0004)
  const FACTS = GameCore.facts(N);
  const PARAMS = { n: FACTS.n, dims: FACTS.dims, cells: FACTS.cells, lines: FACTS.lines };

  /* ---------- локализация (по умолчанию английский) ---------- */

  const I18N = {
    en: {
      'title.tag': 'Hyper-Cube // tic-tac-toe in four-dimensional space',
      'menu.subtitle': '// HYPERFIELD ACTIVE · TIC-TAC-TOE IN FOUR-DIMENSIONAL SPACE',
      'menu.field.lang': 'LANGUAGE:',
      'menu.field.opponent': 'OPPONENT:',
      'menu.field.side': 'YOUR SYMBOL:',
      'menu.field.level': 'AI LEVEL:',
      'opp.human': 'HUMAN',
      'opp.human.sub': 'hot-seat · 2 players',
      'opp.ai': 'AI',
      'opp.ai.sub': 'play against the machine',
      'side.X.sub': 'move first',
      'side.O.sub': 'move second',
      'level.0': 'SCRIPT KIDDIE',
      'level.0.sub': 'noise and randomness',
      'level.1': 'NETRUNNER',
      'level.1.sub': 'greedy heuristic',
      'level.2': 'CORPORATE AI',
      'level.2.sub': 'search · up to ~1 sec',
      'btn.start': '▶ INITIALIZE MATCH',
      'btn.rules': 'RULES // PROTOCOL',
      'hint.hypercube': 'HYPERCUBE: {dims} · {cells} cells · {lines} winning lines',
      'tag.mode.hypercube': '// HYPERCUBE · {dims} · {n} IN A ROW',
      'tag.opponent.human': '// HOT-SEAT · 2 PLAYERS',
      'tag.opponent.ai': '// AI: {level}',
      'tag.round': 'ROUND {n}',
      'score.draws': 'DRAWS',
      'btn.sound.on': 'SOUND: ON',
      'btn.sound.off': 'SOUND: OFF',
      'btn.restart': '⟲ RESTART',
      'btn.menu': 'MENU',
      'turn.thinking': 'AI THINKING',
      'turn.hotseat': '▶ TURN: {sym}',
      'turn.you': '▶ YOUR TURN: {sym}',
      'turn.line': '// LINE CLOSED: {sym} WINS',
      'turn.draw': '// GAME OVER: DRAW',
      'hint.board': 'SLICES w×x // INSIDE SLICE: ROWS y · COLUMNS z',
      'btn.next': '▶ NEXT ROUND',
      'btn.hide': '▼ COLLAPSE // ANALYZE',
      'overlay.title.x': '{sym} WINS',
      'overlay.title.ai': 'AI WINS',
      'overlay.title.hack': 'HACK CONFIRMED',
      'overlay.title.draw': 'DRAW',
      'overlay.sub.draw': '// SYSTEM BALANCED',
      'overlay.sub.hack': '// HUMAN ({sym}) OUTPLAYS THE AI · LEVEL: {level}',
      'overlay.sub.ai': '// SYMBOL {sym} · LEVEL: {level}',
      'overlay.sub.line': '// LINE CLOSED IN FOUR DIMENSIONS',
      'rules.title': '// PROTOCOL: HYPERFIELD RULES',
      'btn.rules.close': '✕ CLOSE',
      'aria.cell': 'Slice {wx}, cell {yz}',
      'rules.1.t': '1 · HYPERFIELD',
      'rules.1.p': 'The game is played in a four-dimensional cube n×n×n×n. Every cell is addressed by four coordinates (w, x, y, z). For humans, the hyperfield is displayed as a grid of slices: the grid rows are the w coordinate, the columns are x; inside a slice, rows are y and columns are z.',
      'rules.2.t': '2 · TURNS',
      'rules.2.p': 'Players take turns occupying free cells: X is a cyan cross, O is a magenta circle. X moves first in the first round; the starting player alternates every following round.',
      'rules.3.t': '3 · WIN AND DRAW',
      'rules.3.p': 'To win, assemble a line of {n} of your symbols along any straight line of four-dimensional space:',
      'rules.3.li1': 'along an axis — within a single dimension;',
      'rules.3.li2': 'a slice diagonal — in the plane of two dimensions;',
      'rules.3.li3': 'a cube diagonal — through the volume of three dimensions;',
      'rules.3.li4': 'a hypercube diagonal — through all four dimensions.',
      'rules.3.p2': 'There are {lines} such lines. A draw is when all playable cells are occupied and there is no line. The winning line is highlighted on the board — the victory window can be collapsed and the combination analyzed.',
      'rules.4.t': '4 · THE FIELD',
      'rules.4.p': '<b>HYPERCUBE</b> — {dims}, {cells} cells, {n} in a row to win. An unrestricted field with deep, honest competition.',
      'rules.5.t': '5 · OPPONENTS',
      'rules.5.li1': '<b>HOT-SEAT</b> — two humans take turns on one device.',
      'rules.5.li2': '<b>SCRIPT KIDDIE AI</b> — noise and randomness, occasionally notices the obvious.',
      'rules.5.li3': '<b>NETRUNNER AI</b> — a greedy heuristic: wins, blocks, pulls the best lines.',
      'rules.5.li4': '<b>CORPORATE AI</b> — alpha-beta search evaluating every line; thinks for up to ~1 second.',
      'rules.6.t': '6 · MATCH',
      'rules.6.p': 'X wins, O wins and draws are accumulated across rounds. Changing the opponent starts a new match and resets the score.',
    },
    ru: {
      'title.tag': 'Hyper-Cube // крестики-нолики четырёхмерного пространства',
      'menu.subtitle': '// ГИПЕРПОЛЕ АКТИВНО · КРЕСТИКИ-НОЛИКИ ЧЕТЫРЁХМЕРНОГО ПРОСТРАНСТВА',
      'menu.field.lang': 'ЯЗЫК:',
      'menu.field.opponent': 'СОПЕРНИК:',
      'menu.field.side': 'ВАШ СИМВОЛ:',
      'menu.field.level': 'УРОВЕНЬ ИИ:',
      'opp.human': 'ЧЕЛОВЕК',
      'opp.human.sub': 'хот-сит · 2 игрока',
      'opp.ai': 'ИИ',
      'opp.ai.sub': 'игра против машины',
      'side.X.sub': 'ход первым',
      'side.O.sub': 'ход вторым',
      'level.0': 'СКРИП-КИДДИ',
      'level.0.sub': 'случайность и шум',
      'level.1': 'НЕТРАННЕР',
      'level.1.sub': 'жадная эвристика',
      'level.2': 'КОРПОРАТИВНЫЙ ИИ',
      'level.2.sub': 'перебор · до ~1 сек',
      'btn.start': '▶ ИНИЦИАЛИЗИРОВАТЬ МАТЧ',
      'btn.rules': 'ПРАВИЛА // ПРОТОКОЛ',
      'hint.hypercube': 'ГИПЕРКУБ: {dims} · {cells} клеток · {lines} линий победы',
      'tag.mode.hypercube': '// ГИПЕРКУБ · {dims} · {n} В РЯД',
      'tag.opponent.human': '// ХОТ-СИТ · 2 ИГРОКА',
      'tag.opponent.ai': '// ИИ: {level}',
      'tag.round': 'РАУНД {n}',
      'score.draws': 'НИЧЬИ',
      'btn.sound.on': 'ЗВУК: ВКЛ',
      'btn.sound.off': 'ЗВУК: ВЫКЛ',
      'btn.restart': '⟲ РЕСТАРТ',
      'btn.menu': 'МЕНЮ',
      'turn.thinking': 'ИИ ДУМАЕТ',
      'turn.hotseat': '▶ ХОД: {sym}',
      'turn.you': '▶ ВАШ ХОД: {sym}',
      'turn.line': '// ЛИНИЯ ЗАМКНУТА: {sym} ПОБЕЖДАЕТ',
      'turn.draw': '// ПАРТИЯ ЗАВЕРШЕНА: НИЧЬЯ',
      'hint.board': 'СРЕЗЫ w×x // ВНУТРИ СРЕЗА: СТРОКИ y · СТОЛБЦЫ z',
      'btn.next': '▶ СЛЕДУЮЩИЙ РАУНД',
      'btn.hide': '▼ СВЕРНУТЬ // АНАЛИЗ',
      'overlay.title.x': '{sym} ПОБЕЖДАЕТ',
      'overlay.title.ai': 'ИИ ПОБЕЖДАЕТ',
      'overlay.title.hack': 'ВЗЛОМ ПОДТВЕРЖДЁН',
      'overlay.title.draw': 'НИЧЬЯ',
      'overlay.sub.draw': '// СИСТЕМА СБАЛАНСИРОВАНА',
      'overlay.sub.hack': '// ЧЕЛОВЕК ({sym}) ОБХОДИТ ИИ · УРОВЕНЬ: {level}',
      'overlay.sub.ai': '// СИМВОЛ {sym} · УРОВЕНЬ: {level}',
      'overlay.sub.line': '// ЛИНИЯ ЗАМКНУТА В ЧЕТЫРЁХ ИЗМЕРЕНИЯХ',
      'rules.title': '// ПРОТОКОЛ: ПРАВИЛА ГИПЕРПОЛЯ',
      'btn.rules.close': '✕ ЗАКРЫТЬ',
      'aria.cell': 'Срез {wx}, клетка {yz}',
      'rules.1.t': '1 · ГИПЕРПОЛЕ',
      'rules.1.p': 'Партия идёт в четырёхмерном кубе n×n×n×n. Каждая клетка адресуется четырьмя координатами (w, x, y, z). Для человека гиперполе отображается сеткой срезов: строки сетки — координата w, столбцы — x; внутри среза строки — y, столбцы — z.',
      'rules.2.t': '2 · ХОДЫ',
      'rules.2.p': 'Соперники по очереди занимают свободные клетки: X — циановый крест, O — маджентовый круг. В первом раунде первым ходит X, в каждом следующем раунде стартёр чередуется.',
      'rules.3.t': '3 · ПОБЕДА И НИЧЬЯ',
      'rules.3.p': 'Победа — собрать линию из {n} своих символов по любой прямой четырёхмерного пространства:',
      'rules.3.li1': 'по оси — вдоль одного измерения;',
      'rules.3.li2': 'диагональ среза — в плоскости двух измерений;',
      'rules.3.li3': 'диагональ куба — через объём трёх измерений;',
      'rules.3.li4': 'диагональ гиперкуба — через все четыре измерения.',
      'rules.3.p2': 'Таких линий {lines}. Ничья: все игровые клетки заняты, а линии нет. Выигрышная линия подсвечивается на поле — окно победы можно свернуть и разобрать комбинацию.',
      'rules.4.t': '4 · ПОЛЕ',
      'rules.4.p': '<b>ГИПЕРКУБ</b> — {dims}, {cells} клеток, победа — {n} в ряд. Поле без ограничений, глубокая честная борьба.',
      'rules.5.t': '5 · СОПЕРНИКИ',
      'rules.5.li1': '<b>ХОТ-СИТ</b> — два человека по очереди за одним устройством.',
      'rules.5.li2': '<b>ИИ «СКРИП-КИДДИ»</b> — шум и случайность, изредка замечает очевидное.',
      'rules.5.li3': '<b>ИИ «НЕТРАННЕР»</b> — жадная эвристика: выигрывает, блокирует, тянет лучшие линии.',
      'rules.5.li4': '<b>ИИ «КОРПОРАТИВНЫЙ»</b> — перебор альфа-бета с оценкой всех линий; думает до ~1 секунды.',
      'rules.6.t': '6 · МАТЧ',
      'rules.6.p': 'Победы X, победы O и ничьи суммируются между раундами. Смена соперника запускает новый матч и сбрасывает счёт.',
    },
  };

  let lang = 'en';
  try { if (localStorage.getItem('xo4d.lang') === 'ru') lang = 'ru'; } catch (e) { /* приватный режим */ }

  function t(key, params) {
    let s = (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
    if (params) for (const k in params) s = s.split('{' + k + '}').join(params[k]);
    return s;
  }

  /* единый путь смены языка: статика по data-i18n, динамика — через render-функции ниже */
  function applyStaticI18n() {
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n, PARAMS); });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml, PARAMS); });
  }

  function setLang(l) {
    lang = l;
    try { localStorage.setItem('xo4d.lang', l); } catch (e) { /* игнорируем */ }
    document.documentElement.lang = l;
    document.title = t('title.tag');
    applyStaticI18n();
    renderMenuHint();
    renderTags();
    renderScore();
    renderTurn();
    updateMuteLabel();
    applyBoardAria();
  }

  /* ---------- состояние UI-слоя ---------- */

  const config = { opponent: 'human', humanSide: 'X', aiLevel: 1 };
  let match = null;          // экземпляр Match (логика матча — в js/match.js)
  let cellEls = [];
  let aiToken = 0;
  let aiTimer = null;
  let overlayTimer = null;
  let overlayDismissed = false;

  const $ = (s) => document.querySelector(s);
  const sideCode = (s) => (s === 'X' ? GameCore.X : GameCore.O);
  const symOf = (code) => (code === GameCore.X ? 'X' : 'O');
  const pad2 = (v) => String(v).padStart(2, '0');
  const symSpan = (s) => `<span class="sym-${s === 'X' ? 'x' : 'o'}">${s}</span>`;

  /* ---------- экраны ---------- */

  function showScreen(id) {
    $('#screen-menu').classList.toggle('hidden', id !== 'screen-menu');
    $('#screen-game').classList.toggle('hidden', id !== 'screen-game');
  }

  /* ---------- меню ---------- */

  function wireSeg(id, onPick) {
    const seg = $(id);
    seg.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (!btn || btn.classList.contains('active')) return;
      seg.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
      AudioFX.click();
      onPick(btn.dataset.value);
    });
  }

  function renderMenuHint() {
    $('#menu-hint').textContent = t('hint.hypercube', PARAMS);
  }

  function initMenu() {
    wireSeg('#seg-lang', setLang);
    wireSeg('#seg-opponent', (v) => {
      config.opponent = v;
      document.querySelectorAll('.ai-only').forEach((el) => el.classList.toggle('hidden', v !== 'ai'));
    });
    wireSeg('#seg-side', (v) => { config.humanSide = v; });
    wireSeg('#seg-level', (v) => { config.aiLevel = +v; });
    $('#btn-start').addEventListener('click', () => { AudioFX.click(); startMatch(); });
    renderMenuHint();
  }

  /* ---------- матч и раунды (логика — в Match, здесь только UI) ---------- */

  function startMatch() {
    cancelTimers();
    overlayDismissed = false;
    match = Match.create(
      { n: N, opponent: config.opponent, humanSide: config.humanSide, aiLevel: config.aiLevel },
      { core: GameCore, ai: AI },
    );
    match.newMatch();
    showScreen('screen-game');
    beginRound();
  }

  function nextRound() {
    match.nextRound();
    hideOverlay();
    beginRound();
  }

  function restartRound() {
    match.restartRound(); // тот же номер раунда — тот же стартёр
    hideOverlay();
    beginRound();
  }

  function backToMenu() {
    cancelTimers();
    overlayDismissed = false;
    match = null;
    hideOverlay();
    showScreen('screen-menu');
  }

  function beginRound() {
    buildBoard();
    renderTags();
    renderScore();
    renderTurn();
    if (match.isAiTurn()) scheduleAI();
  }

  function cancelTimers() {
    aiToken++;
    if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
    if (overlayTimer) { clearTimeout(overlayTimer); overlayTimer = null; }
  }

  /* ---------- ходы ---------- */

  function onCellClick(idx) {
    if (!match || match.game.winner) { AudioFX.error(); return; }
    if (match.game.cells[idx] !== 0) { AudioFX.error(); return; }
    if (match.isAiTurn()) { AudioFX.error(); return; }
    afterMove(match.play(idx), idx);
  }

  function afterMove(mover, idx) {
    if (!mover) return;
    if (mover === GameCore.X) AudioFX.moveX(); else AudioFX.moveO();
    renderCell(idx, mover);
    if (match.game.winner) { endRoundUI(); return; }
    if (match.isAiTurn()) scheduleAI();
    else renderTurn();
  }

  function scheduleAI() {
    const token = ++aiToken;
    renderTurn();
    AudioFX.aiThink();
    aiTimer = setTimeout(() => {
      if (token !== aiToken || !match || match.game.winner) return;
      const mover = match.aiMove();
      afterMove(mover, match.game.lastMove);
    }, AI.delayFor(config.aiLevel));
  }

  /* ---------- конец раунда (UI-сторона) ---------- */

  function endRoundUI() {
    cancelTimers();
    const w = match.game.winner;
    renderScore();
    renderTurn();

    $('#board').classList.add('finished');
    if (match.game.winLine) {
      const set = new Set(match.game.winLine);
      cellEls.forEach((el, idx) => {
        el.classList.toggle('win', set.has(idx));
        el.classList.toggle('dim', !set.has(idx));
      });
    } else {
      cellEls.forEach((el) => el.classList.add('dim'));
    }

    if (w === GameCore.DRAW) AudioFX.draw();
    else if (match.config.opponent === 'ai' && w !== sideCode(match.config.humanSide)) AudioFX.lose();
    else AudioFX.win();

    overlayTimer = setTimeout(() => {
      overlayTimer = null;
      if (match && match.game.winner) showOverlay(w);
    }, 700);
  }

  /* ---------- рендер ---------- */

  function buildBoard() {
    const n = match.game.n;
    const board = $('#board');
    board.style.setProperty('--n', n);
    board.classList.remove('finished');

    let html = '';
    for (let w = 0; w < n; w++) {
      for (let x = 0; x < n; x++) {
        html += `<div class="slice" style="--sw:${w};--sx:${x}"><span class="slice-tag">${w}.${x}</span><div class="slice-grid">`;
        for (let y = 0; y < n; y++) {
          for (let z = 0; z < n; z++) {
            const idx = GameCore.idxOf(n, w, x, y, z);
            html += `<button class="cell" data-idx="${idx}" data-wx="${w}.${x}" data-yz="${y}.${z}"></button>`;
          }
        }
        html += '</div></div>';
      }
    }
    board.innerHTML = html;
    cellEls = new Array(match.game.cellCount);
    board.querySelectorAll('.cell').forEach((el) => { cellEls[+el.dataset.idx] = el; });
    applyBoardAria();
  }

  /* aria-метки живут отдельно от разметки: пересчитываются при каждой смене языка */
  function applyBoardAria() {
    if (!cellEls.length) return;
    const label = t('aria.cell');
    cellEls.forEach((el) => {
      if (el) el.setAttribute('aria-label', label.replace('{wx}', el.dataset.wx).replace('{yz}', el.dataset.yz));
    });
  }

  function renderCell(idx, player) {
    const el = cellEls[idx];
    if (!el) return;
    el.classList.add('filled');
    el.innerHTML = '<span class="mark ' + (player === GameCore.X ? 'mark-x' : 'mark-o') + '" aria-hidden="true"></span>';
    cellEls.forEach((c) => c.classList.remove('last'));
    el.classList.add('last');
  }

  function renderTurnClass() {
    const board = $('#board');
    if (!match || match.game.winner) { board.classList.remove('turn-x', 'turn-o'); return; }
    board.classList.toggle('turn-x', match.game.turn === GameCore.X);
    board.classList.toggle('turn-o', match.game.turn === GameCore.O);
  }

  /* кнопка «следующий раунд» вне оверлея — видна, когда окно победы свёрнуто для анализа */
  function updateInlineNext() {
    $('#inline-next').classList.toggle('hidden', !(match && match.game.winner && overlayDismissed));
  }

  function renderTurn() {
    const el = $('#turn-banner');
    renderTurnClass();
    updateInlineNext();
    if (!match) { el.textContent = ''; return; }
    const g = match.game;

    if (g.winner) {
      el.classList.remove('thinking');
      if (g.winner === GameCore.DRAW) el.textContent = t('turn.draw');
      else el.innerHTML = t('turn.line').replace('{sym}', symSpan(symOf(g.winner)));
      return;
    }

    if (match.isAiTurn()) {
      el.innerHTML = t('turn.thinking') + '<span class="dots"><span>.</span><span>.</span><span>.</span></span>';
      el.classList.add('thinking');
    } else {
      el.classList.remove('thinking');
      const key = match.config.opponent === 'ai' ? 'turn.you' : 'turn.hotseat';
      el.innerHTML = t(key).replace('{sym}', symSpan(g.turn));
    }
  }

  function scoreView() {
    const s = match ? match.score : { X: 0, O: 0, D: 0 };
    return `<span class="score-x">X ${pad2(s.X)}</span>` +
      `<span class="score-d">${t('score.draws')} ${pad2(s.D)}</span>` +
      `<span class="score-o">O ${pad2(s.O)}</span>`;
  }

  function renderScore() {
    $('#score').innerHTML = scoreView();
  }

  function renderTags() {
    $('#tag-mode').textContent = t('tag.mode.hypercube', PARAMS);
    $('#tag-opponent').textContent = config.opponent === 'human'
      ? t('tag.opponent.human')
      : t('tag.opponent.ai').replace('{level}', t('level.' + config.aiLevel));
    $('#tag-round').textContent = t('tag.round').replace('{n}', pad2((match ? match.round : 0) + 1));
  }

  function updateMuteLabel() {
    $('#btn-mute').textContent = AudioFX.muted ? t('btn.sound.off') : t('btn.sound.on');
  }

  /* ---------- оверлей итога ---------- */

  function showOverlay(w) {
    overlayDismissed = false;
    updateInlineNext();
    const tEl = $('#overlay-title');
    let title, sub, cls;
    if (w === GameCore.DRAW) {
      title = t('overlay.title.draw');
      sub = t('overlay.sub.draw');
      cls = 't-draw';
    } else {
      const s = symOf(w);
      if (match.config.opponent === 'ai') {
        if (w === sideCode(match.config.humanSide)) {
          title = t('overlay.title.hack');
          sub = t('overlay.sub.hack').replace('{sym}', s).replace('{level}', t('level.' + match.config.aiLevel));
        } else {
          title = t('overlay.title.ai');
          sub = t('overlay.sub.ai').replace('{sym}', s).replace('{level}', t('level.' + match.config.aiLevel));
        }
      } else {
        title = t('overlay.title.x').replace('{sym}', s);
        sub = t('overlay.sub.line');
      }
      cls = w === GameCore.X ? 't-x' : 't-o';
    }
    tEl.textContent = title;
    tEl.dataset.text = title;
    tEl.className = `glitch ${cls}`;
    $('#overlay-sub').textContent = sub;
    $('#overlay-score').innerHTML =
      `<span class="score-x">X ${pad2(match.score.X)}</span> · ` +
      `<span class="score-d">${t('score.draws')} ${pad2(match.score.D)}</span> · ` +
      `<span class="score-o">O ${pad2(match.score.O)}</span>`;
    $('#overlay').classList.remove('hidden');
  }

  function hideOverlay() { $('#overlay').classList.add('hidden'); }

  /* ---------- инициализация ---------- */

  function init() {
    document.querySelectorAll('#seg-lang .seg-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.value === lang);
    });

    initMenu();
    setLang(lang);

    $('#board').addEventListener('click', (e) => {
      const cell = e.target.closest('.cell');
      if (cell) onCellClick(+cell.dataset.idx);
    });

    $('#btn-restart').addEventListener('click', () => { AudioFX.click(); restartRound(); });
    $('#btn-menu').addEventListener('click', () => { AudioFX.click(); backToMenu(); });
    $('#btn-next').addEventListener('click', () => { AudioFX.click(); nextRound(); });
    $('#btn-overlay-menu').addEventListener('click', () => { AudioFX.click(); backToMenu(); });

    $('#btn-hide').addEventListener('click', () => {
      AudioFX.click();
      overlayDismissed = true;
      hideOverlay();
      renderTurn();
    });
    $('#btn-banner-next').addEventListener('click', () => { AudioFX.click(); nextRound(); });

    $('#btn-rules').addEventListener('click', () => { AudioFX.click(); $('#rules-overlay').classList.remove('hidden'); });
    $('#btn-rules-close').addEventListener('click', () => { AudioFX.click(); $('#rules-overlay').classList.add('hidden'); });
    $('#rules-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
    });

    const muteBtn = $('#btn-mute');
    muteBtn.addEventListener('click', () => {
      AudioFX.toggle();
      updateMuteLabel();
    });
    updateMuteLabel();

    document.addEventListener('pointerdown', () => AudioFX.unlock(), { once: true });
    showScreen('screen-menu');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
