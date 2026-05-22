"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ── Pool de palabras (sin tildes ni Ñ para la cuadrícula) ──────────────────
const WORD_POOL = [
  "CALMA", "ARDILLA", "BELLOTA", "ALEGRIA",
  "BIENESTAR", "AMOR", "MENTE", "FUERZA",
  "RACHA", "LOGRO", "HABITO", "DIARIO",
  "ANIMO", "CUERPO", "SALUD", "DESCANSO",
  "NATURAL", "RESPIRA", "PAUSA", "CUIDADO",
  "CONFIA", "AVANZA", "FLORECE", "LATIDO",
  "CALOR", "HOGAR", "BOSQUE", "CIELO",
];

const SIZE = 10;
const LETTERS = "ABCDEFGHIJKLMNOPRSTUVWXYZ"; // sin Q, sin Ñ

type Cell = { row: number; col: number };
type WordPos = { word: string; row: number; col: number; horizontal: boolean };

// ── Generador de sopa ──────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePuzzle(): { grid: string[][]; positions: WordPos[]; words: string[] } {
  const words = shuffle(WORD_POOL).slice(0, 4);
  const grid: string[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(""));
  const positions: WordPos[] = [];

  for (const word of words) {
    let placed = false;
    for (let attempt = 0; attempt < 200 && !placed; attempt++) {
      const horizontal = Math.random() < 0.5;
      const maxRow = horizontal ? SIZE - 1 : SIZE - word.length;
      const maxCol = horizontal ? SIZE - word.length : SIZE - 1;
      if (maxRow < 0 || maxCol < 0) continue;
      const row = Math.floor(Math.random() * (maxRow + 1));
      const col = Math.floor(Math.random() * (maxCol + 1));
      let valid = true;
      for (let i = 0; i < word.length; i++) {
        const r = horizontal ? row : row + i;
        const c = horizontal ? col + i : col;
        if (grid[r][c] !== "" && grid[r][c] !== word[i]) { valid = false; break; }
      }
      if (valid) {
        for (let i = 0; i < word.length; i++) {
          const r = horizontal ? row : row + i;
          const c = horizontal ? col + i : col;
          grid[r][c] = word[i];
        }
        positions.push({ word, row, col, horizontal });
        placed = true;
      }
    }
  }

  // Rellenar huecos con letras al azar
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === "")
        grid[r][c] = LETTERS[Math.floor(Math.random() * LETTERS.length)];

  return { grid, positions, words: positions.map(p => p.word) };
}

function cellKey(r: number, c: number) { return `${r},${c}`; }

function getCellsInLine(start: Cell, end: Cell): Cell[] {
  const dr = Math.sign(end.row - start.row);
  const dc = Math.sign(end.col - start.col);
  const rowDiff = Math.abs(end.row - start.row);
  const colDiff = Math.abs(end.col - start.col);
  // Solo horizontal o vertical
  if (rowDiff > 0 && colDiff > 0) return [start];
  const cells: Cell[] = [];
  let r = start.row, c = start.col;
  const maxSteps = Math.max(rowDiff, colDiff);
  for (let i = 0; i <= maxSteps; i++) {
    cells.push({ row: r, col: c });
    r += dr; c += dc;
  }
  return cells;
}

// ── Props ──────────────────────────────────────────────────────────────────
type Props = {
  onFinish: (found: number) => void;
  onClose: () => void;
};

export default function SopaDeLetras({ onFinish, onClose }: Props) {
  const [puzzle]    = useState(() => generatePuzzle());
  const [found,     setFound]     = useState<Set<string>>(new Set());
  const [foundCells,setFoundCells]= useState<Set<string>>(new Set());
  const [startCell, setStartCell] = useState<Cell | null>(null);
  const [endCell,   setEndCell]   = useState<Cell | null>(null);
  const [flash,     setFlash]     = useState<"ok" | "err" | null>(null);
  const [done,      setDone]      = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { grid, positions, words } = puzzle;

  // Celdas de la selección actual
  const selectedCells = useMemo<Set<string>>(() => {
    if (!startCell || !endCell) return new Set();
    return new Set(getCellsInLine(startCell, endCell).map(c => cellKey(c.row, c.col)));
  }, [startCell, endCell]);

  // Color de la palabra encontrada (por índice)
  const WORD_COLORS = ["#6d28d9", "#0891b2", "#059669", "#d97706"];

  const [wordCellColors, setWordCellColors] = useState<Record<string, string>>({});

  // Obtener celda desde coordenadas de pantalla
  const cellFromPoint = useCallback((x: number, y: number): Cell | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const data = el?.closest("[data-cell]")?.getAttribute("data-cell");
    if (!data) return null;
    const [r, c] = data.split(",").map(Number);
    return { row: r, col: c };
  }, []);

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    setStartCell(cell);
    setEndCell(cell);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!startCell) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell) setEndCell(cell);
  }

  function handlePointerUp(e: React.PointerEvent) {
    e.preventDefault();
    if (!startCell || !endCell) { setStartCell(null); setEndCell(null); return; }
    const cells = getCellsInLine(startCell, endCell);
    const word  = cells.map(c => grid[c.row][c.col]).join("");
    const wordRev = word.split("").reverse().join("");

    const match = positions.find(p => p.word === word || p.word === wordRev);
    if (match && !found.has(match.word)) {
      const colorIdx = found.size;
      const color = WORD_COLORS[colorIdx] ?? "#6d28d9";
      const newCells = new Set(foundCells);
      const newColors: Record<string, string> = { ...wordCellColors };
      cells.forEach(c => {
        const k = cellKey(c.row, c.col);
        newCells.add(k);
        newColors[k] = color;
      });
      setFoundCells(newCells);
      setWordCellColors(newColors);
      const newFound = new Set(found);
      newFound.add(match.word);
      setFound(newFound);
      setFlash("ok");
      setTimeout(() => setFlash(null), 600);
      if (newFound.size === words.length) {
        setTimeout(() => setDone(true), 700);
      }
    } else {
      setFlash("err");
      setTimeout(() => setFlash(null), 500);
    }
    setStartCell(null);
    setEndCell(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-violet-900 to-indigo-900">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-safe pt-4 pb-2">
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-lg active:scale-95">✕</button>
        <div className="text-center">
          <p className="text-white font-extrabold text-base">🔤 Sopa de letras</p>
          <p className="text-white/70 text-xs">{found.size}/{words.length} palabras</p>
        </div>
        <div className="w-9"/>
      </div>

      {/* Palabras a buscar */}
      <div className="shrink-0 flex gap-2 px-4 pb-3 flex-wrap justify-center">
        {words.map((w, i) => {
          const isFound = found.has(w);
          return (
            <span key={w}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all
                ${isFound
                  ? "border-transparent text-white line-through opacity-60"
                  : "bg-white/10 border-white/30 text-white"}`}
              style={isFound ? { background: WORD_COLORS[i] } : {}}>
              {w}
            </span>
          );
        })}
      </div>

      {/* Cuadrícula */}
      <div className="flex-1 flex items-center justify-center px-3 pb-4">
        <div
          ref={containerRef}
          className={`select-none rounded-2xl overflow-hidden shadow-2xl transition-all
            ${flash === "ok" ? "ring-4 ring-green-400" : flash === "err" ? "ring-4 ring-red-400" : ""}`}
          style={{ touchAction: "none", userSelect: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => { setStartCell(null); setEndCell(null); }}
        >
          {grid.map((row, r) => (
            <div key={r} className="flex">
              {row.map((letter, c) => {
                const key  = cellKey(r, c);
                const isSel   = selectedCells.has(key);
                const isFound2 = foundCells.has(key);
                const foundColor = wordCellColors[key];
                return (
                  <div
                    key={c}
                    data-cell={key}
                    className={`w-[9.2vw] h-[9.2vw] max-w-[38px] max-h-[38px] flex items-center justify-center
                      text-xs font-extrabold transition-all
                      ${isSel   ? "bg-yellow-300 text-yellow-900 scale-110 z-10" : ""}
                      ${isFound2 && !isSel ? "text-white" : ""}
                      ${!isSel && !isFound2 ? "bg-white/10 text-white/90" : ""}
                    `}
                    style={isFound2 && !isSel ? { background: foundColor } : {}}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Fin del juego */}
      {done && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm px-8">
          <div className="bg-white rounded-3xl p-8 w-full max-w-xs text-center shadow-2xl">
            <p className="text-5xl mb-3">🎉</p>
            <p className="text-2xl font-extrabold text-slate-800 mb-1">¡Completada!</p>
            <p className="text-slate-500 text-sm mb-6">Encontraste las {words.length} palabras</p>
            <div className="flex gap-3">
              <button
                onClick={() => { onFinish(words.length); }}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold text-sm shadow-md active:scale-95"
              >
                ¡Cobrar premio! 🌰
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-500 font-bold text-sm active:scale-95"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
