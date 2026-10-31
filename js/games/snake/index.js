/*
 * Snake: неоновая змейка. Логика — в core.js (чистая, тестируемая),
 * здесь только UI-слой: canvas-рендер, управление, цикл, рекорд.
 */
import AudioFX from '../../audio.js';
import { t, currentLang } from '../../i18n.js';
import { applyStaticI18n } from '../../ui.js';
import * as core from './core.js';
import SCREEN_HTML from './screen.html?raw';

const COLS = 20;
const ROWS = 20;
const START_MS = 150; // базовый интервал шага
const MIN_MS = 70; // потолок скорости
const FIRST_MS = 900; // форы перед первым шагом — успеть взять управление

const KEY_DIRS = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
};

let state = null;
let canvas = null;
let ctx = null;
let cell = 0;
let timer = null;
let onKey = null;
let touchStart = null;
let best = 0;

function loadBest() {
  try {
    best = +localStorage.getItem('xo4d.snake.best') || 0;
  } catch {
    best = 0; // приватный режим
  }
}

function saveBest() {
  try {
    localStorage.setItem('xo4d.snake.best', String(best));
  } catch {
    /* игнорируем */
  }
}

const pad2 = (v) => String(v).padStart(2, '0');

function hud() {
  document.getElementById('snake-hud').innerHTML =
    `<span class="score-x">${t('sn.score')} ${pad2(state.score)}</span>` +
    `<span class="score-d">${t('sn.best')} ${pad2(best)}</span>`;
}

const speed = () => Math.max(MIN_MS, START_MS - state.score * 4);

function tick() {
  const { events } = core.step(state);
  if (events.includes('eat')) AudioFX.moveX();
  if (events.includes('die')) AudioFX.lose();
  if (events.includes('win')) AudioFX.win();
  draw();
  hud();
  if (!state.alive) {
    gameOver();
    return;
  }
  timer = setTimeout(tick, speed());
}

function gameOver() {
  timer = null;
  if (state.score > best) {
    best = state.score;
    saveBest();
  }
  const tEl = document.getElementById('sn-overlay-title');
  const title = state.food === null ? t('sn.win') : t('sn.over');
  tEl.textContent = title;
  tEl.dataset.text = title;
  document.getElementById('sn-overlay-sub').textContent = t('sn.final').replace(
    '{n}',
    String(state.score),
  );
  document.getElementById('sn-overlay').classList.remove('hidden');
  hud();
}

function draw() {
  ctx.fillStyle = '#04040a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(0, 240, 255, 0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < COLS; i++) {
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, canvas.height);
    ctx.moveTo(0, i * cell);
    ctx.lineTo(canvas.width, i * cell);
  }
  ctx.stroke();

  if (state.food) {
    const fx = state.food.x * cell;
    const fy = state.food.y * cell;
    ctx.save();
    ctx.shadowColor = '#ff2bd6';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ff2bd6';
    ctx.fillRect(fx + cell * 0.25, fy + cell * 0.25, cell * 0.5, cell * 0.5);
    ctx.restore();
  }

  state.snake.forEach((p, i) => {
    const head = i === 0;
    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = head ? 16 : 6;
    ctx.fillStyle = head ? '#00f0ff' : `rgba(0, 240, 255, ${Math.max(0.25, 0.85 - i * 0.03)})`;
    ctx.fillRect(p.x * cell + 2, p.y * cell + 2, cell - 4, cell - 4);
    ctx.restore();
  });
}

function steer(dir) {
  if (!state || !state.alive) return;
  core.turn(state, dir);
}

function restart() {
  if (timer) clearTimeout(timer);
  timer = null;
  state = core.create(COLS, ROWS);
  document.getElementById('sn-overlay').classList.add('hidden');
  hud();
  draw();
  timer = setTimeout(tick, FIRST_MS);
}

function mount(root) {
  root.innerHTML = SCREEN_HTML;
  canvas = document.getElementById('snake-canvas');
  ctx = canvas.getContext('2d');
  cell = canvas.width / COLS;
  loadBest();

  document.getElementById('snake-restart').addEventListener('click', restart);
  document.getElementById('snake-exit').addEventListener('click', () => {
    location.hash = '#/';
  });
  document.getElementById('sn-again').addEventListener('click', restart);
  document.getElementById('sn-exit').addEventListener('click', () => {
    location.hash = '#/';
  });

  onKey = (e) => {
    const dir = KEY_DIRS[e.code];
    if (!dir) return;
    e.preventDefault();
    steer(dir);
  };
  window.addEventListener('keydown', onKey);

  canvas.addEventListener(
    'touchstart',
    (e) => {
      touchStart = e.changedTouches[0];
    },
    { passive: true },
  );
  canvas.addEventListener(
    'touchend',
    (e) => {
      if (!touchStart) return;
      const dx = e.changedTouches[0].clientX - touchStart.clientX;
      const dy = e.changedTouches[0].clientY - touchStart.clientY;
      touchStart = null;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
      steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    },
    { passive: true },
  );

  document.documentElement.lang = currentLang();
  document.title = t('sn.title');
  applyStaticI18n();
  restart();
}

/* окно закрывается, цикл и клавиатура гасятся — DOM уходит вместе с экраном */
function unmount() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (onKey) window.removeEventListener('keydown', onKey);
}

export default {
  id: 'snake',
  nameKey: 'cat.snake.name',
  tagKey: 'cat.snake.tag',
  accent: 'magenta',
  mount,
  unmount,
};
