'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const Session = require('../js/session.js');
const Net = require('../js/net.js');
const GameCore = require('../js/game.js');
const Match = require('../js/match.js');
const { mulberry32 } = require('./helpers.js');

/* Пара транспортов: отправка одной стороны попадает в «входящие» другой. */
function makePipe() {
  const toGuest = [];
  const toHost = [];
  return {
    toGuest,
    toHost,
    hostSend: (m) => toGuest.push(m),
    guestSend: (m) => toHost.push(m),
  };
}

function hostUp(pipe) {
  const match = Match.create({ n: 4, opponent: 'p2p', humanSide: 'X' }, { core: GameCore, ai: null });
  match.newMatch();
  const session = Session.host({ core: GameCore, match, send: pipe.hostSend });
  return { match, session };
}

function guestUp(pipe) {
  return Session.guest({ core: GameCore, n: 4, send: pipe.guestSend });
}

test('makeCode: формат, управляемая случайность, нормализация ввода', () => {
  const a = Net.makeCode(6, mulberry32(7));
  const b = Net.makeCode(6, mulberry32(7));
  assert.equal(a, b); // rng инъецируется — детерминизм в тестах
  assert.match(a, /^HYP-[A-HJ-NP-Z2-9]{6}$/);
  assert.ok(Net.isValid(Net.normalize(' hyp-k3m2q8 '))); // регистр и пробелы не мешают
  assert.ok(!Net.isValid('HYP-AB1BCD')); // 1 в коде невозможна
  assert.ok(!Net.isValid('XXXXXX')); // без префикса
});

test('checkHello: только hello с текущей версией протокола', () => {
  assert.ok(Session.checkHello({ t: 'hello', v: Session.PROTOCOL }));
  assert.ok(!Session.checkHello({ t: 'hello', v: Session.PROTOCOL + 1 }));
  assert.ok(!Session.checkHello({ t: 'move', idx: 0 }));
  assert.ok(!Session.checkHello(null));
});

test('ход гостя принимается только в его ход и валидируется хостом', () => {
  const pipe = makePipe();
  const { match, session } = hostUp(pipe);
  assert.equal(session.onData({ t: 'move', idx: 5 }).kind, 'ignore'); // сейчас ход X
  match.play(0); // хост занял клетку символом X
  const res = session.onData({ t: 'move', idx: 5 });
  assert.equal(res.changed, true);
  assert.equal(res.mover, GameCore.O);
  assert.equal(match.game.cells[5], GameCore.O);
  assert.equal(session.onData({ t: 'move', idx: 5 }).kind, 'ignore'); // клетка занята
  assert.equal(session.onData({ t: 'move', idx: 6 }).kind, 'ignore'); // снова ход X
});

test('снапшот переносит состояние в представление гостя', () => {
  const pipe = makePipe();
  const { match, session } = hostUp(pipe);
  match.play(0); // X
  match.play(16); // O
  const guest = guestUp(pipe);
  const res = guest.onData(session.snapshot());
  assert.equal(res.kind, 'snap');
  assert.equal(res.roundChanged, true); // первое состояние — всегда «новый раунд»
  assert.equal(guest.view.game.cells[0], GameCore.X);
  assert.equal(guest.view.game.cells[16], GameCore.O);
  assert.equal(guest.view.game.turn, GameCore.X);
  assert.equal(guest.view.round, 0);
  assert.deepEqual(guest.view.score, { X: 0, O: 0, D: 0 });
  assert.equal(guest.onData(session.snapshot()).roundChanged, false); // тот же раунд
});

test('полный цикл: победа хоста, next от гостя, раунд 2 начинает O', () => {
  const pipe = makePipe();
  const { match, session } = hostUp(pipe);
  const guest = guestUp(pipe);
  guest.onData(session.snapshot()); // старт раунда 1: ход X
  // X: 0,1,2,3 — ось z; O отвечает 16,17,18
  match.play(0); guest.onData(session.snapshot());
  assert.equal(guest.move(16), true);
  session.onData(pipe.toHost.pop());
  guest.onData(session.snapshot());
  match.play(1); guest.onData(session.snapshot());
  assert.equal(guest.move(17), true);
  session.onData(pipe.toHost.pop());
  guest.onData(session.snapshot());
  match.play(2); guest.onData(session.snapshot());
  assert.equal(guest.move(18), true);
  session.onData(pipe.toHost.pop());
  guest.onData(session.snapshot());
  match.play(3); guest.onData(session.snapshot()); // X замкнул линию
  assert.equal(match.game.winner, GameCore.X);
  assert.deepEqual(match.score, { X: 1, O: 0, D: 0 });
  assert.equal(guest.view.game.winner, GameCore.X);
  assert.deepEqual(guest.view.score, { X: 1, O: 0, D: 0 });
  assert.deepEqual(guest.view.game.winLine, match.game.winLine);
  // гость инициирует следующий раунд — хост применяет
  guest.next();
  assert.equal(session.onData(pipe.toHost.pop()).kind, 'next');
  assert.equal(match.round, 1);
  assert.equal(match.game.turn, GameCore.O); // стартёр чередуется
  guest.onData(session.snapshot());
  assert.equal(guest.view.round, 1);
  assert.equal(guest.view.game.turn, GameCore.O);
  assert.equal(guest.move(20), true); // гость начинает раунд 2
  session.onData(pipe.toHost.pop());
  assert.equal(match.game.cells[20], GameCore.O);
});

test('restart от гостя переигрывает раунд с тем же стартёром', () => {
  const pipe = makePipe();
  const { match, session } = hostUp(pipe);
  const guest = guestUp(pipe);
  guest.onData(session.snapshot());
  match.play(0);
  assert.equal(match.game.cells[0], GameCore.X);
  guest.restart();
  const res = session.onData(pipe.toHost.pop());
  assert.equal(res.kind, 'restart');
  assert.equal(match.round, 0); // номер раунда сохранён
  assert.equal(match.game.cells[0], 0); // поле очищено
  assert.equal(match.game.turn, GameCore.X); // стартёр сохранён
});

test('гость не отправляет ход на чужой очереди; next — только после победы', () => {
  const pipe = makePipe();
  const { session } = hostUp(pipe);
  const guest = guestUp(pipe);
  guest.onData(session.snapshot()); // ход X — не гостя
  assert.equal(guest.move(5), false);
  guest.next(); // партия не завершена — next не отправится
  assert.equal(pipe.toHost.length, 0);
  guest.restart(); // restart возможен в любой момент раунда
  assert.deepEqual(pipe.toHost, [{ v: Session.PROTOCOL, t: 'restart' }]);
  // на хосте next вне завершённой партии игнорируется
  assert.equal(session.onData({ t: 'next' }).kind, 'ignore');
});

test('ошибка протокола доходит до гостя, мусор отбрасывается', () => {
  const guest = guestUp({ guestSend: () => {} });
  const res = guest.onData({ v: 1, t: 'err', code: 'version' });
  assert.equal(res.kind, 'err');
  assert.equal(res.code, 'version');
  assert.equal(guest.onData('мусор'), null);
  assert.equal(guest.onData(null), null);
  assert.equal(guest.onData({ t: 'snap', v: 99 }), null); // чужая версия снапшота
});

test('bye доходит до обеих сторон сессии', () => {
  const pipe = makePipe();
  const { session } = hostUp(pipe);
  const guest = guestUp(pipe);
  assert.equal(session.onData({ t: 'bye' }).kind, 'bye');
  assert.equal(guest.onData({ t: 'bye' }).kind, 'bye');
});
