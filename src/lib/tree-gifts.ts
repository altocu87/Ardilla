import { addOwnedClothing } from "./squirrel-shop";
import { pushToCloud }     from "./cloudsync";

/* ── Regalos del árbol ───────────────────────────────────────────────────── */
export type TreeGift = {
  id:              string;
  streakRequired:  number;
  clothingId:      string;
  emoji:           string;
  name:            string;
  label:           string; // frase que aparece en el árbol
};

export const TREE_GIFTS: TreeGift[] = [
  {
    id: "tg1", streakRequired: 3,  clothingId: "tree_hoja_roble",
    emoji: "🍃", name: "Hoja de Roble",
    label: "Tu primera racha — el árbol te regala su primera hoja",
  },
  {
    id: "tg2", streakRequired: 7,  clothingId: "tree_ristra_bellotas",
    emoji: "🌰", name: "Ristra de Bellotas",
    label: "¡Una semana! El árbol celebra tu constancia",
  },
  {
    id: "tg3", streakRequired: 14, clothingId: "tree_sombrero_seta",
    emoji: "🍄", name: "Sombrero Seta",
    label: "Dos semanas — el bosque ya te conoce bien",
  },
  {
    id: "tg4", streakRequired: 21, clothingId: "tree_capa_hojas",
    emoji: "🍂", name: "Capa de Hojas",
    label: "Tres semanas — las hojas se tejen solas para ti",
  },
  {
    id: "tg5", streakRequired: 30, clothingId: "tree_corona_bosque",
    emoji: "🌿", name: "Corona del Bosque",
    label: "Un mes entero — el árbol te corona. ¡Eres parte del bosque!",
  },
  {
    id: "tg6", streakRequired: 60, clothingId: "tree_manto_legendario",
    emoji: "🌳", name: "Manto Legendario",
    label: "60 días — el árbol legendario te viste. Solo tú lo tienes.",
  },
];

/* ── Persistencia ─────────────────────────────────────────────────────────── */
const LS_COLLECTED = "tree_gifts_collected_v1";
const LS_HARVEST   = "tree_last_harvest_v1";

function loadArr(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]") as string[]; }
  catch { return []; }
}

export function getCollectedGifts(): string[] {
  return loadArr(LS_COLLECTED);
}

/**
 * Devuelve el regalo de mayor racha que el usuario puede recoger ahora
 * (racha suficiente y no recogido todavía).
 */
export function getAvailableGift(streak: number): TreeGift | null {
  const collected = getCollectedGifts();
  return (
    [...TREE_GIFTS]
      .reverse()
      .find(g => streak >= g.streakRequired && !collected.includes(g.id)) ?? null
  );
}

/** Recoge el regalo: añade la prenda al armario y lo marca como recogido. */
export function collectGift(giftId: string): TreeGift | null {
  const gift = TREE_GIFTS.find(g => g.id === giftId);
  if (!gift) return null;
  const collected = getCollectedGifts();
  if (collected.includes(giftId)) return null;

  addOwnedClothing(gift.clothingId);          // añadir al armario
  collected.push(giftId);
  try {
    localStorage.setItem(LS_COLLECTED, JSON.stringify(collected));
    pushToCloud(LS_COLLECTED, collected);
  } catch { /* noop */ }
  return gift;
}

/* ── Cosecha de bellotas ──────────────────────────────────────────────────── */

/** Bellotas base por etapa del árbol (índice 0-6). */
const BASE_HARVEST = [0, 0, 2, 3, 5, 7, 10] as const;

/** Cantidad de bellotas a recoger según etapa y racha. */
export function getHarvestAmount(stageIdx: number, streak: number): number {
  const base  = BASE_HARVEST[Math.min(stageIdx, 6) as 0|1|2|3|4|5|6] ?? 0;
  if (base === 0) return 0;
  const bonus = streak >= 30 ? 4 : streak >= 21 ? 3 : streak >= 14 ? 2 : streak >= 7 ? 1 : 0;
  return base + bonus;
}

/** ¿Se puede cosechar hoy? (una vez al día) */
export function canHarvestToday(): boolean {
  try {
    const last  = localStorage.getItem(LS_HARVEST) ?? "";
    return last < new Date().toISOString().slice(0, 10);
  } catch { return true; }
}

/** Registra que se ha cosechado hoy. */
export function recordHarvest(): void {
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(LS_HARVEST, today);
    pushToCloud(LS_HARVEST, today);
  } catch { /* noop */ }
}
