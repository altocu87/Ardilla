"use client";
import { useEffect, useState } from "react";
import { getDailyMissions, getMissionById, type DailyMissionsState } from "@/lib/missions";
import { getCareMissions, getCareMissionDef, type CareMissionsState } from "@/lib/care-missions";

const MISSION_DESCRIPTIONS: Record<string, string> = {
  diario:    "Abre el diario y describe tu situación del día con señales y respuesta nueva.",
  emocional: "Registra cómo te sientes emocionalmente y qué hay detrás de esa emoción.",
  caca:      "Haz un registro de tu tránsito intestinal de hoy.",
  p1:        "Completa el ejercicio de Señal y alarma — nota la señal corporal y regula.",
  p2:        "Dibuja tu mapa de hiperalerta y localiza las zonas de tensión.",
  p3:        "Practica la orientación suave: escanea el entorno con calma.",
};

type Tab = "bienestar" | "cuidados";

export default function MisionesModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("bienestar");
  const [state, setState] = useState<DailyMissionsState | null>(null);
  const [care, setCare] = useState<CareMissionsState | null>(null);

  useEffect(() => {
    try { setState(getDailyMissions()); } catch { /* SSR */ }
    try { setCare(getCareMissions()); } catch { /* SSR */ }
  }, []);

  if (!state) return null;

  const today = new Date();
  const dateLabel = today.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  /* ── Bienestar ── */
  const missions = state.missions.map(id => getMissionById(id)).filter(Boolean);
  const completedCount = state.completed.length;
  const allDone = completedCount === 3;

  /* ── Cuidados ── */
  const careDone = care ? care.missions.filter(m => m.done).length : 0;
  const careAllDone = careDone === 3;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-4 mb-1 shrink-0" />

        {/* Header */}
        <div className="px-5 pt-2 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Misiones del día</h2>
              <p className="text-xs text-slate-400 capitalize">{dateLabel}</p>
            </div>
            <span className={`text-2xl font-black ${
              (tab === "bienestar" ? allDone : careAllDone) ? "text-amber-500" : "text-slate-300"
            }`}>
              {(tab === "bienestar" ? allDone : careAllDone)
                ? "🏆"
                : `${tab === "bienestar" ? completedCount : careDone}/3`}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-3 bg-slate-100 rounded-xl p-1">
            {([["bienestar", "🌸 Bienestar"], ["cuidados", "🐿️ Cuidados"]] as [Tab, string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-3 pt-2">
          {tab === "bienestar" && (
            <>
              {missions.map((mission) => {
                if (!mission) return null;
                const done = state.completed.includes(mission.id);
                return (
                  <div key={mission.id}
                    className={`rounded-2xl border-2 px-4 py-4 transition-all ${
                      done ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100"
                    }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                        done ? "bg-emerald-100" : "bg-white border border-slate-200"
                      }`}>
                        {done ? "✅" : mission.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`font-bold text-sm leading-tight ${done ? "text-emerald-800" : "text-slate-700"}`}>
                            {mission.label}
                          </p>
                          {done && (
                            <span className="shrink-0 text-[9px] font-bold text-emerald-600 bg-emerald-200 px-1.5 py-0.5 rounded-full">
                              ¡Hecho!
                            </span>
                          )}
                        </div>
                        <p className={`text-xs leading-snug mb-2 ${done ? "text-emerald-600" : "text-slate-400"}`}>
                          {MISSION_DESCRIPTIONS[mission.id] ?? "Completa esta actividad hoy."}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            done ? "bg-amber-200 text-amber-700" : "bg-slate-200 text-slate-500"
                          }`}>
                            {mission.bellotas}🌰
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            done ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-500"
                          }`}>
                            +{mission.xp} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className={`rounded-2xl border-2 px-4 py-3 flex items-center gap-3 transition-all ${
                allDone ? "bg-amber-50 border-amber-300" : "bg-slate-50 border-dashed border-slate-200 opacity-60"
              }`}>
                <span className="text-2xl">{allDone ? "🏆" : "🎁"}</span>
                <div>
                  <p className={`font-bold text-sm ${allDone ? "text-amber-800" : "text-slate-500"}`}>Bonus por completar las 3</p>
                  <p className={`text-xs ${allDone ? "text-amber-600" : "text-slate-400"}`}>+20🌰 y +30 XP extra cuando acabes todas</p>
                </div>
              </div>
            </>
          )}

          {tab === "cuidados" && care && (
            <>
              <p className="text-xs text-slate-400 -mt-1">Cuida a la ardilla para completarlas. Se cumplen jugando con ella.</p>
              {care.missions.map((mp) => {
                const def = getCareMissionDef(mp.id);
                if (!def) return null;
                return (
                  <div key={mp.id}
                    className={`rounded-2xl border-2 px-4 py-4 transition-all ${
                      mp.done ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100"
                    }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                        mp.done ? "bg-emerald-100" : "bg-white border border-slate-200"
                      }`}>
                        {mp.done ? "✅" : def.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`font-bold text-sm leading-tight ${mp.done ? "text-emerald-800" : "text-slate-700"}`}>
                            {def.label}
                          </p>
                          {def.target > 1 && (
                            <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              mp.done ? "text-emerald-600 bg-emerald-200" : "text-slate-500 bg-slate-200"
                            }`}>
                              {Math.min(mp.progress, def.target)}/{def.target}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs leading-snug mb-2 ${mp.done ? "text-emerald-600" : "text-slate-400"}`}>
                          {def.desc}
                        </p>
                        {def.target > 1 && !mp.done && (
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                            <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-500"
                              style={{ width: `${(Math.min(mp.progress, def.target) / def.target) * 100}%` }}/>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            mp.done ? "bg-amber-200 text-amber-700" : "bg-slate-200 text-slate-500"
                          }`}>
                            {def.bellotas}🌰
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            mp.done ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-500"
                          }`}>
                            +{def.xp} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className={`rounded-2xl border-2 px-4 py-3 flex items-center gap-3 transition-all ${
                careAllDone ? "bg-amber-50 border-amber-300" : "bg-slate-50 border-dashed border-slate-200 opacity-60"
              }`}>
                <span className="text-2xl">{careAllDone ? "🏆" : "🎁"}</span>
                <div>
                  <p className={`font-bold text-sm ${careAllDone ? "text-amber-800" : "text-slate-500"}`}>Bonus por cuidarla bien</p>
                  <p className={`text-xs ${careAllDone ? "text-amber-600" : "text-slate-400"}`}>+15🌰 y +20 XP extra al completar las 3</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Botón cerrar */}
        <div className="px-5 pb-8 shrink-0">
          <button onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-slate-800 text-white font-bold text-sm active:scale-95 transition-all">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
