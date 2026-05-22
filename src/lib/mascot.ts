import { getPregLog } from "./db";

/* ════════════════════════════════════════════════════
   CONFIG DE LA MASCOTA (persiste en ajustes)
════════════════════════════════════════════════════ */
export type MascotConfig = {
  nombre: string;
  rachaFeliz: number;
};

export const DEFAULT_MASCOT_CONFIG: MascotConfig = {
  nombre: "Ardilla",
  rachaFeliz: 5,
};

const LS_KEY = "mascot_config_v1";

export function getMascotConfig(): MascotConfig {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return { ...DEFAULT_MASCOT_CONFIG, ...(JSON.parse(stored) as Partial<MascotConfig>) };
  } catch { /* noop */ }
  return { ...DEFAULT_MASCOT_CONFIG };
}

export function saveMascotConfig(cfg: MascotConfig): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)); } catch { /* noop */ }
}

export async function getDaysSinceLastActivity(): Promise<number> {
  try {
    const log   = await getPregLog();
    const dates = Object.keys(log).sort().reverse();
    if (dates.length === 0) return 999;
    const last  = new Date(dates[0]);
    const today = new Date();
    today.setHours(0,0,0,0); last.setHours(0,0,0,0);
    return Math.max(0, Math.floor((today.getTime() - last.getTime()) / 86_400_000));
  } catch { return 999; }
}
