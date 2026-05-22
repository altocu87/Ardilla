"use client";
import { useState, useEffect, useCallback, useRef } from "react";

type ItemType = "acorn" | "nispero";
type FallingItem = { id: number; x: number; y: number; speed: number; type: ItemType };

const REWARD_TIERS = [
  { min: 20, label: "¡INCREÍBLE! 🏆",    bonus: "+40 ánimo",  color: "text-yellow-500" },
  { min: 15, label: "¡Excelente! 🥇",    bonus: "+30 ánimo",  color: "text-amber-500"  },
  { min: 10, label: "¡Bien hecho! ⭐",   bonus: "+20 ánimo",  color: "text-orange-500" },
  { min:  5, label: "¡Nada mal! 🌰",     bonus: "+10 ánimo",  color: "text-green-600"  },
  { min:  0, label: "¡Practica más! 💪", bonus: "+3 ánimo",   color: "text-slate-500"  },
];

function getRewardTier(score: number) {
  return REWARD_TIERS.find(t => score >= t.min) ?? REWARD_TIERS[REWARD_TIERS.length - 1];
}

/* ── Forest background SVG ──────────────────────── */
function ForestBg() {
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gameSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#87CEEB"/>
          <stop offset="60%"  stopColor="#B8E4F0"/>
          <stop offset="100%" stopColor="#D4EED4"/>
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#gameSky)"/>
      <g fill="white" opacity="0.88">
        <ellipse cx="80"  cy="55" rx="50" ry="22"/>
        <ellipse cx="110" cy="44" rx="36" ry="20"/>
        <ellipse cx="55"  cy="60" rx="30" ry="16"/>
      </g>
      <g fill="white" opacity="0.75">
        <ellipse cx="300" cy="42" rx="44" ry="18"/>
        <ellipse cx="328" cy="34" rx="30" ry="16"/>
      </g>
      <g fill="#4a8a3a" opacity="0.5">
        <ellipse cx="30"  cy="320" rx="35" ry="55"/>
        <ellipse cx="68"  cy="308" rx="28" ry="48"/>
        <ellipse cx="360" cy="325" rx="38" ry="58"/>
        <ellipse cx="328" cy="312" rx="26" ry="45"/>
        <ellipse cx="200" cy="295" rx="30" ry="50"/>
      </g>
      <ellipse cx="0"   cy="520" rx="200" ry="90" fill="#5aaa46"/>
      <ellipse cx="200" cy="528" rx="240" ry="80" fill="#4fa03d"/>
      <ellipse cx="400" cy="520" rx="200" ry="90" fill="#5aaa46"/>
      <rect x="0"   y="340" width="30" height="160" fill="#6b4c26"/>
      <ellipse cx="15"  cy="330" rx="42" ry="68" fill="#2d7a2d"/>
      <ellipse cx="15"  cy="310" rx="30" ry="52" fill="#3a9a3a"/>
      <rect x="370" y="340" width="30" height="160" fill="#6b4c26"/>
      <ellipse cx="385" cy="330" rx="42" ry="68" fill="#2d7a2d"/>
      <ellipse cx="385" cy="310" rx="30" ry="52" fill="#3a9a3a"/>
      <circle cx="120" cy="478" r="6" fill="#FFD700" opacity="0.8"/>
      <circle cx="180" cy="482" r="5" fill="#FF9EBC" opacity="0.8"/>
      <circle cx="250" cy="475" r="6" fill="#FFD700" opacity="0.8"/>
      <circle cx="310" cy="480" r="5" fill="#FF9EBC" opacity="0.8"/>
    </svg>
  );
}

export default function TamaMiniGame({
  onFinish,
  onClose,
}: {
  onFinish: (score: number) => void;
  onClose: () => void;
}) {
  const [items,    setItems]    = useState<FallingItem[]>([]);
  const [score,    setScore]    = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [phase,    setPhase]    = useState<"ready"|"playing"|"done">("ready");
  const [flash,    setFlash]    = useState<{ text: string; color: string; key: number } | null>(null);
  const scoreRef  = useRef(0);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    scoreRef.current = 0;
    setScore(0); setTimeLeft(15); setItems([]); setPhase("playing"); setFlash(null);
  }, []);

  /* Timer */
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setPhase("done"); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  /* Notify parent when done */
  useEffect(() => {
    if (phase === "done") {
      const s = scoreRef.current;
      setTimeout(() => onFinish(s), 1600);
    }
  }, [phase, onFinish]);

  /* Spawn acorns — frequent */
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => {
      setItems(prev => [
        ...prev,
        {
          id:    Date.now() + Math.random(),
          x:     8 + Math.random() * 84,
          y:    -8,
          speed: 0.7 + Math.random() * 0.6,
          type:  "acorn" as const,
        },
      ]);
    }, 620);
    return () => clearInterval(t);
  }, [phase]);

  /* Spawn nísperos — less frequent, trap */
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => {
      setItems(prev => [
        ...prev,
        {
          id:    Date.now() + Math.random() + 9999,
          x:     8 + Math.random() * 84,
          y:    -8,
          speed: 0.6 + Math.random() * 0.5,
          type:  "nispero" as const,
        },
      ]);
    }, 2800);
    return () => clearInterval(t);
  }, [phase]);

  /* Move items */
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => {
      setItems(prev => prev
        .map(a => ({ ...a, y: a.y + a.speed * 3 }))
        .filter(a => a.y < 112)
      );
    }, 40);
    return () => clearInterval(t);
  }, [phase]);

  function hitItem(id: number, type: ItemType) {
    setItems(prev => prev.filter(a => a.id !== id));
    if (type === "acorn") {
      scoreRef.current++;
      setScore(scoreRef.current);
      showFlash("+1", "#16a34a");
    } else {
      const next = Math.max(0, scoreRef.current - 1);
      scoreRef.current = next;
      setScore(next);
      showFlash("−1 🍑", "#dc2626");
    }
  }

  function showFlash(text: string, color: string) {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ text, color, key: Date.now() });
    flashTimer.current = setTimeout(() => setFlash(null), 750);
  }

  const tier = getRewardTier(scoreRef.current);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm"/>
      <div
        className="relative bg-white rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ height: "86vh" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3"/>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800">¡Atrapa las bellotas!</h2>
            <p className="text-[10px] text-slate-400">🌰 atrapar +1 &nbsp;·&nbsp; 🍑 níspero −1</p>
          </div>
          <div className="flex items-end gap-3">
            {flash && (
              <span key={flash.key} className="text-sm font-black"
                style={{ color: flash.color, animation: "flashUp 0.75s ease-out forwards" }}>
                {flash.text}
              </span>
            )}
            <div className="text-right">
              <p className="text-3xl font-black text-amber-500">{score}</p>
              <p className={`text-xs font-bold ${timeLeft <= 5 && phase === "playing" ? "text-red-500 animate-pulse" : "text-slate-400"}`}>
                {phase === "playing" ? `${timeLeft}s` : phase === "done" ? "¡Fin!" : "Listo"}
              </p>
            </div>
          </div>
        </div>

        {/* Game area */}
        <div
          className="mx-4 rounded-2xl relative overflow-hidden border-2 border-white/50 shadow-inner"
          style={{ height: "calc(100% - 148px)" }}
        >
          <ForestBg/>

          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-green-700/35 to-transparent"/>

          {/* Falling items */}
          {items.map(item => (
            <button
              key={item.id}
              onClick={(e) => { e.stopPropagation(); hitItem(item.id, item.type); }}
              className={`absolute leading-none select-none active:scale-125 transition-transform duration-75
                ${item.type === "acorn" ? "text-5xl" : "text-4xl"}`}
              style={{ left: `${item.x}%`, top: `${item.y}%`, transform: "translateX(-50%)" }}
            >
              {item.type === "acorn" ? "🌰" : "🍑"}
            </button>
          ))}

          {/* Ready screen */}
          {phase === "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/88 backdrop-blur-sm rounded-2xl">
              <div className="flex gap-4">
                <span className="text-6xl" style={{ animation: "bounce 0.9s ease-in-out infinite" }}>🌰</span>
                <span className="text-5xl" style={{ animation: "bounce 0.9s ease-in-out 0.35s infinite" }}>🍑</span>
              </div>
              <div className="text-center px-6">
                <p className="text-slate-800 text-sm font-bold mb-1">¡Atrapa bellotas, esquiva nísperos!</p>
                <p className="text-slate-500 text-xs">🌰 +1 punto &nbsp;&nbsp; 🍑 −1 punto</p>
                <p className="text-slate-400 text-xs mt-1">15 segundos · ¡a por ello!</p>
              </div>
              <button onClick={start}
                className="bg-amber-500 text-white font-extrabold text-lg px-10 py-3.5 rounded-2xl shadow-lg active:scale-95 transition-transform">
                ¡Empezar! 🎮
              </button>
            </div>
          )}

          {/* Done screen */}
          {phase === "done" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/92 backdrop-blur-sm rounded-2xl px-6">
              <span className="text-6xl">
                {scoreRef.current >= 20 ? "🏆" : scoreRef.current >= 10 ? "⭐" : "🌰"}
              </span>
              <p className="text-5xl font-black text-amber-500">{scoreRef.current}</p>
              <p className={`text-lg font-bold ${tier.color}`}>{tier.label}</p>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-2.5 text-center">
                <p className="text-xs text-amber-600 font-semibold">🎁 Bonus de ánimo</p>
                <p className="text-xl font-black text-amber-500">{tier.bonus}</p>
              </div>
            </div>
          )}
        </div>

        {/* Close button */}
        <div className="px-4 pt-2 pb-5">
          <button onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-700 text-white font-bold text-sm active:scale-95">
            {phase === "done" ? "¡Listo! ✓" : "Cerrar"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes flashUp {
          0%   { opacity: 1; transform: translateY(0)   scale(1.3); }
          100% { opacity: 0; transform: translateY(-18px) scale(0.9); }
        }
      `}</style>
    </div>
  );
}
