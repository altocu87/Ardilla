import { getCacaLog, getEmocionalLog } from "./db";
import { getTamaStats, saveTamaStats } from "./tamagotchi";

export type RegistroContext = {
  hasConstipation: boolean;
  hasDiarrhea:     boolean;
  tristeza:        boolean;
  goodDay:         boolean;
};

const NEGATIVE_ESTADOS = ["Tristeza", "Bloqueo", "Rabia", "Inquietud"];

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

export async function getRegistroContext(): Promise<RegistroContext> {
  const dates = [daysAgo(0), daysAgo(1), daysAgo(2)];
  let hasConstipation = false;
  let hasDiarrhea     = false;
  let tristeza        = false;
  let goodDay         = false;

  try {
    const cacaLog = await getCacaLog();
    for (const date of dates) {
      for (const entry of cacaLog[date] ?? []) {
        if (entry.bristol <= 2) hasConstipation = true;
        if (entry.bristol >= 6) hasDiarrhea     = true;
      }
    }
  } catch { /* noop */ }

  try {
    const emoLog = await getEmocionalLog();
    const today = daysAgo(0);
    const yest  = daysAgo(1);
    const entry = emoLog[today] ?? emoLog[yest];
    if (entry) {
      tristeza = NEGATIVE_ESTADOS.includes(entry.estado) && entry.intensidad >= 5;
      goodDay  = entry.estado === "Calma" && entry.intensidad <= 3;
    }
  } catch { /* noop */ }

  return { hasConstipation, hasDiarrhea, tristeza, goodDay };
}

/**
 * Once per day: if recent caca log shows constipation and ardilla is healthy,
 * trigger the "caca" illness. Returns true if illness was newly set.
 */
export async function syncCacaIllness(): Promise<boolean> {
  const ctx = await getRegistroContext();
  if (!ctx.hasConstipation && !ctx.hasDiarrhea) return false;

  const s    = getTamaStats();
  if (s.illness) return false;

  const today = daysAgo(0);
  // Use lastSickCheck as a proxy — if it's already today the daily check ran; add our own key
  const storeKey = "tama_registro_sync_v1";
  try {
    if (localStorage.getItem(storeKey) === today) return false;
  } catch { return false; }

  s.illness      = "caca";
  s.illnessSince = new Date().toISOString();
  s.totalIllnesses           = (s.totalIllnesses  ?? 0) + 1;
  if (!s.illnessByType) s.illnessByType = {};
  s.illnessByType.caca = (s.illnessByType.caca ?? 0) + 1;
  s.lastSaved    = new Date().toISOString();
  saveTamaStats(s);

  try { localStorage.setItem(storeKey, today); } catch { /* noop */ }
  return true;
}
