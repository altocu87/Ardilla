"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { SIGNALS, ALARMS, REGULAT, AFTER } from "@/lib/constants";
import { getPregLog, getCacaLog, PregEntry, PregLog, updatePregEntry, deletePregEntry } from "@/lib/db";
import type { CacaLog } from "@/lib/db";

const HABITUAL = [
  "Vigilar y comprobar",
  "Pelear contra el síntoma",
  "Controlar la alimentación",
  "Evitar actividades",
  "Buscar soluciones inmediatas",
  "Aislarme",
];

type Entry = PregEntry;
type Log = PregLog;

function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === "string" && v) return [v];
  return [];
}


function calcStreak(log: Log): number {
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (!log[d.toISOString().slice(0, 10)]) return i;
  }
  return 365;
}

function topValue(entries: [string, Entry][], key: keyof Entry): string | null {
  const counts: Record<string, number> = {};
  for (const [, e] of entries) {
    const vals = arr(e[key]);
    for (const v of vals) counts[v] = (counts[v] || 0) + 1;
  }
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
}

function exportCSV(log: Log) {
  const headers = ["Fecha", "Situación", "Señal", "Alarma", "Habitual", "Nueva respuesta", "Después"];
  const rows = Object.entries(log)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, e]) =>
      [
        date,
        `"${(e.situation || "").replace(/"/g, '""')}"`,
        `"${arr(e.signal).join("; ").replace(/"/g, '""')}"`,
        `"${arr(e.alarm).join("; ").replace(/"/g, '""')}"`,
        `"${arr(e.habitual).join("; ").replace(/"/g, '""')}"`,
        `"${arr(e.newResponse).join("; ").replace(/"/g, '""')}"`,
        `"${arr(e.after).join("; ").replace(/"/g, '""')}"`,
      ].join(",")
    );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `registro-diario-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function toggleArr(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

function MultiButtons({
  options, selected, onChange, activeColor,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  activeColor: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => onChange(toggleArr(selected, opt))}
            className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all active:scale-[0.98] ${
              on ? activeColor : "bg-white border-slate-200 text-slate-600"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function HistoricoDiario() {
  const [log, setLog] = useState<Log>({});
  const [cacaLog, setCacaLog] = useState<CacaLog>({});
  const [editing, setEditing] = useState<{ date: string; entry: Entry } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  useEffect(() => {
    async function load() {
      try {
        const [pregLog, cLog] = await Promise.all([getPregLog(), getCacaLog()]);
        setLog(pregLog);
        setCacaLog(cLog);
      } catch (e) { console.error(e); }
    }
    load();
  }, []);

  const entries = useMemo(
    () => Object.entries(log).sort(([a], [b]) => b.localeCompare(a)),
    [log]
  );

  const streak = useMemo(() => calcStreak(log), [log]);
  const topSignal = useMemo(() => topValue(entries, "signal"), [entries]);
  const topNewResponse = useMemo(() => topValue(entries, "newResponse"), [entries]);

  const chartData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - 13 + i);
      const key = d.toISOString().slice(0, 10);
      return {
        label: d.toLocaleDateString("es", { day: "numeric", month: "short" }),
        value: log[key] ? 1 : 0,
        isToday: key === today.toISOString().slice(0, 10),
      };
    });
  }, [log]);

  const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const calendarCells = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDow = (firstDay.getDay() + 6) % 7;
    const todayKey = new Date().toISOString().slice(0, 10);
    const cells: (null | { key: string; day: number; isFuture: boolean })[] = Array(firstDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ key, day: d, isFuture: key > todayKey });
    }
    return cells;
  }, [calYear, calMonth]);

  const isCurrentMonth = calYear === new Date().getFullYear() && calMonth === new Date().getMonth();

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }

  function nextMonth() {
    if (isCurrentMonth) return;
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  async function deleteEntry(date: string) {
    const entry = log[date];
    if (!entry?.id) return;
    try {
      await deletePregEntry(entry.id);
      const updated = { ...log };
      delete updated[date];
      setLog(updated);
      setConfirmDelete(null);
    } catch (e) { console.error(e); }
  }

  async function saveEdit() {
    if (!editing) return;
    const { date, entry } = editing;
    try {
      await updatePregEntry(entry.id, {
        situation: entry.situation,
        signal: arr(entry.signal),
        alarm: arr(entry.alarm),
        habitual: arr(entry.habitual),
        newResponse: arr(entry.newResponse),
        after: arr(entry.after),
        mood: entry.mood,
      });
      setLog({ ...log, [date]: entry });
      setEditing(null);
    } catch (e) { console.error(e); }
  }

  function setEditArr(key: keyof Entry, val: string[]) {
    if (!editing) return;
    setEditing({ ...editing, entry: { ...editing.entry, [key]: val } });
  }

  if (entries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-teal-50 to-emerald-100 flex flex-col">
        <header className="flex items-center gap-2 px-5 pt-8 pb-4 max-w-lg mx-auto w-full">
          <Link href="/registro" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/70 text-slate-600 text-lg shadow-sm">←</Link>
          <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/70 text-slate-600 text-lg shadow-sm">🏠</Link>
          <h1 className="text-xl font-bold text-slate-800">Log Diario</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-4">
          <span className="text-6xl">🐿️</span>
          <p className="text-slate-500 text-base font-medium">Aún no hay registros.</p>
          <Link href="/registro/diario" className="px-6 py-3 rounded-2xl bg-teal-500 text-white font-bold shadow-md active:scale-95 transition">
            Hacer el primer registro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-teal-50 to-emerald-50 pb-8">

        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-white/60 shadow-sm">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              <Link href="/registro" className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-lg">←</Link>
              <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-lg">🏠</Link>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">Log Diario</h1>
                <p className="text-xs text-slate-400">{entries.length} registros</p>
              </div>
            </div>
            <button
              onClick={() => exportCSV(log)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-200 active:scale-95 transition"
            >
              <span>📥</span> Exportar
            </button>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 pt-5 flex flex-col gap-5">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
              <p className="text-2xl font-bold text-teal-600">{entries.length}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Registros</p>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
              <p className="text-2xl font-bold text-orange-500">{streak > 0 ? `🔥${streak}` : "0"}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Racha días</p>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
              <p className="text-2xl font-bold text-violet-500">
                {Math.round((entries.filter(([k]) => {
                  const d = new Date(); d.setDate(d.getDate() - 6);
                  return k >= d.toISOString().slice(0, 10);
                }).length / 7) * 100)}%
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Últ. semana</p>
            </div>
          </div>

          {/* Frecuentes */}
          {(topSignal || topNewResponse) && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
              {topSignal && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-slate-400 w-24 shrink-0 pt-0.5">Señal frecuente</span>
                  <span className="text-xs text-slate-700 font-medium leading-snug">{topSignal}</span>
                </div>
              )}
              {topNewResponse && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-slate-400 w-24 shrink-0 pt-0.5">Respuesta usada</span>
                  <span className="text-xs text-teal-700 font-medium leading-snug">{topNewResponse}</span>
                </div>
              )}
            </div>
          )}

          {/* Calendario mensual */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-sm active:scale-95 transition">←</button>
              <p className="text-sm font-semibold text-slate-700">{MONTH_NAMES[calMonth]} {calYear}</p>
              <button onClick={nextMonth} disabled={isCurrentMonth}
                className={`w-7 h-7 flex items-center justify-center rounded-full text-sm active:scale-95 transition ${isCurrentMonth ? "bg-slate-50 text-slate-300 cursor-default" : "bg-slate-100 text-slate-600"}`}>→</button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {["L", "M", "X", "J", "V", "S", "D"].map((l) => (
                <p key={l} className="text-center text-[9px] text-slate-300 font-semibold pb-1">{l}</p>
              ))}
              {calendarCells.map((cell, i) => {
                if (!cell) return <div key={`pad-${i}`} />;
                const hasEntry = !!log[cell.key];
                const moodEmoji = hasEntry ? (log[cell.key]?.mood ?? "") : "";
                const hasCaca = (cacaLog[cell.key]?.length ?? 0) > 0;
                const isToday = cell.key === new Date().toISOString().slice(0, 10);
                return (
                  <div key={cell.key} title={cell.key}
                    className={`aspect-square rounded-md relative flex items-center justify-center leading-none ${
                      hasEntry ? "bg-teal-500 shadow-sm shadow-teal-200 text-[26px]"
                      : isToday ? "border-2 border-teal-300 bg-teal-50"
                      : cell.isFuture ? "bg-white"
                      : "bg-slate-100"
                    }`}
                  >
                    <span className={`absolute top-0.5 left-1 text-[7px] font-bold leading-none ${hasEntry ? "text-white/70" : cell.isFuture ? "text-slate-200" : "text-slate-400"}`}>{cell.day}</span>
                    {moodEmoji}
                    {hasCaca && !cell.isFuture && (
                      <span className="absolute bottom-0.5 right-0.5 text-[13px] leading-none drop-shadow-sm">💩</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfico */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-3">Actividad últimos 14 días</p>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={chartData} barSize={14} margin={{ top: 0, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={1} />
                <YAxis domain={[0, 1]} hide />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={((v: number) => [v === 1 ? "Con registro ✓" : "Sin registro", ""]) as any} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.value ? (d.isToday ? "#0d9488" : "#5eead4") : "#e2e8f0"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lista */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Entradas ({entries.length})</p>
            {entries.map(([date, entry]) => {
              const isExpanded = expanded === date;
              const isConfirming = confirmDelete === date;
              const d = new Date(entry.savedAt || date);
              return (
                <div key={date} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : date)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {entry.mood && <span className="text-2xl">{entry.mood}</span>}
                      <div>
                        <p className="text-sm font-bold text-slate-700 capitalize">
                          {d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })} · {arr(entry.signal)[0] ?? "—"}
                        </p>
                      </div>
                    </div>
                    <span className={`text-slate-400 transition-transform text-lg ${isExpanded ? "rotate-180" : ""}`}>▾</span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 flex flex-col gap-3 border-t border-slate-100 pt-3">
                      <Field label="Situación" value={entry.situation} />
                      <Field label="Señal" value={arr(entry.signal).join(" · ")} color="teal" />
                      <Field label="Alarma" value={arr(entry.alarm).join(" · ")} color="rose" />
                      <Field label="Habitual" value={arr(entry.habitual).join(" · ")} color="orange" />
                      <Field label="Nueva respuesta" value={arr(entry.newResponse).join(" · ")} color="violet" />
                      <Field label="Después" value={arr(entry.after).join(" · ")} color="sky" />

                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => setEditing({ date, entry: { ...entry, signal: arr(entry.signal), alarm: arr(entry.alarm), habitual: arr(entry.habitual), newResponse: arr(entry.newResponse), after: arr(entry.after) } })}
                          className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold active:scale-95 transition"
                        >
                          ✏️ Editar
                        </button>
                        {isConfirming ? (
                          <>
                            <button onClick={() => deleteEntry(date)} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold active:scale-95 transition">
                              Confirmar eliminación
                            </button>
                            <button onClick={() => setConfirmDelete(null)} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold active:scale-95 transition">
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDelete(date)} className="flex-1 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-bold active:scale-95 transition">
                            🗑️ Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal edición */}
      {editing && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative mt-auto bg-white rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 pt-5 pb-3 flex items-center justify-between z-10">
              <h2 className="text-base font-bold text-slate-800">Editar registro</h2>
              <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-lg flex items-center justify-center">×</button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Situación</label>
                <textarea
                  value={editing.entry.situation}
                  onChange={(e) => setEditing({ ...editing, entry: { ...editing.entry, situation: e.target.value } })}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm resize-none focus:outline-none focus:border-teal-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Señal</label>
                <MultiButtons options={SIGNALS} selected={arr(editing.entry.signal)} onChange={(v) => setEditArr("signal", v)} activeColor="bg-teal-100 border-teal-400 text-teal-800 font-semibold border" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Alarma</label>
                <MultiButtons options={ALARMS} selected={arr(editing.entry.alarm)} onChange={(v) => setEditArr("alarm", v)} activeColor="bg-rose-100 border-rose-400 text-rose-800 font-semibold border" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Habitual</label>
                <MultiButtons options={HABITUAL} selected={arr(editing.entry.habitual)} onChange={(v) => setEditArr("habitual", v)} activeColor="bg-orange-100 border-orange-400 text-orange-800 font-semibold border" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nueva respuesta</label>
                <MultiButtons options={REGULAT} selected={arr(editing.entry.newResponse)} onChange={(v) => setEditArr("newResponse", v)} activeColor="bg-violet-100 border-violet-400 text-violet-800 font-semibold border" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Después</label>
                <MultiButtons options={AFTER} selected={arr(editing.entry.after)} onChange={(v) => setEditArr("after", v)} activeColor="bg-sky-100 border-sky-400 text-sky-800 font-semibold border" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Estado de ánimo</label>
                <div className="flex justify-around">
                  {[{e:"😴",l:"Cansada"},{e:"😢",l:"Triste"},{e:"😐",l:"Normal"},{e:"😊",l:"Satisfecha"},{e:"😄",l:"Contenta"}].map((m) => (
                    <button key={m.e}
                      onClick={() => setEditing({ ...editing!, entry: { ...editing!.entry, mood: editing!.entry.mood === m.e ? "" : m.e } })}
                      className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all ${editing!.entry.mood === m.e ? "bg-teal-100 scale-110 shadow" : "hover:bg-slate-50"}`}
                    >
                      <span className="text-2xl">{m.e}</span>
                      <span className="text-[9px] text-slate-500">{m.l}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={saveEdit} className="w-full py-4 rounded-2xl bg-teal-500 text-white font-bold shadow-md shadow-teal-200 active:scale-95 transition mt-2">
                Guardar cambios ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, value, color }: { label: string; value: string; color?: "teal" | "rose" | "orange" | "violet" | "sky" }) {
  const colorMap: Record<string, string> = {
    teal: "bg-teal-50 text-teal-800 border-teal-100",
    rose: "bg-rose-50 text-rose-800 border-rose-100",
    orange: "bg-orange-50 text-orange-800 border-orange-100",
    violet: "bg-violet-50 text-violet-800 border-violet-100",
    sky: "bg-sky-50 text-sky-800 border-sky-100",
  };
  const cls = color ? colorMap[color] : "bg-slate-50 text-slate-700 border-slate-100";
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xs font-medium px-3 py-2 rounded-xl border ${cls} leading-snug`}>{value || "—"}</p>
    </div>
  );
}
