/*
 * Hyper-Maze: идеальный 4D-лабиринт на полной карте из срезов (ADR-0009).
 * Логика — в core.js (чистая, тестируемая), здесь только UI-слой:
 * canvas-рендер сетки срезов, управление, таймер, рекорд.
 */
import AudioFX from '../../audio.js';
import { t, currentLang } from '../../i18n.js';
import { applyStaticI18n } from '../../ui.js';
import * as core from './core.js';
import SCREEN_HTML from './screen.html?raw';

const N = 4;

/* геометрия карты: панели (w, x) — строки×столбцы, внутри панели ячейки (y, z) */
const CELL = 26; // ячейка
const WALL = 4; // толщина стены — чётная, линии на целых координатах получаются резкими
const PITCH = CELL + WALL;
const SPAN = N * PITCH; // поле панели
const GAP = 24; // зазор между панелями
const LABEL = 14; // место под подпись w.x
const M = 16; // поля канвы
const INSET = WALL / 2; // отступ ячейки от линии стены

const CANVAS_W = 2 * M + N * SPAN + (N - 1) * GAP;
const CANVAS_H = 2 * M + N * (SPAN + LABEL) + (N - 1) * GAP;

const COL_WALL = 'rgba(0, 240, 255, 0.5)';
const COL_BORDER = 'rgba(0, 240, 255, 0.65)';
const COL_TRAIL = 'rgba(127, 255, 0, 0.10)';
const COL_PLAYER = '#7fff00';
const COL_PORTAL = '#eaff00';
const COL_FINISH = '#ff2bd6';
const COL_LABEL = '#6b7f9e';

/* абсолютные оси: стрелки — внутри среза, WASD — между панелями (±W/±X) */
const KEY_DIRS = {
  ArrowUp: 5, // -y
  ArrowDown: 4, // +y
  ArrowLeft: 7, // -z
  ArrowRight: 6, // +z
  KeyW: 1, // ана (-w)
  KeyS: 0, // ката (+w)
  KeyA: 3, // -x
  KeyD: 2, // +x
};

let state = null;
let canvas = null;
let ctx = null;
let clock = null;
let onKey = null;
let startTime = null;
let finalMs = 0;
let best = 0;
let flash = null; // { idx, dir, until } — вспышка стены при упоре

const px = (x) => M + x * (SPAN + GAP);
const py = (w) => M + LABEL + w * (SPAN + LABEL + GAP);

function loadBest() {
  try {
    best = +localStorage.getItem('xo4d.maze.best') || 0;
  } catch {
    best = 0; // приватный режим
  }
}

function saveBest() {
  try {
    localStorage.setItem('xo4d.maze.best', String(Math.round(best)));
  } catch {
    /* игнорируем */
  }
}

const pad3 = (v) => String(v).padStart(3, '0');

const fmt = (ms) => {
  const s = ms / 1000;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s) % 60).padStart(2, '0')}.${Math.floor((s % 1) * 10)}`;
};

const elapsed = () => {
  if (state.won) return finalMs;
  return startTime ? performance.now() - startTime : 0;
};

function hud() {
  document.getElementById('hm-hud').innerHTML =
    `<span class="score-x">${t('hm.steps')} ${pad3(state.steps)}</span>` +
    `<span class="score-x">${t('hm.time')} ${fmt(elapsed())}</span>` +
    `<span class="score-d">${t('hm.best')} ${best ? fmt(best) : '—'}</span>`;
}

/* стрелка-портал у края ячейки: проход по W/X в соседнюю панель */
function glyph(cx, cy, d) {
  ctx.save();
  ctx.shadowColor = COL_PORTAL;
  ctx.shadowBlur = 5;
  ctx.beginPath();
  if (d === 0) {
    ctx.moveTo(cx - 5, cy + 5); // ката — панелью ниже
    ctx.lineTo(cx + 5, cy + 5);
    ctx.lineTo(cx, cy + 10);
  } else if (d === 1) {
    ctx.moveTo(cx - 5, cy - 5); // ана — панелью выше
    ctx.lineTo(cx + 5, cy - 5);
    ctx.lineTo(cx, cy - 10);
  } else if (d === 2) {
    ctx.moveTo(cx + 5, cy - 5); // +x — панелью правее
    ctx.lineTo(cx + 5, cy + 5);
    ctx.lineTo(cx + 10, cy);
  } else {
    ctx.moveTo(cx - 5, cy - 5); // -x — панелью левее
    ctx.lineTo(cx - 5, cy + 5);
    ctx.lineTo(cx - 10, cy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function ring(cx, cy) {
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.stroke();
}

function diamond(cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  ctx.shadowColor = COL_FINISH;
  ctx.shadowBlur = 10;
  ctx.fillStyle = COL_FINISH;
  ctx.fillRect(-7, -7, 14, 14);
  ctx.restore();
}

function drawPanel(w, x) {
  const ox = px(x);
  const oy = py(w);

  ctx.fillStyle = COL_LABEL;
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${w}.${x}`, ox, oy - 5);

  /* границы панели всегда глухие: переходы W/X — порталы внутри ячеек */
  ctx.lineWidth = WALL;
  ctx.strokeStyle = COL_BORDER;
  ctx.strokeRect(ox, oy, SPAN, SPAN);

  ctx.strokeStyle = COL_WALL;
  ctx.beginPath();
  for (let y = 0; y < N; y++) {
    for (let z = 0; z < N; z++) {
      const idx = core.idxOf(N, w, x, y, z);
      if (y < N - 1 && !core.isOpen(state, idx, 4)) {
        const gy = oy + (y + 1) * PITCH;
        ctx.moveTo(ox + z * PITCH, gy);
        ctx.lineTo(ox + (z + 1) * PITCH, gy);
      }
      if (z < N - 1 && !core.isOpen(state, idx, 6)) {
        const gx = ox + (z + 1) * PITCH;
        ctx.moveTo(gx, oy + y * PITCH);
        ctx.lineTo(gx, oy + (y + 1) * PITCH);
      }
    }
  }
  ctx.stroke();

  for (let y = 0; y < N; y++) {
    for (let z = 0; z < N; z++) {
      const idx = core.idxOf(N, w, x, y, z);
      const cx0 = ox + z * PITCH + INSET;
      const cy0 = oy + y * PITCH + INSET;
      const cx = cx0 + CELL / 2;
      const cy = cy0 + CELL / 2;
      if (state.seen[idx] && idx !== state.player) {
        ctx.fillStyle = COL_TRAIL;
        ctx.fillRect(cx0, cy0, CELL, CELL);
      }
      ctx.fillStyle = COL_PORTAL;
      for (let d = 0; d < 4; d++) {
        if (core.isOpen(state, idx, d)) glyph(cx, cy, d);
      }
      if (idx === state.start) ring(cx, cy);
      if (idx === state.finish) diamond(cx, cy);
      if (idx === state.player) {
        ctx.save();
        ctx.shadowColor = COL_PLAYER;
        ctx.shadowBlur = 12;
        ctx.fillStyle = COL_PLAYER;
        ctx.beginPath();
        ctx.arc(cx, cy, CELL / 2 - 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}

/* вспышка стены, в которую упёрлись: грань ячейки в сторону попытки */
function drawFlash() {
  if (!flash || performance.now() >= flash.until) return;
  const [fw, fx, fy, fz] = core.decode(flash.idx, N);
  const x0 = px(fx) + fz * PITCH + INSET;
  const y0 = py(fw) + fy * PITCH + INSET;
  const edge = CELL + INSET; // центр стены на грани ячейки
  ctx.strokeStyle = COL_FINISH;
  ctx.lineWidth = WALL;
  ctx.beginPath();
  if (flash.dir === 0 || flash.dir === 4) {
    ctx.moveTo(x0 - INSET, y0 + edge);
    ctx.lineTo(x0 + edge, y0 + edge);
  } else if (flash.dir === 1 || flash.dir === 5) {
    ctx.moveTo(x0 - INSET, y0 - INSET);
    ctx.lineTo(x0 + edge, y0 - INSET);
  } else if (flash.dir === 2 || flash.dir === 6) {
    ctx.moveTo(x0 + edge, y0 - INSET);
    ctx.lineTo(x0 + edge, y0 + edge);
  } else {
    ctx.moveTo(x0 - INSET, y0 - INSET);
    ctx.lineTo(x0 - INSET, y0 + edge);
  }
  ctx.stroke();
}

function draw() {
  ctx.fillStyle = '#04040a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let w = 0; w < N; w++) {
    for (let x = 0; x < N; x++) drawPanel(w, x);
  }
  drawFlash();
}

function win() {
  finalMs = startTime ? performance.now() - startTime : 0;
  if (clock) {
    clearInterval(clock);
    clock = null;
  }
  if (!best || finalMs < best) {
    best = finalMs;
    saveBest();
  }
  const title = document.getElementById('hm-overlay-title');
  title.textContent = t('hm.win');
  title.dataset.text = title.textContent;
  document.getElementById('hm-overlay-sub').textContent = t('hm.final')
    .replace('{t}', fmt(finalMs))
    .replace('{n}', String(state.steps));
  document.getElementById('hm-overlay').classList.remove('hidden');
  AudioFX.win();
  hud();
}

function steer(d) {
  if (!state || state.won) return;
  const { events } = core.step(state, d);
  if (events.includes('block')) {
    AudioFX.error();
    flash = { idx: state.player, dir: d, until: performance.now() + 180 };
    setTimeout(draw, 200); // погасить вспышку
  } else if (events.includes('warp')) {
    AudioFX.moveO();
  } else if (events.includes('move')) {
    AudioFX.moveX();
  }
  if (events.includes('move') && !startTime) startTime = performance.now();
  if (events.includes('win')) win();
  draw();
  hud();
}

function restart() {
  state = core.create(N);
  startTime = null;
  finalMs = 0;
  flash = null;
  document.getElementById('hm-overlay').classList.add('hidden');
  if (clock) clearInterval(clock);
  clock = setInterval(hud, 200);
  hud();
  draw();
}

function mount(root) {
  root.innerHTML = SCREEN_HTML;
  canvas = document.getElementById('hm-canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  ctx = canvas.getContext('2d');
  loadBest();

  document.getElementById('hm-new').addEventListener('click', restart);
  document.getElementById('hm-exit').addEventListener('click', () => {
    location.hash = '#/';
  });
  document.getElementById('hm-again').addEventListener('click', restart);
  document.getElementById('hm-exit2').addEventListener('click', () => {
    location.hash = '#/';
  });

  onKey = (e) => {
    const d = KEY_DIRS[e.code];
    if (d === undefined) return;
    e.preventDefault();
    steer(d);
  };
  window.addEventListener('keydown', onKey);

  for (const padId of ['hm-pad-slice', 'hm-pad-panels']) {
    document.getElementById(padId).addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-dir]');
      if (!btn) return;
      steer(+btn.dataset.dir);
    });
  }

  document.documentElement.lang = currentLang();
  document.title = t('hm.title');
  applyStaticI18n();
  restart();
}

/* окно закрывается, часы и клавиатура гасятся — DOM уходит вместе с экраном */
function unmount() {
  if (clock) clearInterval(clock);
  clock = null;
  if (onKey) window.removeEventListener('keydown', onKey);
}

export default {
  id: 'hypermaze',
  nameKey: 'cat.hm.name',
  tagKey: 'cat.hm.tag',
  accent: 'lime',
  mount,
  unmount,
};
