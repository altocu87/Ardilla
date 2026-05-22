import { pushToCloud } from "./cloudsync";

export type MiniGameEntry = { score: number; date: string };
export type MemoryEntry   = { moves: number; timeSeconds: number; date: string };
type GameRankings = { miniGame: MiniGameEntry[]; memory: MemoryEntry[] };

const LS_KEY = "tama_game_rankings_v1";

function load(): GameRankings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as GameRankings) : { miniGame: [], memory: [] };
  } catch { return { miniGame: [], memory: [] }; }
}

function save(data: GameRankings): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); pushToCloud(LS_KEY, data); }
  catch { /* noop */ }
}

export function getMiniGameRankings(): MiniGameEntry[] { return load().miniGame; }

export function addMiniGameScore(score: number): void {
  const d = load();
  d.miniGame = [...d.miniGame, { score, date: new Date().toISOString() }]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  save(d);
}

export function getMemoryRankings(): MemoryEntry[] { return load().memory; }

export function addMemoryScore(moves: number, timeSeconds: number): void {
  const d = load();
  d.memory = [...d.memory, { moves, timeSeconds, date: new Date().toISOString() }]
    .sort((a, b) => a.moves !== b.moves ? a.moves - b.moves : a.timeSeconds - b.timeSeconds)
    .slice(0, 10);
  save(d);
}
