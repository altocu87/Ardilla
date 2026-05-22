"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { addMemoryScore } from "@/lib/game-rankings";

type CardState = "hidden" | "revealed" | "matched";
type Card = { id: number; animal: string; pairIndex: number; state: CardState };

const ANIMALS = ["🐿️", "🐌", "🐱", "🐀", "🪳", "🦊", "🐸", "🦔"];

const SCORE_TIERS = [
  { max: 12, label: "¡PERFECTO! 🏆",        bonus: "+30 ánimo", bonusAmt: 30, color: "text-yellow-500" },
  { max: 16, label: "¡Excelente! 🥇",        bonus: "+22 ánimo", bonusAmt: 22, color: "text-amber-500"  },
  { max: 20, label: "¡Bien hecho! ⭐",       bonus: "+14 ánimo", bonusAmt: 14, color: "text-orange-500" },
  { max: 28, label: "¡Nada mal! 🌰",         bonus: "+8 ánimo",  bonusAmt: 8,  color: "text-green-600"  },
  { max: 999,"label": "¡Practica más! 💪",   bonus: "+4 ánimo",  bonusAmt: 4,  color: "text-slate-500"  },
];

function getScoreTier(moves: number) {
  return SCORE_TIERS.find(t => moves <= t.max) ?? SCORE_TIERS[SCORE_TIERS.length - 1];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createCards(): Card[] {
  return shuffle([...ANIMALS, ...ANIMALS]).map((animal, idx) => ({
    id: idx,
    animal,
    pairIndex: ANIMALS.indexOf(animal),
    state: "hidden" as CardState,
  }));
}

export default function MemoryCardGame({
  onFinish,
  onClose,
}: {
  onFinish: (moves: number, timeSeconds: number) => void;
  onClose: () => void;
}) {
  const [cards,     setCards]     = useState<Card[]>(() => createCards());
  const [revealed,  setRevealed]  = useState<number[]>([]);
  const [moves,     setMoves]     = useState(0);
  const [phase,     setPhase]     = useState<"playing" | "done">("playing");
  const [elapsed,   setElapsed]   = useState(0);
  const [lockBoard, setLockBoard] = useState(false);

  const movesRef    = useRef(0);
  const startTime   = useRef(Date.now());
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameOverRef = useRef(false);
  const finalMovesRef = useRef(0);
  const finalTimeRef  = useRef(0);

  /* Timer */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  /* Win detection */
  useEffect(() => {
    if (gameOverRef.current) return;
    if (cards.length === 0) return;
    if (!cards.every(c => c.state === "matched")) return;

    gameOverRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    const totalTime = Math.floor((Date.now() - startTime.current) / 1000);
    finalMovesRef.current = movesRef.current;
    finalTimeRef.current  = totalTime;
    setPhase("done");
    addMemoryScore(movesRef.current, totalTime);
    setTimeout(() => onFinish(movesRef.current, totalTime), 2000);
  }, [cards, onFinish]);

  function handleCardClick(cardId: number) {
    if (lockBoard || phase !== "playing") return;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.state !== "hidden" || revealed.includes(cardId)) return;

    const newRevealed = [...revealed, cardId];
    setRevealed(newRevealed);

    if (newRevealed.length === 2) {
      movesRef.current++;
      setMoves(movesRef.current);
      setLockBoard(true);

      const [id1, id2] = newRevealed;
      const c1 = cards.find(c => c.id === id1)!;
      const c2 = cards.find(c => c.id === id2)!;

      if (c1.pairIndex === c2.pairIndex) {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === id1 || c.id === id2 ? { ...c, state: "matched" } : c
          ));
          setRevealed([]);
          setLockBoard(false);
        }, 350);
      } else {
        setTimeout(() => {
          setRevealed([]);
          setLockBoard(false);
        }, 850);
      }
    }
  }

  const handleDoneClose = useCallback(() => {
    onFinish(finalMovesRef.current, finalTimeRef.current);
  }, [onFinish]);

  const matched = cards.filter(c => c.state === "matched").length / 2;
  const tier    = getScoreTier(moves);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm"/>
      <div
        className="relative bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ height: "92vh" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 shrink-0"/>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2 shrink-0">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800">Memoria animal</h2>
            <p className="text-[10px] text-slate-400">Encuentra las 8 parejas 🐾</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400 font-semibold">{matched}/8 🎯</p>
              <p className="text-[10px] text-slate-300">{elapsed}s</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-violet-500">{moves}</p>
              <p className="text-[10px] text-slate-400">movs</p>
            </div>
          </div>
        </div>

        {/* Card grid */}
        <div className="flex-1 px-4 pb-2 flex flex-col justify-center">
          <div className="grid grid-cols-4 gap-2">
            {cards.map(card => {
              const isRevealed = revealed.includes(card.id);
              const isMatched  = card.state === "matched";
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-4xl transition-all duration-200 border-2 active:scale-95 ${
                    isMatched
                      ? "bg-green-100 border-green-300 opacity-50 cursor-default"
                      : isRevealed
                      ? "bg-amber-50 border-amber-300 shadow-md scale-105"
                      : "bg-gradient-to-br from-violet-500 to-indigo-600 border-violet-400 shadow-sm"
                  }`}
                >
                  {(isRevealed || isMatched) ? card.animal : "❓"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Done overlay */}
        {phase === "done" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/95 backdrop-blur-sm px-6 rounded-t-3xl">
            <span className="text-6xl">
              {moves <= 12 ? "🏆" : moves <= 20 ? "⭐" : "🌰"}
            </span>
            <p className={`text-xl font-bold ${tier.color}`}>{tier.label}</p>
            <div className="flex gap-3">
              <div className="text-center bg-violet-50 border border-violet-200 rounded-2xl px-4 py-2.5">
                <p className="text-xs text-violet-500 font-semibold">Movimientos</p>
                <p className="text-3xl font-black text-violet-600">{moves}</p>
              </div>
              <div className="text-center bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5">
                <p className="text-xs text-amber-500 font-semibold">Tiempo</p>
                <p className="text-3xl font-black text-amber-500">{elapsed}s</p>
              </div>
            </div>
            <div className="bg-pink-50 border border-pink-200 rounded-2xl px-5 py-2.5 text-center">
              <p className="text-xs text-pink-600 font-semibold">🎁 Bonus de ánimo</p>
              <p className="text-xl font-black text-pink-500">{tier.bonus}</p>
            </div>
          </div>
        )}

        {/* Close button */}
        <div className="px-4 pt-2 pb-5 shrink-0">
          <button
            onClick={phase === "done" ? handleDoneClose : onClose}
            className="w-full py-3 rounded-2xl bg-slate-700 text-white font-bold text-sm active:scale-95"
          >
            {phase === "done" ? "¡Listo! ✓" : "Cerrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
