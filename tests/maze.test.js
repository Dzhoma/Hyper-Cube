import { test } from 'node:test';
import assert from 'node:assert';
import Maze from '../js/games/hypermaze/core.js';
import { mulberry32 } from './helpers.js';

const N = 4;
const DIR_COUNT = 8;

/* путь от старта до цели по проходам (лабиринт — дерево, путь единственный) */
function walk(m, target) {
  const prev = new Map();
  const seen = new Set([m.start]);
  const queue = [m.start];
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    if (cur === target) break;
    for (let d = 0; d < DIR_COUNT; d++) {
      if (!Maze.isOpen(m, cur, d)) continue;
      const nb = Maze.neighbor(cur, d, m.n);
      if (nb >= 0 && !seen.has(nb)) {
        seen.add(nb);
        prev.set(nb, { cur, d });
        queue.push(nb);
      }
    }
  }
  if (!seen.has(target)) return { reached: false, path: [] };
  const path = [];
  let cur = target;
  while (cur !== m.start) {
    const step = prev.get(cur);
    path.push(step.d);
    cur = step.cur;
  }
  return { reached: true, path: path.reverse() };
}

const countOpen = (m) => {
  let n = 0;
  for (let i = 0; i < m.open.length; i++) if (m.open[i]) n++;
  return n;
};

test('create: лабиринт связен — от старта достижимы все ячейки', () => {
  const m = Maze.create(N, mulberry32(1));
  const seen = new Set([m.start]);
  const queue = [m.start];
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    for (let d = 0; d < DIR_COUNT; d++) {
      if (!Maze.isOpen(m, cur, d)) continue;
      const nb = Maze.neighbor(cur, d, m.n);
      if (nb >= 0 && !seen.has(nb)) {
        seen.add(nb);
        queue.push(nb);
      }
    }
  }
  assert.equal(seen.size, m.cells);
});

test('create: лабиринт идеален — проходов ровно cells-1 (каждый хранится в обе стороны)', () => {
  const m = Maze.create(N, mulberry32(2));
  assert.equal(countOpen(m), (m.cells - 1) * 2);
});

test('create: проходы симметричны и не ведут за границу гиперкуба', () => {
  const m = Maze.create(N, mulberry32(3));
  for (let idx = 0; idx < m.cells; idx++) {
    for (let d = 0; d < DIR_COUNT; d++) {
      const nb = Maze.neighbor(idx, d, N);
      if (nb < 0) assert.ok(!Maze.isOpen(m, idx, d));
      else assert.equal(Maze.isOpen(m, idx, d), Maze.isOpen(m, nb, Maze.opposite(d)));
    }
  }
});

test('create: путь старт→финиш существует и содержит шаг по W', () => {
  const m = Maze.create(N, mulberry32(4));
  const { reached, path } = walk(m, m.finish);
  assert.ok(reached);
  assert.ok(path.some((d) => d === Maze.KATA || d === Maze.ANA));
});

test('create: детерминизм — один сид даёт один лабиринт, разные сиды различаются', () => {
  const a = Maze.create(N, mulberry32(7));
  const b = Maze.create(N, mulberry32(7));
  const c = Maze.create(N, mulberry32(8));
  assert.deepEqual([...a.open], [...b.open]);
  assert.notDeepEqual([...a.open], [...c.open]);
});

test('step: упор в стену — block, позиция и счётчик шагов не меняются', () => {
  const m = Maze.create(N, mulberry32(5));
  const blocked = [...Array(DIR_COUNT).keys()].find((d) => !Maze.isOpen(m, m.player, d));
  assert.ok(blocked !== undefined);
  const { events } = Maze.step(m, blocked);
  assert.deepEqual(events, ['block']);
  assert.equal(m.player, m.start);
  assert.equal(m.steps, 0);
});

test('step: через проход — move, счётчик шагов, след', () => {
  const m = Maze.create(N, mulberry32(5));
  const d = [...Array(DIR_COUNT).keys()].find((dir) => Maze.isOpen(m, m.player, dir));
  assert.ok(d !== undefined);
  const { events } = Maze.step(m, d);
  assert.ok(events.includes('move'));
  assert.equal(m.steps, 1);
  assert.equal(m.seen[m.player], 1);
});

test('step: переход по W помечается warp', () => {
  const m = Maze.create(N, mulberry32(6));
  const cell = [...Array(m.cells).keys()].find((idx) => Maze.isOpen(m, idx, Maze.KATA));
  assert.ok(cell !== undefined);
  m.player = cell;
  const { events } = Maze.step(m, Maze.KATA);
  assert.ok(events.includes('move'));
  assert.ok(events.includes('warp'));
});

test('step: достижение финиша — win, дальше шагов нет', () => {
  const m = Maze.create(N, mulberry32(4));
  const { path } = walk(m, m.finish);
  let last = [];
  for (const d of path) last = Maze.step(m, d).events;
  assert.ok(last.includes('win'));
  assert.equal(m.won, true);
  assert.equal(m.player, m.finish);
  assert.deepEqual(Maze.step(m, Maze.KATA).events, []);
});

test('create: ядро размеро-независимо — n=3 даёт 81 ячейку и дерево', () => {
  const m = Maze.create(3, mulberry32(9));
  assert.equal(m.cells, 81);
  assert.equal(countOpen(m), (m.cells - 1) * 2);
});
