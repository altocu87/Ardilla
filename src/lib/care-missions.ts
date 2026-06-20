import { getPlayerProfile, upsertPlayerProfile } from "./db";
import { pushToCloud } from "./cloudsync";

/* ════════════════════════════════════════════════════
   MISIONES DE CUIDADO DE LA ARDILLA
   Paralelo a missions.ts (que son de bienestar). Aquí las
   misiones se cumplen cuidando a la mascota: darle de comer,
   jugar, dejarla dormir, hacerle cosquillas, tenerla feliz.
   Recompensan bellotas/XP vía player_profile.
════════════════════════════════════════════════════ */
export type CareMissionKind =
  | "feed" | "play" | "sleep" | "tickle" | "mood_high" | "cure" | "dressup";

export type CareMission = {
  id: string;
  kind: CareMissionKind;
  label: string;
  emoji: string;
  desc: string;
  target: number;
  bellotas: number;
  xp: number;
};

/* Catálogo completo. El POOL diario solo usa las que se pueden cumplir
   siempre desde la pantalla principal (cure/dressup quedan fuera del sorteo
   pero recordCareEvent las acepta por si en el futuro se enganchan). */
const ALL: CareMission[] = [
  { id: "feed2",   kind: "feed",      label: "Dale de comer 2 veces",   emoji: "🍎", desc: "Mantén su barriguita llena.",        target: 2, bellotas: 6, xp: 10 },
  { id: "play2",   kind: "play",      label: "Juega con ella 2 veces",  emoji: "🎾", desc: "Sácale una sonrisa jugando.",         target: 2, bellotas: 6, xp: 10 },
  { id: "sleep1",  kind: "sleep",     label: "Deja que eche la siesta", emoji: "😴", desc: "Que descanse al menos una vez hoy.",  target: 1, bellotas: 5, xp: 8  },
  { id: "tickle1", kind: "tickle",    label: "Hazle cosquillas",        emoji: "🤭", desc: "Mímala hasta que se ría.",            target: 1, bellotas: 5, xp: 8  },
  { id: "mood1",   kind: "mood_high", label: "Tenla contenta",          emoji: "💖", desc: "Que llegue a estar feliz hoy.",       target: 1, bellotas: 7, xp: 12 },
  { id: "cure1",   kind: "cure",      label: "Cúrala si lo necesita",   emoji: "💊", desc: "Cura una enfermedad o un enfado.",    target: 1, bellotas: 8, xp: 12 },
  { id: "dress1",  kind: "dressup",   label: "Cámbiale el modelito",    emoji: "👒", desc: "Pruébale una prenda nueva.",          target: 1, bellotas: 4, xp: 6  },
];
const POOL_IDS = ["feed2", "play2", "sleep1", "tickle1", "mood1"];

const BONUS_BELLOTAS = 15;
const BONUS_XP = 20;
const LS_KEY = "care_missions_v1";

export type CareMissionProgress = { id: string; progress: number; done: boolean };
export type CareMissionsState = { date: string; missions: CareMissionProgress[]; bonusAwarded?: boolean };

export function getCareMissionDef(id: string): CareMission | undefined {
  return ALL.find(m => m.id === id);
}

function loadState(): CareMissionsState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as CareMissionsState;
  } catch { /* noop */ }
  return null;
}

function saveState(state: CareMissionsState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    pushToCloud(LS_KEY, state);
  } catch { /* noop */ }
}

/** Selección determinista por fecha: 3 ids del POOL (mismo idioma que missions.ts). */
function selectForDate(dateStr: string): string[] {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  const n = POOL_IDS.length;
  const indices: number[] = [];
  let seed = hash;
  while (indices.length < 3) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const idx = seed % n;
    if (!indices.includes(idx)) indices.push(idx);
  }
  return indices.map(i => POOL_IDS[i]);
}

export function getCareMissions(): CareMissionsState {
  const today = new Date().toISOString().slice(0, 10);
  const state = loadState();
  if (state && state.date === today) return state;
  const fresh: CareMissionsState = {
    date: today,
    missions: selectForDate(today).map(id => ({ id, progress: 0, done: false })),
    bonusAwarded: false,
  };
  saveState(fresh);
  return fresh;
}

export type CareReward = {
  mission: CareMission;
  isBonus: boolean;
  bonusBellotas: number;
  bonusXp: number;
};

/**
 * Registra un evento de cuidado. Avanza la(s) misión(es) que coincidan con `kind`,
 * premia al completarlas (+ bonus al completar las 3). Devuelve las recompensas
 * obtenidas en esta llamada (para mostrar un toast). Idempotente por misión vía `done`.
 */
export async function recordCareEvent(kind: CareMissionKind, amount = 1): Promise<CareReward[]> {
  const state = getCareMissions();
  const rewards: CareReward[] = [];
  let changed = false;

  for (const mp of state.missions) {
    if (mp.done) continue;
    const def = getCareMissionDef(mp.id);
    if (!def || def.kind !== kind) continue;
    mp.progress = Math.min(def.target, mp.progress + amount);
    changed = true;
    if (mp.progress >= def.target) {
      mp.done = true;
      rewards.push({ mission: def, isBonus: false, bonusBellotas: 0, bonusXp: 0 });
    }
  }

  if (!changed) return rewards;

  const allDone = state.missions.every(m => m.done);
  const giveBonus = allDone && !state.bonusAwarded;
  if (giveBonus) state.bonusAwarded = true;
  saveState(state);

  /* Aplicar recompensas al perfil */
  const earnedBellotas = rewards.reduce((a, r) => a + r.mission.bellotas, 0) + (giveBonus ? BONUS_BELLOTAS : 0);
  const earnedXp       = rewards.reduce((a, r) => a + r.mission.xp, 0)       + (giveBonus ? BONUS_XP : 0);
  if (earnedBellotas > 0 || earnedXp > 0) {
    try {
      const profile = await getPlayerProfile();
      await upsertPlayerProfile({ xp: profile.xp + earnedXp, bellotas: profile.bellotas + earnedBellotas });
    } catch { /* noop */ }
  }

  if (giveBonus && rewards.length > 0) {
    rewards[rewards.length - 1] = { ...rewards[rewards.length - 1], isBonus: true, bonusBellotas: BONUS_BELLOTAS, bonusXp: BONUS_XP };
  }
  return rewards;
}
