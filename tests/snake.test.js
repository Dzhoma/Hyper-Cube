import { test } from 'node:test';
import assert from 'node:assert';
import Snake from '../js/games/snake/core.js';
import { mulberry32 } from './helpers.js';

test('create: змея из 3 сегментов в центре, еда на свободной клетке', () => {
  const s = Snake.create(20, 20, mulberry32(1));
  assert.equal(s.snake.length, 3);
  assert.deepEqual(s.snake[0], { x: 10, y: 10 });
  assert.ok(s.food);
  assert.ok(s.food.x >= 0 && s.food.x < 20 && s.food.y >= 0 && s.food.y < 20);
  assert.equal(s.alive, true);
  assert.equal(s.score, 0);
});

test('turn: разворот на 180° игнорируется, прямой поворот принимается', () => {
  const s = Snake.create(20, 20, mulberry32(1));
  Snake.turn(s, 'left');
  assert.equal(s.next, null);
  Snake.turn(s, 'up');
  assert.equal(s.next, 'up');
  Snake.turn(s, 'down'); // относительно next 'up' — разворот, игнор
  assert.equal(s.next, 'up');
});

test('step: ход без еды — длина та же, голова продвинулась', () => {
  const s = Snake.create(20, 20, mulberry32(1));
  s.food = { x: 0, y: 0 }; // еду убираем с пути
  const len = s.snake.length;
  const { events } = Snake.step(s, mulberry32(2));
  assert.deepEqual(events, []);
  assert.equal(s.snake.length, len);
  assert.equal(s.snake[0].x, 11);
});

test('step: еда съедена — рост, очки, новая еда', () => {
  const s = Snake.create(20, 20, mulberry32(1));
  const f = s.food;
  s.snake = [
    { x: f.x - 1, y: f.y },
    { x: f.x - 2, y: f.y },
    { x: f.x - 3, y: f.y },
  ];
  s.dir = 'right';
  s.next = null;
  const { events } = Snake.step(s, mulberry32(2));
  assert.ok(events.includes('eat'));
  assert.equal(s.score, 1);
  assert.equal(s.snake.length, 4);
  assert.ok(s.food);
});

test('step: выход за стену — смерть', () => {
  const s = Snake.create(20, 20, mulberry32(1));
  s.snake = [
    { x: 19, y: 0 },
    { x: 18, y: 0 },
    { x: 17, y: 0 },
  ];
  s.dir = 'right';
  s.next = null;
  s.food = { x: 0, y: 0 };
  const { events } = Snake.step(s, mulberry32(2));
  assert.ok(events.includes('die'));
  assert.equal(s.alive, false);
});

test('step: в собственное тело — смерть', () => {
  const s = Snake.create(20, 20, mulberry32(1));
  s.snake = [
    { x: 5, y: 5 },
    { x: 5, y: 6 },
    { x: 5, y: 7 },
    { x: 5, y: 8 },
    { x: 5, y: 9 },
  ];
  s.dir = 'right';
  s.next = 'down';
  s.food = { x: 0, y: 0 };
  const { events } = Snake.step(s, mulberry32(2));
  assert.ok(events.includes('die'));
  assert.equal(s.alive, false);
});

test('step: в клетку уходящего хвоста зайти можно', () => {
  const s = Snake.create(20, 20, mulberry32(1));
  s.snake = [
    { x: 5, y: 5 },
    { x: 6, y: 5 },
    { x: 6, y: 4 },
    { x: 5, y: 4 },
  ];
  s.dir = 'up';
  s.next = null;
  s.food = { x: 0, y: 0 };
  const { events } = Snake.step(s, mulberry32(2));
  assert.ok(!events.includes('die'));
  assert.equal(s.alive, true);
});

test('step: поле заполнено — победа', () => {
  const s = {
    cols: 2,
    rows: 2,
    snake: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    dir: 'right',
    next: null,
    food: { x: 1, y: 0 },
    alive: true,
    score: 0,
  };
  const { events } = Snake.step(s, mulberry32(2));
  assert.ok(events.includes('eat'));
  assert.ok(events.includes('win'));
  assert.equal(s.alive, false);
});

test('step: мёртвая змея шагов не делает', () => {
  const s = Snake.create(20, 20, mulberry32(1));
  s.alive = false;
  const len = s.snake.length;
  const { events } = Snake.step(s, mulberry32(2));
  assert.deepEqual(events, []);
  assert.equal(s.snake.length, len);
});
