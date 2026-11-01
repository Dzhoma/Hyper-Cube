/*
 * Чистая логика гиперлабиринта: 4D-сетка n×n×n×n, идеальный лабиринт —
 * остовное дерево на графе ячеек (ровно один путь между любыми двумя ячейками).
 * Без DOM и таймеров; случайность вводится через rnd — детерминизм в тестах
 * (тот же приём, что в AI и змейке).
 *
 * Координаты (w, x, y, z) — конвенция аркады; индекс ячейки:
 *   idx = ((w*n + x)*n + y)*n + z — та же формула, что у Hyper-Cube.
 *
 * Состояние: { n, cells, open (Uint8Array cells*8 — проходы по 8 направлениям),
 *              start, finish, player, steps, seen (Uint8Array), won }.
 * Направления: [dw, dx, dy, dz]; пары противоположностей — 0↔1, 2↔3, 4↔5, 6↔7.
 */
export const DIRS = [
  [1, 0, 0, 0], // 0 — ката (+w)
  [-1, 0, 0, 0], // 1 — ана (-w)
  [0, 1, 0, 0], // 2 — +x
  [0, -1, 0, 0], // 3 — -x
  [0, 0, 1, 0], // 4 — +y
  [0, 0, -1, 0], // 5 — -y
  [0, 0, 0, 1], // 6 — +z
  [0, 0, 0, -1], // 7 — -z
];
export const KATA = 0;
export const ANA = 1;

export const idxOf = (n, w, x, y, z) => ((w * n + x) * n + y) * n + z;

export function decode(idx, n) {
  let v = idx;
  const z = v % n;
  v = (v - z) / n;
  const y = v % n;
  v = (v - y) / n;
  const x = v % n;
  const w = (v - x) / n;
  return [w, x, y, z];
}

export const opposite = (d) => d ^ 1;

/* сосед в направлении d или -1, если шаг выходит за гиперкуб */
export function neighbor(idx, d, n) {
  const [w, x, y, z] = decode(idx, n);
  const [dw, dx, dy, dz] = DIRS[d];
  const nw = w + dw;
  const nx = x + dx;
  const ny = y + dy;
  const nz = z + dz;
  if (nw < 0 || nx < 0 || ny < 0 || nz < 0) return -1;
  if (nw >= n || nx >= n || ny >= n || nz >= n) return -1;
  return idxOf(n, nw, nx, ny, nz);
}

/* идеальный лабиринт: рандомизированный обход в глубину от старта */
function generate(n, rnd) {
  const cells = n ** 4;
  const open = new Uint8Array(cells * 8);
  const seen = new Uint8Array(cells);
  const stack = [0]; // старт (0,0,0,0) — индекс 0
  seen[0] = 1;
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const options = [];
    for (let d = 0; d < 8; d++) {
      const nb = neighbor(cur, d, n);
      if (nb >= 0 && !seen[nb]) options.push(d);
    }
    if (!options.length) {
      stack.pop();
      continue;
    }
    const d = options[Math.floor(rnd() * options.length)];
    const nb = neighbor(cur, d, n);
    open[cur * 8 + d] = 1;
    open[nb * 8 + opposite(d)] = 1;
    seen[nb] = 1;
    stack.push(nb);
  }
  return open;
}

/* путь старт→финиш по дереву; true, если среди шагов есть переход по W */
function pathHasW(n, open) {
  const cells = n ** 4;
  const finish = idxOf(n, n - 1, n - 1, n - 1, n - 1);
  const prevDir = new Uint8Array(cells);
  const prev = new Int32Array(cells).fill(-1);
  const seen = new Uint8Array(cells);
  const queue = [0];
  seen[0] = 1;
  for (let head = 0; head < queue.length && !seen[finish]; head++) {
    const cur = queue[head];
    for (let d = 0; d < 8; d++) {
      if (!open[cur * 8 + d]) continue;
      const nb = neighbor(cur, d, n);
      if (nb >= 0 && !seen[nb]) {
        seen[nb] = 1;
        prev[nb] = cur;
        prevDir[nb] = d;
        queue.push(nb);
      }
    }
  }
  if (!seen[finish]) return false;
  let cur = finish;
  while (cur !== 0) {
    const d = prevDir[cur];
    if (d === KATA || d === ANA) return true;
    cur = prev[cur];
  }
  return false;
}

/*
 * create(n, rnd): идеальный лабиринт, у которого путь старт→финиш требует
 * шагов по W. При противоположных углах w меняется с 0 до n-1, так что
 * условие выполняется всегда — проверка страхует смену старт/финиша.
 */
export function create(n, rnd = Math.random) {
  let open = generate(n, rnd);
  while (!pathHasW(n, open)) open = generate(n, rnd);
  const cells = n ** 4;
  const seen = new Uint8Array(cells);
  seen[0] = 1;
  return {
    n,
    cells,
    open,
    start: 0,
    finish: idxOf(n, n - 1, n - 1, n - 1, n - 1),
    player: 0,
    steps: 0,
    seen,
    won: false,
  };
}

export const isOpen = (state, idx, d) => state.open[idx * 8 + d] === 1;

/* шаг: мутирует состояние, возвращает события ['block'|'move'|'warp'|'win'] */
export function step(state, d) {
  if (state.won) return { state, events: [] };
  const nb = neighbor(state.player, d, state.n);
  if (nb < 0 || !isOpen(state, state.player, d)) return { state, events: ['block'] };
  state.player = nb;
  state.steps++;
  state.seen[nb] = 1;
  const events = ['move'];
  if (d === KATA || d === ANA) events.push('warp');
  if (nb === state.finish) {
    state.won = true;
    events.push('win');
  }
  return { state, events };
}

export default { DIRS, KATA, ANA, idxOf, decode, opposite, neighbor, isOpen, create, step };
