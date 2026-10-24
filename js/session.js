'use strict';

/*
 * Сетевой протокол и синхронизация матча: host-авторитарная сессия (ADR-0006).
 *
 * Хост владеет Match и GameCore: валидирует каждый ход гостя и после каждого
 * изменения рассылает снапшот — полное сериализованное состояние. Гость —
 * тонкий клиент: match-подобное представление только для рендера, строгий
 * режим (ход отображается лишь после подтверждения снапшотом).
 *
 * INTERFACE:
 *   Session.PROTOCOL        — версия протокола; несовпадение = отказ в рукопожатии.
 *   Session.checkHello(msg) → true, если hello корректен (матч хост создаёт после него).
 *   Session.host({ core, match, send }) → { kind: 'host', onData(msg) → результат, snapshot() }
 *     onData применяет к матчу ход/переход гостя: { kind: 'move'|'next'|'restart'|'bye'|'ignore',
 *     changed, mover, idx }; snapshot() → сообщение-снапшот для отправки.
 *   Session.guest({ core, n, send }) → { kind: 'guest', view, onData(msg), move(idx), next(), restart() }
 *     view — match-подобный объект для рендера; move/next/restart отправляют действия хосту
 *     (move — строго по подтверждённому снапшоту и только в свой ход).
 *
 * Сообщения:
 *   { v, t: 'hello' }                        — гость → хост, рукопожатие;
 *   { v, t: 'snap', round, score, cells, turn, winner, winLine, lastMove, moveCount } — хост → гость;
 *   { v, t: 'move', idx }                    — гость → хост;
 *   { v, t: 'next' | 'restart' | 'bye' }     — обе стороны;
 *   { v, t: 'err', code }                    — отказ (code: 'version').
 */
const Session = (() => {
  const PROTOCOL = 1;

  function snapshotMsg(match) {
    const g = match.game;
    return {
      v: PROTOCOL,
      t: 'snap',
      round: match.round,
      score: { X: match.score.X, O: match.score.O, D: match.score.D },
      cells: Array.from(g.cells),
      turn: g.turn,
      winner: g.winner,
      winLine: g.winLine ? g.winLine.slice() : null,
      lastMove: g.lastMove,
      moveCount: g.moveCount,
    };
  }

  function checkHello(msg) {
    return !!msg && msg.t === 'hello' && msg.v === PROTOCOL;
  }

  function host({ core, match, send }) {
    function onData(msg) {
      if (!msg || typeof msg !== 'object') return { kind: 'ignore' };
      if (msg.t === 'move' && Number.isInteger(msg.idx)) {
        const g = match.game;
        // гость — всегда O: чужой ход, занятая клетка и завершённая партия отклоняются
        if (g.winner || g.cells[msg.idx] !== 0 || g.turn !== core.O) return { kind: 'ignore' };
        const mover = match.play(msg.idx);
        return { kind: 'move', changed: !!mover, mover, idx: msg.idx };
      }
      if (msg.t === 'next' && match.game.winner) {
        match.nextRound();
        return { kind: 'next', changed: true };
      }
      if (msg.t === 'restart') {
        match.restartRound();
        return { kind: 'restart', changed: true };
      }
      if (msg.t === 'bye') return { kind: 'bye' };
      return { kind: 'ignore' };
    }
    return { kind: 'host', onData, snapshot: () => snapshotMsg(match) };
  }

  function guest({ core, n, send }) {
    const cellCount = n * n * n * n;
    const game = {
      n,
      cellCount,
      cells: new Int8Array(cellCount),
      turn: core.X,
      moveCount: 0,
      winner: 0,
      winLine: null,
      lastMove: -1,
    };
    const view = {
      config: { n, opponent: 'p2p', humanSide: 'O', aiLevel: 0 },
      score: { X: 0, O: 0, D: 0 },
      round: 0,
      game,
      isAiTurn: () => false,
    };
    let hasState = false;

    function onData(msg) {
      if (!msg || typeof msg !== 'object') return null;
      if (msg.t === 'snap' && msg.v === PROTOCOL && msg.score) {
        const roundChanged = !hasState || msg.round !== view.round;
        view.round = msg.round;
        view.score.X = msg.score.X;
        view.score.O = msg.score.O;
        view.score.D = msg.score.D;
        game.cells.set(msg.cells);
        game.turn = msg.turn;
        game.winner = msg.winner;
        game.winLine = msg.winLine ? msg.winLine.slice() : null;
        game.lastMove = msg.lastMove;
        game.moveCount = msg.moveCount;
        hasState = true;
        return { kind: 'snap', roundChanged };
      }
      if (msg.t === 'err') return { kind: 'err', code: msg.code || 'error' };
      if (msg.t === 'bye') return { kind: 'bye' };
      return null;
    }

    function move(idx) {
      if (!hasState || !Number.isInteger(idx)) return false;
      if (game.winner || game.cells[idx] !== 0 || game.turn !== core.O) return false;
      send({ v: PROTOCOL, t: 'move', idx });
      return true;
    }

    function next() {
      if (hasState && game.winner) send({ v: PROTOCOL, t: 'next' });
    }

    function restart() {
      if (hasState) send({ v: PROTOCOL, t: 'restart' });
    }

    return { kind: 'guest', onData, view, move, next, restart };
  }

  return { PROTOCOL, checkHello, host, guest };
})();

/* Загрузка в Node без этапа сборки: в браузере module не существует. */
if (typeof module !== 'undefined' && module.exports) module.exports = Session;
