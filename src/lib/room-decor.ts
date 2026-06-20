import { getPlayerProfile, upsertPlayerProfile } from "./db";
import { pushToCloud } from "./cloudsync";

/* ════════════════════════════════════════════════════
   DECORACIÓN DE LA MADRIGUERA
   Objetos comprables con bellotas que decoran la escena
   (SceneForeground los dibuja por su id). Solo cosmético.
════════════════════════════════════════════════════ */
export type DecorSlot = "tree" | "burrow" | "ground" | "sky";

export type DecorItem = {
  id: string;
  name: string;
  emoji: string;
  price: number;
  slot: DecorSlot;
  desc: string;
};

export const DECOR_CATALOG: DecorItem[] = [
  { id: "deco_farolillos", name: "Farolillos",        emoji: "🏮", price: 30,  slot: "tree",   desc: "Guirnalda de farolillos en el árbol." },
  { id: "deco_columpio",   name: "Columpio",          emoji: "🪧", price: 45,  slot: "tree",   desc: "Un columpio colgando de la rama." },
  { id: "deco_seta",       name: "Seta gigante",      emoji: "🍄", price: 25,  slot: "ground", desc: "Una seta enorme junto a la madriguera." },
  { id: "deco_valla",      name: "Vallita",           emoji: "🪵", price: 35,  slot: "ground", desc: "Una valla de madera muy mona." },
  { id: "deco_farol",      name: "Farol",             emoji: "🏮", price: 50,  slot: "ground", desc: "Un farol que ilumina el camino." },
  { id: "deco_banderines", name: "Banderines",        emoji: "🎏", price: 40,  slot: "sky",    desc: "Banderines de fiesta cruzando el cielo." },
  { id: "deco_charco",     name: "Charquito",         emoji: "💧", price: 30,  slot: "ground", desc: "Un charco donde se refleja la luna." },
  { id: "deco_buzon",      name: "Buzón",             emoji: "📬", price: 55,  slot: "burrow", desc: "Un buzón en la puerta de la madriguera." },
];

const LS_OWNED    = "room_decor_owned_v1";
const LS_EQUIPPED = "room_decor_equipped_v1";

function loadArr(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]") as string[]; }
  catch { return []; }
}
function saveArr(key: string, arr: string[]): void {
  try { localStorage.setItem(key, JSON.stringify(arr)); pushToCloud(key, arr); }
  catch { /* noop */ }
}

export function getDecorItem(id: string): DecorItem | undefined {
  return DECOR_CATALOG.find(d => d.id === id);
}

export function getOwnedDecor(): string[]    { return loadArr(LS_OWNED); }
export function getEquippedDecor(): string[] { return loadArr(LS_EQUIPPED); }

/** Compra una decoración si hay bellotas suficientes. */
export async function buyDecor(id: string): Promise<{ ok: boolean; reason?: string }> {
  const item = getDecorItem(id);
  if (!item) return { ok: false, reason: "No existe" };
  const owned = getOwnedDecor();
  if (owned.includes(id)) return { ok: false, reason: "Ya la tienes" };
  const profile = await getPlayerProfile();
  if (profile.bellotas < item.price) return { ok: false, reason: "Te faltan bellotas 🌰" };
  await upsertPlayerProfile({ bellotas: profile.bellotas - item.price });
  saveArr(LS_OWNED, [...owned, id]);
  // Equiparla automáticamente al comprarla
  const eq = getEquippedDecor();
  if (!eq.includes(id)) saveArr(LS_EQUIPPED, [...eq, id]);
  return { ok: true };
}

/** Pone/quita una decoración ya comprada. */
export function toggleDecor(id: string): string[] {
  if (!getOwnedDecor().includes(id)) return getEquippedDecor();
  const eq = getEquippedDecor();
  const next = eq.includes(id) ? eq.filter(x => x !== id) : [...eq, id];
  saveArr(LS_EQUIPPED, next);
  return next;
}
