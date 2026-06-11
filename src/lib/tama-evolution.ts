import { pushToCloud } from "./cloudsync";

export type EvolutionPhase = "bebe" | "joven" | "adulta" | "anciana";

export type EvolutionData = {
  daysCaredFor: number;
  phase: EvolutionPhase;
  lastChecked: string;   // YYYY-MM-DD
  totalTaps: number;
  goodNightsStreak: number; // consecutive nights where we didn't disturb sleep
};

const LS_KEY = "tama_evolution_v1";

const DEFAULT: EvolutionData = {
  daysCaredFor: 0,
  phase: "bebe",
  lastChecked: new Date().toISOString().slice(0, 10),
  totalTaps: 0,
  goodNightsStreak: 0,
};

export const PHASE_INFO: Record<EvolutionPhase, { label: string; emoji: string; desc: string; minDays: number }> = {
  bebe:    { label: "Bebé",          emoji: "🌱", desc: "Recién llegada al mundo",             minDays: 0  },
  joven:   { label: "Joven",         emoji: "✨", desc: "Creciendo y aprendiendo",             minDays: 7  },
  adulta:  { label: "Adulta",        emoji: "🌟", desc: "En plena forma",                      minDays: 30 },
  anciana: { label: "Anciana Sabia", emoji: "🦉", desc: "Llena de experiencia y sabiduría",    minDays: 90 },
};

function computePhase(days: number): EvolutionPhase {
  if (days >= 90) return "anciana";
  if (days >= 30) return "adulta";
  if (days >= 7)  return "joven";
  return "bebe";
}

export function getEvolutionData(): EvolutionData {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw
      ? { ...DEFAULT, ...(JSON.parse(raw) as EvolutionData) }
      : { ...DEFAULT };
  } catch { return { ...DEFAULT }; }
}

export function saveEvolutionData(data: EvolutionData): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    pushToCloud(LS_KEY, data);
  } catch { /* noop */ }
}

/** Call once per day (on app open) to count care and update phase. Returns new phase if it changed. */
export function tickDailyEvolution(avgStats: number): EvolutionPhase | null {
  const today = new Date().toISOString().slice(0, 10);
  const data  = getEvolutionData();
  if (data.lastChecked === today) return null;
  const oldPhase = data.phase;
  if (avgStats >= 50) data.daysCaredFor++;
  data.lastChecked = today;
  data.phase = computePhase(data.daysCaredFor);
  saveEvolutionData(data);
  return data.phase !== oldPhase ? data.phase : null;
}

export function recordTap(): { totalTaps: number } {
  const data = getEvolutionData();
  data.totalTaps = (data.totalTaps || 0) + 1;
  saveEvolutionData(data);
  return { totalTaps: data.totalTaps };
}

export function recordGoodNight(): void {
  const data = getEvolutionData();
  data.goodNightsStreak = (data.goodNightsStreak || 0) + 1;
  saveEvolutionData(data);
}

export function resetGoodNightStreak(): void {
  const data = getEvolutionData();
  data.goodNightsStreak = 0;
  saveEvolutionData(data);
}

export function isNightTime(): boolean {
  const h = new Date().getHours();
  return h < 9; // medianoche–9h (hora española GMT+1)
}

export function getEvolutionProgress(): {
  daysFor: number;
  daysNeeded: number;
  nextPhase: EvolutionPhase | null;
} {
  const data = getEvolutionData();
  const nextThreshold: Partial<Record<EvolutionPhase, number>> = {
    bebe: 7, joven: 30, adulta: 90,
  };
  const nextPhaseMap: Partial<Record<EvolutionPhase, EvolutionPhase>> = {
    bebe: "joven", joven: "adulta", adulta: "anciana",
  };
  return {
    daysFor:   data.daysCaredFor,
    daysNeeded: nextThreshold[data.phase] ?? 90,
    nextPhase: nextPhaseMap[data.phase] ?? null,
  };
}
