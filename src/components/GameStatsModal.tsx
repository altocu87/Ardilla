"use client";
import { useState, useEffect } from "react";
import {
  loadGameStats, GAME_META,
  type GameKey, type AllGameStats,
} from "@/lib/game-stats";

/* ── Animales de la carrera (orden fijo) ─────────────────────────────── */
const RACE_ANIMALS = [
  { emoji: "🐌", name: "Caracol" },
  { emoji: "🐿️", name: "Ardilla" },
  { emoji: "🐱", name: "Gato" },
  { emoji: "🐀", name: "Rata" },
  { emoji: "🪳", name: "Cucaracha" },
];

const ALL_GAME_KEYS: GameKey[] = ["tres_en_raya", "conecta4", "mayor_menor", "carrera"];

type Tab = "resumen" | "carreras" | "2p";

/* ─────────────────────────────────────────────────────────────────────── */
export default function GameStatsModal({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<AllGameStats | null>(null);
  const [tab,   setTab]   = useState<Tab>("resumen");

  useEffect(() => { setStats(loadGameStats()); }, []);

  if (!stats) return null;

  /* ── Cálculos ──────────────────────────────────────────────────────── */
  const totalPlayed = ALL_GAME_KEYS.reduce((s, g) => s + (stats.perGame[g]?.played ?? 0), 0);
  const totalDelta  = ALL_GAME_KEYS.reduce((s, g) => s + (stats.perGame[g]?.bellotasDelta ?? 0), 0);

  const raceLeader = RACE_ANIMALS.map(a => ({
    ...a,
    wins:     stats.raceAnimalWins[a.emoji]     ?? 0,
    picks:    stats.raceAnimalPicks[a.emoji]    ?? 0,
    pickWins: stats.raceAnimalPickWins[a.emoji] ?? 0,
  })).sort((a, b) => b.wins - a.wins);
  const totalRaces = raceLeader.reduce((s, a) => s + a.wins, 0);

  const has2P = ALL_GAME_KEYS.some(g => (stats.twoPlayer[g]?.played ?? 0) > 0);

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-t-3xl flex flex-col shadow-2xl"
        style={{ maxHeight: "88vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Tirador */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />

        {/* Cabecera */}
        <div className="shrink-0 px-5 pb-3 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800">Estadísticas de Juegos</h2>
            <p className="text-xs text-slate-400">
              {totalPlayed > 0
                ? `${totalPlayed} partidas · balance ${totalDelta >= 0 ? "+" : ""}${totalDelta} 🌰`
                : "Todavía no hay partidas registradas"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center active:scale-95 transition shrink-0">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex gap-1 px-5 mb-1">
          {([
            ["resumen",  "🎮 Juegos"],
            ["carreras", "🏁 Carreras"],
            ...(has2P ? [["2p", "👥 2 Jugadores"]] as const : []),
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === t ? "bg-violet-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Contenido scroll */}
        <div className="flex-1 overflow-y-auto px-5 pb-10 pt-2">

          {/* ── Tab: Resumen ── */}
          {tab === "resumen" && (
            <div className="flex flex-col gap-3">

              {/* Balance total */}
              {totalPlayed > 0 && (
                <div className={`rounded-2xl p-4 flex items-center gap-3 border ${
                  totalDelta >= 0
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-red-50 border-red-200"
                }`}>
                  <span className="text-3xl">🌰</span>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Balance total en juegos</p>
                    <p className={`text-2xl font-black ${totalDelta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {totalDelta >= 0 ? "+" : ""}{totalDelta} bellotas
                    </p>
                  </div>
                </div>
              )}

              {/* Por juego */}
              {ALL_GAME_KEYS.map(g => {
                const pg = stats.perGame[g];
                if (!pg || pg.played === 0) return null;
                const info    = GAME_META[g];
                const winPct  = Math.round((pg.won / pg.played) * 100);
                const barW    = Math.max(winPct, 3);
                return (
                  <div key={g} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{info.emoji}</span>
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-sm leading-tight">{info.name}</p>
                        <p className="text-xs text-slate-400">{pg.played} partida{pg.played !== 1 ? "s" : ""} · {winPct}% victorias</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        pg.bellotasDelta >= 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {pg.bellotasDelta >= 0 ? "+" : ""}{pg.bellotasDelta} 🌰
                      </span>
                    </div>

                    {/* Barra de victorias */}
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all"
                        style={{ width: `${barW}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-emerald-50 rounded-xl py-2">
                        <p className="text-emerald-600 font-black text-lg leading-tight">{pg.won}</p>
                        <p className="text-emerald-500 text-[10px] font-semibold">Victorias</p>
                      </div>
                      <div className="bg-red-50 rounded-xl py-2">
                        <p className="text-red-600 font-black text-lg leading-tight">{pg.lost}</p>
                        <p className="text-red-500 text-[10px] font-semibold">Derrotas</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl py-2">
                        <p className="text-amber-600 font-black text-lg leading-tight">{pg.drawn}</p>
                        <p className="text-amber-500 text-[10px] font-semibold">Empates</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {totalPlayed === 0 && (
                <div className="text-center py-10">
                  <p className="text-5xl mb-3">🎮</p>
                  <p className="text-slate-500 text-sm font-semibold">Todavía no has jugado ninguna partida</p>
                  <p className="text-slate-400 text-xs mt-1">Toca "Jugar" para empezar</p>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Carreras ── */}
          {tab === "carreras" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-500 text-center">
                {totalRaces > 0 ? `${totalRaces} carreras registradas` : "Todavía no hay carreras"}
              </p>

              {totalRaces === 0 ? (
                <div className="text-center py-10">
                  <p className="text-5xl mb-3">🏁</p>
                  <p className="text-slate-500 text-sm font-semibold">Sin carreras todavía</p>
                </div>
              ) : (
                <>
                  {/* Clasificación de victorias */}
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">🏆 Victorias en carrera</p>
                  {raceLeader.map((a, idx) => {
                    const winPct = totalRaces > 0 ? Math.round((a.wins / totalRaces) * 100) : 0;
                    const medal  = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                    return (
                      <div
                        key={a.emoji}
                        className={`rounded-2xl p-3 flex items-center gap-3 border-2 ${
                          idx === 0 && a.wins > 0
                            ? "border-yellow-300 bg-yellow-50"
                            : "border-slate-100 bg-slate-50"
                        }`}>
                        <span className="text-base w-5 text-center shrink-0">
                          {medal ?? <span className="text-slate-400 text-sm">{idx + 1}</span>}
                        </span>
                        <span className="text-3xl shrink-0">{a.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm">{a.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 rounded-full"
                                style={{ width: `${winPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">{winPct}%</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black text-slate-700 leading-tight">{a.wins}</p>
                          <p className="text-[9px] text-slate-400">victorias</p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Mis apuestas */}
                  {raceLeader.some(a => a.picks > 0) && (
                    <>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-2">🎯 Mis apuestas personales</p>
                      {raceLeader
                        .filter(a => a.picks > 0)
                        .sort((a, b) => b.picks - a.picks)
                        .map(a => {
                          const myWinPct = a.picks > 0 ? Math.round((a.pickWins / a.picks) * 100) : 0;
                          return (
                            <div key={a.emoji} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                              <span className="text-2xl">{a.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-700">{a.name}</p>
                                <p className="text-xs text-slate-400">
                                  Apostado {a.picks}× · ganado {a.pickWins}×
                                </p>
                              </div>
                              <div className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                myWinPct >= 50 ? "bg-emerald-100 text-emerald-700"
                                : myWinPct > 0  ? "bg-amber-100 text-amber-700"
                                :                 "bg-red-100 text-red-700"
                              }`}>
                                {myWinPct}% acierto
                              </div>
                            </div>
                          );
                        })
                      }
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Tab: 2 Jugadores ── */}
          {tab === "2p" && (
            <div className="flex flex-col gap-3">
              {ALL_GAME_KEYS.map(g => {
                const tp = stats.twoPlayer[g];
                if (!tp || tp.played === 0) return null;
                const info  = GAME_META[g];
                const total = tp.p1Wins + tp.p2Wins + tp.draws;
                return (
                  <div key={g} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{info.emoji}</span>
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-sm">{info.name}</p>
                        <p className="text-xs text-slate-400">{tp.played} partida{tp.played !== 1 ? "s" : ""} 2J</p>
                      </div>
                    </div>

                    {/* Barra J1 vs J2 */}
                    {total > 0 && (
                      <div className="flex h-3 rounded-full overflow-hidden mb-3 gap-px">
                        {tp.p1Wins > 0 && (
                          <div
                            className="bg-blue-400 flex items-center justify-center text-[8px] font-black text-white"
                            style={{ width: `${(tp.p1Wins / total) * 100}%` }}>
                            {tp.p1Wins > 1 ? tp.p1Wins : ""}
                          </div>
                        )}
                        {tp.draws > 0 && (
                          <div
                            className="bg-amber-300"
                            style={{ width: `${(tp.draws / total) * 100}%` }} />
                        )}
                        {tp.p2Wins > 0 && (
                          <div
                            className="bg-pink-400 flex items-center justify-center text-[8px] font-black text-white"
                            style={{ width: `${(tp.p2Wins / total) * 100}%` }}>
                            {tp.p2Wins > 1 ? tp.p2Wins : ""}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-blue-50 rounded-xl py-2.5">
                        <p className="text-blue-600 font-black text-xl leading-tight">{tp.p1Wins}</p>
                        <p className="text-blue-400 text-[10px] font-semibold">J1 gana</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl py-2.5">
                        <p className="text-amber-600 font-black text-xl leading-tight">{tp.draws}</p>
                        <p className="text-amber-400 text-[10px] font-semibold">Empates</p>
                      </div>
                      <div className="bg-pink-50 rounded-xl py-2.5">
                        <p className="text-pink-600 font-black text-xl leading-tight">{tp.p2Wins}</p>
                        <p className="text-pink-400 text-[10px] font-semibold">J2 gana</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!has2P && (
                <div className="text-center py-10">
                  <p className="text-5xl mb-3">👥</p>
                  <p className="text-slate-500 text-sm font-semibold">Sin partidas 2 jugadores todavía</p>
                  <p className="text-slate-400 text-xs mt-1">Elige el modo "2 Jugadores" en cualquier juego</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
