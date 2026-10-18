'use strict';

/* Сборка приложения: локализация, меню, матч, раунды, рендер, звук. */
(() => {
  const MODES = {
    classic:   { n: 3, lines: 272, blockedCenter: true },
    hypercube: { n: 4, lines: 520, blockedCenter: false },
  };
  const AI_BUDGET_MS = 900;

  /* ---------- локализация (по умолчанию английский) ---------- */

  const I18N = {
    en: {
      'title.tag': 'Hyper-Cube // tic-tac-toe in four-dimensional space',
      'menu.subtitle': '// HYPERFIELD ACTIVE · TIC-TAC-TOE IN FOUR-DIMENSIONAL SPACE',
      'menu.field.lang': 'LANGUAGE:',
      'menu.field.mode': 'BOARD MODE:',
      'menu.field.opponent': 'OPPONENT:',
      'menu.field.side': 'YOUR SYMBOL:',
      'menu.field.level': 'AI LEVEL:',
      'mode.classic': 'CLASSIC',
      'mode.classic.sub': '3×3×3×3 · 3 in a row',
      'mode.hypercube': 'HYPERCUBE',
      'mode.hypercube.sub': '4×4×4×4 · 4 in a row',
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
      'hint.classic': 'CLASSIC: 3×3×3×3 · 81 cells · 272 winning lines · center blocked',
      'hint.hypercube': 'HYPERCUBE: 4×4×4×4 · 256 cells · 520 winning lines',
      'tag.mode.classic': '// CLASSIC · 3×3×3×3 · 3 IN A ROW',
      'tag.mode.hypercube': '// HYPERCUBE · 4×4×4×4 · 4 IN A ROW',
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
      'aria.blocked': 'Blocked cell',
    },
    ru: {
      'title.tag': 'Hyper-Cube // крестики-нолики четырёхмерного пространства',
      'menu.subtitle': '// ГИПЕРПОЛЕ АКТИВНО · КРЕСТИКИ-НОЛИКИ ЧЕТЫРЁХМЕРНОГО ПРОСТРАНСТВА',
      'menu.field.lang': 'ЯЗЫК:',
      'menu.field.mode': 'РЕЖИМ ПОЛЯ:',
      'menu.field.opponent': 'СОПЕРНИК:',
      'menu.field.side': 'ВАШ СИМВОЛ:',
      'menu.field.level': 'УРОВЕНЬ ИИ:',
      'mode.classic': 'КЛАССИКА',
      'mode.classic.sub': '3×3×3×3 · 3 в ряд',
      'mode.hypercube': 'ГИПЕРКУБ',
      'mode.hypercube.sub': '4×4×4×4 · 4 в ряд',
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
      'hint.classic': 'КЛАССИКА: 3×3×3×3 · 81 клетка · 272 линии победы · центр заблокирован',
      'hint.hypercube': 'ГИПЕРКУБ: 4×4×4×4 · 256 клеток · 520 линий победы',
      'tag.mode.classic': '// КЛАССИКА · 3×3×3×3 · 3 В РЯД',
      'tag.mode.hypercube': '// ГИПЕРКУБ · 4×4×4×4 · 4 В РЯД',
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
      'aria.blocked': 'Заблокированная клетка',
    },
  };

  let lang = 'en';
  try { if (localStorage.getItem('xo4d.lang') === 'ru') lang = 'ru'; } catch (e) { /* приватный режим */ }

  function t(key, params) {
    let s = (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
    if (params) for (const k in params) s = s.split('{' + k + '}').join(params[k]);
    return s;
  }

  function applyStaticI18n() {
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  }

  function setLang(l) {
    lang = l;
    try { localStorage.setItem('xo4d.lang', l); } catch (e) { /* игнорируем */ }
    document.documentElement.lang = l;
    document.title = t('title.tag');
    applyStaticI18n();
    $('#rules-en').classList.toggle('hidden', l !== 'en');
    $('#rules-ru').classList.toggle('hidden', l !== 'ru');
    renderMenuHint();
    renderTags();
    renderScore();
    renderTurn();
    updateMuteLabel();
  }

  const config = { mode: 'classic', opponent: 'human', humanSide: 'X', aiLevel: 1 };
  const match = { scoreX: 0, scoreO: 0, scoreD: 0, round: 0 };

  let game = null;
  let cellEls = [];
  let aiToken = 0;
  let aiTimer = null;
  let overlayTimer = null;
  let overlayDismissed = false;

  const $ = (s) => document.querySelector(s);
  const sideCode = (s) => (s === 'X' ? 1 : 2);
  const symOf = (code) => (code === 1 ? 'X' : 'O');
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
    $('#menu-hint').textContent = t('hint.' + config.mode);
  }

  function initMenu() {
    wireSeg('#seg-lang', setLang);
    wireSeg('#seg-mode', (v) => { config.mode = v; renderMenuHint(); });
    wireSeg('#seg-opponent', (v) => {
      config.opponent = v;
      document.querySelectorAll('.ai-only').forEach((el) => el.classList.toggle('hidden', v !== 'ai'));
    });
    wireSeg('#seg-side', (v) => { config.humanSide = v; });
    wireSeg('#seg-level', (v) => { config.aiLevel = +v; });
    $('#btn-start').addEventListener('click', () => { AudioFX.click(); startMatch(); });
    renderMenuHint();
  }

  /* ---------- матч и раунды ---------- */

  /* стартёр чередуется каждый раунд: раунд 1 — X, раунд 2 — O, ... */
  const starterOf = (round) => (round % 2 === 0 ? 1 : 2);

  function startMatch() {
    match.scoreX = 0;
    match.scoreO = 0;
    match.scoreD = 0;
    match.round = 0;
    showScreen('screen-game');
    startRound();
  }

  function startRound() {
    cancelAI();
    overlayDismissed = false;
    const m = MODES[config.mode];
    game = GameCore.create(m.n, m.blockedCenter ? [GameCore.centerIdx(m.n)] : []);
    game.turn = starterOf(match.round);
    buildBoard();
    renderTags();
    renderScore();
    renderTurn();
    if (isAiTurn()) scheduleAI();
  }

  function nextRound() {
    match.round++;
    hideOverlay();
    startRound();
  }

  function restartRound() {
    hideOverlay();
    startRound(); // тот же номер раунда — тот же стартёр
  }

  function backToMenu() {
    cancelAI();
    overlayDismissed = false;
    hideOverlay();
    showScreen('screen-menu');
  }

  function cancelAI() {
    aiToken++;
    if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
    if (overlayTimer) { clearTimeout(overlayTimer); overlayTimer = null; }
  }

  /* ---------- ходы ---------- */

  const isAiTurn = () => config.opponent === 'ai' && game.turn !== sideCode(config.humanSide);

  function onCellClick(idx) {
    if (!game || game.winner) { AudioFX.error(); return; }
    if (game.cells[idx] !== 0 || game.blocked.has(idx)) { AudioFX.error(); return; }
    if (isAiTurn()) { AudioFX.error(); return; }
    playMove(idx);
  }

  function playMove(idx) {
    const player = game.turn;
    GameCore.applyMove(game, idx);
    if (player === 1) AudioFX.moveX(); else AudioFX.moveO();
    renderCell(idx, player);
    if (game.winner) { endRound(); return; }
    if (isAiTurn()) scheduleAI();
    else renderTurn();
  }

  function scheduleAI() {
    const token = ++aiToken;
    renderTurn();
    AudioFX.aiThink();
    const level = config.aiLevel;
    const delay = level === 2 ? 120 : 280 + Math.random() * 260;
    aiTimer = setTimeout(() => {
      if (token !== aiToken || !game || game.winner) return;
      const idx = AI.choose(game, level, AI_BUDGET_MS);
      if (token !== aiToken || !game || game.winner) return;
      playMove(idx);
    }, delay);
  }

  /* ---------- конец раунда ---------- */

  function endRound() {
    cancelAI();
    const w = game.winner;
    if (w === 1) match.scoreX++;
    else if (w === 2) match.scoreO++;
    else match.scoreD++;
    renderScore();
    renderTurn();

    $('#board').classList.add('finished');
    if (game.winLine) {
      const set = new Set(game.winLine);
      cellEls.forEach((el, idx) => {
        el.classList.toggle('win', set.has(idx));
        el.classList.toggle('dim', !set.has(idx));
      });
    } else {
      cellEls.forEach((el) => el.classList.add('dim'));
    }

    if (w === 3) AudioFX.draw();
    else if (config.opponent === 'ai' && w !== sideCode(config.humanSide)) AudioFX.lose();
    else AudioFX.win();

    overlayTimer = setTimeout(() => {
      overlayTimer = null;
      if (game && game.winner) showOverlay(w);
    }, 700);
  }

  /* ---------- рендер ---------- */

  function buildBoard() {
    const n = game.n;
    const board = $('#board');
    board.style.setProperty('--n', n);
    board.style.maxWidth = n === 3 ? '720px' : '1060px';
    board.classList.remove('finished');

    const cellLabel = t('aria.cell');
    let html = '';
    for (let w = 0; w < n; w++) {
      for (let x = 0; x < n; x++) {
        html += `<div class="slice" style="--sw:${w};--sx:${x}"><span class="slice-tag">${w}.${x}</span><div class="slice-grid">`;
        for (let y = 0; y < n; y++) {
          for (let z = 0; z < n; z++) {
            const idx = ((w * n + x) * n + y) * n + z;
            const label = cellLabel.replace('{wx}', w + '.' + x).replace('{yz}', y + '.' + z);
            html += `<button class="cell" data-idx="${idx}" aria-label="${label}"></button>`;
          }
        }
        html += '</div></div>';
      }
    }
    board.innerHTML = html;
    cellEls = new Array(game.cellCount);
    board.querySelectorAll('.cell').forEach((el) => { cellEls[+el.dataset.idx] = el; });
    game.blocked.forEach((idx) => {
      const el = cellEls[idx];
      el.classList.add('blocked');
      el.disabled = true;
      el.setAttribute('aria-label', t('aria.blocked'));
    });
  }

  function renderCell(idx, player) {
    const el = cellEls[idx];
    if (!el) return;
    el.classList.add('filled');
    el.innerHTML = '<span class="mark ' + (player === 1 ? 'mark-x' : 'mark-o') + '" aria-hidden="true"></span>';
    cellEls.forEach((c) => c.classList.remove('last'));
    el.classList.add('last');
  }

  function renderTurnClass() {
    const board = $('#board');
    if (!game || game.winner) { board.classList.remove('turn-x', 'turn-o'); return; }
    board.classList.toggle('turn-x', game.turn === 1);
    board.classList.toggle('turn-o', game.turn === 2);
  }

  /* кнопка «следующий раунд» вне оверлея — видна, когда окно победы свёрнуто для анализа */
  function updateInlineNext() {
    $('#inline-next').classList.toggle('hidden', !(game && game.winner && overlayDismissed));
  }

  function renderTurn() {
    const el = $('#turn-banner');
    renderTurnClass();
    updateInlineNext();
    if (!game) { el.textContent = ''; return; }

    if (game.winner) {
      el.classList.remove('thinking');
      if (game.winner === 3) el.textContent = t('turn.draw');
      else el.innerHTML = t('turn.line').replace('{sym}', symSpan(symOf(game.winner)));
      return;
    }

    if (isAiTurn()) {
      el.innerHTML = t('turn.thinking') + '<span class="dots"><span>.</span><span>.</span><span>.</span></span>';
      el.classList.add('thinking');
    } else {
      el.classList.remove('thinking');
      const key = config.opponent === 'ai' ? 'turn.you' : 'turn.hotseat';
      el.innerHTML = t(key).replace('{sym}', symSpan(symOf(game.turn)));
    }
  }

  function renderScore() {
    $('#score').innerHTML =
      `<span class="score-x">X ${pad2(match.scoreX)}</span>` +
      `<span class="score-d">${t('score.draws')} ${pad2(match.scoreD)}</span>` +
      `<span class="score-o">O ${pad2(match.scoreO)}</span>`;
  }

  function renderTags() {
    $('#tag-mode').textContent = t('tag.mode.' + config.mode);
    $('#tag-opponent').textContent = config.opponent === 'human'
      ? t('tag.opponent.human')
      : t('tag.opponent.ai').replace('{level}', t('level.' + config.aiLevel));
    $('#tag-round').textContent = t('tag.round').replace('{n}', pad2(match.round + 1));
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
    if (w === 3) {
      title = t('overlay.title.draw');
      sub = t('overlay.sub.draw');
      cls = 't-draw';
    } else {
      const s = symOf(w);
      if (config.opponent === 'ai') {
        if (w === sideCode(config.humanSide)) {
          title = t('overlay.title.hack');
          sub = t('overlay.sub.hack').replace('{sym}', s).replace('{level}', t('level.' + config.aiLevel));
        } else {
          title = t('overlay.title.ai');
          sub = t('overlay.sub.ai').replace('{sym}', s).replace('{level}', t('level.' + config.aiLevel));
        }
      } else {
        title = t('overlay.title.x').replace('{sym}', s);
        sub = t('overlay.sub.line');
      }
      cls = w === 1 ? 't-x' : 't-o';
    }
    tEl.textContent = title;
    tEl.dataset.text = title;
    tEl.className = `glitch ${cls}`;
    $('#overlay-sub').textContent = sub;
    $('#overlay-score').innerHTML =
      `<span class="score-x">X ${pad2(match.scoreX)}</span> · ` +
      `<span class="score-d">${t('score.draws')} ${pad2(match.scoreD)}</span> · ` +
      `<span class="score-o">O ${pad2(match.scoreO)}</span>`;
    $('#overlay').classList.remove('hidden');
  }

  function hideOverlay() { $('#overlay').classList.add('hidden'); }

  /* ---------- инициализация ---------- */

  function init() {
    document.documentElement.lang = lang;
    document.title = t('title.tag');
    applyStaticI18n();
    $('#rules-en').classList.toggle('hidden', lang !== 'en');
    $('#rules-ru').classList.toggle('hidden', lang !== 'ru');
    document.querySelectorAll('#seg-lang .seg-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.value === lang);
    });

    initMenu();

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
