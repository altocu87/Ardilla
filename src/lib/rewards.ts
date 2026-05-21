// Configuración de recompensas por actividad — guardada en localStorage.

export type ActivityKey = "diario" | "caca" | "emocional" | "p1" | "p2" | "p3";

export type RewardEntry = { xp: number; bellotas: number };

export type RewardsConfig = Record<ActivityKey, RewardEntry>;

export const ACTIVITY_LABELS: Record<ActivityKey, { label: string; emoji: string; color: string }> = {
  diario:    { label: "Registro diario",                   emoji: "📓", color: "text-teal-600"    },
  caca:      { label: "Registro caca",                     emoji: "💩", color: "text-amber-600"   },
  emocional: { label: "Registro emocional",                emoji: "💭", color: "text-sky-600"     },
  p1:        { label: "Práctica 1 · Señal y alarma",       emoji: "🟠", color: "text-orange-600"  },
  p2:        { label: "Práctica 2 · Mapa de hiperalerta",  emoji: "🟣", color: "text-violet-600"  },
  p3:        { label: "Práctica 3 · Orientación suave",    emoji: "🟢", color: "text-emerald-600" },
};

export const ACTIVITY_KEYS: ActivityKey[] = ["diario", "caca", "emocional", "p1", "p2", "p3"];

export const DEFAULT_REWARDS: RewardsConfig = {
  diario:    { xp: 30, bellotas: 5 },
  caca:      { xp: 15, bellotas: 3 },
  emocional: { xp: 20, bellotas: 4 },
  p1:        { xp: 20, bellotas: 4 },
  p2:        { xp: 25, bellotas: 5 },
  p3:        { xp: 15, bellotas: 3 },
};

const LS_KEY = "rewards_config_v1";

export function getRewardsConfig(): RewardsConfig {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<RewardsConfig>;
      // Mezclar con defaults para nuevas claves
      return { ...DEFAULT_REWARDS, ...parsed };
    }
  } catch { /* noop */ }
  return { ...DEFAULT_REWARDS };
}

export function saveRewardsConfig(cfg: RewardsConfig): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)); } catch { /* noop */ }
}
