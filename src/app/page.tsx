"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getPlayerProfile } from "@/lib/db";
import { getLevelInfo } from "@/lib/profile";

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

function AcornCrystalIcon() {
  return (
    <>
      <style>{`
        @keyframes hue-crystal {
          0%   { filter: hue-rotate(0deg)   saturate(2.2) brightness(1.25); }
          100% { filter: hue-rotate(360deg) saturate(2.2) brightness(1.25); }
        }
        @keyframes sp1 { 0%,100%{opacity:0;transform:scale(.4)} 50%{opacity:1;transform:scale(1.3)} }
        @keyframes sp2 { 0%,100%{opacity:0;transform:scale(.4)} 40%{opacity:1;transform:scale(1.2)} }
        @keyframes sp3 { 0%,100%{opacity:0;transform:scale(.4)} 60%{opacity:1;transform:scale(1.1)} }
      `}</style>
      <div style={{ animation: "hue-crystal 3s linear infinite", display: "inline-block" }}>
        <svg viewBox="0 0 68 90" width="58" height="78">
          {/* Cap */}
          <ellipse cx="34" cy="27" rx="30" ry="14" fill="#7dd3fc"/>
          {[11,16,21,26,31,36,41,47,53].map(x => (
            <line key={x} x1={x} y1="15" x2={x+3} y2="38" stroke="#38bdf8" strokeWidth="2" opacity="0.65"/>
          ))}
          <ellipse cx="34" cy="38" rx="30" ry="6" fill="#0ea5e9" opacity="0.85"/>
          {/* Stem */}
          <line x1="34" y1="13" x2="34" y2="4" stroke="#0369a1" strokeWidth="4" strokeLinecap="round"/>
          {/* Body */}
          <ellipse cx="34" cy="68" rx="26" ry="30" fill="#818cf8"/>
          {/* Crystal facets */}
          <path d="M16 55 Q24 48 30 57 Q23 66 16 55Z"  fill="white"   fillOpacity="0.38"/>
          <path d="M46 60 Q53 53 56 64 Q51 73 46 60Z"  fill="#a5f3fc" fillOpacity="0.42"/>
          <ellipse cx="34" cy="85" rx="9" ry="5"        fill="white"   fillOpacity="0.2"/>
          <path d="M34 44 Q40 50 34 58 Q28 50 34 44Z"  fill="white"   fillOpacity="0.15"/>
          {/* Sparkle dots */}
          <circle cx="6"  cy="46" r="3"   fill="#f0abfc" style={{animation:"sp1 1.8s 0s   ease-in-out infinite"}}/>
          <circle cx="62" cy="38" r="2.5" fill="#fde68a" style={{animation:"sp2 2.1s 0.6s ease-in-out infinite"}}/>
          <circle cx="10" cy="75" r="2"   fill="#a5f3fc" style={{animation:"sp3 1.6s 1.1s ease-in-out infinite"}}/>
          <circle cx="60" cy="70" r="2.5" fill="#f9a8d4" style={{animation:"sp1 2.3s 0.3s ease-in-out infinite"}}/>
          {/* Star sparkle */}
          <path d="M58 20 L59.5 15.5 L61 20 L65.5 21.5 L61 23 L59.5 27.5 L58 23 L53.5 21.5Z"
            fill="#fef08a" opacity="0.95" style={{animation:"sp2 2.5s 0.8s ease-in-out infinite"}}/>
        </svg>
      </div>
    </>
  );
}

export default function Home() {
  const [xp,       setXp]       = useState(0);
  const [bellotas, setBellotas] = useState(0);
  const [loaded,   setLoaded]   = useState(false);

  useEffect(() => {
    getPlayerProfile()
      .then(p => { setXp(p.xp); setBellotas(p.bellotas); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const { level, currentXp, nextLevelXp, progress } = getLevelInfo(xp);

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-sky-100 via-teal-50 to-emerald-100 overflow-hidden">

      {/* ── PERFIL ── */}
      <div className="shrink-0 px-5 pt-5">
        <div className="bg-white/75 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-md flex items-center gap-3">
          <div className="shrink-0 w-14 h-14 rounded-full bg-teal-100 border-2 border-teal-300 flex items-center justify-center text-3xl shadow-sm">
            🐿️
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-base font-extrabold text-slate-700 leading-none">Vicky</span>
              <span className="flex items-center gap-1 text-sm font-bold text-amber-600">
                🌰 <span>{loaded ? bellotas : "—"}</span>
              </span>
            </div>
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
                {loaded ? `${currentXp}/${nextLevelXp} XP` : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SALUDO + ANIMALES ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-700 tracking-tight mb-1">¡Hola, Vicky!</h1>
          <p className="text-slate-400 text-sm font-medium">{greeting()}</p>
        </div>
        <div className="flex items-end justify-center gap-4 w-full px-2">
          {ANIMALS.map((a, i) => (
            <span key={i} className={`${a.size} select-none drop-shadow-sm`}
              style={{ display: "inline-block", animation: `bounce ${a.dur} ease-in-out infinite`, animationDelay: a.delay }}>
              {a.emoji}
            </span>
          ))}
        </div>
      </div>

      {/* ── BOTONES ── */}
      <div className="shrink-0 px-5 pb-10 flex flex-col gap-3">
        <Link href="/registro"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-3xl bg-teal-500 text-white font-bold text-xl shadow-lg shadow-teal-200 active:scale-95 transition-transform">
          <span className="text-2xl">✏️</span> Registro
        </Link>
        <Link href="/formaciones"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-3xl bg-violet-500 text-white font-bold text-xl shadow-lg shadow-violet-200 active:scale-95 transition-transform">
          <span className="text-2xl">🎓</span> Ejercicios
        </Link>

        {/* Tienda — botón especial con bellota iridiscente */}
        <Link href="/tienda"
          className="flex items-center justify-between w-full px-5 py-3 rounded-3xl text-white font-bold text-lg shadow-lg active:scale-95 transition-transform overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #a855f7 70%, #ec4899 100%)" }}>
          <div className="flex items-center gap-3">
            <AcornCrystalIcon />
            <span>Tienda de recompensas</span>
          </div>
          <span className="text-sm font-bold bg-white/20 px-2 py-1 rounded-full">🌰 {loaded ? bellotas : "—"}</span>
        </Link>

        <Link href="/informacion"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-3xl bg-amber-400 text-white font-bold text-xl shadow-lg shadow-amber-200 active:scale-95 transition-transform">
          <span className="text-2xl">ℹ️</span> Información
        </Link>
        <Link href="/opciones"
          className="flex items-center justify-center gap-3 w-full py-3 rounded-3xl bg-slate-500 text-white font-bold text-base shadow-md shadow-slate-200 active:scale-95 transition-transform">
          <span className="text-xl">⚙️</span> Ajustes
        </Link>
      </div>

    </div>
  );
}
