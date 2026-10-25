import { test } from 'node:test';
import assert from 'node:assert';
import Match from '../js/match.js';
import GameCore from '../js/game.js';
import { mulberry32 } from './helpers.js';

/* Фейковый ИИ: зовётся, как настоящий, но играет «первую пустую от idx». */
function fakeAI(idx) {
  const calls = [];
  return {
    calls,
    choose(state, level, opts) {
      calls.push({ level, turn: state.turn, rng: opts.rng });
      let i = idx;
      while (state.cells[i] !== 0) i++;
      return i;
    },
  };
}

test('newMatch: раунд 1 начинает X, счёт в нулях', () => {
  const m = Match.create(
    { n: 4, opponent: 'human', humanSide: 'X' },
    { core: GameCore, ai: fakeAI(0) },
  );
  m.newMatch();
  assert.equal(m.game.turn, GameCore.X);
  assert.deepEqual(m.score, { X: 0, O: 0, D: 0 });
  assert.equal(m.round, 0);
});

test('стартёр чередуется по раундам, restartRound сохраняет его', () => {
  const m = Match.create(
    { n: 4, opponent: 'human', humanSide: 'X' },
    { core: GameCore, ai: fakeAI(0) },
  );
  m.newMatch();
  assert.equal(m.game.turn, GameCore.X);
  m.nextRound();
  assert.equal(m.game.turn, GameCore.O);
  m.nextRound();
  assert.equal(m.game.turn, GameCore.X);
  m.restartRound();
  assert.equal(m.game.turn, GameCore.X);
  assert.equal(m.round, 2);
});

test('play считает счёт ровно один раз за раунд', () => {
  const m = Match.create(
    { n: 4, opponent: 'human', humanSide: 'X' },
    { core: GameCore, ai: fakeAI(0) },
  );
  m.newMatch();
  for (const idx of [0, 16, 1, 17, 2, 18, 3]) m.play(idx);
  assert.equal(m.game.winner, GameCore.X);
  assert.deepEqual(m.score, { X: 1, O: 0, D: 0 });
  assert.equal(m.play(5), 0); // партия окончена — ход отклонён
  assert.deepEqual(m.score, { X: 1, O: 0, D: 0 });
});

test('play отклоняет занятую клетку', () => {
  const m = Match.create(
    { n: 4, opponent: 'human', humanSide: 'X' },
    { core: GameCore, ai: fakeAI(0) },
  );
  m.newMatch();
  assert.equal(m.play(0), GameCore.X);
  assert.equal(m.play(0), 0);
  assert.equal(m.game.moveCount, 1);
});

test('aiMove играет символом ИИ и передаёт уровень и rng на seam', () => {
  const rng = mulberry32(9);
  const ai = fakeAI(5);
  const m = Match.create(
    { n: 4, opponent: 'ai', humanSide: 'O', aiLevel: 2 },
    { core: GameCore, ai, rng },
  );
  m.newMatch();
  assert.ok(m.isAiTurn()); // стартёр X — это ИИ (человек за O)
  assert.equal(m.aiMove(), GameCore.X);
  assert.equal(m.game.cells[5], GameCore.X);
  assert.equal(ai.calls[0].level, 2);
  assert.equal(ai.calls[0].rng, rng);
  assert.ok(!m.isAiTurn()); // теперь ход человека
  assert.equal(m.aiMove(), 0);
});

test('когда стартёр — человек, aiMove бездействует', () => {
  const ai = fakeAI(0);
  const m = Match.create(
    { n: 4, opponent: 'ai', humanSide: 'X', aiLevel: 1 },
    { core: GameCore, ai, rng: mulberry32(1) },
  );
  m.newMatch();
  assert.ok(!m.isAiTurn());
  assert.equal(m.aiMove(), 0);
  assert.equal(ai.calls.length, 0);
});

test('в хот-сите ИИ не ходит', () => {
  const m = Match.create(
    { n: 4, opponent: 'human', humanSide: 'X' },
    { core: GameCore, ai: fakeAI(0) },
  );
  m.newMatch();
  assert.ok(!m.isAiTurn());
  assert.equal(m.aiMove(), 0);
});

test('человек побеждает ИИ — очко уходит в счёт O', () => {
  const ai = fakeAI(5);
  const m = Match.create(
    { n: 4, opponent: 'ai', humanSide: 'O', aiLevel: 1 },
    { core: GameCore, ai, rng: mulberry32(3) },
  );
  m.newMatch();
  // ИИ (X): «первая пустая от 5» → 5,6,7,8; человек (O) строит ось z среза 1.0: 64,65,66,67
  m.aiMove(); // X: 5
  m.play(64); // O
  m.aiMove(); // X: 6
  m.play(65); // O
  m.aiMove(); // X: 7
  m.play(66); // O
  m.aiMove(); // X: 8 (фейк не мешает и не блокирует)
  m.play(67); // O замыкает линию
  assert.equal(m.game.winner, GameCore.O);
  assert.deepEqual(m.score, { X: 0, O: 1, D: 0 });
});
