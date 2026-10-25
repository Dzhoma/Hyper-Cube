import { test } from 'node:test';
import assert from 'node:assert';
import AI from '../js/ai.js';
import GameCore from '../js/game.js';
import { mulberry32 } from './helpers.js';

/* X занимает 0,1,2 — фор на клетку 3 (ось z среза 0.0); O вдали, парой. */
function almostWon() {
  const s = GameCore.create(4);
  GameCore.applyMove(s, 0);
  GameCore.applyMove(s, 200);
  GameCore.applyMove(s, 1);
  GameCore.applyMove(s, 201);
  GameCore.applyMove(s, 2);
  return s;
}

test('уровень 1 замыкает свою тройку 0,1,2 ходом 3', () => {
  const s = almostWon(); // ход X
  assert.equal(AI.choose(s, 1, { rng: mulberry32(1) }), 3);
});

test('уровень 1 за O блокирует фор X на клетку 3', () => {
  const s = almostWon();
  s.turn = GameCore.O;
  assert.equal(AI.choose(s, 1, { rng: mulberry32(2) }), 3);
});

test('все уровни возвращают свободную клетку на пустом поле', () => {
  for (const level of [0, 1, 2]) {
    const s = GameCore.create(4);
    const idx = AI.choose(s, level, { rng: mulberry32(7), budgetMs: 300 });
    assert.ok(Number.isInteger(idx) && idx >= 0 && idx < 256, 'уровень ' + level);
    assert.equal(s.cells[idx], 0);
  }
});

test('rng-инъекция делает уровень 0 детерминированным', () => {
  const a = AI.choose(GameCore.create(4), 0, { rng: mulberry32(42) });
  const b = AI.choose(GameCore.create(4), 0, { rng: mulberry32(42) });
  assert.equal(a, b);
});

test('delayFor живёт на seam ИИ: 120 мс у поиска, 280–540 у прочих', () => {
  assert.equal(AI.delayFor(2), 120);
  assert.equal(
    AI.delayFor(0, () => 0),
    280,
  );
  assert.equal(
    AI.delayFor(1, () => 1),
    540,
  );
});
