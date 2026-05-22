"use client";
/**
 * SopaDeLetras.tsx — Generador de sopas de letras infinitas en español
 * • ~180 palabras repartidas en 6 categorías temáticas
 * • 8 direcciones de colocación y detección (H, V, 4 diagonales + sus inversas)
 * • Selección por arrastrar el dedo (pointer events)
 * • Categoría cambiable + botón "Nueva sopa" para partidas infinitas
 */
import { useState, useMemo, useRef, useCallback, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════════
// BANCO DE PALABRAS (sin tildes ni Ñ; máx. 9 letras para caber en 10×10)
// ══════════════════════════════════════════════════════════════════════════════
export const WORD_BANK: Record<string, string[]> = {
  "🌿 Naturaleza": [
    "BOSQUE","ARBOL","FLOR","LLUVIA","TIERRA","CIELO","NUBE","LUNA",
    "ESTRELLA","MONTANA","LAGO","JARDIN","SEMILLA","HOJA","RAMA","PRADO",
    "BRISA","AURORA","ROCIO","MANANTIAL","COLINA","PLAYA","TORMENTA","SELVA",
    "CASCADA","PALMERA","VOLCAN","GLACIAR","DESIERTO","PRADERA",
  ],
  "💜 Bienestar": [
    "CALMA","PAUSA","RESPIRA","SILENCIO","DESCANSO","CUIDADO","ATENCION",
    "SALUD","ANIMO","FORTALEZA","SERENIDAD","CLARIDAD","PLENITUD","ARMONIA",
    "ENERGIA","GRATITUD","PRESENTE","POSITIVO","CONFIANZA","VITALIDAD",
    "FLORECER","SOLTAR","BRILLAR","CRECER","AVANZAR","CONFIAR","SANAR",
    "ELEGIR","LOGRAR","VIVIR",
  ],
  "😊 Emociones": [
    "ALEGRIA","AMOR","FELICIDAD","ESPERANZA","ORGULLO","TERNURA","EUFORIA",
    "DICHA","GOZO","AFECTO","CARINO","CALIDEZ","PLACER","ILUSION","BONDAD",
    "PERDON","EMPATIA","COMPASION","GRATITUD","VALENTIA","LIBERTAD",
    "REGOCIJO","ENTUSIASMO","PAZ","EMOCION","PASION",
    "EUFORIA","TERNURA","AFECTO",
  ],
  "🐿️ Animales": [
    "ARDILLA","CONEJO","ZORRO","CIERVO","AGUILA","MARIPOSA","ABEJA",
    "TORTUGA","DELFIN","LOBO","PAJARO","CISNE","LECHUZA","COLIBRI",
    "ERIZO","CASTOR","GORRION","LIBELULA","SALMON","PANDA","KOALA",
    "LORO","FLAMENCO","HALCON","NUTRIA","MAPACHE","ZORZAL","LAGARTO",
    "GARZA","ABEJORRO",
  ],
  "🎨 Colores": [
    "ROJO","AZUL","VERDE","AMARILLO","NARANJA","VIOLETA","ROSA","BLANCO",
    "NEGRO","DORADO","PLATEADO","CELESTE","TURQUESA","LAVANDA","CORAL",
    "SALMON","MAGENTA","INDIGO","ESMERALDA","OCRE","CARMESI","COBRE",
    "PERLA","GRANATE","ZAFIRO","MARFIL","AZABACHE","BURDEOS","LILA",
    "CICLAMEN",
  ],
  "💪 Valores": [
    "VALENTIA","PACIENCIA","RESPETO","LIBERTAD","VERDAD","NOBLEZA",
    "SABIDURIA","PERDON","EMPATIA","VIRTUD","JUSTICIA","HONOR","LEALTAD",
    "CORAJE","HUMILDAD","BONDAD","PRUDENCIA","COMPASION","MODESTIA",
    "TOLERANCIA","DILIGENCIA","INTEGRIDAD","TEMPLANZA",
    "CONSTANCIA","ESFUERZO","PERSEVERA","SERVICIO","DIGNIDAD",
    "SINCERIDAD","GENEROSA",
  ],
};

// Limpiar: sin duplicados, largo 4-9, todo mayúsculas puras
function cleanBank(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [cat, words] of Object.entries(WORD_BANK)) {
    const seen = new Set<string>();
    out[cat] = words
      .map(w => w.toUpperCase().slice(0, 9).replace(/[^A-Z]/g, ""))
      .filter(w => w.length >= 4 && w.length <= 9 && !seen.has(w) && seen.add(w));
  }
  return out;
}
export const CLEAN_BANK = cleanBank();

// ══════════════════════════════════════════════════════════════════════════════
// ALGORITMO GENERADOR
// ══════════════════════════════════════════════════════════════════════════════
const SIZE = 10;
const GRID_LETTERS = "ABCDEFGHIJKLMNOPRSTUVWXYZ";

// 8 direcciones: →←↓↑↘↙↗↖
const DIRS: [number, number][] = [
  [0, 1],[0,-1],[1, 0],[-1, 0],
  [1, 1],[1,-1],[-1, 1],[-1,-1],
];

type Cell    = { row: number; col: number };
type WordPos = { word: string; row: number; col: number; dr: number; dc: number };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function canPlace(
  grid: string[][], word: string,
  row: number, col: number, dr: number, dc: number
): boolean {
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return false;
    if (grid[r][c] !== "" && grid[r][c] !== word[i]) return false;
  }
  return true;
}

function placeWord(
  grid: string[][], word: string,
  row: number, col: number, dr: number, dc: number
) {
  for (let i = 0; i < word.length; i++)
    grid[row + dr * i][col + dc * i] = word[i];
}

export function generatePuzzle(
  categoryKey: string,
  wordCount = 5
): { grid: string[][]; positions: WordPos[]; words: string[] } {
  const pool = shuffle(CLEAN_BANK[categoryKey] ?? Object.values(CLEAN_BANK).flat());
  const grid: string[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(""));
  const positions: WordPos[] = [];

  for (const word of pool) {
    if (positions.length >= wordCount) break;
    let placed = false;

    // Intentamos hasta 300 veces con dirección y posición al azar
    const dirs = shuffle([...DIRS]);
    outer: for (let attempt = 0; attempt < 300 && !placed; attempt++) {
      const [dr, dc] = dirs[attempt % dirs.length];
      // Calcular rango válido de inicio
      const rMin = dr < 0 ? (word.length - 1) : 0;
      const rMax = dr > 0 ? SIZE - word.length : SIZE - 1;
      const cMin = dc < 0 ? (word.length - 1) : 0;
      const cMax = dc > 0 ? SIZE - word.length : SIZE - 1;
      if (rMin > rMax || cMin > cMax) continue;
      const row = rMin + Math.floor(Math.random() * (rMax - rMin + 1));
      const col = cMin + Math.floor(Math.random() * (cMax - cMin + 1));
      if (canPlace(grid, word, row, col, dr, dc)) {
        placeWord(grid, word, row, col, dr, dc);
        positions.push({ word, row, col, dr, dc });
        placed = true;
        break outer;
      }
    }
  }

  // Rellenar huecos con letras al azar
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === "")
        grid[r][c] = GRID_LETTERS[Math.floor(Math.random() * GRID_LETTERS.length)];

  return { grid, positions, words: positions.map(p => p.word) };
}

// ══════════════════════════════════════════════════════════════════════════════
// UTILIDADES DE SELECCIÓN
// ══════════════════════════════════════════════════════════════════════════════
function cellKey(r: number, c: number) { return `${r},${c}`; }

function getLineCells(start: Cell, end: Cell): Cell[] | null {
  const dr = end.row - start.row;
  const dc = end.col - start.col;
  const adr = Math.abs(dr);
  const adc = Math.abs(dc);
  // Válido: H, V o diagonal 45°
  if (adr !== 0 && adc !== 0 && adr !== adc) return null;
  const steps = Math.max(adr, adc);
  const ndr = Math.sign(dr);
  const ndc = Math.sign(dc);
  return Array.from({ length: steps + 1 }, (_, i) => ({
    row: start.row + ndr * i,
    col: start.col + ndc * i,
  }));
}

// ══════════════════════════════════════════════════════════════════════════════
// COLORES POR PALABRA (paleta contrastante)
// ══════════════════════════════════════════════════════════════════════════════
const COLORS = ["#7c3aed","#0891b2","#059669","#d97706","#be185d","#1d4ed8"];

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
type Props = { onFinish: (found: number) => void; onClose: () => void };

export default function SopaDeLetras({ onFinish, onClose }: Props) {
  const cats = Object.keys(CLEAN_BANK);

  const [catKey,     setCatKey]     = useState(cats[0]);
  const [puzzle,     setPuzzle]     = useState(() => generatePuzzle(cats[0]));
  const [found,      setFound]      = useState<Set<string>>(new Set());
  const [foundCells, setFoundCells] = useState<Map<string, string>>(new Map()); // key→color
  const [startCell,  setStartCell]  = useState<Cell | null>(null);
  const [endCell,    setEndCell]    = useState<Cell | null>(null);
  const [flash,      setFlash]      = useState<"ok" | "err" | null>(null);
  const [done,       setDone]       = useState(false);
  const [secs,       setSecs]       = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { grid, positions, words } = puzzle;

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => setSecs(s => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [puzzle]); // reinicia con cada puzzle nuevo

  useEffect(() => {
    if (done && timerRef.current) clearInterval(timerRef.current);
  }, [done]);

  function formatTime(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  // ── Generar nueva sopa ────────────────────────────────────────────────────
  function newGame(key?: string) {
    const k = key ?? catKey;
    setCatKey(k);
    setPuzzle(generatePuzzle(k));
    setFound(new Set());
    setFoundCells(new Map());
    setStartCell(null);
    setEndCell(null);
    setFlash(null);
    setDone(false);
    setSecs(0);
  }

  // ── Selección por arrastre ────────────────────────────────────────────────
  const cellFromPoint = useCallback((x: number, y: number): Cell | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const d  = el?.closest("[data-cell]")?.getAttribute("data-cell");
    if (!d) return null;
    const [r, c] = d.split(",").map(Number);
    return { row: r, col: c };
  }, []);

  const selectedCells = useMemo<Set<string>>(() => {
    if (!startCell || !endCell) return new Set();
    const line = getLineCells(startCell, endCell);
    if (!line) return new Set([cellKey(startCell.row, startCell.col)]);
    return new Set(line.map(c => cellKey(c.row, c.col)));
  }, [startCell, endCell]);

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
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
    const line = getLineCells(startCell, endCell);
    if (!line || line.length < 2) { setStartCell(null); setEndCell(null); return; }

    const text    = line.map(c => grid[c.row][c.col]).join("");
    const textRev = text.split("").reverse().join("");

    const match = positions.find(p => !found.has(p.word) && (p.word === text || p.word === textRev));

    if (match) {
      const color = COLORS[found.size % COLORS.length];
      const newFC = new Map(foundCells);
      line.forEach(c => newFC.set(cellKey(c.row, c.col), color));
      setFoundCells(newFC);
      const nf = new Set(found);
      nf.add(match.word);
      setFound(nf);
      setFlash("ok");
      setTimeout(() => setFlash(null), 500);
      if (nf.size === words.length) setTimeout(() => setDone(true), 600);
    } else {
      setFlash("err");
      setTimeout(() => setFlash(null), 400);
    }
    setStartCell(null);
    setEndCell(null);
  }

  // ── Bellotas al terminar ─────────────────────────────────────────────────
  const bellotasPremio = done
    ? (found.size >= words.length ? Math.max(40 - Math.floor(secs / 10), 15) : found.size * 8)
    : 0;

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "linear-gradient(160deg,#1e1b4b,#312e81,#1e3a8a)" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-5 pb-2">
        <button onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-lg active:scale-95">
          ✕
        </button>
        <div className="text-center">
          <p className="text-white font-extrabold text-base tracking-wide">🔤 Sopa de letras</p>
          <p className="text-white/60 text-xs">{found.size}/{words.length} palabras · ⏱ {formatTime(secs)}</p>
        </div>
        <button onClick={() => newGame()}
          className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-base active:scale-95"
          title="Nueva sopa">
          🔄
        </button>
      </div>

      {/* ── Selector de categoría ────────────────────────────────────────── */}
      <div className="shrink-0 flex gap-2 px-4 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {cats.map(k => (
          <button key={k} onClick={() => newGame(k)}
            className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-all
              ${catKey === k
                ? "bg-white text-indigo-800 border-white"
                : "bg-white/10 text-white/80 border-white/20 active:bg-white/20"
              }`}>
            {k.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* ── Palabras a encontrar ──────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap gap-2 px-4 pb-2 justify-center">
        {words.map((w, i) => {
          const isFound = found.has(w);
          const color   = COLORS[i % COLORS.length];
          return (
            <span key={w}
              className={`px-3 py-1 rounded-full text-xs font-extrabold border transition-all
                ${isFound ? "border-transparent opacity-70" : "bg-white/10 border-white/30 text-white"}`}
              style={isFound ? { background: color, color: "#fff", textDecoration: "line-through" } : {}}>
              {w}
            </span>
          );
        })}
      </div>

      {/* ── Cuadrícula ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-2 pb-3">
        <div
          className={`select-none rounded-2xl overflow-hidden shadow-2xl transition-all ring-offset-2
            ${flash === "ok"  ? "ring-4 ring-emerald-400"
            : flash === "err" ? "ring-4 ring-red-400"
            : "ring-0"
          }`}
          style={{ touchAction: "none", userSelect: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => { setStartCell(null); setEndCell(null); }}
        >
          {grid.map((row, r) => (
            <div key={r} className="flex">
              {row.map((letter, c) => {
                const key       = cellKey(r, c);
                const isSel     = selectedCells.has(key);
                const foundClr  = foundCells.get(key);
                return (
                  <div
                    key={c}
                    data-cell={key}
                    className={`
                      w-[9vw] h-[9vw] max-w-[36px] max-h-[36px]
                      flex items-center justify-center
                      text-[11px] font-extrabold leading-none
                      transition-all duration-75 select-none
                      ${isSel
                        ? "bg-yellow-300 text-yellow-900 scale-110 z-10 rounded-sm"
                        : foundClr
                          ? "rounded-sm"
                          : "text-white/85"
                      }
                    `}
                    style={
                      foundClr && !isSel
                        ? { background: foundClr, color: "#fff" }
                        : !isSel
                          ? { background: "rgba(255,255,255,0.07)" }
                          : {}
                    }
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Pista sobre direcciones ──────────────────────────────────────── */}
      <p className="shrink-0 text-center text-white/40 text-[10px] pb-2 px-4">
        Las palabras pueden ir en cualquier dirección, incluso diagonal
      </p>

      {/* ── Modal de victoria ────────────────────────────────────────────── */}
      {done && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
          <div className="bg-white rounded-3xl p-7 w-full max-w-sm text-center shadow-2xl">
            <p className="text-5xl mb-2">🎉</p>
            <p className="text-2xl font-extrabold text-slate-800">¡Completada!</p>
            <p className="text-slate-500 text-sm mt-1 mb-1">
              {found.size}/{words.length} palabras · {formatTime(secs)}
            </p>
            <p className="text-amber-600 font-extrabold text-lg mb-5">
              +{bellotasPremio} 🌰 bellotas
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => onFinish(found.size)}
                className="flex-1 py-3 rounded-2xl font-bold text-sm text-white shadow-md active:scale-95"
                style={{ background: "linear-gradient(135deg,#7c3aed,#1d4ed8)" }}>
                ¡Cobrar!
              </button>
              <button
                onClick={() => newGame()}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm active:scale-95">
                🔄 Nueva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
