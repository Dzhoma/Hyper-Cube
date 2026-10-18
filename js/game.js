'use strict';

/*
 * Ядро игры: гиперполе n×n×n×n, клетки адресуются индексом
 * idx = ((w*n + x)*n + y)*n + z. Символы: 0 — пусто, 1 — X, 2 — O.
 * Победа — линия из n клеток по любому из 4D-направлений.
 */
const GameCore = (() => {

  /* Канонические направления: компоненты из {-1,0,1}, первая ненулевая = +1. */
  function makeDirections() {
    const dirs = [];
    for (let mask = 0; mask < 81; mask++) {
      const v = [0, 0, 0, 0];
      let m = mask;
      for (let i = 0; i < 4; i++) { v[i] = (m % 3) - 1; m = Math.floor(m / 3); }
      let f = 0;
      while (f < 4 && v[f] === 0) f++;
      if (f === 4 || v[f] !== 1) continue;
      dirs.push(v);
    }
    return dirs;
  }

  /* Все выигрышные линии: старт прижат к границе по ненулевым компонентам
     (s_i=0 при v_i=+1, s_i=n-1 при v_i=-1), свободные координаты перебираются при v_i=0. */
  function makeLines(n) {
    const lines = [];
    for (const v of makeDirections()) {
      const free = [];
      for (let i = 0; i < 4; i++) if (v[i] === 0) free.push(i);
      const combos = Math.pow(n, free.length);
      for (let k = 0; k < combos; k++) {
        const s = [0, 0, 0, 0];
        for (let i = 0; i < 4; i++) {
          if (v[i] === 1) s[i] = 0;
          else if (v[i] === -1) s[i] = n - 1;
        }
        let t = k;
        for (let j = 0; j < free.length; j++) { s[free[j]] = t % n; t = Math.floor(t / n); }
        const line = new Array(n);
        for (let step = 0; step < n; step++) {
          const w = s[0] + v[0] * step, x = s[1] + v[1] * step;
          const y = s[2] + v[2] * step, z = s[3] + v[3] * step;
          line[step] = ((w * n + x) * n + y) * n + z;
        }
        lines.push(line);
      }
    }
    return lines;
  }

  /* Индекс абсолютного центра (1,1,1,1) — осмыслен для нечётных n. */
  function centerIdx(n) {
    return ((1 * n + 1) * n + 1) * n + 1;
  }

  function create(n, blocked = []) {
    const lines = makeLines(n);
    const cellCount = n * n * n * n;
    const cellLines = Array.from({ length: cellCount }, () => []);
    for (let li = 0; li < lines.length; li++) {
      for (const c of lines[li]) cellLines[c].push(li);
    }
    const blockedSet = new Set(blocked);
    return {
      n,
      cellCount,
      lines,
      cellLines,
      blocked: blockedSet,
      playableCount: cellCount - blockedSet.size,
      cells: new Int8Array(cellCount),
      turn: 1,        // 1 = X, 2 = O
      moveCount: 0,
      winner: 0,      // 0 — игра идёт, 1 — X, 2 — O, 3 — ничья
      winLine: null,
      lastMove: -1,
    };
  }

  /* Линия через клетку idx, целиком занятая символом player, или null. */
  function lineWinsFor(state, idx, player) {
    const { lines, cellLines, cells } = state;
    for (const li of cellLines[idx]) {
      const line = lines[li];
      let ok = true;
      for (let i = 0; i < line.length; i++) {
        if (cells[line[i]] !== player) { ok = false; break; }
      }
      if (ok) return line;
    }
    return null;
  }

  function applyMove(state, idx) {
    if (state.blocked.has(idx)) return state; // заблокированные клетки не играют
    const player = state.turn;
    state.cells[idx] = player;
    state.lastMove = idx;
    state.moveCount++;
    const winLine = lineWinsFor(state, idx, player);
    if (winLine) {
      state.winner = player;
      state.winLine = winLine;
    } else if (state.moveCount === state.playableCount) {
      state.winner = 3;
    } else {
      state.turn = 3 - player;
    }
    return state;
  }

  return { create, applyMove, lineWinsFor, centerIdx };
})();
