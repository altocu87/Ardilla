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

export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume();
}

/* ─── Ruido marrón ──────────────────────────────── */
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

/* ════════════════════════════════════════════════════
   PEDOS 💨
   Técnica clave: LFO de amplitud a 15-30 Hz simula
   la vibración de las "válvulas" — sin esto no suenan
   a pedo real, solo a ruido.
════════════════════════════════════════════════════ */

function makeFart(c: AudioContext, cfg: {
  dur: number;          // duración total
  lfoHz: number;        // velocidad de aleteo (Hz)
  lfoDepth: number;     // profundidad del trémolo (0–0.4)
  startFreq: number;    // frecuencia inicial del filtro
  endFreq: number;      // frecuencia final (descenso)
  rate: number;         // playbackRate del buffer
  vol: number;
}) {
  const { dur, lfoHz, lfoDepth, startFreq, endFreq, rate, vol } = cfg;
  const t   = c.currentTime;

  // Fuente: ruido marrón
  const src = brownNoise(c, dur);
  src.playbackRate.value = rate;

  // Filtro paso-bajo que desciende (da el "color" del pedo)
  const lpf = c.createBiquadFilter();
  lpf.type  = "lowpass";
  lpf.frequency.setValueAtTime(startFreq, t);
  lpf.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  lpf.Q.value = 1.8;

  // Ganancia DC (offset para que el LFO no la lleve a negativo)
  const dc = vol * 0.55;
  const gainNode = c.createGain();
  gainNode.gain.value = dc;

  // LFO — el truco que lo hace sonar a pedo real
  const lfo = c.createOscillator();
  lfo.type  = "sine";
  lfo.frequency.setValueAtTime(lfoHz, t);
  lfo.frequency.linearRampToValueAtTime(lfoHz * 0.55, t + dur); // ralentiza al final

  const lfoGain = c.createGain();
  lfoGain.gain.value = lfoDepth * vol;
  lfo.connect(lfoGain);
  lfoGain.connect(gainNode.gain); // modula la ganancia

  // Envolvente de amplitud
  const env = c.createGain();
  env.gain.setValueAtTime(0,   t);
  env.gain.linearRampToValueAtTime(1, t + 0.018);
  env.gain.setValueAtTime(1,           t + dur * 0.55);
  env.gain.exponentialRampToValueAtTime(0.01, t + dur);

  src.connect(lpf);
  lpf.connect(gainNode);
  gainNode.connect(env);
  env.connect(c.destination);

  src.start(t); src.stop(t + dur + 0.05);
  lfo.start(t); lfo.stop(t + dur + 0.05);
}

/** Pedo corto y agudo — escapa rápido */
function playFart0(vol: number) {
  const c = getCtx(); if (!c) return;
  makeFart(c, {
    dur: 0.13 + Math.random() * 0.07,
    lfoHz: 28 + Math.random() * 10,
    lfoDepth: 0.38,
    startFreq: 700, endFreq: 280,
    rate: 1.4 + Math.random() * 0.3,
    vol,
  });
}

/** Pedo clásico — el de toda la vida */
function playFart1(vol: number) {
  const c = getCtx(); if (!c) return;
  makeFart(c, {
    dur: 0.32 + Math.random() * 0.18,
    lfoHz: 20 + Math.random() * 8,
    lfoDepth: 0.40,
    startFreq: 420, endFreq: 85,
    rate: 0.92 + Math.random() * 0.2,
    vol,
  });
}

/** Pedo largo y profundo — leyenda del bosque */
function playFart2(vol: number) {
  const c = getCtx(); if (!c) return;
  makeFart(c, {
    dur: 0.55 + Math.random() * 0.22,
    lfoHz: 12 + Math.random() * 6,
    lfoDepth: 0.35,
    startFreq: 300, endFreq: 55,
    rate: 0.68 + Math.random() * 0.15,
    vol,
  });
}

export function playFartRandom(vol = 0.70): void {
  const c = getCtx(); if (!c) return;
  void c.resume();
  const v = Math.floor(Math.random() * 3);
  if (v === 0) playFart0(vol);
  else if (v === 1) playFart1(vol);
  else playFart2(vol);
}

/* ════════════════════════════════════════════════════
   ERUCTOS 😮‍💨
   Técnica clave: filtros de formantes (F1 + F2) que
   simulan la resonancia de garganta y pecho.
   Sin formantes suena a sintetizador; con ellos suena
   a eructo de verdad.
════════════════════════════════════════════════════ */

function makeBurp(c: AudioContext, cfg: {
  dur: number;
  baseFreq: number;     // frecuencia inicial del oscilador
  endRatio: number;     // multiplicador final de frecuencia
  f1: number;           // formante 1 Hz (pecho)
  f2: number;           // formante 2 Hz (garganta)
  noiseAmt: number;     // cantidad de ruido húmedo (0–0.25)
  vol: number;
}) {
  const { dur, baseFreq, endRatio, f1: f1Hz, f2: f2Hz, noiseAmt, vol } = cfg;
  const t = c.currentTime;

  // Oscilador principal — diente de sierra (rico en armónicos)
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(baseFreq,              t);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5,      t + dur * 0.40);
  osc.frequency.linearRampToValueAtTime(baseFreq * 0.62,           t + dur * 0.62);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * endRatio, t + dur);

  // Formante 1 — resonancia de pecho/estómago (frecuencia baja)
  const form1 = c.createBiquadFilter();
  form1.type  = "bandpass";
  form1.frequency.value = f1Hz;
  form1.Q.value = 4;

  // Formante 2 — resonancia de garganta (frecuencia media)
  const form2 = c.createBiquadFilter();
  form2.type  = "bandpass";
  form2.frequency.value = f2Hz;
  form2.Q.value = 5;

  // Mezcla de formantes
  const mix = c.createGain();
  mix.gain.value = 1;

  osc.connect(form1); form1.connect(mix);
  osc.connect(form2); form2.connect(mix);

  // Ruido húmedo (pequeña cantidad da textura "mojada")
  if (noiseAmt > 0) {
    const noise   = brownNoise(c, dur * 0.35);
    const nLpf    = c.createBiquadFilter();
    nLpf.type     = "lowpass"; nLpf.frequency.value = 350;
    const nGain   = c.createGain();
    nGain.gain.value = noiseAmt * vol;
    noise.connect(nLpf); nLpf.connect(nGain); nGain.connect(c.destination);
    noise.start(t); noise.stop(t + dur * 0.35 + 0.05);
  }

  // Envolvente principal
  const env = c.createGain();
  env.gain.setValueAtTime(0,   t);
  env.gain.linearRampToValueAtTime(vol, t + 0.02);
  env.gain.setValueAtTime(vol,          t + dur * 0.55);
  env.gain.exponentialRampToValueAtTime(0.01, t + dur);

  mix.connect(env);
  env.connect(c.destination);

  osc.start(t); osc.stop(t + dur + 0.05);
}

/** Eructo corto y explosivo */
function playBurp0(vol: number) {
  const c = getCtx(); if (!c) return;
  makeBurp(c, {
    dur: 0.22 + Math.random() * 0.08,
    baseFreq: 240 + Math.random() * 60,
    endRatio: 0.30,
    f1: 260, f2: 580,
    noiseAmt: 0.12,
    vol,
  });
}

/** Eructo operístico — glorioso y largo */
function playBurp1(vol: number) {
  const c = getCtx(); if (!c) return;
  makeBurp(c, {
    dur: 0.55 + Math.random() * 0.18,
    baseFreq: 175 + Math.random() * 45,
    endRatio: 0.22,
    f1: 220, f2: 520,
    noiseAmt: 0.18,
    vol,
  });
}

/** Eructo grave de oso del bosque */
function playBurp2(vol: number) {
  const c = getCtx(); if (!c) return;
  makeBurp(c, {
    dur: 0.45 + Math.random() * 0.12,
    baseFreq: 110 + Math.random() * 30,
    endRatio: 0.25,
    f1: 160, f2: 380,
    noiseAmt: 0.22,
    vol: vol * 1.1,
  });
}

export function playBurpRandom(vol = 0.52): void {
  const c = getCtx(); if (!c) return;
  void c.resume();
  const v = Math.floor(Math.random() * 3);
  if (v === 0) playBurp0(vol);
  else if (v === 1) playBurp1(vol);
  else playBurp2(vol);
}

/* ── Alias para eventos aleatorios de fondo ─────── */
export function playFart(vol = 0.70): void { playFartRandom(vol); }
export function playBurp(vol = 0.52): void { playBurpRandom(vol); }

/* ─── Guardias de frecuencia ──────────────────── */
const FART_KEY = "sq_last_fart_ts";
const BURP_KEY = "sq_last_burp_ts";
function getLastTs(k: string) { try { return parseInt(localStorage.getItem(k) ?? "0", 10); } catch { return 0; } }
function setLastTs(k: string) { try { localStorage.setItem(k, Date.now().toString()); } catch { /* noop */ } }

export function maybeRandomFart(): string | null {
  if (typeof window === "undefined") return null;
  if (Date.now() - getLastTs(FART_KEY) < 3_600_000) return null;
  setLastTs(FART_KEY);
  if (Math.random() > 0.20) return null;
  playFartRandom();
  const msgs = [
    "💨 *pfffrrt*… 🫣 ¡Uy, perdón!", "💨 El bosque tiene sus propios sonidos 🌿😅",
    "💨 ¡Culpa de las bellotas! 🌰💨", "💨 …¿Qué? Aquí no ha pasado nada 😶",
    "💨 El viento del bosque soy yo 😏",
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

export function maybeEructo(): string | null {
  if (Date.now() - getLastTs(BURP_KEY) < 120_000) return null;
  if (Math.random() > 0.35) return null;
  setLastTs(BURP_KEY);
  playBurpRandom();
  const msgs = [
    "¡BUUUURP! 😮‍💨 Perdona, es que estaba muy rico",
    "¡Eructo de campeona! 😳 …disculpa",
    "¡Ups! 😮‍💨 Las bellotas hacen eso a veces",
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}
