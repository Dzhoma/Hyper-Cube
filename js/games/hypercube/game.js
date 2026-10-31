/*
 * Ядро игры «Гиперполе»: четырёхмерный куб n×n×n×n.
 *
 * INTERFACE — всё, что должен знать вызывающий:
 *   create(n, { starter })          → state (описан ниже); starter — код символа,
 *                                     начинающего партию (по умолчанию X).
 *   applyMove(state, idx)           → state; занимает клетку idx текущим символом,
 *                                     переключает ход или фиксирует победу/ничью.
 *   lineWinsFor(state, idx, player) → массив индексов закрывающей линии или null.
 *   idxOf(n, w, x, y, z)            → индекс клетки; единственное место, где живёт
 *                                     формула адресации idx = ((w*n + x)*n + y)*n + z.
 *   facts(n)                        → { n, dims, cells, lines } — справка о поле для UI.
 *   X = 1, O = 2, DRAW = 3          → кодировка символов и ничьей.
 *
 * State — plain data и объявленная часть interface (её читают app.js и ai.js):
 *   n, cellCount, lines (массивы индексов выигрышных линий), cellLines,
 *   cells — Int8Array: 0 пусто, 1 X, 2 O;
 *   turn — 1 X / 2 O; moveCount; winner — 0 идёт / X / O / DRAW;
 *   winLine — массив индексов или null; lastMove — индекс или -1.
 */
const GameCore = (() => {
  const X = 1;
  const O = 2;
  const DRAW = 3;

  /* индекс клетки — единственное место с формулой адресации */
  function idxOf(n, w, x, y, z) {
    return ((w * n + x) * n + y) * n + z;
  }

  /* Канонические направления: компоненты из {-1,0,1}, первая ненулевая = +1. */
  function makeDirections() {
    const dirs = [];
    for (let mask = 0; mask < 81; mask++) {
      const v = [0, 0, 0, 0];
      let m = mask;
      for (let i = 0; i < 4; i++) {
        v[i] = (m % 3) - 1;
        m = Math.floor(m / 3);
      }
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
        for (let j = 0; j < free.length; j++) {
          s[free[j]] = t % n;
          t = Math.floor(t / n);
        }
        const line = Array.from({ length: n });
        for (let step = 0; step < n; step++) {
          line[step] = idxOf(
            n,
            s[0] + v[0] * step,
            s[1] + v[1] * step,
            s[2] + v[2] * step,
            s[3] + v[3] * step,
          );
        }
        lines.push(line);
      }
    }
    return lines;
  }

  function create(n, { starter = X } = {}) {
    const lines = makeLines(n);
    const cellCount = n * n * n * n;
    const cellLines = Array.from({ length: cellCount }, () => []);
    for (let li = 0; li < lines.length; li++) {
      for (const c of lines[li]) cellLines[c].push(li);
    }
    return {
      n,
      cellCount,
      lines,
      cellLines,
      cells: new Int8Array(cellCount),
      turn: starter,
      moveCount: 0,
      winner: 0, // 0 — партия идёт
      winLine: null,
      lastMove: -1,
    };
  }

  /* Справка о поле для UI: размеры, число клеток и линий — единый источник чисел. */
  function facts(n) {
    return {
      n,
      dims: `${n}×${n}×${n}×${n}`,
      cells: n * n * n * n,
      lines: makeLines(n).length,
    };
  }

  /* Линия через клетку idx, целиком занятая символом player, или null. */
  function lineWinsFor(state, idx, player) {
    const { lines, cellLines, cells } = state;
    for (const li of cellLines[idx]) {
      const line = lines[li];
      let ok = true;
      for (let i = 0; i < line.length; i++) {
        if (cells[line[i]] !== player) {
          ok = false;
          break;
        }
      }
      if (ok) return line;
    }
    return null;
  }

  function applyMove(state, idx) {
    const player = state.turn;
    state.cells[idx] = player;
    state.lastMove = idx;
    state.moveCount++;
    const winLine = lineWinsFor(state, idx, player);
    if (winLine) {
      state.winner = player;
      state.winLine = winLine;
    } else if (state.moveCount === state.cellCount) {
      state.winner = DRAW;
    } else {
      state.turn = 3 - player;
    }
    return state;
  }

  return { X, O, DRAW, create, applyMove, lineWinsFor, idxOf, facts };
})();

export default GameCore;
