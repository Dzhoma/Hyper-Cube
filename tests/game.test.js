import { test } from 'node:test';
import assert from 'node:assert';
import GameCore from '../js/game.js';

test('create(4): 256 клеток, 520 линий, старт по умолчанию X', () => {
  const g = GameCore.create(4);
  assert.equal(g.cellCount, 256);
  assert.equal(g.lines.length, 520);
  assert.equal(g.turn, GameCore.X);
  assert.equal(g.winner, 0);
  assert.equal(g.lastMove, -1);
});

test('create(4, {starter}) задаёт стартёра раунда', () => {
  assert.equal(GameCore.create(4, { starter: GameCore.O }).turn, GameCore.O);
  assert.equal(GameCore.create(4, { starter: GameCore.X }).turn, GameCore.X);
});

test('idxOf — единственное место с формулой адресации', () => {
  assert.equal(GameCore.idxOf(4, 1, 2, 3, 0), ((1 * 4 + 2) * 4 + 3) * 4 + 0);
  assert.equal(GameCore.idxOf(4, 0, 0, 0, 0), 0);
  assert.equal(GameCore.idxOf(4, 3, 3, 3, 3), 255);
});

test('facts(4): единый источник чисел для UI', () => {
  assert.deepEqual(GameCore.facts(4), { n: 4, dims: '4×4×4×4', cells: 256, lines: 520 });
});

test('applyMove: победа X по оси z, линия возвращается', () => {
  const g = GameCore.create(4);
  for (const idx of [0, 16, 1, 17, 2, 18, 3]) GameCore.applyMove(g, idx);
  assert.equal(g.winner, GameCore.X);
  assert.deepEqual(Array.from(g.winLine), [0, 1, 2, 3]);
});

test('applyMove: ход переключается, пока нет победы', () => {
  const g = GameCore.create(4);
  GameCore.applyMove(g, 0);
  assert.equal(g.turn, GameCore.O);
  GameCore.applyMove(g, 16);
  assert.equal(g.turn, GameCore.X);
});
