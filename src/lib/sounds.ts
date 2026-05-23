/* ════════════════════════════════════════════════════
   SOUNDS — Web Audio API (sin archivos externos)
   Funciona en iOS/Android con interacción previa del usuario.
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

/** Llama esto en cualquier gesto del usuario para desbloquear audio en iOS. */
export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume();
}

/* ─── PEDO 💨 ───────────────────────────────────────
   Ruido marrón (brown noise) filtrado paso bajo
   con caída de frecuencia progresiva.              */
export function playFart(volume = 0.65): void {
  const c = getCtx();
  if (!c) return;
  void c.resume();

  const duration = 0.28 + Math.random() * 0.28; // 0.28–0.56 s
  const sampleRate = c.sampleRate;
  const bufSize    = Math.floor(sampleRate * duration);
  const buf        = c.createBuffer(1, bufSize, sampleRate);
  const d          = buf.getChannelData(0);

  // Genera ruido marrón
  let last = 0;
  for (let i = 0; i < bufSize; i++) {
    const white = Math.random() * 2 - 1;
    d[i]  = (last + 0.022 * white) / 1.022;
    last  = d[i];
    d[i] *= 3.5;
  }

  const src  = c.createBufferSource();
  src.buffer = buf;
  // Pitch-bend leve aleatorio
  src.playbackRate.value = 0.85 + Math.random() * 0.3;

  const lpf = c.createBiquadFilter();
  lpf.type = "lowpass";
  lpf.frequency.setValueAtTime(380, c.currentTime);
  lpf.frequency.exponentialRampToValueAtTime(85, c.currentTime + duration);
  lpf.Q.value = 1.2;

  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + duration);

  src.connect(lpf);
  lpf.connect(gain);
  gain.connect(c.destination);
  src.start();
  src.stop(c.currentTime + duration + 0.05);
}

/* ─── ERUCTO 😮‍💨 ──────────────────────────────────
   Oscilador en diente de sierra + distorsión suave
   con glide descendente.                           */
export function playBurp(volume = 0.48): void {
  const c = getCtx();
  if (!c) return;
  void c.resume();

  const t   = c.currentTime;
  const dur = 0.32 + Math.random() * 0.12;

  // Oscilador principal
  const osc = c.createOscillator();
  osc.type  = "sawtooth";
  const baseFreq = 180 + Math.random() * 70;
  osc.frequency.setValueAtTime(baseFreq,       t);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.38, t + dur * 0.55);
  osc.frequency.linearRampToValueAtTime(baseFreq * 0.50,       t + dur * 0.85);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.28, t + dur);

  // Waveshaper para distorsión intestinal
  const dist = c.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i * 2) / 256 - 1;
    curve[i] = (Math.PI + 80) * x / (Math.PI + 80 * Math.abs(x));
  }
  dist.curve = curve;

  // Filtro para oscurecer el timbre
  const lpf = c.createBiquadFilter();
  lpf.type = "lowpass";
  lpf.frequency.value = 800;

  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

  osc.connect(dist);
  dist.connect(lpf);
  lpf.connect(gain);
  gain.connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/* ─── Guardia de frecuencia (localStorage) ────────── */
const FART_KEY = "sq_last_fart_ts";
const BURP_KEY = "sq_last_burp_ts";

function getLastTs(key: string): number {
  try { return parseInt(localStorage.getItem(key) ?? "0", 10); } catch { return 0; }
}
function setLastTs(key: string): void {
  try { localStorage.setItem(key, Date.now().toString()); } catch { /* noop */ }
}

/**
 * Comprueba si toca un pedo aleatorio (20% por hora).
 * Si toca, reproduce el sonido y devuelve el mensaje divertido.
 */
export function maybeRandomFart(): string | null {
  if (typeof window === "undefined") return null;
  const elapsed = Date.now() - getLastTs(FART_KEY);
  if (elapsed < 60 * 60 * 1000) return null;          // espera al menos 1h
  if (Math.random() > 0.20) {
    setLastTs(FART_KEY);                                // marca la hora aunque no toque
    return null;
  }
  setLastTs(FART_KEY);
  playFart();
  const msgs = [
    "💨 *pfffrrt*… 🫣 ¡Uy, perdón!",
    "💨 Ejem… eso no he sido yo 😳",
    "💨 El bosque tiene sus propios sonidos 🌿😅",
    "💨 ¡Culpa de las bellotas! 🌰💨",
    "💨 …¿Qué? Aquí no ha pasado nada 😶",
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

/**
 * Posible eructo tras comer (35% de probabilidad).
 * Reproduce el sonido y devuelve el mensaje divertido.
 */
export function maybeEructo(): string | null {
  if (Math.random() > 0.35) return null;
  // No repetir eructo si hace menos de 2 min
  if (Date.now() - getLastTs(BURP_KEY) < 2 * 60 * 1000) return null;
  setLastTs(BURP_KEY);
  playBurp();
  const msgs = [
    "¡BUUUURP! 😮‍💨 Perdona, es que estaba muy rico",
    "¡Eructo de campeona! 😳 …disculpa",
    "Mmm… *BEEELCH* 😅 ¡Qué vergüenza!",
    "¡Buaaaaarp! 🫢 Soy muy educada, lo prometo",
    "¡Ups! 😮‍💨 Las bellotas hacen eso a veces",
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}
