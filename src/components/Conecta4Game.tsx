"use client";
import { useState, useEffect, useRef } from "react";
import { getPlayerProfile, upsertPlayerProfile } from "@/lib/db";
import { recordResult1P, record2PResult } from "@/lib/game-stats";

/* ── Constantes ────────────────────────────────────────────────────────── */
const ROWS = 6;
const COLS = 7;
const BET_OPTIONS = [1, 2, 5, 10];

type Cell  = "p" | "a" | null; // p = jugador (amber), a = IA (teal)
type Board = Cell[][];
type Phase = "mode-select" | "betting" | "playing" | "result";
type GameMode = "1p" | "2p";

/* ── Lógica del tablero ─────────────────────────────────────────────────── */
function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null) as Cell[]);
}

/** Devuelve el índice de fila donde cae la pieza en la columna, o -1 si llena. */
function findRow(board: Board, col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === null) return r;
  }
  return -1;
}

function dropPiece(board: Board, col: number, player: "p" | "a"): { board: Board; row: number } | null {
  const row = findRow(board, col);
  if (row < 0) return null;
  const nb: Board = board.map(r => [...r]);
  nb[row][col] = player;
  return { board: nb, row };
}

type WinResult = { player: "p" | "a"; cells: [number, number][] } | null;

function checkWin(board: Board): WinResult {
  function check4(cells: [number, number][]): "p" | "a" | null {
    if (cells.some(([r, c]) => r < 0 || r >= ROWS || c < 0 || c >= COLS)) return null;
    const vals = cells.map(([r, c]) => board[r][c]);
    if (vals[0] && vals.every(v => v === vals[0])) return vals[0];
    return null;
  }

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const cells: [number, number][] = [[r, c], [r, c+1], [r, c+2], [r, c+3]];
      const w = check4(cells);
      if (w) return { player: w, cells };
    }
  }
  // Vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const cells: [number, number][] = [[r, c], [r+1, c], [r+2, c], [r+3, c]];
      const w = check4(cells);
      if (w) return { player: w, cells };
    }
  }
  // Diagonal ↘
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const cells: [number, number][] = [[r, c], [r+1, c+1], [r+2, c+2], [r+3, c+3]];
      const w = check4(cells);
      if (w) return { player: w, cells };
    }
  }
  // Diagonal ↙
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      const cells: [number, number][] = [[r, c], [r+1, c-1], [r+2, c-2], [r+3, c-3]];
      const w = check4(cells);
      if (w) return { player: w, cells };
    }
  }
  return null;
}

function isFull(board: Board): boolean {
  return board[0].every(c => c !== null);
}

/* ── IA: minimax con alpha-beta (profundidad 5) ─────────────────────────── */
function scoreWindow(window: Cell[], ai: "p" | "a"): number {
  const opp   = ai === "a" ? "p" : "a";
  const mine  = window.filter(c => c === ai).length;
  const yours = window.filter(c => c === opp).length;
  const empty = window.filter(c => c === null).length;
  if (mine === 4) return 100;
  if (mine === 3 && empty === 1) return 6;
  if (mine === 2 && empty === 2) return 2;
  if (yours === 3 && empty === 1) return -8;
  return 0;
}

function heuristic(board: Board): number {
  let score = 0;
  // Centro vale más
  const center = Math.floor(COLS / 2);
  for (let r = 0; r < ROWS; r++) {
    if (board[r][center] === "a") score += 3;
    else if (board[r][center] === "p") score -= 3;
  }
  // Horizontal
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c <= COLS - 4; c++)
      score += scoreWindow([board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]], "a");
  // Vertical
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r <= ROWS - 4; r++)
      score += scoreWindow([board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]], "a");
  // Diagonal ↘
  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 0; c <= COLS - 4; c++)
      score += scoreWindow([board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]], "a");
  // Diagonal ↙
  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 3; c < COLS; c++)
      score += scoreWindow([board[r][c], board[r+1][c-1], board[r+2][c-2], board[r+3][c-3]], "a");
  return score;
}

function minimax(board: Board, depth: number, isMax: boolean, alpha: number, beta: number): number {
  const win = checkWin(board);
  if (win?.player === "a") return  10000 + depth;
  if (win?.player === "p") return -10000 - depth;
  if (isFull(board))       return 0;
  if (depth === 0)         return heuristic(board);

  // Orden de columnas: centro primero (mejor poda α-β)
  const cols = [3, 2, 4, 1, 5, 0, 6].filter(c => board[0][c] === null);
  if (cols.length === 0) return 0;

  if (isMax) {
    let best = -Infinity;
    for (const col of cols) {
      const result = dropPiece(board, col, "a");
      if (!result) continue;
      best = Math.max(best, minimax(result.board, depth - 1, false, alpha, beta));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const col of cols) {
      const result = dropPiece(board, col, "p");
      if (!result) continue;
      best = Math.min(best, minimax(result.board, depth - 1, true, alpha, beta));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function getAIMove(board: Board): number {
  const validCols = [3, 2, 4, 1, 5, 0, 6].filter(c => board[0][c] === null);
  if (validCols.length === 0) return -1;

  let best = -Infinity, bestCol = validCols[0];
  for (const col of validCols) {
    const result = dropPiece(board, col, "a");
    if (!result) continue;
    const score = minimax(result.board, 5, false, -Infinity, Infinity);
    if (score > best) { best = score; bestCol = col; }
  }
  return bestCol;
}

/* ── Componente principal ─────────────────────────────────────────────── */
interface Props { onClose: () => void }

export default function Conecta4Game({ onClose }: Props) {
  const [bellotas, setBellotas] = useState(0);
  const [loading,  setLoading]  = useState(true);

  // Mode selector
  const [gameMode, setGameMode] = useState<GameMode>("1p");

  const [bet,        setBet]        = useState(1);
  const [phase,      setPhase]      = useState<Phase>("mode-select");
  const [board,      setBoard]      = useState<Board>(createBoard);
  const [winResult,  setWinResult]  = useState<WinResult>(null);
  const [isDraw,     setIsDraw]     = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [lastCell,   setLastCell]   = useState<[number, number] | null>(null); // para animación
  const [previewCol, setPreviewCol] = useState<number | null>(null);

  // 1P session stats
  const [wins,        setWins]        = useState(0);
  const [losses,      setLosses]      = useState(0);
  const [draws,       setDraws]       = useState(0);
  const [totalGained, setTotalGained] = useState(0);

  // 2P session stats
  const [p1Wins,  setP1Wins]  = useState(0);
  const [p2Wins,  setP2Wins]  = useState(0);
  const [p2Draws, setP2Draws] = useState(0);

  // 2P current turn: "p" = Player 1, "a" = Player 2
  const [currentTurn, setCurrentTurn] = useState<"p" | "a">("p");

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
    setBoard(createBoard());
    setWinResult(null);
    setIsDraw(false);
    setLastCell(null);
    setPreviewCol(null);
    setCurrentTurn("p");
    setPhase("playing");
  }

  /* ── 1P column click handler ── */
  function handleColumnClick1P(col: number) {
    if (phase !== "playing" || winResult || isDraw || aiThinking) return;
    if (board[0][col] !== null) return; // columna llena

    const result = dropPiece(board, col, "p");
    if (!result) return;

    setBoard(result.board);
    setLastCell([result.row, col]);
    setPreviewCol(null);

    const win = checkWin(result.board);
    if (win) {
      setWinResult(win);
      setPhase("result");
      setWins(w => w + 1);
      updateBellotas(+bet);
      recordResult1P("conecta4", "win", +bet);
      return;
    }
    if (isFull(result.board)) {
      setIsDraw(true);
      setPhase("result");
      setDraws(d => d + 1);
      recordResult1P("conecta4", "draw", 0);
      return;
    }

    // Turno IA
    setAiThinking(true);
    setTimeout(() => {
      const aiCol = getAIMove(result.board);
      if (aiCol < 0) { setAiThinking(false); return; }
      const aiResult = dropPiece(result.board, aiCol, "a");
      if (!aiResult) { setAiThinking(false); return; }

      setBoard(aiResult.board);
      setLastCell([aiResult.row, aiCol]);
      setAiThinking(false);

      const aiWin = checkWin(aiResult.board);
      if (aiWin) {
        setWinResult(aiWin);
        setPhase("result");
        setLosses(l => l + 1);
        updateBellotas(-bet);
        recordResult1P("conecta4", "lose", -bet);
        return;
      }
      if (isFull(aiResult.board)) {
        setIsDraw(true);
        setPhase("result");
        setDraws(d => d + 1);
        recordResult1P("conecta4", "draw", 0);
      }
    }, 480);
  }

  /* ── 2P column click handler ── */
  function handleColumnClick2P(col: number) {
    if (phase !== "playing" || winResult || isDraw) return;
    if (board[0][col] !== null) return; // columna llena

    const player = currentTurn; // "p" = J1 (amber), "a" = J2 (blue/teal)
    const result = dropPiece(board, col, player);
    if (!result) return;

    setBoard(result.board);
    setLastCell([result.row, col]);
    setPreviewCol(null);

    const win = checkWin(result.board);
    if (win) {
      setWinResult(win);
      setPhase("result");
      if (player === "p") {
        setP1Wins(w => w + 1);
        record2PResult("conecta4", "p1");
      } else {
        setP2Wins(w => w + 1);
        record2PResult("conecta4", "p2");
      }
      return;
    }
    if (isFull(result.board)) {
      setIsDraw(true);
      setPhase("result");
      setP2Draws(d => d + 1);
      record2PResult("conecta4", "draw");
      return;
    }

    // Alternate turn
    setCurrentTurn(player === "p" ? "a" : "p");
  }

  function handleColumnClick(col: number) {
    if (gameMode === "2p") {
      handleColumnClick2P(col);
    } else {
      handleColumnClick1P(col);
    }
  }

  function resetGame() {
    setBoard(createBoard());
    setWinResult(null);
    setIsDraw(false);
    setLastCell(null);
    setPreviewCol(null);
    setCurrentTurn("p");
    if (gameMode === "1p") {
      setPhase("betting");
      if (bet > bellotas) setBet(BET_OPTIONS.filter(b => b <= bellotas)[0] ?? 1);
    } else {
      // In 2P mode, skip betting and go straight to playing
      setBoard(createBoard());
      setPhase("playing");
    }
  }

  function selectMode(mode: GameMode) {
    setGameMode(mode);
    setBoard(createBoard());
    setWinResult(null);
    setIsDraw(false);
    setLastCell(null);
    setPreviewCol(null);
    setCurrentTurn("p");
    if (mode === "1p") {
      setPhase("betting");
    } else {
      setPhase("playing");
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <span className="text-4xl animate-bounce">🌰</span>
      </div>
    );
  }

  const isResult   = phase === "result";
  const noBellotas = bellotas < 1;
  const gamesPlayed1P = wins + losses + draws;
  const gamesPlayed2P = p1Wins + p2Wins + p2Draws;

  function isWinCell(r: number, c: number) {
    return winResult?.cells.some(([wr, wc]) => wr === r && wc === c) ?? false;
  }
  function isLastCell(r: number, c: number) {
    return lastCell?.[0] === r && lastCell?.[1] === c;
  }

  // In 2P mode the "a" slot is used for Player 2 (teal/blue pieces)
  // Cell color helpers
  function getCellBg(cell: Cell, r: number, c: number): string {
    const winC = isWinCell(r, c);
    const lastC = isLastCell(r, c);
    if (gameMode === "2p") {
      if (winC) {
        return cell === "p"
          ? "bg-orange-300 ring-4 ring-yellow-200 scale-110 shadow-lg"
          : "bg-blue-300 ring-4 ring-cyan-200 scale-110 shadow-lg";
      }
      if (cell === "p") return `bg-orange-400 shadow-inner ${lastC ? "drop-shadow-lg" : ""}`;
      if (cell === "a") return `bg-blue-400 shadow-inner ${lastC ? "drop-shadow-lg" : ""}`;
    } else {
      if (winC) {
        return cell === "p"
          ? "bg-amber-300 ring-4 ring-yellow-200 scale-110 shadow-lg"
          : "bg-teal-300 ring-4 ring-cyan-200 scale-110 shadow-lg";
      }
      if (cell === "p") return `bg-amber-400 shadow-inner ${lastC ? "drop-shadow-lg" : ""}`;
      if (cell === "a") return `bg-teal-400 shadow-inner ${lastC ? "drop-shadow-lg" : ""}`;
    }
    return "";
  }

  const isDisabled2P = isResult;
  const isDisabled1P = isResult || aiThinking;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-6 pb-3">
        <div>
          <p className="text-amber-300 text-[10px] font-bold uppercase tracking-widest">Juego del bosque</p>
          <h1 className="text-white text-2xl font-black leading-tight">Conecta 4 🌰</h1>
        </div>
        <div className="flex items-center gap-3">
          {gameMode === "1p" && (
            <div className="bg-amber-800/60 rounded-2xl px-4 py-2 flex items-center gap-1.5">
              <span className="text-xl">🌰</span>
              <span className="text-white font-black text-lg">{bellotas}</span>
            </div>
          )}
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-amber-800/60 text-white font-bold text-lg flex items-center justify-center active:scale-95 transition">✕</button>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 gap-4 overflow-y-auto">

        {/* ─ Fase selección de modo ─ */}
        {phase === "mode-select" && (
          <div className="w-full max-w-xs flex flex-col gap-5 items-center">
            <div className="text-center">
              <p className="text-amber-200 text-base font-bold mb-1">¿Cómo quieres jugar?</p>
              <p className="text-amber-400 text-xs">Elige el modo de juego</p>
            </div>

            <button
              onClick={() => selectMode("1p")}
              className="w-full py-5 rounded-2xl bg-amber-800/60 border-2 border-amber-600/60 flex flex-col items-center gap-2 active:scale-95 transition hover:border-amber-400/80 hover:bg-amber-700/60">
              <span className="text-4xl">🤖</span>
              <span className="text-white font-black text-lg">vs IA</span>
              <span className="text-amber-300 text-xs">Apuesta bellotas contra el Caracol</span>
            </button>

            <button
              onClick={() => selectMode("2p")}
              className="w-full py-5 rounded-2xl bg-amber-800/60 border-2 border-amber-600/60 flex flex-col items-center gap-2 active:scale-95 transition hover:border-amber-400/80 hover:bg-amber-700/60">
              <span className="text-4xl">👥</span>
              <span className="text-white font-black text-lg">2 Jugadores</span>
              <span className="text-amber-300 text-xs">Juega con un amigo, sin bellotas en juego</span>
            </button>
          </div>
        )}

        {/* ─ Fase apuesta (1P) ─ */}
        {phase === "betting" && gameMode === "1p" && (
          <div className="w-full max-w-xs flex flex-col gap-5 items-center">
            {/* Leyenda de colores */}
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-amber-400 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/40">🌰</div>
                <span className="text-amber-200 text-xs font-bold">Tú</span>
              </div>
              <span className="text-white font-black text-2xl">VS</span>
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-teal-400 flex items-center justify-center text-3xl shadow-lg shadow-teal-500/40">🌰</div>
                <span className="text-teal-200 text-xs font-bold">Caracol IA</span>
              </div>
            </div>

            <p className="text-amber-300 text-sm text-center">
              Conecta 4 bellotas del mismo color en fila,<br/>columna o diagonal para ganar.
            </p>

            <div className="bg-amber-800/60 rounded-2xl p-4 w-full">
              <p className="text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 text-center">
                ¿Cuántas bellotas apuestas?
              </p>
              <div className="grid grid-cols-4 gap-2">
                {BET_OPTIONS.map(b => (
                  <button key={b} onClick={() => setBet(b)} disabled={b > bellotas}
                    className={`py-3 rounded-xl font-black text-base transition-all active:scale-95 ${
                      bet === b
                        ? "bg-amber-400 text-amber-900 scale-105 shadow-lg"
                        : b > bellotas
                        ? "bg-amber-900/40 text-amber-700 cursor-not-allowed"
                        : "bg-amber-700 text-amber-100 hover:bg-amber-600"
                    }`}>
                    {b}
                  </button>
                ))}
              </div>
              <p className="text-amber-400 text-xs text-center mt-2">
                Apuesta: <strong>{bet} 🌰</strong>
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setPhase("mode-select")}
                className="flex-1 py-4 rounded-2xl bg-amber-900/60 text-amber-300 font-bold text-sm active:scale-95 transition">
                ← Volver
              </button>
              {noBellotas ? (
                <div className="flex-1 bg-red-900/60 rounded-2xl px-5 py-4 text-center">
                  <p className="text-red-300 font-bold text-sm">¡Sin bellotas!</p>
                </div>
              ) : (
                <button onClick={startGame}
                  className="flex-1 py-4 rounded-2xl bg-amber-400 text-amber-900 font-black text-base shadow-xl active:scale-95 transition">
                  ¡Empezar! 🎮
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─ Fase juego / resultado ─ */}
        {(phase === "playing" || phase === "result") && (
          <>
            {/* Estado / resultado */}
            {!isResult ? (
              gameMode === "1p" ? (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${
                  aiThinking ? "bg-teal-700/60" : "bg-amber-600/60"
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                    aiThinking ? "bg-teal-400" : "bg-amber-400"
                  }`}>🌰</div>
                  <span className="text-white font-bold text-sm">
                    {aiThinking ? "🐌 Caracol pensando…" : "🐿️ Tu turno · toca una columna"}
                  </span>
                </div>
              ) : (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${
                  currentTurn === "p" ? "bg-orange-600/60" : "bg-blue-700/60"
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                    currentTurn === "p" ? "bg-orange-400" : "bg-blue-400"
                  }`}>🌰</div>
                  <span className="text-white font-bold text-sm">
                    {currentTurn === "p" ? "Turno del Jugador 1 🟠" : "Turno del Jugador 2 🔵"}
                  </span>
                </div>
              )
            ) : (
              gameMode === "1p" ? (
                <div className={`rounded-2xl px-6 py-3 text-center shadow-xl ${
                  winResult?.player === "p" ? "bg-emerald-500"
                  : winResult?.player === "a" ? "bg-red-500"
                  : "bg-amber-500"
                }`}>
                  <p className="text-white font-black text-lg">
                    {winResult?.player === "p"
                      ? `¡Conectaste 4! +${bet} 🌰 🎉`
                      : winResult?.player === "a"
                      ? `El caracol conectó 4 🐌  −${bet} 🌰`
                      : "¡Tablero lleno! Empate 🤝"}
                  </p>
                </div>
              ) : (
                <div className={`rounded-2xl px-6 py-3 text-center shadow-xl ${
                  winResult?.player === "p" ? "bg-orange-500"
                  : winResult?.player === "a" ? "bg-blue-500"
                  : "bg-amber-500"
                }`}>
                  <p className="text-white font-black text-lg">
                    {winResult?.player === "p"
                      ? "¡Jugador 1 conectó 4! 🟠🎉"
                      : winResult?.player === "a"
                      ? "¡Jugador 2 conectó 4! 🔵🎉"
                      : "¡Tablero lleno! Empate 🤝"}
                  </p>
                </div>
              )
            )}

            {/* Flechas de columna */}
            {!isResult && (
              <div className="flex gap-1 w-full max-w-[330px]">
                {Array.from({ length: COLS }, (_, c) => {
                  const full = board[0][c] !== null;
                  const isAiTurn = gameMode === "1p" && aiThinking;
                  return (
                    <button key={c}
                      onClick={() => handleColumnClick(c)}
                      onMouseEnter={() => setPreviewCol(c)}
                      onMouseLeave={() => setPreviewCol(null)}
                      disabled={full || isAiTurn}
                      className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition-all text-lg
                        ${full || isAiTurn
                          ? "opacity-20 cursor-not-allowed"
                          : previewCol === c
                          ? `${gameMode === "2p" && currentTurn === "a" ? "bg-blue-400/60" : "bg-amber-400/60"} scale-110 text-white`
                          : `${gameMode === "2p" && currentTurn === "a" ? "text-blue-400/70 hover:text-blue-300" : "text-amber-400/70 hover:text-amber-300"} active:scale-95`
                        }`}>
                      ↓
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tablero 7×6 */}
            <div className="bg-amber-800/50 p-2 rounded-3xl shadow-2xl border border-amber-700/40 w-full max-w-[340px]">
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
                {Array.from({ length: ROWS }, (_, r) =>
                  Array.from({ length: COLS }, (_, c) => {
                    const cell = board[r][c];
                    const lastC = isLastCell(r, c);
                    const disabled = gameMode === "1p" ? isDisabled1P : isDisabled2P;
                    // Preview: mostrar ghost en la primera fila vacía de la columna de previewCol
                    const isPreview = !isResult && !(gameMode === "1p" && aiThinking) && previewCol === c && cell === null
                      && findRow(board, c) === r;

                    const bgClass = cell
                      ? getCellBg(cell, r, c)
                      : isPreview
                      ? gameMode === "2p" && currentTurn === "a"
                        ? "bg-blue-400/35 border border-blue-400/50"
                        : "bg-amber-400/35 border border-amber-400/50"
                      : "bg-amber-950/70";

                    return (
                      <button key={`${r}-${c}`}
                        onClick={() => handleColumnClick(c)}
                        disabled={disabled}
                        className={`aspect-square rounded-full flex items-center justify-center text-base font-black transition-all ${bgClass}`}
                        style={lastC ? { animation: "dropIn 0.3s cubic-bezier(.34,1.56,.64,1) both" } : undefined}
                      >
                        {cell ? "🌰" : isPreview ? "🌰" : ""}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Leyenda */}
            {gameMode === "1p" ? (
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-xs">🌰</div>
                  <span className="text-amber-200 text-xs font-semibold">Tú</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center text-xs">🌰</div>
                  <span className="text-teal-200 text-xs font-semibold">Caracol</span>
                </div>
              </div>
            ) : (
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center text-xs">🌰</div>
                  <span className="text-amber-200 text-xs font-semibold">Jugador 1</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center text-xs">🌰</div>
                  <span className="text-blue-200 text-xs font-semibold">Jugador 2</span>
                </div>
              </div>
            )}

            {/* Botones post-resultado */}
            {isResult && (
              <div className="w-full max-w-xs flex flex-col gap-3">
                {gameMode === "1p" ? (
                  bellotas > 0 ? (
                    <button onClick={resetGame}
                      className="w-full py-4 rounded-2xl bg-amber-400 text-amber-900 font-black text-lg shadow-xl active:scale-95">
                      Jugar de nuevo →
                    </button>
                  ) : (
                    <div className="bg-red-900/60 rounded-2xl px-5 py-3 text-center">
                      <p className="text-red-300 font-bold text-sm">¡Sin bellotas!</p>
                    </div>
                  )
                ) : (
                  <button onClick={resetGame}
                    className="w-full py-4 rounded-2xl bg-amber-400 text-amber-900 font-black text-lg shadow-xl active:scale-95">
                    Jugar de nuevo →
                  </button>
                )}
                <button
                  onClick={() => setPhase("mode-select")}
                  className="w-full py-3 rounded-2xl bg-amber-800/60 text-amber-300 font-bold text-sm active:scale-95">
                  Cambiar modo
                </button>
                <button onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-amber-900/60 text-amber-300 font-bold text-sm active:scale-95">
                  Salir del juego
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Estadísticas de sesión ── */}
      {gameMode === "1p" && gamesPlayed1P > 0 && (
        <div className="shrink-0 flex justify-center gap-5 px-5 py-4 border-t border-amber-800/40">
          <div className="text-center">
            <p className="text-amber-300 text-xs">Victorias</p>
            <p className="text-emerald-400 font-black text-lg">{wins}</p>
          </div>
          <div className="text-center">
            <p className="text-amber-300 text-xs">Derrotas</p>
            <p className="text-red-400 font-black text-lg">{losses}</p>
          </div>
          <div className="text-center">
            <p className="text-amber-300 text-xs">Empates</p>
            <p className="text-amber-400 font-black text-lg">{draws}</p>
          </div>
          <div className="text-center">
            <p className="text-amber-300 text-xs">Sesión</p>
            <p className={`font-black text-lg ${totalGained >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {totalGained >= 0 ? "+" : ""}{totalGained} 🌰
            </p>
          </div>
        </div>
      )}

      {gameMode === "2p" && gamesPlayed2P > 0 && (
        <div className="shrink-0 flex justify-center gap-5 px-5 py-4 border-t border-amber-800/40">
          <div className="text-center">
            <p className="text-orange-300 text-xs">J1 Victorias</p>
            <p className="text-orange-400 font-black text-lg">{p1Wins}</p>
          </div>
          <div className="text-center">
            <p className="text-blue-300 text-xs">J2 Victorias</p>
            <p className="text-blue-400 font-black text-lg">{p2Wins}</p>
          </div>
          <div className="text-center">
            <p className="text-amber-300 text-xs">Empates</p>
            <p className="text-amber-400 font-black text-lg">{p2Draws}</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropIn {
          from { transform: translateY(-80px) scale(0.8); opacity: 0.4; }
          to   { transform: translateY(0)     scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
