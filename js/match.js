'use strict';

/*
 * Матч: серия раундов с общим счётом побед X, O и ничьих.
 *
 * INTERFACE:
 *   Match.create(config, deps) → объект матча.
 *     config: { n, opponent: 'human' | 'ai', humanSide: 'X' | 'O', aiLevel: 0|1|2 }
 *     deps:   { core, ai, rng = Math.random } — ядро (GameCore), ИИ (AI) и генератор
 *             случайности передаются снаружи: модуль ничего не создаёт сам,
 *             поэтому в тестах подсовываются фейки.
 *   Экземпляр:
 *     newMatch()      — новый матч: счёт в ноль, раунд 1, стартёр X.
 *     nextRound()     — следующий раунд: стартёр чередуется.
 *     restartRound()  — переиграть раунд: номер раунда и стартёр не меняются.
 *     play(idx)       — ход текущего игрока; возвращает код символа (X/O)
 *                       или 0, если ход невозможен (партия окончена, клетка занята).
 *     aiMove()        — ход ИИ текущим символом; возвращает код символа или 0.
 *     isAiTurn()      — сейчас ход ИИ?
 *     game            — текущий state ядра (plain data, наружу — только чтение).
 *     score, round    — { X, O, D } и номер текущего раунда с нуля.
 *
 * Инварианты: стартёр чередуется каждый раунд (раунд 1 — X, раунд 2 — O, ...);
 * restartRound() сохраняет стартёра; счёт растёт ровно один раз за раунд.
 */
const Match = (() => {

  function create(config, deps) {
    const { core, ai, rng = Math.random } = deps;
    const score = { X: 0, O: 0, D: 0 };
    let round = 0;
    let game = null;

    const sideCode = (s) => (s === 'X' ? core.X : core.O);
    const starterOf = (r) => (r % 2 === 0 ? core.X : core.O);

    function startRound() {
      game = core.create(config.n, { starter: starterOf(round) });
    }

    function tally() {
      if (game.winner === core.X) score.X++;
      else if (game.winner === core.O) score.O++;
      else score.D++;
    }

    function play(idx) {
      if (!game || game.winner || game.cells[idx] !== 0) return 0;
      const mover = game.turn;
      core.applyMove(game, idx);
      if (game.winner) tally();
      return mover;
    }

    function isAiTurn() {
      return !!game && !game.winner &&
        config.opponent === 'ai' && game.turn !== sideCode(config.humanSide);
    }

    function aiMove() {
      if (!isAiTurn()) return 0;
      const idx = ai.choose(game, config.aiLevel, { rng });
      return play(idx);
    }

    return {
      newMatch() { score.X = 0; score.O = 0; score.D = 0; round = 0; startRound(); },
      nextRound() { round++; startRound(); },
      restartRound() { startRound(); }, // тот же номер раунда — тот же стартёр
      play,
      aiMove,
      isAiTurn,
      get game() { return game; },
      get score() { return score; },
      get round() { return round; },
      get config() { return config; },
    };
  }

  return { create };
})();

/* Загрузка в Node без этапа сборки: в браузере module не существует. */
if (typeof module !== 'undefined' && module.exports) module.exports = Match;
