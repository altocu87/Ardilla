import type { ActivityKey } from "./rewards";
import { pushToCloud } from "./cloudsync";

/* ════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════ */
export type IllnessType = "stomach" | "caca" | "tired";

export const ILLNESS_INFO: Record<IllnessType, {
  emoji: string; name: string; desc: string;
  medicineId: string; medicineName: string; medicineEmoji: string;
  badgeColor: string;
}> = {
  stomach: { emoji: "🤒", name: "Dolor de barriga",   desc: "Le duele la barriguita. Necesita probióticos.",       medicineId: "med_probiotics", medicineName: "Probióticos",  medicineEmoji: "💊", badgeColor: "bg-orange-100 border-orange-300 text-orange-700" },
  caca:    { emoji: "💩", name: "Estreñimiento",        desc: "Le cuesta ir al baño. Necesita CacaMax.",            medicineId: "med_fibra",      medicineName: "CacaMax",       medicineEmoji: "🌾", badgeColor: "bg-amber-100  border-amber-300  text-amber-700"  },
  tired:   { emoji: "😴", name: "Cansancio crónico",   desc: "Agotada sin remedio. Necesita vitaminas C.",          medicineId: "med_vitaminas",  medicineName: "Vitaminas C",   medicineEmoji: "🍊", badgeColor: "bg-blue-100   border-blue-300   text-blue-700"   },
};

export type TamaStats = {
  hambre:   number;
  energia:  number;
  animo:    number;
  salud:    number;
  illness?:      IllnessType | null;
  illnessSince?: string;
  lastSickCheck?: string;
  totalIllnesses?: number;
  illnessByType?:  Partial<Record<IllnessType, number>>;
  /* legacy compat */
  stomachSick?: boolean;
  stomachSickSince?: string;
  lastSaved: string;
};

export type TamaVisualState =
  | "muy_feliz" | "feliz" | "neutral" | "triste" | "hambre"
  | "cansada"   | "comiendo" | "durmiendo" | "jugando" | "enfadada"
  | "malita";

/* ════════════════════════════════════════════════════
   DECAY (por hora)
════════════════════════════════════════════════════ */
const DECAY = { hambre: 2.8, energia: 2.0, animo: 2.2 };

/* ════════════════════════════════════════════════════
   ACTIVITY BOOSTS
════════════════════════════════════════════════════ */
export const ACTIVITY_TAMA: Record<ActivityKey, Partial<Pick<TamaStats, "hambre"|"energia"|"animo">>> = {
  diario:    { animo: 22, energia: 12 },
  emocional: { animo: 25, energia: 8  },
  caca:      { animo: 8,  energia: 5  },
  p1:        { energia: 16, animo: 14 },
  p2:        { energia: 14, animo: 16 },
  p3:        { energia: 20, animo: 12 },
};

/* ════════════════════════════════════════════════════
   STATE MESSAGES
════════════════════════════════════════════════════ */
const BASE_MESSAGES: Record<TamaVisualState, string[]> = {
  muy_feliz:  [
    "¡Estoy contentísima! 🥳", "¡Hoy me siento genial! ✨", "¡Eres la mejor! 💖",
    "¡Bailemos entre las bellotas! 🌰🎉", "¡El bosque brilla hoy por ti! 🌳✨",
  ],
  feliz:      [
    "¡Qué bien me tratas! ✨", "Me alegra tenerte aquí 🌟", "¡Contigo todo es mejor! 🎉",
    "El bosque huele a cosas bonitas hoy 🌿", "¡He encontrado una bellota dorada! 🌰",
  ],
  neutral:    [
    "Aquí estoy, contigo 🌿", "Un día tranquilo... 🍃", "¿Cómo estás tú hoy? 💬",
    "El caracol pasa por aquí y te saluda 🐌", "El bosque tiene su magia aunque sea suave 🌲",
  ],
  triste:     [
    "Me siento un poco sola... 💙", "Necesito más cariño 🥺", "¿Me das un abrazo? 🤗",
    "Los días grises también son válidos 🌧️", "El bosque te escucha aunque no hable 🌳",
  ],
  hambre:     [
    "Tengo mucha hambre... 😩", "¡Mi barriguita gruñe! 🍎", "¿Hora de comer? 🥺",
    "¡Las bellotas del bosque me llaman! 🌰😋",
  ],
  cansada:    [
    "Estoy agotada... 💤", "Necesito dormir un poco 😪", "Mis ojos se cierran... 🌙",
    "Hasta las ardillas necesitan su nidito 🌿",
  ],
  comiendo:   [
    "¡Mmm, está riquísimo! 😋", "¡Qué rico todo! 🍽️", "¡Gracias por la comida! 🥰",
    "¡Nom nom nom! 🌰", "¡La mejor ardilla del bosque come bien! 🐿️",
  ],
  durmiendo:  [
    "Zzz... dulces sueños... 😴", "Shh, estoy descansando 🌙", "Zzz... 💤",
    "Soñando con bellotas y caracoles... 🌰🐌💤",
  ],
  jugando:    [
    "¡Esto es genial! 🎉", "¡Me encanta jugar! 🎮", "¡Más, más! 🌟",
    "¡Corro por el bosque! 🌿🏃", "¡El caracol se une al juego! 🐌🎉",
  ],
  enfadada:   [
    "¡Llevas mucho sin cuidarme! 😤", "Me siento abandonada 😠", "¡Presta atención! ⚡",
    "¡Hasta las ardillas necesitan amor! 🐿️",
  ],
  malita:     [
    "Ay... me encuentro muy mal 🤒", "Necesito medicina... 💊", "Me encuentro fatal 😞",
    "El bosque también me cuida... ¿tú también? 🌱",
  ],
};

export const ENCOURAGEMENT_MESSAGES = [
  "Cada paso cuenta, igual que cada bellota 🌰",
  "El caracol siempre llega, a su ritmo y con su estilo 🐌💛",
  "Hoy no ha sido fácil, pero sigues aquí. Eso es todo 🌿",
  "El bosque nunca abandona a ningún árbol, ni yo a ti 🌲",
  "Tienes una ardilla de tu lado: ¡nada puede contigo! 🐿️💪",
  "Hasta la tormenta más larga acaba mostrando el sol ☀️",
  "Esta bellota es tuya, ganada hoy solo por seguir 🌰✨",
  "El bosque te conoce y aquí siempre hay un refugio 🍃",
  "¿Sabes qué? El caracol sabe que tú puedes con esto 🐌",
  "Paso a paso, como las hojas que caen con gracia 🍂",
  "Eres más fuerte que cualquier tormenta del bosque 🌲",
];

export const CACA_ILLNESS_MESSAGES = [
  "Ay, hoy el bosque no va bien de barriga... 💩😣",
  "¡CacaMax al rescate! El bosque siempre cuida 🌾",
  "Los árboles también tienen sus días difíciles 🌳",
  "Tranquila, esto pasa pronto. El caracol lo sabe 🐌",
  "Dame CacaMax y volveré a ser la reina del bosque 💪",
];

const STREAK_MESSAGES: Record<number, string> = {
  3:  "¡3 días seguidos! 🔥 ¡Somos imparables!",
  7:  "¡Una semana entera! 🎊 ¡Eres increíble!",
  14: "¡14 días! 🏆 ¡Eres una campeona!",
  30: "¡Un mes! 🥇 ¡Nunca me has fallado!",
};

export type MessageContext = {
  tristeza?:    boolean;
  cacaIllness?: boolean;
};

export function getContextualMessage(
  state: TamaVisualState,
  streak: number,
  ctx?: MessageContext,
): string {
  for (const days of [30, 14, 7, 3]) {
    if (streak === days && STREAK_MESSAGES[days]) return STREAK_MESSAGES[days];
  }
  const t = Math.floor(Date.now() / 60_000);
  if (ctx?.cacaIllness && state === "malita") {
    return CACA_ILLNESS_MESSAGES[t % CACA_ILLNESS_MESSAGES.length];
  }
  if (ctx?.tristeza && (state === "triste" || state === "neutral")) {
    return ENCOURAGEMENT_MESSAGES[t % ENCOURAGEMENT_MESSAGES.length];
  }
  const pool = BASE_MESSAGES[state] ?? BASE_MESSAGES.neutral;
  return pool[t % pool.length];
}

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

    /* Legacy migration: stomachSick → illness */
    if (s.stomachSick && !s.illness) {
      s.illness      = "stomach";
      s.illnessSince = s.stomachSickSince;
      s.stomachSick  = false;
    }

    const now  = new Date();
    const last = new Date(s.lastSaved);
    const hrs  = Math.max(0, (now.getTime() - last.getTime()) / 3_600_000);
    let dirty  = false;

    if (hrs > 0.016) {
      s.hambre  = Math.max(0, s.hambre  - DECAY.hambre  * hrs);
      s.energia = Math.max(0, s.energia - DECAY.energia * hrs);
      const animoDecay = s.illness ? DECAY.animo * 1.6 : DECAY.animo;
      s.animo   = Math.max(0, s.animo   - animoDecay * hrs);
      s.salud   = computeSalud(s.hambre, s.energia, s.animo);
      s.lastSaved = now.toISOString();
      dirty = true;
    }

    /* Daily sickness check */
    const today = now.toISOString().slice(0, 10);
    if (!s.illness && (s.lastSickCheck ?? "1970") < today) {
      s.lastSickCheck = today;
      const chance = s.hambre < 15 ? 0.18 : 0.04;
      if (Math.random() < chance) {
        const types: IllnessType[] = ["stomach", "caca", "tired"];
        s.illness      = types[Math.floor(Math.random() * 3)];
        s.illnessSince = now.toISOString();
        s.totalIllnesses  = (s.totalIllnesses  ?? 0) + 1;
        if (!s.illnessByType) s.illnessByType = {};
        s.illnessByType[s.illness] = (s.illnessByType[s.illness] ?? 0) + 1;
      }
      dirty = true;
    }

    /* Auto-heal after 48 hours */
    if (s.illness && s.illnessSince) {
      const sickHrs = (now.getTime() - new Date(s.illnessSince).getTime()) / 3_600_000;
      if (sickHrs >= 48) {
        s.illness      = null;
        s.illnessSince = undefined;
        dirty = true;
      }
    }

    if (dirty) saveTamaStats(s);
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

export function cureIllness(): TamaStats {
  const s = getTamaStats();
  s.illness      = null;
  s.illnessSince = undefined;
  s.animo   = Math.min(100, s.animo   + 20);
  s.energia = Math.min(100, s.energia + 12);
  s.salud   = computeSalud(s.hambre, s.energia, s.animo);
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
  if (s.illness)        return "malita";
  const avg = (s.hambre + s.energia + s.animo) / 3;
  if (s.hambre  <= 12)  return "hambre";
  if (s.energia <= 12)  return "cansada";
  const min = Math.min(s.hambre, s.energia, s.animo);
  if (avg >= 80 && min >= 60) return "muy_feliz";
  if (avg >= 62) return "feliz";
  if (avg >= 42) return "neutral";
  if (avg >= 24) return "triste";
  return "enfadada";
}
