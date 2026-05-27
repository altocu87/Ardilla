"use client";
import { useState, useEffect } from "react";
import { getPlayerProfile, upsertPlayerProfile } from "@/lib/db";

/* ── Types & constants ─────────────────────────────────────────────────── */
const BET_OPTIONS = [1, 2, 5, 10];
type Cell  = "p" | "a" | null; // p = ardilla (jugador), a = caracol (IA)
type Phase = "betting" | "playing" | "result";

const WIN_LINES: [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(board: Cell[]): { winner: Cell | "draw" | null; line: [number, number, number] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return { winner: board[a], line };
  }
  if (board.every(c => c !== null)) return { winner: "draw", line: null };
  return { winner: null, line: null };
}

function minimax(board: Cell[], isMax: boolean, depth: number): number {
  const { winner } = checkWinner(board);
  if (winner === "a")    return 10 - depth;
  if (winner === "p")    return depth - 10;
  if (winner === "draw") return 0;

  const empties = board.map((c, i) => (c === null ? i : -1)).filter(i => i >= 0);
  if (isMax) {
    let best = -Infinity;
    for (const i of empties) {
      const nb = [...board] as Cell[]; nb[i] = "a";
      best = Math.max(best, minimax(nb, false, depth + 1));
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of empties) {
      const nb = [...board] as Cell[]; nb[i] = "p";
      best = Math.min(best, minimax(nb, true, depth + 1));
    }
    return best;
  }
}

function getAIMove(board: Cell[]): number {
  const empties = board.map((c, i) => (c === null ? i : -1)).filter(i => i >= 0);
  if (empties.length === 0) return -1;

  // 15 % de azar para que sea beatable
  if (Math.random() < 0.15) {
    return empties[Math.floor(Math.random() * empties.length)];
  }

  let best = -Infinity;
  let bestMove = empties[0];
  for (const i of empties) {
    const nb = [...board] as Cell[]; nb[i] = "a";
    const score = minimax(nb, false, 0);
    if (score > best) { best = score; bestMove = i; }
  }
  return bestMove;
}

/* ── Componente principal ─────────────────────────────────────────────── */
interface Props { onClose: () => void }

export default function TresEnRayaGame({ onClose }: Props) {
  const [bellotas, setBellotas] = useState(0);
  const [loading,  setLoading]  = useState(true);

  const [bet,        setBet]        = useState(1);
  const [phase,      setPhase]      = useState<Phase>("betting");
  const [board,      setBoard]      = useState<Cell[]>(Array(9).fill(null));
  const [winInfo,    setWinInfo]    = useState<{ winner: Cell | "draw"; line: [number, number, number] | null } | null>(null);
  const [aiThinking, setAiThinking] = useState(false);

  const [wins,        setWins]        = useState(0);
  const [losses,      setLosses]      = useState(0);
  const [draws,       setDraws]       = useState(0);
  const [totalGained, setTotalGained] = useState(0);

  useEffect(() => {
    getPlayerProfile()
      .then(p => { setBellotas(p.bellotas ?? 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function updateBellotas(delta: number) {
    const newVal = Math.max(0, bellotas + delta);
    setBellotas(newVal);
    setTotalGained(prev => prev + delta);
    try { await upsertPlayerProfile({ bellotas: newVal }); } catch { /* noop */ }
  }

  function startGame() {
    setBoard(Array(9).fill(null));
    setWinInfo(null);
    setPhase("playing");
  }

  function finishGame(b: Cell[], result: { winner: Cell | "draw" | null; line: [number, number, number] | null }) {
    if (!result.winner) return;
    setWinInfo({ winner: result.winner, line: result.line });
    setPhase("result");
    if (result.winner === "p") {
      setWins(w => w + 1);
      updateBellotas(+bet);
    } else if (result.winner === "a") {
      setLosses(l => l + 1);
      updateBellotas(-bet);
    } else {
      setDraws(d => d + 1);
    }
  }

  function handleCellClick(idx: number) {
    if (phase !== "playing" || board[idx] || winInfo || aiThinking) return;

    const newBoard = [...board] as Cell[];
    newBoard[idx] = "p";
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result.winner) { finishGame(newBoard, result); return; }

    setAiThinking(true);
    setTimeout(() => {
      const aiIdx = getAIMove(newBoard);
      if (aiIdx < 0) { setAiThinking(false); return; }
      const b2 = [...newBoard] as Cell[]; b2[aiIdx] = "a";
      setBoard(b2);
      setAiThinking(false);
      const r2 = checkWinner(b2);
      if (r2.winner) finishGame(b2, r2);
    }, 420);
  }

  function resetGame() {
    setBoard(Array(9).fill(null));
    setWinInfo(null);
    setPhase("betting");
    if (bet > bellotas) setBet(BET_OPTIONS.filter(b => b <= bellotas)[0] ?? 1);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <span className="text-4xl animate-bounce">🐿️</span>
      </div>
    );
  }

  const isResult   = phase === "result";
  const noBellotas = bellotas < 1;
  const gamesPlayed = wins + losses + draws;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-emerald-950 via-green-900 to-emerald-950 overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-6 pb-3">
        <div>
          <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest">Juego del bosque</p>
          <h1 className="text-white text-2xl font-black leading-tight">Tres en Raya</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-800/60 rounded-2xl px-4 py-2 flex items-center gap-1.5">
            <span className="text-xl">🌰</span>
            <span className="text-white font-black text-lg">{bellotas}</span>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-emerald-800/60 text-white font-bold text-lg flex items-center justify-center active:scale-95 transition">✕</button>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-5 overflow-y-auto">

        {/* ─ Fase apuesta ─ */}
        {phase === "betting" && (
          <div className="w-full max-w-xs flex flex-col gap-5 items-center">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <span className="text-6xl drop-shadow-lg">🐿️</span>
                <span className="text-emerald-200 text-xs font-bold">Tú</span>
              </div>
              <span className="text-white font-black text-3xl">VS</span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-6xl drop-shadow-lg">🐌</span>
                <span className="text-emerald-200 text-xs font-bold">Caracol</span>
              </div>
            </div>
            <p className="text-emerald-300 text-sm text-center">Tú pones la 🐿️ · El caracol pone la 🐌<br/>¡Tres en raya gana!</p>

            <div className="bg-emerald-800/60 rounded-2xl p-4 w-full">
              <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3 text-center">
                ¿Cuántas bellotas apuestas?
              </p>
              <div className="grid grid-cols-4 gap-2">
                {BET_OPTIONS.map(b => (
                  <button key={b} onClick={() => setBet(b)} disabled={b > bellotas}
                    className={`py-3 rounded-xl font-black text-base transition-all active:scale-95 ${
                      bet === b
                        ? "bg-emerald-400 text-emerald-900 scale-105 shadow-lg"
                        : b > bellotas
                        ? "bg-emerald-900/40 text-emerald-700 cursor-not-allowed"
                        : "bg-emerald-700 text-emerald-100 hover:bg-emerald-600"
                    }`}>
                    {b}
                  </button>
                ))}
              </div>
              <p className="text-emerald-400 text-xs text-center mt-2">
                Apuesta: <strong>{bet} 🌰</strong> · Ganas si ganas: <strong>+{bet} 🌰</strong>
              </p>
            </div>

            {noBellotas ? (
              <div className="bg-red-900/60 rounded-2xl px-5 py-4 text-center w-full">
                <p className="text-red-300 font-bold text-sm">¡Sin bellotas para apostar!</p>
                <p className="text-red-400 text-xs mt-1">Completa registros para ganar más 🌰</p>
              </div>
            ) : (
              <button onClick={startGame}
                className="w-full py-5 rounded-2xl bg-emerald-400 text-emerald-900 font-black text-xl shadow-xl active:scale-95 transition">
                ¡Empezar partida! 🎮
              </button>
            )}
          </div>
        )}

        {/* ─ Fase juego / resultado ─ */}
        {(phase === "playing" || phase === "result") && (
          <>
            {/* Turno / resultado */}
            {!isResult ? (
              <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all ${
                aiThinking ? "bg-teal-700/70" : "bg-amber-500/70"
              }`}>
                <span className="text-2xl">{aiThinking ? "🐌" : "🐿️"}</span>
                <span className="text-white font-bold text-sm">
                  {aiThinking ? "El caracol está pensando…" : "Tu turno · toca una casilla"}
                </span>
              </div>
            ) : (
              <div className={`rounded-2xl px-6 py-3 text-center shadow-xl ${
                winInfo?.winner === "p" ? "bg-emerald-500"
                : winInfo?.winner === "a" ? "bg-red-500"
                : "bg-amber-500"
              }`}>
                <p className="text-white font-black text-xl">
                  {winInfo?.winner === "p"
                    ? `¡Ganaste! +${bet} 🌰 🎉`
                    : winInfo?.winner === "a"
                    ? `Ganó el caracol 🐌  −${bet} 🌰`
                    : "¡Empate! 🤝 Sin cambios"}
                </p>
              </div>
            )}

            {/* Tablero 3×3 */}
            <div className="grid grid-cols-3 gap-2">
              {board.map((cell, i) => {
                const isWinCell = winInfo?.line?.includes(i) ?? false;
                const row = Math.floor(i / 3);
                const col = i % 3;
                const borderR = col < 2 ? "border-r-2" : "";
                const borderB = row < 2 ? "border-b-2" : "";
                return (
                  <button key={i} onClick={() => handleCellClick(i)}
                    disabled={!!cell || isResult || aiThinking}
                    style={{ animation: isWinCell ? "winPulse 0.7s ease-in-out infinite alternate" : undefined }}
                    className={`w-24 h-24 rounded-xl flex items-center justify-center text-5xl transition-all
                      border-emerald-600/50 ${borderR} ${borderB}
                      ${isWinCell
                        ? "bg-yellow-400/80 shadow-lg shadow-yellow-500/40 scale-105"
                        : cell
                        ? "bg-emerald-800/60"
                        : "bg-white/10 hover:bg-white/20 active:scale-95 active:bg-white/30"
                      }`}>
                    {cell === "p" ? "🐿️" : cell === "a" ? "🐌" : ""}
                  </button>
                );
              })}
            </div>

            {/* Botones post-resultado */}
            {isResult && (
              <div className="w-full max-w-xs flex flex-col gap-3">
                {bellotas > 0 ? (
                  <button onClick={resetGame}
                    className="w-full py-4 rounded-2xl bg-emerald-400 text-emerald-900 font-black text-lg shadow-xl active:scale-95">
                    Jugar de nuevo →
                  </button>
                ) : (
                  <div className="bg-red-900/60 rounded-2xl px-5 py-3 text-center">
                    <p className="text-red-300 font-bold text-sm">¡Sin bellotas!</p>
                  </div>
                )}
                <button onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-emerald-900/60 text-emerald-300 font-bold text-sm active:scale-95">
                  Salir del juego
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Estadísticas de sesión ── */}
      {gamesPlayed > 0 && (
        <div className="shrink-0 flex justify-center gap-5 px-5 py-4 border-t border-emerald-800/40">
          <div className="text-center">
            <p className="text-emerald-300 text-xs">Victorias</p>
            <p className="text-emerald-400 font-black text-lg">{wins}</p>
          </div>
          <div className="text-center">
            <p className="text-emerald-300 text-xs">Derrotas</p>
            <p className="text-red-400 font-black text-lg">{losses}</p>
          </div>
          <div className="text-center">
            <p className="text-emerald-300 text-xs">Empates</p>
            <p className="text-amber-400 font-black text-lg">{draws}</p>
          </div>
          <div className="text-center">
            <p className="text-emerald-300 text-xs">Sesión</p>
            <p className={`font-black text-lg ${totalGained >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {totalGained >= 0 ? "+" : ""}{totalGained} 🌰
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes winPulse {
          from { box-shadow: 0 0 0 0 rgba(250,204,21,0.6); }
          to   { box-shadow: 0 0 16px 8px rgba(250,204,21,0.15); }
        }
      `}</style>
    </div>
  );
}
