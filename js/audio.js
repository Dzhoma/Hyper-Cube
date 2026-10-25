/* Синтезированные звуки на WebAudio — без внешних файлов. */
const AudioFX = (() => {
  let ctx = null;
  let master = null;
  let muted = false;
  try {
    muted = localStorage.getItem('xo4d.muted') === '1';
  } catch {
    /* приватный режим */
  }

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, when = 0) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + when;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(g);
    g.connect(master);
    src.start(t0);
  }

  return {
    unlock() {
      ensure();
    },
    get muted() {
      return muted;
    },
    toggle() {
      muted = !muted;
      try {
        localStorage.setItem('xo4d.muted', muted ? '1' : '0');
      } catch {
        /* игнорируем */
      }
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    click() {
      tone(1300, 0.045, 'square', 0.08);
    },
    error() {
      tone(110, 0.14, 'sawtooth', 0.18);
    },
    moveX() {
      tone(720, 0.09, 'square', 0.16, 0, 980);
    },
    moveO() {
      tone(300, 0.11, 'sawtooth', 0.15, 0, 210);
    },
    aiThink() {
      tone(180, 0.3, 'sine', 0.06, 0, 240);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'square', 0.15, i * 0.09));
      noise(0.5, 0.08, 0.1);
    },
    lose() {
      [392, 311, 233, 155].forEach((f, i) => tone(f, 0.2, 'sawtooth', 0.13, i * 0.12));
    },
    draw() {
      tone(440, 0.22, 'sine', 0.12);
      tone(440, 0.22, 'sine', 0.12, 0.28);
    },
  };
})();

export default AudioFX;
