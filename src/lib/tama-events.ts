import { getPlayerProfile, upsertPlayerProfile } from "./db";
import { pushToCloud } from "./cloudsync";

/* ════════════════════════════════════════════════════
   EVENTOS / SORPRESAS
   Como mucho un evento al día (guarda por fecha, idioma de rollBadSleep).
   El evento queda activo hasta que se reclama o caduca. Reclamar premia
   bellotas vía player_profile. Solo en cliente (localStorage + Math.random).
════════════════════════════════════════════════════ */
export type GameEventKind = "snail" | "merchant" | "gift" | "shooting_star";

export type GameEvent = {
  id: string;
  kind: GameEventKind;
  emoji: string;
  title: string;
  message: string;
  rewardBellotas: number;
  expiresAt: number;
};

const LS_ACTIVE = "tama_event_active_v1";
const LS_DAILY  = "tama_event_daily_v1";

const H = 3_600_000;

function isNight(): boolean {
  const h = new Date().getHours();
  return h < 9 || h >= 21;
}

function buildEvent(kind: GameEventKind): GameEvent {
  const now = Date.now();
  const id = `${kind}-${now}`;
  switch (kind) {
    case "snail":
      return { id, kind, emoji: "🐌", title: "¡Visita del caracol!",
        message: "El caracol ha venido a saludar. ¡La ardilla está encantada!",
        rewardBellotas: 3, expiresAt: now + 6 * H };
    case "merchant":
      return { id, kind, emoji: "🧺", title: "Mercader ambulante",
        message: "Un mercader cruza el bosque y te regala unas bellotas.",
        rewardBellotas: 6, expiresAt: now + 6 * H };
    case "gift":
      return { id, kind, emoji: "🎁", title: "¡Regalo del bosque!",
        message: "Alguien ha dejado un regalito bajo el árbol.",
        rewardBellotas: 8, expiresAt: now + 8 * H };
    case "shooting_star":
      return { id, kind, emoji: "🌠", title: "¡Estrella fugaz!",
        message: "Pide un deseo... ¡y atrápala antes de que se vaya!",
        rewardBellotas: 12, expiresAt: now + 3 * H };
  }
}

function rollKind(): GameEventKind {
  const r = Math.random();
  let kind: GameEventKind = r < 0.4 ? "snail" : r < 0.68 ? "gift" : r < 0.9 ? "merchant" : "shooting_star";
  if (kind === "shooting_star" && !isNight()) kind = "gift"; // la estrella solo de noche
  return kind;
}

function saveActive(ev: GameEvent | null): void {
  try {
    if (ev) localStorage.setItem(LS_ACTIVE, JSON.stringify(ev));
    else    localStorage.removeItem(LS_ACTIVE);
    pushToCloud(LS_ACTIVE, ev);
  } catch { /* noop */ }
}

export function getActiveEvent(): GameEvent | null {
  try {
    const raw = localStorage.getItem(LS_ACTIVE);
    if (!raw) return null;
    const ev = JSON.parse(raw) as GameEvent;
    if (Date.now() >= ev.expiresAt) { saveActive(null); return null; }
    return ev;
  } catch { return null; }
}

/** Tirada diaria: si ya hay evento activo lo devuelve; si no, ~60% de que aparezca uno. */
export function rollDailyEvents(): GameEvent | null {
  const existing = getActiveEvent();
  if (existing) return existing;
  const today = new Date().toISOString().slice(0, 10);
  let lastRoll = "";
  try { lastRoll = localStorage.getItem(LS_DAILY) ?? ""; } catch { /* noop */ }
  if (lastRoll >= today) return null;
  try { localStorage.setItem(LS_DAILY, today); } catch { /* noop */ }
  if (Math.random() < 0.6) {
    const ev = buildEvent(rollKind());
    saveActive(ev);
    return ev;
  }
  return null;
}

/** Reclama el evento activo. Devuelve las bellotas otorgadas. */
export async function claimEvent(id: string): Promise<number> {
  const ev = getActiveEvent();
  if (!ev || ev.id !== id) return 0;
  saveActive(null);
  const reward = ev.rewardBellotas;
  if (reward > 0) {
    try {
      const p = await getPlayerProfile();
      await upsertPlayerProfile({ bellotas: p.bellotas + reward });
    } catch { /* noop */ }
  }
  return reward;
}
