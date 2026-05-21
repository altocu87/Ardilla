"use client";
import Link from "next/link";

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
  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-sky-100 via-teal-50 to-emerald-100 overflow-hidden">

      <div className="flex-1 flex flex-col items-center justify-center gap-10 px-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-700 tracking-tight mb-1">
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
