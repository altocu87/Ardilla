"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getProfile, getLevelInfo } from "@/lib/profile";

const ANIMALS = [
  { emoji: "🐌", size: "text-4xl", dur: "2.2s", delay: "0s" },
  { emoji: "🐿️", size: "text-5xl", dur: "1.9s", delay: "0.3s" },
  { emoji: "🐱", size: "text-5xl", dur: "2.0s", delay: "0.5s" },
  { emoji: "🐈", size: "text-6xl", dur: "2.4s", delay: "0.7s" },
  { emoji: "🐈‍⬛", size: "text-7xl", dur: "2.1s", delay: "1.0s" },
];

function greeting() {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return "Buenos días ☀️";
  if (h >= 14 && h < 21) return "Buenas tardes 🌤️";
  return "Buenas noches 🌙";
}

export default function Home() {
  const [xp,       setXp]       = useState(0);
  const [bellotas, setBellotas] = useState(0);

  useEffect(() => {
    const p = getProfile();
    setXp(p.xp);
    setBellotas(p.bellotas);
  }, []);

  const { level, currentXp, nextLevelXp, progress } = getLevelInfo(xp);

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-sky-100 via-teal-50 to-emerald-100 overflow-hidden">

      {/* ── PERFIL DE JUGADOR ── */}
      <div className="shrink-0 px-5 pt-5">
        <div className="bg-white/75 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-md flex items-center gap-3">

          {/* Avatar */}
          <div className="shrink-0 w-14 h-14 rounded-full bg-teal-100 border-2 border-teal-300 flex items-center justify-center text-3xl shadow-sm">
            🐿️
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-base font-extrabold text-slate-700 leading-none">Vicky</span>
              <span className="flex items-center gap-1 text-sm font-bold text-amber-600">
                🌰 <span>{bellotas}</span>
              </span>
            </div>

            {/* Nivel + barra XP */}
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[10px] font-bold text-white bg-teal-500 px-1.5 py-0.5 rounded-full leading-none">
                Nv.{level}
              </span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-700"
                  style={{ width: `${Math.max(progress * 100, 3)}%` }}
                />
              </div>
              <span className="shrink-0 text-[9px] text-slate-400 font-medium">
                {currentXp}/{nextLevelXp} XP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SALUDO + ANIMALES ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-700 tracking-tight mb-1">
            ¡Hola, Vicky!
          </h1>
          <p className="text-slate-400 text-sm font-medium">{greeting()}</p>
        </div>

        <div className="flex items-end justify-center gap-4 w-full px-2">
          {ANIMALS.map((a, i) => (
            <span
              key={i}
              className={`${a.size} select-none drop-shadow-sm`}
              style={{
                display: "inline-block",
                animation: `bounce ${a.dur} ease-in-out infinite`,
                animationDelay: a.delay,
              }}
            >
              {a.emoji}
            </span>
          ))}
        </div>
      </div>

      {/* ── BOTONES ── */}
      <div className="shrink-0 px-5 pb-10 flex flex-col gap-3">
        <Link
          href="/registro"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-3xl bg-teal-500 text-white font-bold text-xl shadow-lg shadow-teal-200 active:scale-95 transition-transform"
        >
          <span className="text-2xl">✏️</span> Registro
        </Link>
        <Link
          href="/formaciones"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-3xl bg-violet-500 text-white font-bold text-xl shadow-lg shadow-violet-200 active:scale-95 transition-transform"
        >
          <span className="text-2xl">🎓</span> Ejercicios
        </Link>
        <Link
          href="/informacion"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-3xl bg-amber-400 text-white font-bold text-xl shadow-lg shadow-amber-200 active:scale-95 transition-transform"
        >
          <span className="text-2xl">ℹ️</span> Información
        </Link>
        <Link
          href="/opciones"
          className="flex items-center justify-center gap-3 w-full py-3 rounded-3xl bg-slate-500 text-white font-bold text-base shadow-md shadow-slate-200 active:scale-95 transition-transform"
        >
          <span className="text-xl">⚙️</span> Ajustes
        </Link>
      </div>

    </div>
  );
}
