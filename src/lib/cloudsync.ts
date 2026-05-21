// Sincronización localStorage ↔ Supabase (tabla user_data).
//
// Estrategia:
//   - En arranque (home): pullFromCloud() lee Supabase y sobreescribe
//     localStorage con los valores en la nube.
//   - En cada save (shop, perfil, recompensas, frases, etc.): además de
//     escribir en localStorage, se hace pushToCloud(key, value) en segundo
//     plano (fire-and-forget).
//
// Una sola usuaria → "last write wins" sin resolución de conflictos.

import { createClient } from "./supabase";

/** Claves que en localStorage se guardan como string crudo (no JSON.stringify). */
const RAW_STRING_KEYS = new Set([
  "snail_image",
  "active_avatar",
  "active_titulo",
]);

/** Lista de TODAS las claves sincronizadas. */
export const SYNCED_KEYS = [
  "player_profile_v1",
  "shop_bellotas",
  "shop_rata",
  "shop_avatares",
  "shop_titulos",
  "tienda_owned",
  "active_avatar",
  "active_titulo",
  "custom_phrases",
  "rewards_config_v1",
  "snail_image",
];

/** Empuja un valor a la nube. Fire-and-forget: nunca lanza. */
export function pushToCloud(key: string, rawValue: unknown): void {
  if (typeof window === "undefined") return;
  // Coercionar al formato JSON-friendly que esperamos:
  // - claves raw (snail_image, etc.): rawValue es un string → guardarlo tal cual
  // - resto: rawValue es un objeto/array/primitivo → guardarlo como está
  const valueForJsonb = rawValue;
  (async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("user_data")
        .upsert({
          key,
          value: valueForJsonb as never,
          updated_at: new Date().toISOString(),
        });
      if (error) console.error("pushToCloud", key, error);
    } catch (e) { console.error("pushToCloud exception", key, e); }
  })();
}

/** Descarga TODAS las claves de la nube y las escribe en localStorage. */
export async function pullFromCloud(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_data")
      .select("key, value")
      .in("key", SYNCED_KEYS);
    if (error) { console.error("pullFromCloud", error); return; }
    for (const row of (data ?? []) as { key: string; value: unknown }[]) {
      try {
        const local = RAW_STRING_KEYS.has(row.key)
          ? String(row.value)
          : JSON.stringify(row.value);
        localStorage.setItem(row.key, local);
      } catch (e) { console.error("pullFromCloud write", row.key, e); }
    }
  } catch (e) { console.error("pullFromCloud exception", e); }
}

/** Sube TODAS las claves de localStorage a la nube (one-shot inicial). */
export async function pushAllToCloud(): Promise<void> {
  if (typeof window === "undefined") return;
  for (const key of SYNCED_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) continue;
      let value: unknown = raw;
      if (!RAW_STRING_KEYS.has(key)) {
        try { value = JSON.parse(raw); } catch { /* mantener raw */ }
      }
      pushToCloud(key, value);
    } catch { /* noop */ }
  }
}
