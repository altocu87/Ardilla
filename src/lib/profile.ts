import { getPlayerProfile, upsertPlayerProfile, getPregLog } from "./db";
import { getRewardsConfig, type ActivityKey } from "./rewards";
export type { PlayerProfile } from "./db";

/** Alias para compatibilidad – todos los tipos de actividad premiable */
export type RegisterType = ActivityKey;

export const STREAK_MILESTONES = [
  { days: 3,  label: "¡3 días seguidos!",      bellotas: 10,  xp: 0   },
  { days: 7,  label: "¡Una semana entera!",     bellotas: 25,  xp: 50  },
  { days: 14, label: "¡Dos semanas seguidas!",  bellotas: 50,  xp: 100 },
  { days: 21, label: "¡Tres semanas!",          bellotas: 75,  xp: 150 },
  { days: 30, label: "¡Un mes completo!",       bellotas: 100, xp: 200 },
];

export type LevelInfo = {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progress: number; // 0-1
};

// Nivel N necesita N*100 XP para pasar al siguiente
export function getLevelInfo(xp: number): LevelInfo {
  let level = 1;
  let xpUsed = 0;
  while (true) {
    const needed = level * 100;
    if (xpUsed + needed > xp) {
      const currentXp = xp - xpUsed;
      return { level, currentXp, nextLevelXp: needed, progress: currentXp / needed };
    }
    xpUsed += needed;
    level++;
  }
}

export type AwardResult = {
  xp: number;
  bellotas: number;
  streakBonus?: { label: string; bellotas: number; xp: number };
};

async function getCurrentStreak(): Promise<number> {
  const log = await getPregLog();
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (log[d.toISOString().slice(0, 10)]) streak++;
    else break;
  }
  return streak;
}

/**
 * Premia XP y bellotas por completar una actividad.
 * Devuelve null si ya se premió hoy este tipo.
 * Para "diario" también comprueba hitos de racha.
 * Las cantidades de XP/bellotas se leen desde la config de Ajustes.
 */
export async function awardXp(type: RegisterType): Promise<AwardResult | null> {
  const today = new Date().toISOString().slice(0, 10);
  const key   = `${type}_${today}`;
  try {
    const profile = await getPlayerProfile();
    const dailyAwards = profile.dailyAwards ?? {};
    if (dailyAwards[key]) return null;

    const cfg    = getRewardsConfig();
    const reward = cfg[type] ?? { xp: 10, bellotas: 2 };

    let newXp       = profile.xp       + reward.xp;
    let newBellotas = profile.bellotas  + reward.bellotas;
    const newStreakAwards = [...(profile.streakAwards ?? [])];
    let streakBonus: AwardResult["streakBonus"] = undefined;

    if (type === "diario") {
      const streak = await getCurrentStreak();
      for (const m of STREAK_MILESTONES) {
        if (streak >= m.days && !newStreakAwards.includes(m.days)) {
          newXp       += m.xp;
          newBellotas += m.bellotas;
          newStreakAwards.push(m.days);
          if (!streakBonus || m.days > (STREAK_MILESTONES.find(x => x.label === streakBonus!.label)?.days ?? 0)) {
            streakBonus = { label: m.label, bellotas: m.bellotas, xp: m.xp };
          }
        }
      }
    }

    await upsertPlayerProfile({
      xp:           newXp,
      bellotas:     newBellotas,
      dailyAwards:  { ...dailyAwards, [key]: true },
      streakAwards: newStreakAwards,
    });

    return { xp: reward.xp, bellotas: reward.bellotas, streakBonus };
  } catch (e) {
    console.error("awardXp error:", e);
    return null;
  }
}
