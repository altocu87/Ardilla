"use client";
import { useEffect, useState } from "react";
import { getDailyMissions, getMissionById, type DailyMissionsState } from "@/lib/missions";

export default function MisionesPanel() {
  const [state, setState] = useState<DailyMissionsState | null>(null);

  useEffect(() => {
    try { setState(getDailyMissions()); } catch { /* SSR */ }
  }, []);

  useEffect(() => {
    function refresh() {
      try { setState(getDailyMissions()); } catch { /* noop */ }
    }
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    const onVis = () => { if (!document.hidden) refresh(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  if (!state) return null;

  const missions = state.missions.map(id => getMissionById(id)).filter(Boolean);
  const completedCount = state.missions.filter(id => state.completed.includes(id)).length;
  const allDone = completedCount === 3;

  return (
    <div className="shrink-0 px-5 pb-2">
      <div className={`rounded-2xl px-3 py-2 flex items-center gap-2 border shadow-sm ${
        allDone
          ? "bg-amber-50/90 border-amber-300"
          : "bg-white/75 border-white/40"
      } backdrop-blur-sm`}>

        {/* Título compacto */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-sm">📋</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden xs:block">Misiones</span>
        </div>

        {/* Separador */}
        <div className="w-px h-6 bg-slate-200 shrink-0" />

        {/* Las 3 misiones en horizontal */}
        <div className="flex-1 flex gap-2 overflow-hidden">
          {missions.map((mission) => {
            if (!mission) return null;
            const done = state.completed.includes(mission.id);
            return (
              <div key={mission.id}
                className={`flex-1 flex items-center gap-1.5 px-2 py-1 rounded-xl border text-left min-w-0 ${
                  done ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
                }`}>
                <span className={`text-base shrink-0 ${done ? "" : "opacity-50"}`}>{mission.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[9px] font-semibold leading-tight truncate ${done ? "text-emerald-700" : "text-slate-500"}`}>
                    {mission.label.replace("Completa ", "").replace("Registro ", "")}
                  </p>
                  <p className={`text-[9px] font-bold ${done ? "text-amber-600" : "text-slate-400"}`}>
                    {done ? "✓ " : ""}{mission.bellotas}🌰
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contador / bonus */}
        <div className="shrink-0 text-right">
          {allDone
            ? <span className="text-[9px] font-bold text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded-full">+20🌰</span>
            : <span className="text-[10px] font-bold text-slate-400">{completedCount}/3</span>
          }
        </div>
      </div>
    </div>
  );
}
