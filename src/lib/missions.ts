import { upsertPlayerProfile, getPlayerProfile } from "./db";
import type { ActivityKey } from "./rewards";

export type Mission = {
  id: string;
  activityKey: ActivityKey;
  label: string;
  emoji: string;
  bellotas: number;
  xp: number;
};

const ALL_MISSIONS: Mission[] = [
  { id: "diario",    activityKey: "diario",    label: "Escribe en el diario",          emoji: "📓", bellotas: 8,  xp: 15 },
  { id: "emocional", activityKey: "emocional", label: "Registro emocional",            emoji: "🌸", bellotas: 6,  xp: 10 },
  { id: "caca",      activityKey: "caca",      label: "Registro de caca",              emoji: "💩", bellotas: 5,  xp: 8  },
  { id: "p1",        activityKey: "p1",        label: "Completa Señal y alarma",       emoji: "🎓", bellotas: 8,  xp: 15 },
  { id: "p2",        activityKey: "p2",        label: "Completa Mapa de hiperalerta",  emoji: "🗺️", bellotas: 8,  xp: 15 },
  { id: "p3",        activityKey: "p3",        label: "Completa Orientación suave",    emoji: "🌊", bellotas: 8,  xp: 15 },
];

const BONUS_BELLOTAS = 20;
const BONUS_XP = 30;

const LS_KEY = "daily_missions_v1";

export type DailyMissionsState = {
  date: string;
  missions: string[];    // mission ids
  completed: string[];   // mission ids completed
};

function loadState(): DailyMissionsState | null {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored) as DailyMissionsState;
  } catch { /* noop */ }
  return null;
}

function saveState(state: DailyMissionsState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch { /* noop */ }
}

/** Deterministic day-based mission selection: pick 3 from pool based on date */
function selectMissionsForDate(dateStr: string): string[] {
  // Simple hash from date string → pick 3 unique indices
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  const n = ALL_MISSIONS.length;
  const indices: number[] = [];
  let seed = hash;
  while (indices.length < 3) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const idx = seed % n;
    if (!indices.includes(idx)) indices.push(idx);
  }
  return indices.map(i => ALL_MISSIONS[i].id);
}

export function getDailyMissions(): DailyMissionsState {
  const today = new Date().toISOString().slice(0, 10);
  const state = loadState();
  if (state && state.date === today) return state;
  // New day → reset
  const newState: DailyMissionsState = {
    date: today,
    missions: selectMissionsForDate(today),
    completed: [],
  };
  saveState(newState);
  return newState;
}

export function getMissionById(id: string): Mission | undefined {
  return ALL_MISSIONS.find(m => m.id === id);
}

export type MissionCompletionResult = {
  mission: Mission;
  isBonus: boolean;
  bonusBellotas: number;
  bonusXp: number;
};

/**
 * Call this after an activity completes. Returns the mission reward if a pending
 * mission matches this activity key, otherwise null.
 * Also saves progress to localStorage.
 */
export async function completeMission(
  activityKey: ActivityKey,
): Promise<MissionCompletionResult | null> {
  const state = getDailyMissions();
  // Find a matching pending mission
  const pendingMissionId = state.missions.find(
    id => !state.completed.includes(id) && ALL_MISSIONS.find(m => m.id === id)?.activityKey === activityKey,
  );
  if (!pendingMissionId) return null;

  const mission = ALL_MISSIONS.find(m => m.id === pendingMissionId);
  if (!mission) return null;

  // Mark as completed
  const updatedCompleted = [...state.completed, pendingMissionId];
  saveState({ ...state, completed: updatedCompleted });

  const isBonus = updatedCompleted.length === state.missions.length;

  // Apply rewards via upsertPlayerProfile
  try {
    const profile = await getPlayerProfile();
    await upsertPlayerProfile({
      xp: profile.xp + mission.xp + (isBonus ? BONUS_XP : 0),
      bellotas: profile.bellotas + mission.bellotas + (isBonus ? BONUS_BELLOTAS : 0),
    });
  } catch (e) {
    console.error("completeMission upsertPlayerProfile error:", e);
  }

  return {
    mission,
    isBonus,
    bonusBellotas: isBonus ? BONUS_BELLOTAS : 0,
    bonusXp: isBonus ? BONUS_XP : 0,
  };
}
