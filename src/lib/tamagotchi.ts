import type { ActivityKey } from "./rewards";
import { pushToCloud } from "./cloudsync";

/* ════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════ */
export type TamaStats = {
  hambre:   number; // 0-100 (100 = llena)
  energia:  number; // 0-100 (100 = descansada)
  animo:    number; // 0-100 (100 = feliz)
  salud:    number; // 0-100 (derivado)
  lastSaved: string; // ISO timestamp
};

export type TamaVisualState =
  | "muy_feliz"
  | "feliz"
  | "neutral"
  | "triste"
  | "hambre"
  | "cansada"
  | "comiendo"
  | "durmiendo"
  | "jugando"
  | "enfadada";

/* ════════════════════════════════════════════════════
   DECAY (por hora)
════════════════════════════════════════════════════ */
const DECAY = { hambre: 2.8, energia: 2.0, animo: 2.2 };

/* ════════════════════════════════════════════════════
   ACTIVITY BOOSTS
════════════════════════════════════════════════════ */
export const ACTIVITY_TAMA: Record<ActivityKey, Partial<Pick<TamaStats, "hambre"|"energia"|"animo">>> = {
  diario:    { animo: 22, energia: 12 },
  emocional: { animo: 25, energia: 8 },
  caca:      { animo: 8,  energia: 5 },
  p1:        { energia: 16, animo: 14 },
  p2:        { energia: 14, animo: 16 },
  p3:        { energia: 20, animo: 12 },
};

/* ════════════════════════════════════════════════════
   STATE MESSAGES
════════════════════════════════════════════════════ */
export const TAMA_MESSAGES: Record<TamaVisualState, string> = {
  muy_feliz:  "¡Estoy contentísima! 🥳",
  feliz:      "¡Qué bien me tratas! ✨",
  neutral:    "Aquí estoy, contigo 🌿",
  triste:     "Me siento un poco sola... 💙",
  hambre:     "Tengo mucha hambre... 😩",
  cansada:    "Estoy agotada, necesito dormir 💤",
  comiendo:   "¡Mmm, está riquísimo! 😋",
  durmiendo:  "Zzz... dulces sueños... 😴",
  jugando:    "¡Esto es genial! 🎉",
  enfadada:   "¡Llevas mucho sin cuidarme! 😤",
};

/* ════════════════════════════════════════════════════
   STORAGE
════════════════════════════════════════════════════ */
const LS_KEY = "tama_stats_v2";

const DEFAULT: TamaStats = {
  hambre: 75, energia: 75, animo: 75, salud: 75,
  lastSaved: new Date().toISOString(),
};

function computeSalud(h: number, e: number, a: number): number {
  const avg = (h + e + a) / 3;
  const min = Math.min(h, e, a);
  const penalty = min < 20 ? (20 - min) * 0.5 : 0;
  return Math.max(0, Math.min(100, avg - penalty));
}

export function getTamaStats(): TamaStats {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const s: TamaStats = raw
      ? { ...DEFAULT, ...(JSON.parse(raw) as TamaStats) }
      : { ...DEFAULT };
    const now  = new Date();
    const last = new Date(s.lastSaved);
    const hrs  = Math.max(0, (now.getTime() - last.getTime()) / 3_600_000);
    if (hrs > 0.016) { // >1 min
      s.hambre  = Math.max(0, s.hambre  - DECAY.hambre  * hrs);
      s.energia = Math.max(0, s.energia - DECAY.energia * hrs);
      s.animo   = Math.max(0, s.animo   - DECAY.animo   * hrs);
      s.salud   = computeSalud(s.hambre, s.energia, s.animo);
      s.lastSaved = now.toISOString();
      saveTamaStats(s);
    }
    return s;
  } catch { return { ...DEFAULT }; }
}

export function saveTamaStats(s: TamaStats): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
    pushToCloud(LS_KEY, s);
  } catch { /* noop */ }
}

/* ════════════════════════════════════════════════════
   ACTIONS
════════════════════════════════════════════════════ */
export function applyActivityToTama(key: ActivityKey): TamaStats {
  const s = getTamaStats();
  const b = ACTIVITY_TAMA[key];
  if (b.hambre)  s.hambre  = Math.min(100, s.hambre  + b.hambre);
  if (b.energia) s.energia = Math.min(100, s.energia + b.energia);
  if (b.animo)   s.animo   = Math.min(100, s.animo   + b.animo);
  s.salud = computeSalud(s.hambre, s.energia, s.animo);
  s.lastSaved = new Date().toISOString();
  saveTamaStats(s);
  return s;
}

export function feedTama(hambreRestore: number, animoBoost = 0): TamaStats {
  const s = getTamaStats();
  s.hambre = Math.min(100, s.hambre + hambreRestore);
  s.animo  = Math.min(100, s.animo  + animoBoost);
  s.salud  = computeSalud(s.hambre, s.energia, s.animo);
  s.lastSaved = new Date().toISOString();
  saveTamaStats(s);
  return s;
}

export function sleepTama(): TamaStats {
  const s = getTamaStats();
  s.energia = Math.min(100, s.energia + 48);
  s.animo   = Math.min(100, s.animo   + 8);
  s.salud   = computeSalud(s.hambre, s.energia, s.animo);
  s.lastSaved = new Date().toISOString();
  saveTamaStats(s);
  return s;
}

export function playTama(animoBoost: number): TamaStats {
  const s = getTamaStats();
  s.animo  = Math.min(100, s.animo  + animoBoost);
  s.hambre = Math.max(0,   s.hambre - 5);
  s.salud  = computeSalud(s.hambre, s.energia, s.animo);
  s.lastSaved = new Date().toISOString();
  saveTamaStats(s);
  return s;
}

/* ════════════════════════════════════════════════════
   VISUAL STATE COMPUTATION
════════════════════════════════════════════════════ */
export function computeVisualState(
  s: TamaStats,
  action?: "comiendo" | "durmiendo" | "jugando",
): TamaVisualState {
  if (action) return action;
  const avg = (s.hambre + s.energia + s.animo) / 3;
  if (s.hambre  <= 12) return "hambre";
  if (s.energia <= 12) return "cansada";
  const min = Math.min(s.hambre, s.energia, s.animo);
  if (avg >= 80 && min >= 60) return "muy_feliz";
  if (avg >= 62) return "feliz";
  if (avg >= 42) return "neutral";
  if (avg >= 24) return "triste";
  return "enfadada";
}
