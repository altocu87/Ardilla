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
};

// ── defaults ────────────────────────────────────────────────────────────────
const DEFAULT_BELLOTAS: ShopItem[] = [
  { id: "b1", emoji: "🌸", name: "Pétalo de calma",      desc: "Una flor de calma para tu diario",          price: 20 },
  { id: "b2", emoji: "🎨", name: "Paleta de colores",    desc: "Desbloquea más colores en los registros",    price: 40 },
  { id: "b3", emoji: "🧸", name: "Peluche de apoyo",     desc: "Un recordatorio de que no estás sola",       price: 60 },
  { id: "b4", emoji: "🌈", name: "Arco iris de premios", desc: "Fondo arcoíris en la pantalla principal",    price: 120 },
];

const DEFAULT_RATA: ShopItem[] = [
  { id: "r1", emoji: "🐀", name: "La Rata Sabia",     desc: "La rata sabe lo que necesitas. Quizás.",  price: 30  },
  { id: "r2", emoji: "🧀", name: "Queso de la suerte",desc: "Un queso especial para días difíciles",   price: 50  },
  { id: "r3", emoji: "🔮", name: "Bola de cristal",   desc: "Predice tu próximo registro perfecto",    price: 80  },
  { id: "r4", emoji: "🌙", name: "Noche de rata",     desc: "Tema oscuro misterioso para la app",      price: 150 },
];

const DEFAULT_AVATARES: AvatarItem[] = [];

const DEFAULT_TITULOS: TituloItem[] = [
  { id: "t1", text: "Ardilla Novata 🌱" },
  { id: "t2", text: "Ardilla Valiente 💪" },
  { id: "t3", text: "Maestra de la Calma 🌿" },
  { id: "t4", text: "Exploradora del Cuerpo 🫀" },
  { id: "t5", text: "Reina de las Bellotas 👑" },
];

// ── helpers localStorage ─────────────────────────────────────────────────────
function load<T>(key: string, fallback: T[]): T[] {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T[]) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* noop */ }
}

// ── Bellotas shop ────────────────────────────────────────────────────────────
export function getShopBellotas(): ShopItem[]        { return load("shop_bellotas", DEFAULT_BELLOTAS); }
export function saveShopBellotas(items: ShopItem[])  { save("shop_bellotas", items); }

// ── Rata shop ────────────────────────────────────────────────────────────────
export function getShopRata(): ShopItem[]            { return load("shop_rata", DEFAULT_RATA); }
export function saveShopRata(items: ShopItem[])      { save("shop_rata", items); }

// ── Avatares ─────────────────────────────────────────────────────────────────
export function getShopAvatares(): AvatarItem[]      { return load("shop_avatares", DEFAULT_AVATARES); }
export function saveShopAvatares(items: AvatarItem[]) { save("shop_avatares", items); }

// ── Títulos ──────────────────────────────────────────────────────────────────
export function getShopTitulos(): TituloItem[]       { return load("shop_titulos", DEFAULT_TITULOS); }
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
}

export function getEquippedTitulo(): string | null   {
  try { return localStorage.getItem("active_titulo"); } catch { return null; }
}
export function setEquippedTitulo(id: string | null) {
  try {
    if (id) localStorage.setItem("active_titulo", id);
    else localStorage.removeItem("active_titulo");
  } catch { /* noop */ }
}
