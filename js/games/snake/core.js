/*
 * Чистая логика змейки: без DOM и таймеров. Случайность вводится через rnd —
 * детерминизм в тестах (тот же приём, что в AI).
 *
 * Состояние: { cols, rows, snake: [{x,y}…] (голова первая), dir, next, food, alive, score }.
 * Поворот между шагами копится в next; шаг применяет его и двигает змею.
 */
export const DIRS = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

const opposite = (a, b) => DIRS[a][0] + DIRS[b][0] === 0 && DIRS[a][1] + DIRS[b][1] === 0;

function spawnFood(state, rnd) {
  const busy = new Set(state.snake.map((p) => p.x + ',' + p.y));
  const free = [];
  for (let y = 0; y < state.rows; y++)
    for (let x = 0; x < state.cols; x++) if (!busy.has(x + ',' + y)) free.push({ x, y });
  if (!free.length) return null; // всё поле съедено — победа
  return free[Math.floor(rnd() * free.length)];
}

export function create(cols, rows, rnd = Math.random) {
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  const state = {
    cols,
    rows,
    snake: [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ],
    dir: 'right',
    next: null,
    food: null,
    alive: true,
    score: 0,
  };
  state.food = spawnFood(state, rnd);
  return state;
}

/* поворот: разворот на 180° запрещён; несколько нажатий до шага — побеждает последнее */
export function turn(state, dir) {
  if (!DIRS[dir] || dir === state.next) return state;
  const moving = state.next || state.dir;
  if (opposite(dir, moving)) return state;
  state.next = dir;
  return state;
}

/* один шаг: мутирует состояние, возвращает события ['eat'|'die'|'win'] */
export function step(state, rnd = Math.random) {
  if (!state.alive) return { state, events: [] };
  state.dir = state.next || state.dir;
  state.next = null;
  const [dx, dy] = DIRS[state.dir];
  const head = state.snake[0];
  const nx = head.x + dx;
  const ny = head.y + dy;

  const events = [];
  if (nx < 0 || ny < 0 || nx >= state.cols || ny >= state.rows) {
    state.alive = false;
    events.push('die');
    return { state, events };
  }

  const eating = state.food && nx === state.food.x && ny === state.food.y;
  // в собственный хвост упереться нельзя: в шаг без роста хвост уходит с дороги
  const body = eating ? state.snake : state.snake.slice(0, -1);
  if (body.some((p) => p.x === nx && p.y === ny)) {
    state.alive = false;
    events.push('die');
    return { state, events };
  }

  state.snake.unshift({ x: nx, y: ny });
  if (eating) {
    state.score++;
    events.push('eat');
    state.food = spawnFood(state, rnd);
    if (!state.food) {
      state.alive = false;
      events.push('win');
    }
  } else {
    state.snake.pop();
  }
  return { state, events };
}

export default { DIRS, create, turn, step };
