"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getEvolutionData, PHASE_INFO, type EvolutionData } from "@/lib/tama-evolution";
import { getTamaStats, ILLNESS_INFO, type TamaStats } from "@/lib/tamagotchi";
import {
  getMiniGameRankings, getMemoryRankings,
  type MiniGameEntry, type MemoryEntry,
} from "@/lib/game-rankings";

export default function EstadisticasPage() {
  const [evo,   setEvo]   = useState<EvolutionData | null>(null);
  const [tama,  setTama]  = useState<TamaStats | null>(null);
  const [mini,  setMini]  = useState<MiniGameEntry[]>([]);
  const [mem,   setMem]   = useState<MemoryEntry[]>([]);

  useEffect(() => {
    setEvo(getEvolutionData());
    setTama(getTamaStats());
    setMini(getMiniGameRankings());
    setMem(getMemoryRankings());
  }, []);

  if (!evo || !tama) return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-sky-100 to-emerald-100">
      <p className="text-slate-400 text-sm">Cargando...</p>
    </div>
  );

  const phaseInfo = PHASE_INFO[evo.phase];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-teal-50 to-emerald-100 pb-10">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-sm border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <Link href="/"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold active:scale-95">
          ←
        </Link>
        <h1 className="text-base font-extrabold text-slate-800">Estadísticas 📊</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* ── Evolution ── */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-white/60">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Evolución</p>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-5xl">{phaseInfo.emoji}</span>
            <div>
              <p className="text-base font-extrabold text-slate-800">{phaseInfo.label}</p>
              <p className="text-xs text-slate-400">{phaseInfo.desc}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-amber-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-amber-600">{evo.daysCaredFor}</p>
              <p className="text-[10px] text-amber-500 font-semibold">Días cuidada</p>
            </div>
            <div className="bg-rose-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-rose-600">{evo.totalTaps}</p>
              <p className="text-[10px] text-rose-500 font-semibold">Caricias</p>
            </div>
            <div className="bg-indigo-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-indigo-600">{evo.goodNightsStreak}</p>
              <p className="text-[10px] text-indigo-500 font-semibold">Buenas noches</p>
            </div>
          </div>
        </div>

        {/* ── Current stats ── */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-white/60">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Estado actual</p>
          {(
            [
              { label: "Hambre",  emoji: "🍖", value: tama.hambre,  color: "#f59e0b" },
              { label: "Energía", emoji: "⚡", value: tama.energia, color: "#818cf8" },
              { label: "Ánimo",   emoji: "🌸", value: tama.animo,   color: "#f472b6" },
              { label: "Salud",   emoji: "❤️", value: tama.salud,   color: "#ef4444" },
            ] as const
          ).map(b => (
            <div key={b.label} className="mb-2 last:mb-0">
              <div className="flex justify-between mb-0.5">
                <span className="text-xs text-slate-500 font-semibold">{b.emoji} {b.label}</span>
                <span className="text-xs font-bold text-slate-400">{Math.round(b.value)}</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${b.value}%`, background: b.color }}/>
              </div>
            </div>
          ))}
        </div>

        {/* ── Illness history ── */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-white/60">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Historial de enfermedades</p>
          {(!tama.totalIllnesses || tama.totalIllnesses === 0) ? (
            <div className="text-center py-4">
              <span className="text-4xl">💪</span>
              <p className="text-sm text-slate-500 mt-2 font-semibold">¡Nunca ha estado enferma!</p>
            </div>
          ) : (
            <>
              <div className="bg-orange-50 rounded-2xl p-3 mb-3 text-center">
                <p className="text-3xl font-black text-orange-600">{tama.totalIllnesses}</p>
                <p className="text-xs text-orange-500 font-semibold">Total de enfermedades</p>
              </div>
              <div className="space-y-2">
                {(["stomach", "caca", "tired"] as const).map(type => {
                  const count = tama.illnessByType?.[type] ?? 0;
                  if (!count) return null;
                  const info = ILLNESS_INFO[type];
                  return (
                    <div key={type} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${info.badgeColor}`}>
                      <span className="text-xl">{info.emoji}</span>
                      <span className="flex-1 text-xs font-bold">{info.name}</span>
                      <span className="text-base font-black">{count}×</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {tama.illness && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-center">
              <p className="text-xs font-bold text-red-600">⚠️ Ahora mismo está enferma — ¡dale la medicina!</p>
            </div>
          )}
        </div>

        {/* ── Mini-game rankings ── */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-white/60">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">🌰 Ranking — Bellotas</p>
          {mini.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-3">Sin partidas todavía</p>
          ) : (
            <div className="space-y-1.5">
              {mini.slice(0, 5).map((entry, i) => (
                <div key={i} className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2.5">
                  <span className="text-sm font-black text-amber-600 w-5 shrink-0">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <span className="text-xl font-black text-amber-500 flex-1">{entry.score} 🌰</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(entry.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Memory rankings ── */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-white/60">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">🃏 Ranking — Memoria</p>
          {mem.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-3">Sin partidas todavía</p>
          ) : (
            <div className="space-y-1.5">
              {mem.slice(0, 5).map((entry, i) => (
                <div key={i} className="flex items-center gap-2 bg-violet-50 rounded-xl px-3 py-2.5">
                  <span className="text-sm font-black text-violet-600 w-5 shrink-0">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <span className="text-sm font-black text-violet-500 flex-1">
                    {entry.moves} movs
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{entry.timeSeconds}s</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(entry.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
