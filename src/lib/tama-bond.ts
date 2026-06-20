import { pushToCloud } from "./cloudsync";

/* ════════════════════════════════════════════════════
   VÍNCULO Y PERSONALIDAD
   Afinidad persistente que crece al cuidar a la ardilla +
   una personalidad diaria (estable en el día, cambia cada día)
   que da sabor a los mensajes y a las probabilidades de enfado.
════════════════════════════════════════════════════ */
export type Personality = "dulce" | "gruñona" | "juguetona" | "dramatica" | "tranquila";

export type BondData = {
  points: number;        // afinidad acumulada
  level: number;         // 0..5 derivado de points
  lastInteract: string;  // YYYY-MM-DD
};

const LS_KEY = "tama_bond_v1";
const DEFAULT: BondData = {
  points: 0, level: 0, lastInteract: new Date().toISOString().slice(0, 10),
};

/** Umbrales de puntos por nivel (índice = nivel). */
const LEVEL_THRESHOLDS = [0, 20, 60, 140, 280, 500];

export function bondLevel(points: number): number {
  let lvl = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) if (points >= LEVEL_THRESHOLDS[i]) lvl = i;
  return lvl;
}

export const BOND_LEVEL_INFO: Record<number, { label: string; emoji: string }> = {
  0: { label: "Conociéndoos", emoji: "🤍" },
  1: { label: "Amiguitas",    emoji: "💛" },
  2: { label: "Compañeras",   emoji: "💚" },
  3: { label: "Inseparables", emoji: "💙" },
  4: { label: "Alma gemela",  emoji: "💜" },
  5: { label: "Para siempre", emoji: "💖" },
};

export function getBondData(): BondData {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const d: BondData = raw ? { ...DEFAULT, ...(JSON.parse(raw) as BondData) } : { ...DEFAULT };
    d.level = bondLevel(d.points);
    return d;
  } catch { return { ...DEFAULT }; }
}

export function saveBondData(d: BondData): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(d));
    pushToCloud(LS_KEY, d);
  } catch { /* noop */ }
}

/** Suma afinidad (al cuidarla). Devuelve el nuevo estado y si subió de nivel. */
export function addBond(n: number): { data: BondData; leveledUp: boolean } {
  const d = getBondData();
  const oldLevel = d.level;
  d.points = Math.max(0, d.points + n);
  d.level = bondLevel(d.points);
  d.lastInteract = new Date().toISOString().slice(0, 10);
  saveBondData(d);
  return { data: d, leveledUp: d.level > oldLevel };
}

const PERSONALITIES: Personality[] = ["dulce", "gruñona", "juguetona", "dramatica", "tranquila"];

export const PERSONALITY_INFO: Record<Personality, { emoji: string; label: string }> = {
  dulce:     { emoji: "🥰", label: "Dulce" },
  gruñona:   { emoji: "😤", label: "Gruñona" },
  juguetona: { emoji: "🤹", label: "Juguetona" },
  dramatica: { emoji: "🎭", label: "Dramática" },
  tranquila: { emoji: "😌", label: "Tranquila" },
};

/** Personalidad del día: estable durante el día, varía cada día (semilla por fecha). */
export function pickPersonalityForToday(d: Date = new Date()): Personality {
  const dateStr = d.toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  return PERSONALITIES[hash % PERSONALITIES.length];
}

/** Multiplicador de probabilidad de enfado según personalidad (1 = neutral). */
export function angerMultiplier(p: Personality): number {
  switch (p) {
    case "gruñona":   return 1.8;
    case "dramatica": return 1.4;
    case "juguetona": return 0.6;
    case "dulce":     return 0.7;
    default:          return 1; // tranquila
  }
}
