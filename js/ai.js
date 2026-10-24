'use strict';

/*
 * ИИ трёх уровней:
 *   0 «Скрип-кидди»      — случайность с редкими тактическими рефлексами;
 *   1 «Нетраннер»        — жадная эвристика (выиграть / заблокировать / лучший прирост);
 *   2 «Корпоративный ИИ» — негамакс с альфа-бета, инкрементальной оценкой линий
 *                          и итеративным углублением в пределах бюджета времени.
 *
 * INTERFACE:
 *   choose(state, level, { budgetMs, rng }) → индекс клетки;
 *     state — plain-data state GameCore (см. interface в js/game.js); модуль не
 *     мутирует его: Engine работает на собственной копии. rng — генератор
 *     случайности [0,1): инъекция делает уровни 0/1 детерминированными в тестах.
 *   delayFor(level, rng) → мс паузы перед ходом (UI-ритм — забота seam ИИ).
 */
const AI = (() => {
  const INF = 1e9;
  const WIN = 1e6;
  const TIMEOUT = { timeout: true };
  const DEFAULT_BUDGET_MS = 900;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  /* Вес линии по числу своих символов: 10, 100, 1000, ... */
  function weightsFor(n) {
    const w = [0];
    for (let k = 1; k <= n; k++) w.push(Math.pow(10, k));
    return w;
  }

  function lineScore(w, a, b) {
    if (a > 0) return b > 0 ? 0 : w[a];
    return b > 0 ? -w[b] : 0;
  }

  /* Рабочая копия позиции с инкрементальной оценкой (score > 0 — лучше для X). */
  function Engine(state) {
    this.n = state.n;
    this.lines = state.lines;
    this.cellLines = state.cellLines;
    this.cells = Int8Array.from(state.cells);
    this.w = weightsFor(state.n);

    const L = state.lines.length;
    this.cx = new Int16Array(L);
    this.co = new Int16Array(L);

    let score = 0;
    let occupied = 0;
    for (let li = 0; li < L; li++) {
      const line = state.lines[li];
      let a = 0, b = 0;
      for (let i = 0; i < line.length; i++) {
        const v = this.cells[line[i]];
        if (v === 1) a++; else if (v === 2) b++;
      }
      this.cx[li] = a;
      this.co[li] = b;
      score += lineScore(this.w, a, b);
    }
    for (let i = 0; i < this.cells.length; i++) if (this.cells[i] !== 0) occupied++;
    this.empty = this.cells.length - occupied;
    this.score = score;

    /* статический порядок перебора: клетки, лежащие на большем числе линий, первыми */
    this.order = Array.from({ length: this.cells.length }, (_, i) => i)
      .sort((x, y) => state.cellLines[y].length - state.cellLines[x].length);

    this.nodes = 0;
    this.deadline = Infinity;
  }

  Engine.prototype.make = function (idx, player) {
    this.cells[idx] = player;
    this.empty--;
    const isX = player === 1;
    const cls = this.cellLines[idx];
    for (let i = 0; i < cls.length; i++) {
      const li = cls[i];
      const old = lineScore(this.w, this.cx[li], this.co[li]);
      if (isX) this.cx[li]++; else this.co[li]++;
      this.score += lineScore(this.w, this.cx[li], this.co[li]) - old;
    }
  };

  Engine.prototype.unmake = function (idx, player) {
    this.cells[idx] = 0;
    this.empty++;
    const isX = player === 1;
    const cls = this.cellLines[idx];
    for (let i = 0; i < cls.length; i++) {
      const li = cls[i];
      const old = lineScore(this.w, this.cx[li], this.co[li]);
      if (isX) this.cx[li]--; else this.co[li]--;
      this.score += lineScore(this.w, this.cx[li], this.co[li]) - old;
    }
  };

  Engine.prototype.isWin = function (idx, player) {
    const cls = this.cellLines[idx];
    for (let i = 0; i < cls.length; i++) {
      const line = this.lines[cls[i]];
      let ok = true;
      for (let j = 0; j < line.length; j++) {
        if (this.cells[line[j]] !== player) { ok = false; break; }
      }
      if (ok) return true;
    }
    return false;
  };

  /* Оценка с точки зрения игрока, чей ход. */
  Engine.prototype.eval = function (player) {
    return player === 1 ? this.score : -this.score;
  };

  Engine.prototype.negamax = function (depth, alpha, beta, player, ply) {
    if ((++this.nodes & 255) === 0 && now() > this.deadline) throw TIMEOUT;
    if (depth <= 0) return this.eval(player);
    const cells = this.cells;
    const order = this.order;
    let best = -INF;
    for (let i = 0; i < order.length; i++) {
      const m = order[i];
      if (cells[m] !== 0) continue;
      this.make(m, player);
      let v;
      if (this.isWin(m, player)) v = WIN - ply;
      else if (this.empty === 0) v = 0;
      else if (depth === 1) v = -this.eval(3 - player);
      else v = -this.negamax(depth - 1, -beta, -alpha, 3 - player, ply + 1);
      this.unmake(m, player);
      if (v > best) best = v;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  };

  /* Насколько ход улучшает позицию: развитие своих линий + блокировка чужих. */
  function moveGain(eng, idx, player) {
    const w = eng.w;
    const cls = eng.cellLines[idx];
    let gain = 0;
    for (let i = 0; i < cls.length; i++) {
      const li = cls[i];
      const a = eng.cx[li]; // X в линии
      const b = eng.co[li]; // O в линии
      if (player === 1) {
        if (b === 0) gain += w[a + 1] - w[a];
        if (a === 0) gain += 0.9 * w[b];
      } else {
        if (a === 0) gain += w[b + 1] - w[b];
        if (b === 0) gain += 0.9 * w[a];
      }
    }
    return gain;
  }

  /* Все ходы, которыми player немедленно замыкает линию. */
  function immediateMoves(eng, player) {
    const res = [];
    const cells = eng.cells;
    for (let idx = 0; idx < cells.length; idx++) {
      if (cells[idx] !== 0) continue;
      eng.make(idx, player);
      const win = eng.isWin(idx, player);
      eng.unmake(idx, player);
      if (win) res.push(idx);
    }
    return res;
  }

  function pickRandom(arr, rng) { return arr[(rng() * arr.length) | 0]; }

  function bestByGain(eng, moves, player, rng) {
    let best = moves[0];
    let bestG = -Infinity;
    for (const m of moves) {
      const g = moveGain(eng, m, player) + rng() * 1e-6;
      if (g > bestG) { bestG = g; best = m; }
    }
    return best;
  }

  function emptiesOf(eng) {
    const res = [];
    for (let i = 0; i < eng.cells.length; i++) if (eng.cells[i] === 0) res.push(i);
    return res;
  }

  /* Уровень 0: шум с редкими проблесками тактики. */
  function chooseLevel0(state, rng) {
    const eng = new Engine(state);
    const player = state.turn;
    const wins = immediateMoves(eng, player);
    if (wins.length && rng() < 0.5) return pickRandom(wins, rng);
    const oppWins = immediateMoves(eng, 3 - player);
    if (oppWins.length && rng() < 0.4) return pickRandom(oppWins, rng);
    return pickRandom(emptiesOf(eng), rng);
  }

  /* Уровень 1: вынужденные ходы + жадный выбор по приросту оценки. */
  function chooseLevel1(state, rng) {
    const eng = new Engine(state);
    const player = state.turn;
    const wins = immediateMoves(eng, player);
    if (wins.length) return pickRandom(wins, rng);
    const oppWins = immediateMoves(eng, 3 - player);
    if (oppWins.length) return bestByGain(eng, oppWins, player, rng);

    let bestG = -Infinity;
    let ties = [];
    for (let idx = 0; idx < eng.cells.length; idx++) {
      if (eng.cells[idx] !== 0) continue;
      const g = moveGain(eng, idx, player);
      if (g > bestG + 1e-9) { bestG = g; ties = [idx]; }
      else if (Math.abs(g - bestG) <= 1e-9) ties.push(idx);
    }
    return pickRandom(ties, rng);
  }

  /* Уровень 2: альфа-бета с итеративным углублением и лимитом времени. */
  function chooseLevel2(state, budgetMs, rng) {
    const eng = new Engine(state);
    const player = state.turn;

    const wins = immediateMoves(eng, player);
    if (wins.length) return pickRandom(wins, rng);
    const oppWins = immediateMoves(eng, 3 - player);
    if (oppWins.length) return bestByGain(eng, oppWins, player, rng);

    const empties = emptiesOf(eng);
    if (empties.length === 1) return empties[0];

    /* сортировка корневых ходов по эвристическому приросту */
    const scored = empties.map((m) => ({ m, g: moveGain(eng, m, player) }));
    scored.sort((x, y) => y.g - x.g);
    let rootMoves = scored.map((o) => o.m);

    eng.deadline = now() + budgetMs;
    let best = rootMoves[0];

    for (let depth = 2; depth <= 8; depth++) {
      let alpha = -INF;
      let localBest = null;
      try {
        for (const m of rootMoves) {
          eng.make(m, player);
          let v;
          if (eng.isWin(m, player)) v = WIN - 1;
          else if (eng.empty === 0) v = 0;
          else v = -eng.negamax(depth - 1, -INF, -alpha, 3 - player, 1);
          eng.unmake(m, player);
          if (localBest === null || v > alpha) { alpha = v; localBest = m; }
        }
      } catch (e) {
        if (e !== TIMEOUT) throw e;
        break; // незавершённая итерация отбрасывается, остаётся результат прошлой глубины
      }
      best = localBest;
      rootMoves = [best].concat(rootMoves.filter((x) => x !== best)); // PV-ход первым
      if (alpha >= WIN - 100) break;       // форсированный выигрыш найден
      if (alpha <= -(WIN - 100)) break;    // всё проиграно — играем лучшее сопротивление
    }
    return best;
  }

  /* Пауза перед ходом ИИ: у «Корпоративного» поиск и так заметен, у прочих — лёгкая задержка. */
  function delayFor(level, rng = Math.random) {
    return level === 2 ? 120 : 280 + rng() * 260;
  }

  function choose(state, level, opts = {}) {
    const { budgetMs = DEFAULT_BUDGET_MS, rng = Math.random } = opts;
    if (level <= 0) return chooseLevel0(state, rng);
    if (level === 1) return chooseLevel1(state, rng);
    return chooseLevel2(state, budgetMs, rng);
  }

  return { choose, delayFor };
})();

/* Загрузка в Node без этапа сборки: в браузере module не существует. */
if (typeof module !== 'undefined' && module.exports) module.exports = AI;
