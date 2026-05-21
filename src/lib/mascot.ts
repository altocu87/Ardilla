import { getPregLog } from "./db";
import type { ActivityKey } from "./rewards";

/* ══════════════════════════════════════════════════════════════════
   TAMAGOTCHI STATS
══════════════════════════════════════════════════════════════════ */
export type TamagotchiStats = {
  vitalidad: number;  // 0-100
  salud: number;      // 0-100
  animo: number;      // 0-100
  lastUpdated: string; // YYYY-MM-DD
};

const LS_TAMA_KEY = "tamagotchi_stats_v1";
const DECAY_PER_DAY = 13;

const DEFAULT_TAMA: TamagotchiStats = {
  vitalidad: 80,
  salud: 80,
  animo: 80,
  lastUpdated: new Date().toISOString().slice(0, 10),
};

const ACTIVITY_BOOST: Record<ActivityKey, Partial<Record<"vitalidad" | "salud" | "animo", number>>> = {
  diario:    { vitalidad: 12, animo: 22 },
  emocional: { vitalidad: 10, salud: 14, animo: 16 },
  caca:      { salud: 28 },
  p1:        { vitalidad: 15, animo: 15 },
  p2:        { vitalidad: 10, salud: 12, animo: 12 },
  p3:        { vitalidad: 20, animo: 12 },
};

export function getTamagotchiStats(): TamagotchiStats {
  try {
    const raw = localStorage.getItem(LS_TAMA_KEY);
    const stats: TamagotchiStats = raw
      ? { ...DEFAULT_TAMA, ...(JSON.parse(raw) as TamagotchiStats) }
      : { ...DEFAULT_TAMA };
    const today = new Date().toISOString().slice(0, 10);
    if (stats.lastUpdated !== today) {
      const diff = Math.floor(
        (new Date(today).getTime() - new Date(stats.lastUpdated).getTime())
        / 86_400_000,
      );
      const decay = Math.min(diff * DECAY_PER_DAY, 100);
      stats.vitalidad = Math.max(0, stats.vitalidad - decay);
      stats.salud     = Math.max(0, stats.salud     - decay);
      stats.animo     = Math.max(0, stats.animo     - decay);
      stats.lastUpdated = today;
      saveTamagotchiStats(stats);
    }
    return stats;
  } catch {
    return { ...DEFAULT_TAMA };
  }
}

export function saveTamagotchiStats(stats: TamagotchiStats): void {
  try { localStorage.setItem(LS_TAMA_KEY, JSON.stringify(stats)); } catch { /* noop */ }
}

export function applyActivityToStats(activityKey: ActivityKey): void {
  const stats = getTamagotchiStats();
  const boost = ACTIVITY_BOOST[activityKey];
  if (!boost) return;
  if (boost.vitalidad) stats.vitalidad = Math.min(100, stats.vitalidad + boost.vitalidad);
  if (boost.salud)     stats.salud     = Math.min(100, stats.salud     + boost.salud);
  if (boost.animo)     stats.animo     = Math.min(100, stats.animo     + boost.animo);
  stats.lastUpdated = new Date().toISOString().slice(0, 10);
  saveTamagotchiStats(stats);
}

export function computeMascotStateFromStats(
  stats: TamagotchiStats,
  currentStreak: number,
  cfg: MascotConfig,
): MascotState {
  const avg    = (stats.vitalidad + stats.salud + stats.animo) / 3;
  const minStat = Math.min(stats.vitalidad, stats.salud, stats.animo);
  if (minStat <= 5)  return "enfadada";
  if (minStat <= 20) return "dormida";
  if (avg <= 35)     return "triste";
  if (currentStreak >= cfg.rachaFeliz && avg >= 65) return "muy_feliz";
  if (avg >= 60)     return "feliz";
  if (avg >= 42)     return "neutral";
  return "triste";
}

/* ══════════════════════════════════════════════════════════════════
   MASCOT STATE
══════════════════════════════════════════════════════════════════ */
export type MascotState =
  | "muy_feliz"
  | "feliz"
  | "neutral"
  | "triste"
  | "dormida"
  | "enfadada";

export type MascotConfig = {
  nombre: string;
  diasTriste: number;
  diasDormida: number;
  diasEnfadada: number;
  rachaFeliz: number;
};

export const DEFAULT_MASCOT_CONFIG: MascotConfig = {
  nombre: "Ardilla",
  diasTriste: 2,
  diasDormida: 4,
  diasEnfadada: 7,
  rachaFeliz: 5,
};

const LS_KEY = "mascot_config_v1";

export function getMascotConfig(): MascotConfig {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<MascotConfig>;
      return { ...DEFAULT_MASCOT_CONFIG, ...parsed };
    }
  } catch { /* noop */ }
  return { ...DEFAULT_MASCOT_CONFIG };
}

export function saveMascotConfig(cfg: MascotConfig): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
  } catch { /* noop */ }
}

export async function getDaysSinceLastActivity(): Promise<number> {
  try {
    const log = await getPregLog();
    const dates = Object.keys(log).sort().reverse();
    if (dates.length === 0) return 999;
    const lastDate = new Date(dates[0]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  } catch {
    return 999;
  }
}

export function computeMascotState(
  daysSinceLastActivity: number,
  currentStreak: number,
  cfg: MascotConfig,
): MascotState {
  if (daysSinceLastActivity >= cfg.diasEnfadada) return "enfadada";
  if (daysSinceLastActivity >= cfg.diasDormida) return "dormida";
  if (daysSinceLastActivity >= cfg.diasTriste) return "triste";
  if (currentStreak >= cfg.rachaFeliz) return "muy_feliz";
  if (currentStreak >= 1) return "feliz";
  return "neutral";
}

export type MascotStateInfo = {
  emoji: string;
  message: string;
  animationClass: string;
  glowColor: string;
  tintClass: string;
};

export const MASCOT_STATE_INFO: Record<MascotState, MascotStateInfo> = {
  muy_feliz: {
    emoji: "🐿️",
    message: "¡Hoy estás imparable! 🥳",
    animationClass: "mascot-muy-feliz",
    glowColor: "rgba(251,191,36,0.7)",
    tintClass: "text-amber-500",
  },
  feliz: {
    emoji: "🐿️",
    message: "¡Qué bien que estás por aquí! ✨",
    animationClass: "mascot-feliz",
    glowColor: "rgba(52,211,153,0.6)",
    tintClass: "text-teal-500",
  },
  neutral: {
    emoji: "🐿️",
    message: "Aquí estoy, lista para acompañarte 🌿",
    animationClass: "mascot-neutral",
    glowColor: "rgba(148,163,184,0.4)",
    tintClass: "text-slate-500",
  },
  triste: {
    emoji: "🐿️",
    message: "Te echo de menos... 💙",
    animationClass: "mascot-triste",
    glowColor: "rgba(96,165,250,0.5)",
    tintClass: "text-blue-400",
  },
  dormida: {
    emoji: "🐿️",
    message: "Zzz... Llevo un rato esperándote 💤",
    animationClass: "mascot-dormida",
    glowColor: "rgba(148,163,184,0.35)",
    tintClass: "text-slate-400",
  },
  enfadada: {
    emoji: "🐿️",
    message: "¡Llevas mucho sin venir! 😤",
    animationClass: "mascot-enfadada",
    glowColor: "rgba(239,68,68,0.5)",
    tintClass: "text-red-500",
  },
};
