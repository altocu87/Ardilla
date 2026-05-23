/* ════════════════════════════════════════════════════
   SOUNDS — Web Audio API (sin archivos externos)
   Compatible iOS/Android con interacción previa del usuario.
════════════════════════════════════════════════════ */

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!_ctx) {
      _ctx = new (
        window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext
      )();
    }
    return _ctx;
  } catch { return null; }
}

/** Desbloquea AudioContext en iOS en el primer gesto del usuario. */
export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume();
}

/* ─── Generador de ruido marrón ─────────────────── */
function brownNoise(c: AudioContext, duration: number): AudioBufferSourceNode {
  const bufSize = Math.floor(c.sampleRate * duration);
  const buf     = c.createBuffer(1, bufSize, c.sampleRate);
  const d       = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < bufSize; i++) {
    const w = Math.random() * 2 - 1;
    d[i]  = (last + 0.022 * w) / 1.022;
    last  = d[i];
    d[i] *= 3.5;
  }
  const src  = c.createBufferSource();
  src.buffer = buf;
  return src;
}

/* ─── Waveshaper para distorsión intestinal ─────── */
function gutDistortion(c: AudioContext, amount = 80): WaveShaperNode {
  const dist  = c.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i * 2) / 256 - 1;
    curve[i] = (Math.PI + amount) * x / (Math.PI + amount * Math.abs(x));
  }
  dist.curve = curve;
  return dist;
}

/* ════════════════════════════════════════════════════
   PEDOS 💨 — tres variantes distintas
════════════════════════════════════════════════════ */

/** Pedo corto y agudo (la ardilla disimula rápido) */
function playFart0(vol: number) {
  const c = getCtx(); if (!c) return;
  const dur = 0.14 + Math.random() * 0.08;
  const src = brownNoise(c, dur);
  src.playbackRate.value = 1.5 + Math.random() * 0.4;
  const lpf = c.createBiquadFilter();
  lpf.type = "bandpass"; lpf.frequency.value = 500; lpf.Q.value = 2;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol * 0.7, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + dur);
  src.connect(lpf); lpf.connect(gain); gain.connect(c.destination);
  src.start(); src.stop(c.currentTime + dur + 0.05);
}

/** Pedo clásico (mediano, suave, inolvidable) */
function playFart1(vol: number) {
  const c = getCtx(); if (!c) return;
  const dur = 0.30 + Math.random() * 0.22;
  const src = brownNoise(c, dur);
  src.playbackRate.value = 0.9 + Math.random() * 0.25;
  const lpf = c.createBiquadFilter();
  lpf.type = "lowpass";
  lpf.frequency.setValueAtTime(420, c.currentTime);
  lpf.frequency.exponentialRampToValueAtTime(90, c.currentTime + dur);
  lpf.Q.value = 1.4;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + dur);
  src.connect(lpf); lpf.connect(gain); gain.connect(c.destination);
  src.start(); src.stop(c.currentTime + dur + 0.05);
}

/** Pedo largo y profundo (las moscas no salen; salen corriendo) */
function playFart2(vol: number) {
  const c = getCtx(); if (!c) return;
  const dur = 0.52 + Math.random() * 0.25;
  const src = brownNoise(c, dur);
  src.playbackRate.value = 0.65 + Math.random() * 0.2;
  const lpf = c.createBiquadFilter();
  lpf.type = "lowpass";
  lpf.frequency.setValueAtTime(280, c.currentTime);
  lpf.frequency.linearRampToValueAtTime(160, c.currentTime + dur * 0.4);
  lpf.frequency.exponentialRampToValueAtTime(55, c.currentTime + dur);
  lpf.Q.value = 1.8;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, c.currentTime);
  gain.gain.setValueAtTime(vol * 1.1, c.currentTime + dur * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + dur);
  src.connect(lpf); lpf.connect(gain); gain.connect(c.destination);
  src.start(); src.stop(c.currentTime + dur + 0.05);
}

export function playFartRandom(vol = 0.65): void {
  const c = getCtx(); if (!c) return;
  void c.resume();
  const v = Math.floor(Math.random() * 3);
  if (v === 0) playFart0(vol);
  else if (v === 1) playFart1(vol);
  else playFart2(vol);
}

/* ════════════════════════════════════════════════════
   ERUCTOS 😮‍💨 — tres variantes distintas
════════════════════════════════════════════════════ */

/** Eructo rápido de campeonato */
function playBurp0(vol: number) {
  const c = getCtx(); if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type  = "sawtooth";
  osc.frequency.setValueAtTime(280, t);
  osc.frequency.exponentialRampToValueAtTime(95, t + 0.18);
  osc.frequency.linearRampToValueAtTime(130, t + 0.26);
  const dist = gutDistortion(c, 100);
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
  osc.connect(dist); dist.connect(gain); gain.connect(c.destination);
  osc.start(t); osc.stop(t + 0.3);
}

/** Eructo operístico (largo y glorioso) */
function playBurp1(vol: number) {
  const c = getCtx(); if (!c) return;
  const t   = c.currentTime;
  const dur = 0.55 + Math.random() * 0.15;
  const osc = c.createOscillator();
  osc.type  = "sawtooth";
  const base = 170 + Math.random() * 50;
  osc.frequency.setValueAtTime(base,            t);
  osc.frequency.exponentialRampToValueAtTime(base * 0.42, t + dur * 0.45);
  osc.frequency.linearRampToValueAtTime(base * 0.58,       t + dur * 0.65);
  osc.frequency.linearRampToValueAtTime(base * 0.38,       t + dur * 0.85);
  osc.frequency.exponentialRampToValueAtTime(base * 0.22, t + dur);
  const dist = gutDistortion(c, 90);
  const lpf  = c.createBiquadFilter();
  lpf.type = "lowpass"; lpf.frequency.value = 900;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol * 0.9, t);
  gain.gain.setValueAtTime(vol,       t + dur * 0.2);
  gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
  osc.connect(dist); dist.connect(lpf); lpf.connect(gain); gain.connect(c.destination);
  osc.start(t); osc.stop(t + dur + 0.05);
}

/** Eructo grave de oso del bosque */
function playBurp2(vol: number) {
  const c = getCtx(); if (!c) return;
  const t   = c.currentTime;
  const dur = 0.42 + Math.random() * 0.1;
  const osc = c.createOscillator();
  osc.type  = "square";
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(48, t + dur * 0.6);
  osc.frequency.linearRampToValueAtTime(70,      t + dur * 0.8);
  osc.frequency.exponentialRampToValueAtTime(35, t + dur);
  const dist = gutDistortion(c, 120);
  const lpf  = c.createBiquadFilter();
  lpf.type = "lowpass"; lpf.frequency.value = 600;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol * 1.1, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
  osc.connect(dist); dist.connect(lpf); lpf.connect(gain); gain.connect(c.destination);
  osc.start(t); osc.stop(t + dur + 0.05);
}

export function playBurpRandom(vol = 0.5): void {
  const c = getCtx(); if (!c) return;
  void c.resume();
  const v = Math.floor(Math.random() * 3);
  if (v === 0) playBurp0(vol);
  else if (v === 1) playBurp1(vol);
  else playBurp2(vol);
}

/* ════════════════════════════════════════════════════
   ALIAS para los eventos aleatorios de fondo
════════════════════════════════════════════════════ */
export function playFart(vol = 0.65): void { playFartRandom(vol); }
export function playBurp(vol = 0.50): void { playBurpRandom(vol); }

/* ─── Guardias de frecuencia (localStorage) ──────── */
const FART_KEY = "sq_last_fart_ts";
const BURP_KEY = "sq_last_burp_ts";

function getLastTs(key: string): number {
  try { return parseInt(localStorage.getItem(key) ?? "0", 10); } catch { return 0; }
}
function setLastTs(key: string): void {
  try { localStorage.setItem(key, Date.now().toString()); } catch { /* noop */ }
}

/** 20% por hora — devuelve mensaje divertido si toca. */
export function maybeRandomFart(): string | null {
  if (typeof window === "undefined") return null;
  const elapsed = Date.now() - getLastTs(FART_KEY);
  if (elapsed < 60 * 60 * 1000) return null;
  setLastTs(FART_KEY);
  if (Math.random() > 0.20) return null;
  playFartRandom();
  const msgs = [
    "💨 *pfffrrt*… 🫣 ¡Uy, perdón!",
    "💨 Ejem… eso no he sido yo 😳",
    "💨 El bosque tiene sus propios sonidos 🌿😅",
    "💨 ¡Culpa de las bellotas! 🌰💨",
    "💨 …¿Qué? Aquí no ha pasado nada 😶",
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

/** 35% tras comer — devuelve mensaje divertido si toca. */
export function maybeEructo(): string | null {
  if (Date.now() - getLastTs(BURP_KEY) < 2 * 60 * 1000) return null;
  if (Math.random() > 0.35) return null;
  setLastTs(BURP_KEY);
  playBurpRandom();
  const msgs = [
    "¡BUUUURP! 😮‍💨 Perdona, es que estaba muy rico",
    "¡Eructo de campeona! 😳 …disculpa",
    "Mmm… *BEEELCH* 😅 ¡Qué vergüenza!",
    "¡Buaaaaarp! 🫢 Soy muy educada, lo prometo",
    "¡Ups! 😮‍💨 Las bellotas hacen eso a veces",
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}
