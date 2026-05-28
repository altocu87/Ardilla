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

/* ════════════════════════════════════════════════════
   COSITAS 🤲 — arpegio suave ascendente (purr mágico)
════════════════════════════════════════════════════ */
export function playCositas(): void {
  const c = getCtx(); if (!c) return;
  void c.resume();

  // Arpegio C mayor + campanita final
  const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4 E4 G4 C5 E5
  notes.forEach((freq, i) => {
    const t     = c.currentTime + i * 0.13;
    const osc   = c.createOscillator();
    osc.type    = "sine";
    osc.frequency.value = freq;

    // Ligero vibrato para efecto "ronroneo"
    const vib  = c.createOscillator();
    vib.type   = "sine";
    vib.frequency.value = 5.5;
    const vibG = c.createGain();
    vibG.gain.value = 3;
    vib.connect(vibG);
    vibG.connect(osc.frequency);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0,    t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + 0.6);
    vib.start(t); vib.stop(t + 0.6);
  });

  // Destello final brillante (octava alta)
  const sparkT = c.currentTime + notes.length * 0.13 + 0.1;
  [1046.50, 1318.51].forEach((freq, i) => {
    const t   = sparkT + i * 0.08;
    const osc = c.createOscillator();
    osc.type  = "sine";
    osc.frequency.value = freq;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0,    t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + 0.45);
  });
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

/* ════════════════════════════════════════════════════
   JUEGOS 🎮 — efectos de sonido para minijuegos
════════════════════════════════════════════════════ */

/** Colocar ficha (Tres en Raya, Conecta 4) */
export function playMove(vol = 0.22): void {
  const c = getCtx(); if (!c) return;
  void c.resume();
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(420, t);
  osc.frequency.exponentialRampToValueAtTime(280, t + 0.09);
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
  osc.connect(gain); gain.connect(c.destination);
  osc.start(t); osc.stop(t + 0.13);
}

/** Caída de pieza (Conecta 4) — tono descendente + golpe */
export function playDrop(vol = 0.28): void {
  const c = getCtx(); if (!c) return;
  void c.resume();
  const t = c.currentTime;
  // Tono descendente
  const osc = c.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(700, t);
  osc.frequency.exponentialRampToValueAtTime(160, t + 0.13);
  const g1 = c.createGain();
  g1.gain.setValueAtTime(vol, t);
  g1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(g1); g1.connect(c.destination);
  osc.start(t); osc.stop(t + 0.17);
  // Golpe percusivo al llegar
  const noise = brownNoise(c, 0.06);
  const hpf = c.createBiquadFilter();
  hpf.type = "highpass"; hpf.frequency.value = 1800;
  const g2 = c.createGain();
  g2.gain.setValueAtTime(vol * 0.6, t + 0.11);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  noise.connect(hpf); hpf.connect(g2); g2.connect(c.destination);
  noise.start(t + 0.11); noise.stop(t + 0.19);
}

/** Voltear carta (Mayor o Menor) */
export function playCardFlip(vol = 0.30): void {
  const c = getCtx(); if (!c) return;
  void c.resume();
  const t = c.currentTime;
  // Swish de papel
  const noise = brownNoise(c, 0.09);
  const hpf = c.createBiquadFilter();
  hpf.type = "highpass"; hpf.frequency.value = 2400;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  noise.connect(hpf); hpf.connect(gain); gain.connect(c.destination);
  noise.start(t); noise.stop(t + 0.1);
  // Tono de "reveal"
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, t + 0.05);
  osc.frequency.exponentialRampToValueAtTime(1100, t + 0.12);
  const g2 = c.createGain();
  g2.gain.setValueAtTime(0, t + 0.05);
  g2.gain.linearRampToValueAtTime(vol * 0.5, t + 0.07);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.connect(g2); g2.connect(c.destination);
  osc.start(t + 0.05); osc.stop(t + 0.2);
}

/** Victoria — fanfarria ascendente */
export function playWin(vol = 0.30): void {
  const c = getCtx(); if (!c) return;
  void c.resume();
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, i) => {
    const t = c.currentTime + i * 0.13;
    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + 0.42);
  });
  // Brillo final
  const sparkT = c.currentTime + 0.52;
  [1318.51, 1567.98].forEach((freq, i) => {
    const t = sparkT + i * 0.07;
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + 0.35);
  });
}

/** Derrota — trombón triste descendente */
export function playLose(vol = 0.22): void {
  const c = getCtx(); if (!c) return;
  void c.resume();
  const notes = [392.00, 349.23, 311.13, 261.63];
  notes.forEach((freq, i) => {
    const t = c.currentTime + i * 0.19;
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.linearRampToValueAtTime(freq * 0.84, t + 0.22);
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + 0.28);
  });
}

/** Empate — dos pulsos neutrales */
export function playDraw(vol = 0.18): void {
  const c = getCtx(); if (!c) return;
  void c.resume();
  [440, 440].forEach((freq, i) => {
    const t = c.currentTime + i * 0.18;
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + 0.25);
  });
}

/** Apuesta colocada — dos notas cortas */
export function playBet(vol = 0.18): void {
  const c = getCtx(); if (!c) return;
  void c.resume();
  [330, 440].forEach((freq, i) => {
    const t = c.currentTime + i * 0.09;
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + 0.15);
  });
}

/** Beep de cuenta atrás — grave normal / agudo en "¡YA!" */
export function playCountdownBeep(isLast = false, vol = 0.32): void {
  const c = getCtx(); if (!c) return;
  void c.resume();
  const t = c.currentTime;
  if (isLast) {
    // "¡YA!" — acorde de inicio
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const t2 = t + i * 0.05;
      const osc = c.createOscillator();
      osc.type = "square";
      osc.frequency.value = freq;
      const gain = c.createGain();
      gain.gain.setValueAtTime(vol * 0.6, t2);
      gain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.35);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(t2); osc.stop(t2 + 0.4);
    });
  } else {
    // Beep normal
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 440;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + 0.2);
  }
}

/** Sonido de carrera en curso — ruido de pasos/ambiente */
export function playRaceAmbient(vol = 0.08): void {
  const c = getCtx(); if (!c) return;
  void c.resume();
  const t = c.currentTime;
  const noise = brownNoise(c, 0.12);
  const bpf = c.createBiquadFilter();
  bpf.type = "bandpass"; bpf.frequency.value = 600; bpf.Q.value = 1.5;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  noise.connect(bpf); bpf.connect(gain); gain.connect(c.destination);
  noise.start(t); noise.stop(t + 0.14);
}

/** Meta cruzada — fanfarria */
export function playRaceFinish(won: boolean, vol = 0.32): void {
  const c = getCtx(); if (!c) return;
  void c.resume();
  if (won) {
    playWin(vol);
  } else {
    playLose(vol * 0.9);
  }
}
