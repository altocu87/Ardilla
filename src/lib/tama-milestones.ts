import { getPlayerProfile, upsertPlayerProfile } from "./db";
import { pushToCloud } from "./cloudsync";
import type { Achievement } from "./tama-achievements";
import { getBondData } from "./tama-bond";
import { getEvolutionData } from "./tama-evolution";

/* ════════════════════════════════════════════════════
   HITOS DE LARGO PLAZO
   Sobre señales existentes (vínculo, días de cuidado, caricias).
   Idempotentes (guardan los ids logrados) y premian bellotas.
   Reutilizan el tipo Achievement para mostrarse con showAchievement.
════════════════════════════════════════════════════ */
type MilestoneDef = {
  id: string; emoji: string; title: string; desc: string; bellotas: number;
  test: () => boolean;
};

const MILESTONES: MilestoneDef[] = [
  { id: "bond_2",   emoji: "💚", title: "Compañeras",   desc: "Vínculo nivel 2 con la ardilla",  bellotas: 15, test: () => getBondData().level >= 2 },
  { id: "bond_3",   emoji: "💙", title: "Inseparables",  desc: "Vínculo nivel 3 con la ardilla",  bellotas: 30, test: () => getBondData().level >= 3 },
  { id: "bond_4",   emoji: "💜", title: "Alma gemela",   desc: "Vínculo nivel 4 con la ardilla",  bellotas: 50, test: () => getBondData().level >= 4 },
  { id: "bond_5",   emoji: "💖", title: "Para siempre",  desc: "Vínculo máximo con la ardilla",   bellotas: 90, test: () => getBondData().level >= 5 },
  { id: "care_50",  emoji: "🌰", title: "Cincuenta días", desc: "50 días cuidando a la ardilla",  bellotas: 60, test: () => getEvolutionData().daysCaredFor >= 50 },
  { id: "care_120", emoji: "🌳", title: "Parte del bosque", desc: "120 días cuidando a la ardilla", bellotas: 120, test: () => getEvolutionData().daysCaredFor >= 120 },
];

const LS_KEY = "tama_milestones_v1";

function getUnlocked(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as string[]; }
  catch { return []; }
}
function saveUnlocked(arr: string[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); pushToCloud(LS_KEY, arr); }
  catch { /* noop */ }
}

function toAchievement(m: MilestoneDef): Achievement {
  return { id: `ms_${m.id}`, emoji: m.emoji, title: m.title, desc: m.desc, category: "especial", rewardBellotas: m.bellotas };
}

/** Comprueba hitos nuevos, premia sus bellotas y los devuelve para el toast. */
export async function checkMilestones(): Promise<Achievement[]> {
  const unlocked = getUnlocked();
  const fresh: MilestoneDef[] = [];
  for (const m of MILESTONES) {
    if (unlocked.includes(m.id)) continue;
    try { if (m.test()) fresh.push(m); } catch { /* noop */ }
  }
  if (!fresh.length) return [];

  saveUnlocked([...unlocked, ...fresh.map(m => m.id)]);
  const total = fresh.reduce((a, m) => a + m.bellotas, 0);
  if (total > 0) {
    try {
      const p = await getPlayerProfile();
      await upsertPlayerProfile({ bellotas: p.bellotas + total });
    } catch { /* noop */ }
  }
  return fresh.map(toAchievement);
}
