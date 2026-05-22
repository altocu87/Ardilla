"use client";
import { useState, useEffect, useCallback, useRef } from "react";

type Acorn = { id: number; x: number; y: number; speed: number };

export default function TamaMiniGame({
  onFinish,
  onClose,
}: {
  onFinish: (score: number) => void;
  onClose: () => void;
}) {
  const [acorns,   setAcorns]   = useState<Acorn[]>([]);
  const [score,    setScore]    = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [phase,    setPhase]    = useState<"ready"|"playing"|"done">("ready");
  const scoreRef   = useRef(0);
  const areaRef    = useRef<HTMLDivElement>(null);

  const start = useCallback(() => {
    scoreRef.current = 0;
    setScore(0); setTimeLeft(10); setAcorns([]); setPhase("playing");
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
      setTimeout(() => onFinish(s), 1400);
    }
  }, [phase, onFinish]);

  /* Spawn acorns */
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => {
      setAcorns(prev => [
        ...prev,
        { id: Date.now() + Math.random(), x: 8 + Math.random() * 82, y: -6, speed: 1.8 + Math.random() * 1.6 },
      ]);
    }, 550);
    return () => clearInterval(t);
  }, [phase]);

  /* Move acorns */
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => {
      setAcorns(prev => prev
        .map(a => ({ ...a, y: a.y + a.speed * 3.5 }))
        .filter(a => a.y < 108)
      );
    }, 40);
    return () => clearInterval(t);
  }, [phase]);

  function hitAcorn(id: number) {
    setAcorns(prev => prev.filter(a => a.id !== id));
    scoreRef.current++;
    setScore(scoreRef.current);
  }

  const msg =
    scoreRef.current >= 20 ? "¡INCREÍBLE! 🏆" :
    scoreRef.current >= 15 ? "¡Excelente! ⭐" :
    scoreRef.current >= 10 ? "¡Muy bien! 👍" :
    scoreRef.current >= 5  ? "¡Nada mal! 😊" : "¡Sigue practicando! 💪";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ height: "82vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">¡Atrapa las bellotas!</h2>
            <p className="text-[11px] text-slate-400">Toca las 🌰 antes de que toquen el suelo</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-amber-500">{score}</p>
            <p className={`text-xs font-bold ${timeLeft <= 3 && phase === "playing" ? "text-red-500 animate-pulse" : "text-slate-400"}`}>
              {phase === "playing" ? `${timeLeft}s` : phase === "done" ? "¡Fin!" : "Listo"}
            </p>
          </div>
        </div>

        {/* Game area */}
        <div
          ref={areaRef}
          className="mx-4 rounded-2xl bg-gradient-to-b from-sky-100 to-emerald-100 border-2 border-white/60 relative overflow-hidden"
          style={{ height: "calc(100% - 160px)" }}
        >
          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-emerald-300/50 to-transparent rounded-b-2xl" />

          {/* Acorns */}
          {acorns.map(a => (
            <button
              key={a.id}
              onClick={(e) => { e.stopPropagation(); hitAcorn(a.id); }}
              className="absolute text-3xl select-none active:scale-125 transition-transform duration-75 leading-none"
              style={{ left: `${a.x}%`, top: `${a.y}%`, transform: "translateX(-50%)" }}
            >
              🌰
            </button>
          ))}

          {/* Ready screen */}
          {phase === "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm">
              <span className="text-7xl" style={{ animation: "bounce 0.8s ease-in-out infinite" }}>🌰</span>
              <p className="text-slate-600 text-sm font-medium text-center px-8 leading-relaxed">
                Las bellotas caerán del cielo.<br/>¡Toca todas las que puedas en 10 segundos!
              </p>
              <button
                onClick={start}
                className="bg-amber-500 text-white font-extrabold text-lg px-10 py-4 rounded-2xl shadow-lg active:scale-95 transition-transform"
              >
                ¡Empezar!
              </button>
            </div>
          )}

          {/* Done screen */}
          {phase === "done" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90 backdrop-blur-sm">
              <span className="text-6xl">{scoreRef.current >= 15 ? "🏆" : scoreRef.current >= 8 ? "⭐" : "🌰"}</span>
              <p className="text-4xl font-black text-amber-500">{scoreRef.current}</p>
              <p className="text-base font-bold text-slate-700">{msg}</p>
              <p className="text-xs text-slate-400">
                +{Math.floor(scoreRef.current * 2)} ánimo para la ardilla
              </p>
            </div>
          )}
        </div>

        {/* Close button */}
        <div className="px-4 pt-2 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-700 text-white font-bold text-sm active:scale-95"
          >
            {phase === "done" ? "¡Listo!" : "Cerrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
