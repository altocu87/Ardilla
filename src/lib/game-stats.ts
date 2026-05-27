import { pushToCloud } from "./cloudsync";

/* ── Tipos ──────────────────────────────────────────────────────────────── */
export type GameKey = "tres_en_raya" | "conecta4" | "mayor_menor" | "carrera";

export const GAME_META: Record<GameKey, { name: string; emoji: string }> = {
  tres_en_raya: { name: "Tres en Raya",      emoji: "🐿️" },
  conecta4:     { name: "Conecta 4",          emoji: "🌰" },
  mayor_menor:  { name: "Mayor o Menor",      emoji: "🎴" },
  carrera:      { name: "Carrera del Bosque", emoji: "🏁" },
};

export interface PerGameStats {
  played: number;
  won: number;
  lost: number;
  drawn: number;
  bellotasDelta: number;   // bellotas ganadas/perdidas (puede ser negativo)
}

export interface TwoPlayerRecord {
  played: number;
  p1Wins: number;
  p2Wins: number;
  draws: number;
}

export interface AllGameStats {
  perGame: Partial<Record<GameKey, PerGameStats>>;
  twoPlayer: Partial<Record<GameKey, TwoPlayerRecord>>;
  raceAnimalWins:     Record<string, number>;  // emoji → veces ganada la carrera
  raceAnimalPicks:    Record<string, number>;  // emoji → veces apostada por el jugador
  raceAnimalPickWins: Record<string, number>;  // emoji → veces apostada Y ganó
}

/* ── Persistencia ───────────────────────────────────────────────────────── */
const LS_KEY = "ardilla_game_stats_v1";

function emptyPerGame(): PerGameStats {
  return { played: 0, won: 0, lost: 0, drawn: 0, bellotasDelta: 0 };
}
function emptyTwoPlayer(): TwoPlayerRecord {
  return { played: 0, p1Wins: 0, p2Wins: 0, draws: 0 };
}
function emptyStats(): AllGameStats {
  return {
    perGame: {}, twoPlayer: {},
    raceAnimalWins: {}, raceAnimalPicks: {}, raceAnimalPickWins: {},
  };
}

export function loadGameStats(): AllGameStats {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return emptyStats();
    const p = JSON.parse(raw) as Partial<AllGameStats>;
    return {
      perGame:            p.perGame            ?? {},
      twoPlayer:          p.twoPlayer          ?? {},
      raceAnimalWins:     p.raceAnimalWins     ?? {},
      raceAnimalPicks:    p.raceAnimalPicks    ?? {},
      raceAnimalPickWins: p.raceAnimalPickWins ?? {},
    };
  } catch { return emptyStats(); }
}

function saveGameStats(s: AllGameStats): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
    pushToCloud(LS_KEY, s);
  } catch { /* noop */ }
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
function pg(s: AllGameStats, game: GameKey): PerGameStats {
  if (!s.perGame[game]) s.perGame[game] = emptyPerGame();
  return s.perGame[game]!;
}
function tp(s: AllGameStats, game: GameKey): TwoPlayerRecord {
  if (!s.twoPlayer[game]) s.twoPlayer[game] = emptyTwoPlayer();
  return s.twoPlayer[game]!;
}

/* ── API pública ────────────────────────────────────────────────────────── */

/** Registra el resultado de una partida 1 jugador. */
export function recordResult1P(
  game: GameKey,
  result: "win" | "lose" | "draw",
  bellotasDelta: number,
): void {
  const s = loadGameStats();
  const g = pg(s, game);
  g.played++;
  if (result === "win")       g.won++;
  else if (result === "lose") g.lost++;
  else                         g.drawn++;
  g.bellotasDelta += bellotasDelta;
  saveGameStats(s);
}

/** Registra el resultado de una partida 2 jugadores (no bellotas en juego). */
export function record2PResult(
  game: GameKey,
  winner: "p1" | "p2" | "draw",
): void {
  const s = loadGameStats();
  const t = tp(s, game);
  t.played++;
  if (winner === "p1")      t.p1Wins++;
  else if (winner === "p2") t.p2Wins++;
  else                       t.draws++;
  saveGameStats(s);
}

/**
 * Registra el resultado de una carrera.
 * En modo 1P: pickedEmoji = animal apostado, wonRace = si ganó.
 * En modo 2P: p1Emoji y p2Emoji son los animales de cada jugador.
 */
export function recordRaceResult(opts: {
  mode: "1p" | "2p";
  winnerEmoji: string;
  bellotasDelta: number;
  // 1P
  pickedEmoji?: string;
  wonRace?: boolean;
  // 2P
  p1Emoji?: string;
  p2Emoji?: string;
}): void {
  const s = loadGameStats();

  // Siempre registrar quién ganó la carrera
  s.raceAnimalWins[opts.winnerEmoji] = (s.raceAnimalWins[opts.winnerEmoji] ?? 0) + 1;

  if (opts.mode === "1p" && opts.pickedEmoji !== undefined) {
    s.raceAnimalPicks[opts.pickedEmoji] = (s.raceAnimalPicks[opts.pickedEmoji] ?? 0) + 1;
    if (opts.wonRace) {
      s.raceAnimalPickWins[opts.pickedEmoji] = (s.raceAnimalPickWins[opts.pickedEmoji] ?? 0) + 1;
    }
    const g = pg(s, "carrera");
    g.played++;
    if (opts.wonRace) g.won++; else g.lost++;
    g.bellotasDelta += opts.bellotasDelta;
  } else if (opts.mode === "2p" && opts.p1Emoji && opts.p2Emoji) {
    // Registrar picks de ambos jugadores
    s.raceAnimalPicks[opts.p1Emoji] = (s.raceAnimalPicks[opts.p1Emoji] ?? 0) + 1;
    s.raceAnimalPicks[opts.p2Emoji] = (s.raceAnimalPicks[opts.p2Emoji] ?? 0) + 1;
    if (opts.p1Emoji === opts.winnerEmoji) {
      s.raceAnimalPickWins[opts.p1Emoji] = (s.raceAnimalPickWins[opts.p1Emoji] ?? 0) + 1;
    }
    if (opts.p2Emoji === opts.winnerEmoji) {
      s.raceAnimalPickWins[opts.p2Emoji] = (s.raceAnimalPickWins[opts.p2Emoji] ?? 0) + 1;
    }
    // 2P record
    const t = tp(s, "carrera");
    t.played++;
    if (opts.p1Emoji === opts.winnerEmoji)      t.p1Wins++;
    else if (opts.p2Emoji === opts.winnerEmoji) t.p2Wins++;
    else                                         t.draws++;
    // Bellotas netas
    const g = pg(s, "carrera");
    g.played++;
    g.bellotasDelta += opts.bellotasDelta;
  }

  saveGameStats(s);
}
