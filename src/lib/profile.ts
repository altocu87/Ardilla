export type Profile = {
  xp: number;
  bellotas: number;
};

export type LevelInfo = {
  level: number;
  currentXp: number;   // XP dentro del nivel actual
  nextLevelXp: number; // XP total necesaria para subir
  progress: number;    // 0-1
};

// XP necesaria para pasar del nivel N al N+1 = N * 100
// Total acumulada hasta nivel N = N*(N+1)/2 * 100 / 2... no, más simple:
// L1→L2: 100, L2→L3: 200, L3→L4: 300, ...
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

export function getProfile(): Profile {
  try {
    const stored = localStorage.getItem("player_profile");
    if (stored) return JSON.parse(stored) as Profile;
  } catch { /* noop */ }
  return { xp: 0, bellotas: 0 };
}

export function saveProfile(profile: Profile): void {
  localStorage.setItem("player_profile", JSON.stringify(profile));
}

export type RegisterType = "diario" | "caca" | "emocional";

const XP_REWARDS: Record<RegisterType, number>       = { diario: 30, caca: 15, emocional: 20 };
const BELLOTAS_REWARDS: Record<RegisterType, number> = { diario:  5, caca:  3, emocional:  4 };

/** Devuelve la ganancia o null si ya se premió hoy ese tipo. */
export function awardXp(type: RegisterType): { xp: number; bellotas: number } | null {
  const today = new Date().toISOString().slice(0, 10);
  const key   = `xp_awarded_${type}_${today}`;
  try {
    if (localStorage.getItem(key)) return null;
    const profile     = getProfile();
    const xpGained    = XP_REWARDS[type];
    const bellGained  = BELLOTAS_REWARDS[type];
    profile.xp        += xpGained;
    profile.bellotas  += bellGained;
    saveProfile(profile);
    localStorage.setItem(key, "1");
    return { xp: xpGained, bellotas: bellGained };
  } catch {
    return null;
  }
}
