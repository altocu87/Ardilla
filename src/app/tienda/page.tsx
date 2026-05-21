"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getPlayerProfile, upsertPlayerProfile } from "@/lib/db";
import { getLevelInfo } from "@/lib/profile";

const ITEMS = [
  {
    id: "frase_1",
    emoji: "✨",
    name: "Frase motivacional",
    desc: "Añade una frase personalizada a tu pantalla de celebración",
    price: 30,
    color: "from-teal-400 to-emerald-500",
    bg: "bg-teal-50 border-teal-200",
  },
  {
    id: "avatar_2",
    emoji: "🐱",
    name: "Avatar Gato",
    desc: "Cambia tu avatar de ardilla por un gato",
    price: 60,
    color: "from-amber-400 to-orange-500",
    bg: "bg-amber-50 border-amber-200",
  },
  {
    id: "avatar_3",
    emoji: "🐌",
    name: "Avatar Caracol Profe",
    desc: "El mismísimo caracol profesor como avatar",
    price: 80,
    color: "from-violet-400 to-purple-500",
    bg: "bg-violet-50 border-violet-200",
  },
  {
    id: "skin_4",
    emoji: "🌈",
    name: "Tema arcoíris",
    desc: "Fondo arcoíris animado en la pantalla principal",
    price: 120,
    color: "from-pink-400 to-fuchsia-500",
    bg: "bg-pink-50 border-pink-200",
  },
  {
    id: "skin_5",
    emoji: "🌙",
    name: "Modo noche especial",
    desc: "Fondo nocturno con estrellas para la app",
    price: 150,
    color: "from-indigo-500 to-slate-600",
    bg: "bg-indigo-50 border-indigo-200",
  },
  {
    id: "title_6",
    emoji: "🏆",
    name: "Título: Maestra ardilla",
    desc: "Desbloquea un título especial junto a tu nombre",
    price: 200,
    color: "from-yellow-400 to-amber-500",
    bg: "bg-yellow-50 border-yellow-200",
  },
];

export default function Tienda() {
  const [bellotas,  setBellotas]  = useState(0);
  const [xp,        setXp]        = useState(0);
  const [owned,     setOwned]     = useState<string[]>([]);
  const [buying,    setBuying]    = useState<string | null>(null);
  const [toast,     setToast]     = useState<string | null>(null);
  const [loaded,    setLoaded]    = useState(false);

  useEffect(() => {
    getPlayerProfile()
      .then(p => {
        setBellotas(p.bellotas);
        setXp(p.xp);
        const saved = JSON.parse(localStorage.getItem("tienda_owned") || "[]");
        setOwned(saved);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const { level } = getLevelInfo(xp);

  async function buy(item: typeof ITEMS[0]) {
    if (bellotas < item.price || owned.includes(item.id)) return;
    setBuying(item.id);
    try {
      const newBellotas = bellotas - item.price;
      await upsertPlayerProfile({ bellotas: newBellotas });
      const newOwned = [...owned, item.id];
      localStorage.setItem("tienda_owned", JSON.stringify(newOwned));
      setBellotas(newBellotas);
      setOwned(newOwned);
      setToast(`¡${item.name} desbloqueado! ${item.emoji}`);
      setTimeout(() => setToast(null), 3000);
    } catch (e) { console.error(e); }
    setBuying(null);
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: "linear-gradient(160deg, #f5f3ff 0%, #fdf4ff 50%, #fef9ee 100%)" }}>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-white/60 shadow-sm">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-lg">←</Link>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">Tienda de recompensas</h1>
              <p className="text-xs text-slate-400">Gasta tus bellotas</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-100 px-3 py-1.5 rounded-full shadow-sm">
            <span className="text-lg">🌰</span>
            <span className="text-sm font-extrabold text-amber-700">{loaded ? bellotas : "—"}</span>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5 flex flex-col gap-4">

        {/* Perfil mini */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
          <span className="text-3xl">🐿️</span>
          <div>
            <p className="text-sm font-bold text-slate-700">Vicky · Nivel {level}</p>
            <p className="text-xs text-slate-400">Completa registros para ganar más 🌰</p>
          </div>
        </div>

        {/* Tabla de premios */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Cómo ganar bellotas</p>
          <div className="flex flex-col gap-2">
            {[
              { label: "Registro diario",    xp: 30, bell: 5,  emoji: "🐿️" },
              { label: "Registro emocional", xp: 20, bell: 4,  emoji: "🌸" },
              { label: "Registro caca",      xp: 15, bell: 3,  emoji: "💩" },
              { label: "Racha 3 días 🔥",    xp: 0,  bell: 10, emoji: "🔥" },
              { label: "Racha 7 días 🔥🔥",  xp: 50, bell: 25, emoji: "🏅" },
              { label: "Racha 14 días",       xp: 100,bell: 50, emoji: "🥈" },
              { label: "Racha 30 días",       xp: 200,bell: 100,emoji: "🥇" },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{r.emoji}</span>
                  <span className="text-xs text-slate-600 font-medium">{r.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {r.xp > 0 && <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">+{r.xp} XP</span>}
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">+{r.bell} 🌰</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Artículos disponibles</p>
        {ITEMS.map(item => {
          const isOwned   = owned.includes(item.id);
          const canAfford = bellotas >= item.price;
          const isBuying  = buying === item.id;
          return (
            <div key={item.id} className={`rounded-2xl border p-4 shadow-sm ${item.bg} ${isOwned ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl shadow-sm shrink-0`}>
                    {item.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700">{item.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-base">🌰</span>
                      <span className="text-sm font-extrabold text-amber-700">{item.price}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => buy(item)}
                  disabled={isOwned || !canAfford || isBuying}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    isOwned
                      ? "bg-slate-200 text-slate-400 cursor-default"
                      : canAfford
                      ? `bg-gradient-to-br ${item.color} text-white shadow-md`
                      : "bg-slate-100 text-slate-400 cursor-default"
                  }`}
                >
                  {isBuying ? "…" : isOwned ? "✓ Tuyo" : canAfford ? "Comprar" : "Sin 🌰"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
