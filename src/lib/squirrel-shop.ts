import { pushToCloud } from "./cloudsync";
import type { IllnessType } from "./tamagotchi";

/* ════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════ */
export type SquirrelFood = {
  id: string; emoji: string; name: string; desc: string;
  price: number; hambreRestore: number; animoBoost?: number;
  curesIllness?: IllnessType;
};

export type ClothingSlot = "head" | "neck" | "body" | "eyes";
export type ClothingType = "bufanda" | "sombrero" | "gafas" | "lazo" | "jersey" | "corona" | "abrigo" | "chaleco" | "capa" | "collar" | "pajarita" | "gorra" | "tapones" | "antifaz" | "pijama";

export type SquirrelClothing = {
  id: string; emoji: string; name: string; desc: string;
  price: number; slot: ClothingSlot; clothingType: ClothingType; color: string;
};

export type SquirrelToy = {
  id: string; emoji: string; name: string; desc: string;
  price: number; animoBoost: number; cooldownMinutes: number;
};

export type EquippedClothing = Partial<Record<ClothingSlot, string>>;
export type FoodInventory   = Record<string, number>;
export type ToyUsage        = Record<string, string>; // id → ISO timestamp

/* ════════════════════════════════════════════════════
   CATALOGS
════════════════════════════════════════════════════ */
export const FOOD_CATALOG: SquirrelFood[] = [
  { id: "food_bellota",  emoji: "🌰", name: "Bellota",           desc: "El clásico favorito",              price: 5,  hambreRestore: 20 },
  { id: "food_seta",     emoji: "🍄", name: "Seta del bosque",   desc: "Muy nutritiva",                    price: 10, hambreRestore: 35 },
  { id: "food_baya",     emoji: "🫐", name: "Bayas silvestres",  desc: "Dulce y energizante",              price: 8,  hambreRestore: 25, animoBoost: 10 },
  { id: "food_manzana",  emoji: "🍎", name: "Manzana roja",      desc: "Sana y crujiente",                 price: 7,  hambreRestore: 28, animoBoost: 5  },
  { id: "food_pastel",   emoji: "🎂", name: "Pastel de nueces",  desc: "Para días especiales ✨",          price: 30, hambreRestore: 60, animoBoost: 25 },
  { id: "food_miel",     emoji: "🍯", name: "Miel de bosque",    desc: "Un lujazo para la ardilla",        price: 18, hambreRestore: 40, animoBoost: 15 },
  { id: "food_probio",  emoji: "💊", name: "Probióticos",       desc: "Cura el dolor de barriga 🤒",      price: 25, hambreRestore: 10, animoBoost: 8, curesIllness: "stomach" },
];

export const MEDICINE_CATALOG: SquirrelFood[] = [
  { id: "med_probiotics", emoji: "💊", name: "Probióticos",    desc: "Cura el dolor de barriga",    price: 0, hambreRestore: 5,  animoBoost: 10, curesIllness: "stomach" },
  { id: "med_fibra",      emoji: "🌾", name: "CacaMax",        desc: "Cura el estreñimiento",       price: 0, hambreRestore: 8,  animoBoost: 8,  curesIllness: "caca"    },
  { id: "med_vitaminas",  emoji: "🍊", name: "Vitaminas C",    desc: "Cura el cansancio crónico",   price: 0, hambreRestore: 5,  animoBoost: 15, curesIllness: "tired"   },
];

export const CLOTHING_CATALOG: SquirrelClothing[] = [
  { id: "cloth_bufanda",   emoji: "🧣", name: "Bufanda roja",    desc: "Calentita para el invierno",       price: 30, slot: "neck",  clothingType: "bufanda",  color: "#ef4444" },
  { id: "cloth_bufanda_b", emoji: "🧣", name: "Bufanda azul",    desc: "Elegante tono azul marino",        price: 30, slot: "neck",  clothingType: "bufanda",  color: "#3b82f6" },
  { id: "cloth_sombrero",  emoji: "🎩", name: "Sombrero hongo",  desc: "Un look muy distinguido",          price: 40, slot: "head",  clothingType: "sombrero", color: "#1c1917" },
  { id: "cloth_gafas",     emoji: "🕶️", name: "Gafas de sol",    desc: "Estilo veraniego",                 price: 35, slot: "eyes",  clothingType: "gafas",    color: "#0f172a" },
  { id: "cloth_gafas_r",   emoji: "👓", name: "Gafas rosas",     desc: "Ver el mundo de color rosa",       price: 28, slot: "eyes",  clothingType: "gafas",    color: "#ec4899" },
  { id: "cloth_lazo",      emoji: "🎀", name: "Lazo rosa",       desc: "¡Qué mona!",                       price: 25, slot: "head",  clothingType: "lazo",     color: "#f472b6" },
  { id: "cloth_jersey",    emoji: "🧥", name: "Jersey verde",    desc: "Cómodo y abrigado",                price: 50, slot: "body",  clothingType: "jersey",   color: "#16a34a" },
  { id: "cloth_jersey_r",  emoji: "🧥", name: "Jersey naranja",  desc: "Alegre y colorido",                price: 50, slot: "body",  clothingType: "jersey",   color: "#ea580c" },
  { id: "cloth_corona",    emoji: "👑", name: "Corona dorada",   desc: "Para reinas del bosque",           price: 80, slot: "head",  clothingType: "corona",   color: "#f59e0b" },
  { id: "cloth_abrigo",      emoji: "🧥", name: "Abrigo morado",       desc: "Elegante y abrigador",              price: 65, slot: "body",  clothingType: "abrigo",   color: "#7c3aed" },
  // ── Nueva ropa ───────────────────────────────────────────────────────────
  { id: "cloth_flores",      emoji: "🌸", name: "Corona de flores",    desc: "Para las que aman la naturaleza",   price: 45, slot: "head",  clothingType: "lazo",     color: "#f472b6" },
  { id: "cloth_gorra",       emoji: "🧢", name: "Gorra azul",          desc: "Un look moderno y fresco",          price: 38, slot: "head",  clothingType: "gorra",    color: "#1d4ed8" },
  { id: "cloth_chaleco",     emoji: "🦺", name: "Chaleco amarillo",    desc: "Abrigado y muy visible",            price: 55, slot: "body",  clothingType: "chaleco",  color: "#eab308" },
  { id: "cloth_capa",        emoji: "🦸", name: "Capa de superhéroe",  desc: "Vuela entre los árboles",           price: 70, slot: "body",  clothingType: "capa",     color: "#dc2626" },
  { id: "cloth_monoculo",    emoji: "🧐", name: "Monóculo dorado",     desc: "El toque más distinguido",          price: 45, slot: "eyes",  clothingType: "gafas",    color: "#f59e0b" },
  { id: "cloth_gafas_heart", emoji: "🥰", name: "Gafas corazón",       desc: "Mira el mundo con amor",            price: 40, slot: "eyes",  clothingType: "gafas",    color: "#f43f5e" },
  { id: "cloth_collar",      emoji: "📿", name: "Collar de perlas",    desc: "Un toque de elegancia",             price: 50, slot: "neck",  clothingType: "collar",   color: "#e2e8f0" },
  { id: "cloth_pajarita",    emoji: "🎀", name: "Pajarita formal",     desc: "Para ocasiones especiales",         price: 42, slot: "neck",  clothingType: "pajarita", color: "#1e293b" },
  // ── Ítems de sueño ───────────────────────────────────────────────────────────
  { id: "cloth_tapones",     emoji: "🔇", name: "Tapones para oídos", desc: "Sin ruidos, mejor sueño 😴",        price: 45, slot: "head",  clothingType: "tapones",  color: "#fef08a" },
  { id: "cloth_antifaz",     emoji: "🌙", name: "Antifaz para dormir",desc: "Oscuridad total, sueño perfecto ✨", price: 45, slot: "eyes",  clothingType: "antifaz",  color: "#312e81" },
  { id: "cloth_pijama",      emoji: "🩲", name: "Pijama cómodo",      desc: "El más suave del bosque 💜",        price: 55, slot: "body",  clothingType: "pijama",   color: "#c4b5fd" },
];

export const TOY_CATALOG: SquirrelToy[] = [
  { id: "toy_pelota",   emoji: "🎾", name: "Pelota de tenis",  desc: "¡Le encanta perseguirla!",          price: 20, animoBoost: 20, cooldownMinutes: 30 },
  { id: "toy_cuerda",   emoji: "🪢", name: "Cuerda de juego",  desc: "Para morder y tirar",               price: 25, animoBoost: 25, cooldownMinutes: 30 },
  { id: "toy_puzzle",   emoji: "🧩", name: "Rompecabezas",     desc: "Ejercita la mente",                 price: 30, animoBoost: 18, cooldownMinutes: 60 },
  { id: "toy_varita",   emoji: "🪄", name: "Varita mágica",    desc: "Cuando la agita pasan cosas ✨",    price: 45, animoBoost: 35, cooldownMinutes: 45 },
  { id: "toy_globo",    emoji: "🎈", name: "Globo de colores",   desc: "La ardilla lo adora",                price: 15, animoBoost: 15, cooldownMinutes: 20 },
  // ── Nuevos juguetes ──────────────────────────────────────────────────────
  { id: "toy_yoyo",     emoji: "🪀", name: "Yo-yó de colores",  desc: "¡Sube y baja sin parar!",            price: 22, animoBoost: 22, cooldownMinutes: 25 },
  { id: "toy_frisbee",  emoji: "🥏", name: "Frisbee brillante", desc: "Vuela por todo el bosque",           price: 28, animoBoost: 28, cooldownMinutes: 35 },
  { id: "toy_pluma",    emoji: "🪶", name: "Pluma mágica",      desc: "Le fascina perseguirla por el aire", price: 32, animoBoost: 30, cooldownMinutes: 40 },
  { id: "toy_estrella", emoji: "⭐", name: "Estrella de goma",  desc: "Blanda y muy divertida",             price: 18, animoBoost: 18, cooldownMinutes: 20 },
  { id: "toy_arcoiris", emoji: "🌈", name: "Aro multicolor",    desc: "Ruleta de colores del bosque",       price: 38, animoBoost: 35, cooldownMinutes: 50 },
];

/* ════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════ */
function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; }
  catch { return fallback; }
}
function save<T>(key: string, data: T): void {
  try { localStorage.setItem(key, JSON.stringify(data)); pushToCloud(key, data); }
  catch { /* noop */ }
}

/* ════════════════════════════════════════════════════
   FOOD INVENTORY
════════════════════════════════════════════════════ */
export function getFoodInventory(): FoodInventory { return load("sq_food_inv", {}); }
export function addFood(id: string): void {
  const inv = getFoodInventory(); inv[id] = (inv[id] ?? 0) + 1; save("sq_food_inv", inv);
}
export function consumeFood(id: string): boolean {
  const inv = getFoodInventory();
  if ((inv[id] ?? 0) <= 0) return false;
  inv[id]--; if (inv[id] === 0) delete inv[id];
  save("sq_food_inv", inv); return true;
}

/* ════════════════════════════════════════════════════
   CLOTHING
════════════════════════════════════════════════════ */
export function getOwnedClothing(): string[] { return load("sq_owned_cloth", []); }
export function addOwnedClothing(id: string): void {
  const arr = getOwnedClothing(); if (!arr.includes(id)) { arr.push(id); save("sq_owned_cloth", arr); }
}
export function getEquippedClothing(): EquippedClothing { return load("sq_equipped_cloth", {}); }
export function setEquippedClothing(eq: EquippedClothing): void { save("sq_equipped_cloth", eq); }

const SLEEP_ITEM_IDS = ["cloth_tapones", "cloth_antifaz", "cloth_pijama"];
export function getSleepItemCount(equipped: EquippedClothing): number {
  return SLEEP_ITEM_IDS.filter(id => Object.values(equipped).includes(id)).length;
}

export function toggleClothing(clothingId: string): EquippedClothing {
  const item = CLOTHING_CATALOG.find(c => c.id === clothingId);
  if (!item) return getEquippedClothing();
  const eq = getEquippedClothing();
  if (eq[item.slot] === clothingId) delete eq[item.slot];
  else eq[item.slot] = clothingId;
  setEquippedClothing(eq);
  return eq;
}

/* ════════════════════════════════════════════════════
   TOYS
════════════════════════════════════════════════════ */
export function getOwnedToys(): string[] { return load("sq_owned_toys", []); }
export function addOwnedToy(id: string): void {
  const arr = getOwnedToys(); if (!arr.includes(id)) { arr.push(id); save("sq_owned_toys", arr); }
}
export function getToyUsage(): ToyUsage { return load("sq_toy_usage", {}); }
export function isToyOnCooldown(id: string, cooldownMin: number): boolean {
  const u = getToyUsage(); if (!u[id]) return false;
  return (Date.now() - new Date(u[id]).getTime()) < cooldownMin * 60_000;
}
export function recordToyUse(id: string): void {
  const u = getToyUsage(); u[id] = new Date().toISOString(); save("sq_toy_usage", u);
}

export function getEquippedToy(): string | null {
  try { return localStorage.getItem("sq_equipped_toy"); } catch { return null; }
}
export function setEquippedToy(id: string | null): void {
  try {
    if (id) localStorage.setItem("sq_equipped_toy", id);
    else localStorage.removeItem("sq_equipped_toy");
  } catch { /* noop */ }
  pushToCloud("sq_equipped_toy", id ?? "");
}
