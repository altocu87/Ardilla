import { pushToCloud } from "./cloudsync";

// ── tipos ──────────────────────────────────────────────────────────────────
export type ShopItem = {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  price: number;
};

export type AvatarItem = {
  id: string;
  name: string;
  img64: string; // base64
};

export type TituloItem = {
  id: string;
  text: string;
  price?: number;
};

// ── defaults ────────────────────────────────────────────────────────────────
// Vacíos: los artículos se gestionan desde Ajustes.
const DEFAULT_BELLOTAS: ShopItem[]  = [];
const DEFAULT_RATA:     ShopItem[]  = [];
const DEFAULT_AVATARES: AvatarItem[] = [];
const DEFAULT_TITULOS: TituloItem[] = [
  { id: "dt01", text: "🌱 Pequeña Ardilla",           price: 50  },
  { id: "dt02", text: "🧘 Mente en calma",             price: 75  },
  { id: "dt03", text: "🌿 Naturaleza interior",        price: 75  },
  { id: "dt04", text: "🦋 En transformación",          price: 100 },
  { id: "dt05", text: "🌸 Flor de la tranquilidad",    price: 100 },
  { id: "dt06", text: "💪 Guerrera del bienestar",     price: 125 },
  { id: "dt07", text: "🌙 Soñadora consciente",        price: 125 },
  { id: "dt08", text: "⚡ Energía positiva",           price: 150 },
  { id: "dt09", text: "🎯 Maestra del registro",       price: 150 },
  { id: "dt10", text: "🌺 Jardín interior",            price: 200 },
  { id: "dt11", text: "🏆 Campeona del bienestar",     price: 200 },
  { id: "dt12", text: "🦁 Corazón valiente",           price: 250 },
  { id: "dt13", text: "🔮 Mente brillante",            price: 250 },
  { id: "dt14", text: "🌈 Arcoíris emocional",         price: 300 },
  { id: "dt15", text: "🧠 Sabia de la calma",          price: 300 },
  { id: "dt16", text: "🌟 Estrella del progreso",      price: 350 },
  { id: "dt17", text: "👑 Reina de la constancia",     price: 350 },
  { id: "dt18", text: "🪄 Magia interior",             price: 400 },
  { id: "dt19", text: "💎 Joya del bienestar",         price: 450 },
  { id: "dt20", text: "🏅 Leyenda de la Tranquilidad", price: 500 },
];

// IDs hardcodeados de la versión anterior — se limpian automáticamente.
const LEGACY_BELL_IDS   = ["b1","b2","b3","b4"];
const LEGACY_RATA_IDS   = ["r1","r2","r3","r4"];
const LEGACY_TITULO_IDS = ["t1","t2","t3","t4","t5"];

// ── helpers localStorage ─────────────────────────────────────────────────────
function load<T>(key: string, fallback: T[]): T[] {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T[]) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* noop */ }
  pushToCloud(key, data);
}

/** Elimina los artículos predeterminados de la versión anterior del localStorage. */
export function cleanupLegacyDefaults(): void {
  try {
    const bell = load<ShopItem>("shop_bellotas", []);
    const filtBell = bell.filter(i => !LEGACY_BELL_IDS.includes(i.id));
    if (filtBell.length !== bell.length) save("shop_bellotas", filtBell);

    const rata = load<ShopItem>("shop_rata", []);
    const filtRata = rata.filter(i => !LEGACY_RATA_IDS.includes(i.id));
    if (filtRata.length !== rata.length) save("shop_rata", filtRata);

    const tit = load<TituloItem>("shop_titulos", []);
    const filtTit = tit.filter(i => !LEGACY_TITULO_IDS.includes(i.id));
    if (filtTit.length !== tit.length) save("shop_titulos", filtTit);
  } catch { /* noop */ }
}

// ── Bellotas shop ────────────────────────────────────────────────────────────
export function getShopBellotas(): ShopItem[]        { return load("shop_bellotas", DEFAULT_BELLOTAS); }
export function saveShopBellotas(items: ShopItem[])  { save("shop_bellotas", items); }

// ── Rata shop ────────────────────────────────────────────────────────────────
export function getShopRata(): ShopItem[]            { return load("shop_rata", DEFAULT_RATA); }
export function saveShopRata(items: ShopItem[])      { save("shop_rata", items); }

// ── Avatares ─────────────────────────────────────────────────────────────────
export function getShopAvatares(): AvatarItem[]       { return load("shop_avatares", DEFAULT_AVATARES); }
export function saveShopAvatares(items: AvatarItem[]) { save("shop_avatares", items); }

// ── Títulos ──────────────────────────────────────────────────────────────────
export function getShopTitulos(): TituloItem[] {
  const stored = load<TituloItem>("shop_titulos", []);
  const storedIds = new Set(stored.map(t => t.id));
  const merged = [...stored, ...DEFAULT_TITULOS.filter(d => !storedIds.has(d.id))];
  return merged;
}
export function saveShopTitulos(items: TituloItem[]) { save("shop_titulos", items); }

// ── Owned / equipado ─────────────────────────────────────────────────────────
export function getOwned(): string[]                 { return load<string>("tienda_owned", []); }
export function setOwned(ids: string[])              { save("tienda_owned", ids); }

export function getEquippedAvatar(): string | null   {
  try { return localStorage.getItem("active_avatar"); } catch { return null; }
}
export function setEquippedAvatar(id: string | null) {
  try {
    if (id) localStorage.setItem("active_avatar", id);
    else localStorage.removeItem("active_avatar");
  } catch { /* noop */ }
  pushToCloud("active_avatar", id ?? "");
}

export function getEquippedTitulo(): string | null   {
  try { return localStorage.getItem("active_titulo"); } catch { return null; }
}
export function setEquippedTitulo(id: string | null) {
  try {
    if (id) localStorage.setItem("active_titulo", id);
    else localStorage.removeItem("active_titulo");
  } catch { /* noop */ }
  pushToCloud("active_titulo", id ?? "");
}
