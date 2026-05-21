"use client";
import { useEffect, useState } from "react";
import { getDailyMissions, getMissionById, type DailyMissionsState } from "@/lib/missions";

export default function MisionesPanel() {
  const [state, setState] = useState<DailyMissionsState | null>(null);

  useEffect(() => {
    try {
      setState(getDailyMissions());
    } catch {
      // localStorage not available during SSR
    }
  }, []);

  // Refresh when page regains focus
  useEffect(() => {
    function refresh() {
      try {
        setState(getDailyMissions());
      } catch { /* noop */ }
    }
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refresh();
    });
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, []);

  if (!state) return null;

  const missions = state.missions.map(id => getMissionById(id)).filter(Boolean);
  const allDone = state.missions.every(id => state.completed.includes(id));

  return (
    <div className="shrink-0 px-5 pb-2">
      <div className={`rounded-2xl overflow-hidden shadow-md border ${
        allDone
          ? "bg-amber-50/90 border-amber-300"
          : "bg-white/80 border-white/40"
      } backdrop-blur-sm`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-3 py-2 ${
          allDone ? "bg-amber-400/20" : "bg-white/40"
        }`}>
          <div className="flex items-center gap-1.5">
            <span className="text-base">📋</span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Misiones del día
            </span>
          </div>
          {allDone && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">
              ¡Todo hecho! +20🌰 +30XP
            </span>
          )}
        </div>

        {/* Missions */}
        <div className="flex gap-1.5 px-3 py-2.5">
          {missions.map((mission) => {
            if (!mission) return null;
            const done = state.completed.includes(mission.id);
            return (
              <div
                key={mission.id}
                className={`flex-1 flex flex-col items-center gap-1 px-1.5 py-2 rounded-xl border transition-all ${
                  done
                    ? "bg-emerald-50 border-emerald-300"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                {/* Status indicator */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  done
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-400"
                }`}>
                  {done ? "✓" : "○"}
                </div>

                {/* Emoji */}
                <span className={`text-lg ${done ? "opacity-100" : "opacity-60"}`}>
                  {mission.emoji}
                </span>

                {/* Label */}
                <p className={`text-[9px] font-semibold text-center leading-tight ${
                  done ? "text-emerald-700" : "text-slate-500"
                }`}>
                  {mission.label}
                </p>

                {/* Reward */}
                <p className={`text-[9px] font-bold ${
                  done ? "text-amber-600" : "text-slate-400"
                }`}>
                  +{mission.bellotas}🌰
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
