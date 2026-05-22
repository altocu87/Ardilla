import { pushToCloud } from "./cloudsync";

export type Achievement = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  rewardBellotas: number;
};

export type AchievementState = {
  unlocked: string[];
};

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: "first_tap",    emoji: "🤝", title: "¡Hola!",               desc: "Primera caricia a la ardilla",                rewardBellotas: 5   },
  { id: "tap_50",       emoji: "💖", title: "Muy cariñosa",          desc: "50 caricias acumuladas",                      rewardBellotas: 15  },
  { id: "tap_200",      emoji: "💝", title: "Amor sin límites",      desc: "200 caricias acumuladas",                     rewardBellotas: 30  },
  { id: "week_care",    emoji: "🎉", title: "Una semana juntas",     desc: "7 días con estadísticas saludables",          rewardBellotas: 25  },
  { id: "month_care",   emoji: "🏆", title: "Un mes increíble",      desc: "30 días cuidando bien a la ardilla",          rewardBellotas: 100 },
  { id: "all_food",     emoji: "🍽️", title: "Cocinera del bosque",   desc: "Probó toda la comida de la tienda",           rewardBellotas: 30  },
  { id: "all_toys",     emoji: "🎮", title: "Juguetona empedernida", desc: "Jugó con todos los juguetes",                 rewardBellotas: 20  },
  { id: "never_hungry", emoji: "🌰", title: "Bien alimentada",       desc: "3 días sin que el hambre llegue a 0",         rewardBellotas: 35  },
  { id: "streak_7",     emoji: "🔥", title: "Racha de la semana",    desc: "7 días consecutivos de registros",            rewardBellotas: 20  },
  { id: "streak_14",    emoji: "🔥", title: "Racha imparable",       desc: "14 días consecutivos de registros",           rewardBellotas: 50  },
  { id: "grew_up",      emoji: "✨", title: "¡Ha crecido!",          desc: "La ardilla llegó a la fase Joven",            rewardBellotas: 20  },
  { id: "adult",        emoji: "🌟", title: "Ardilla adulta",        desc: "La ardilla llegó a la fase Adulta",           rewardBellotas: 50  },
  { id: "wise",         emoji: "🦉", title: "Anciana sabia",         desc: "La ardilla llegó a la fase Anciana",          rewardBellotas: 150 },
  { id: "minigame_5",   emoji: "🎯", title: "Buena puntería",        desc: "10+ bellotas atrapadas en el mini-juego",     rewardBellotas: 10  },
  { id: "minigame_pro", emoji: "🎖️", title: "Maestra bellotera",     desc: "20+ bellotas atrapadas en el mini-juego",     rewardBellotas: 25  },
  { id: "good_night_3", emoji: "🌙", title: "Buenas noches",         desc: "3 noches sin despertar a la ardilla",         rewardBellotas: 15  },
  { id: "tickle",       emoji: "😂", title: "¡Cosquillas!",          desc: "Le hiciste cosquillas a la ardilla",          rewardBellotas: 5   },
];

const LS_KEY = "tama_achievements_v1";

export function getAchievementState(): AchievementState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as AchievementState) : { unlocked: [] };
  } catch { return { unlocked: [] }; }
}

export function saveAchievementState(s: AchievementState): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); pushToCloud(LS_KEY, s); }
  catch { /* noop */ }
}

export function isUnlocked(id: string): boolean {
  return getAchievementState().unlocked.includes(id);
}

/** Returns the achievement if it was newly unlocked, null if already had it. */
export function tryUnlock(id: string): Achievement | null {
  const state = getAchievementState();
  if (state.unlocked.includes(id)) return null;
  const ach = ALL_ACHIEVEMENTS.find(a => a.id === id);
  if (!ach) return null;
  state.unlocked.push(id);
  saveAchievementState(state);
  return ach;
}

export function getUnlockedAchievements(): Achievement[] {
  const state = getAchievementState();
  return ALL_ACHIEVEMENTS.filter(a => state.unlocked.includes(a.id));
}
