"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getEmocionalLog, updateEmocionalEntry, deleteEmocionalEntry, EmocionalEntry, EmocionalLog } from "@/lib/db";
import { ESTADO_OPTS, NECESIDAD_OPTS } from "@/app/registro/emocional/page";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const DONDE_OPTS = ["Pecho", "Garganta", "Abdomen", "Mandíbula", "Espalda", "Manos", "Piernas"];

function estadoEmoji(label: string): string {
  return ESTADO_OPTS.find(o => o.label === label)?.emoji ?? "💭";
}

function necesidadEmoji(label: string): string {
  return NECESIDAD_OPTS.find(o => o.label === label)?.emoji ?? "✨";
}

function calcStreak(log: EmocionalLog): number {
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (!log[key]) return i;
  }
  return 365;
}

function exportCSV(entries: EmocionalEntry[]) {
  const headers = ["Fecha", "Hora", "Estado", "Intensidad", "Donde", "Necesidad", "Estado ánimo"];
  const rows = [...entries]
    .sort((a, b) => a.savedAt.localeCompare(b.savedAt))
    .map(e => {
      const d = new Date(e.savedAt);
      return [
        d.toLocaleDateString("es"),
        d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
        `"${e.estado}"`, String(e.intensidad),
        `"${e.donde.join("; ")}"`,
        `"${e.necesidad.join("; ")}"`,
        `"${e.mood ?? ""}"`,
      ].join(",");
    });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `registro-emocional-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Field({ label, value, color }: { label: string; value: string; color?: "rose" | "pink" | "fuchsia" | "violet" }) {
  const cls: Record<string, string> = {
    rose:    "bg-rose-50 text-rose-800 border-rose-100",
    pink:    "bg-pink-50 text-pink-800 border-pink-100",
    fuchsia: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-100",
    violet:  "bg-violet-50 text-violet-800 border-violet-100",
  };
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xs font-medium px-3 py-2 rounded-xl border leading-snug ${color ? cls[color] : "bg-slate-50 text-slate-700 border-slate-100"}`}>
        {value || "—"}
      </p>
    </div>
  );
}

export default function HistoricoEmocional() {
  const [log, setLog] = useState<EmocionalLog>({});
  const [editing, setEditing] = useState<EmocionalEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [calYear, setCalYear]   = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  useEffect(() => {
    getEmocionalLog().then(setLog).catch(console.error);
  }, []);

  const entries: EmocionalEntry[] = useMemo(() =>
    Object.values(log).sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    [log]
  );

  const streak = useMemo(() => calcStreak(log), [log]);

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
    const firstDay  = new Date(calYear, calMonth, 1);
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDow  = (firstDay.getDay() + 6) % 7;
    const todayKey  = new Date().toISOString().slice(0, 10);
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
      await deleteEmocionalEntry(entry.id);
      const updated = { ...log };
      delete updated[date];
      setLog(updated);
      setConfirmDelete(null);
    } catch (e) { console.error(e); }
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      await updateEmocionalEntry(editing.id, {
        estado:      editing.estado,
        estadoEmoji: estadoEmoji(editing.estado),
        donde:       editing.donde,
        intensidad:  editing.intensidad,
        necesidad:   editing.necesidad,
      });
      const date = new Date(editing.savedAt).toISOString().slice(0, 10);
      setLog(prev => ({ ...prev, [date]: { ...editing, estadoEmoji: estadoEmoji(editing.estado) } }));
      setEditing(null);
    } catch (e) { console.error(e); }
  }

  if (entries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-100 via-pink-50 to-fuchsia-100 flex flex-col">
        <header className="flex items-center gap-2 px-5 pt-8 pb-4 max-w-lg mx-auto w-full">
          <Link href="/registro" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/70 text-slate-600 text-lg shadow-sm">←</Link>
          <Link href="/"         className="w-9 h-9 flex items-center justify-center rounded-full bg-white/70 text-slate-600 text-lg shadow-sm">🏠</Link>
          <h1 className="text-xl font-bold text-slate-800">Log Emocional</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-4">
          <span className="text-6xl">🌸</span>
          <p className="text-slate-500 text-base font-medium">Aún no hay registros.</p>
          <Link href="/registro/emocional" className="px-6 py-3 rounded-2xl bg-rose-500 text-white font-bold shadow-md active:scale-95 transition">
            Hacer el primer registro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-fuchsia-50 pb-8">

        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-white/60 shadow-sm">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              <Link href="/registro" className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-lg">←</Link>
              <Link href="/"         className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-lg">🏠</Link>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">Log Emocional 🌸</h1>
                <p className="text-xs text-slate-400">{entries.length} registros</p>
              </div>
            </div>
            <button onClick={() => exportCSV(entries)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-200 active:scale-95 transition">
              <span>📥</span> Exportar
            </button>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 pt-5 flex flex-col gap-5">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
              <p className="text-2xl font-bold text-rose-500">{entries.length}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Registros</p>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
              <p className="text-2xl font-bold text-pink-500">{streak > 0 ? `🔥${streak}` : "0"}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Racha días</p>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
              <p className="text-2xl font-bold text-fuchsia-500">
                {Math.round((Object.keys(log).filter((k) => {
                  const d = new Date(); d.setDate(d.getDate() - 6);
                  return k >= d.toISOString().slice(0, 10);
                }).length / 7) * 100)}%
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Últ. semana</p>
            </div>
          </div>

          {/* Estado más frecuente */}
          {(() => {
            const counts: Record<string, number> = {};
            entries.forEach(e => { counts[e.estado] = (counts[e.estado] || 0) + 1; });
            const top = Object.entries(counts).sort(([,a],[,b]) => b - a)[0];
            if (!top) return null;
            return (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                <span className="text-3xl">{estadoEmoji(top[0])}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Estado más frecuente</p>
                  <p className="text-sm font-bold text-slate-700">{top[0]} · {top[1]} {top[1] === 1 ? "vez" : "veces"}</p>
                </div>
              </div>
            );
          })()}

          {/* Calendario mensual */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-sm active:scale-95 transition">←</button>
              <p className="text-sm font-semibold text-slate-700">{MONTH_NAMES[calMonth]} {calYear}</p>
              <button onClick={nextMonth} disabled={isCurrentMonth}
                className={`w-7 h-7 flex items-center justify-center rounded-full text-sm active:scale-95 transition ${isCurrentMonth ? "bg-slate-50 text-slate-300 cursor-default" : "bg-slate-100 text-slate-600"}`}>→</button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {["L","M","X","J","V","S","D"].map(l => (
                <p key={l} className="text-center text-[9px] text-slate-300 font-semibold pb-1">{l}</p>
              ))}
              {calendarCells.map((cell, i) => {
                if (!cell) return <div key={`pad-${i}`} />;
                const entry    = log[cell.key];
                const hasEntry = !!entry;
                const isToday  = cell.key === new Date().toISOString().slice(0, 10);
                return (
                  <div key={cell.key}
                    className={`aspect-square rounded-md relative flex items-center justify-center leading-none overflow-hidden ${
                      hasEntry   ? "bg-rose-300 shadow-sm shadow-rose-100"
                      : isToday  ? "border-2 border-rose-300 bg-rose-50"
                      : cell.isFuture ? "bg-white"
                      : "bg-slate-100"
                    }`}
                  >
                    <span className={`absolute top-0.5 left-1 text-[7px] font-bold leading-none z-10 ${hasEntry ? "text-white/70" : cell.isFuture ? "text-slate-200" : "text-slate-400"}`}>{cell.day}</span>
                    {hasEntry && <span className="text-[22px]">{entry.estadoEmoji || estadoEmoji(entry.estado)}</span>}
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
                <Tooltip formatter={(v: number) => [v === 1 ? "Con registro ✓" : "Sin registro", ""]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.value ? (d.isToday ? "#e11d48" : "#fb7185") : "#e2e8f0"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lista de entradas */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Entradas ({entries.length})</p>
            {entries.map((entry) => {
              const date   = new Date(entry.savedAt).toISOString().slice(0, 10);
              const isExp  = expanded === entry.id;
              const isConf = confirmDelete === entry.id;
              const d      = new Date(entry.savedAt);
              const emoji1 = entry.estadoEmoji || estadoEmoji(entry.estado);
              const firstNec = entry.necesidad[0];
              const emoji4 = firstNec ? necesidadEmoji(firstNec) : null;

              return (
                <div key={entry.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : entry.id)}
                    className="w-full text-left">

                    {/* Fila superior: estado emoji + fecha */}
                    <div className="flex items-center justify-between px-4 pt-3 pb-1">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{emoji1}</span>
                        <div>
                          <p className="text-sm font-bold text-slate-700 capitalize">
                            {d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })} · {entry.estado} · {entry.intensidad}/10
                          </p>
                        </div>
                      </div>
                      <span className={`text-slate-400 transition-transform text-lg ${isExp ? "rotate-180" : ""}`}>▾</span>
                    </div>

                    {/* Fila inferior: necesidad emoji */}
                    {emoji4 && (
                      <div className="flex items-center gap-2 px-4 pb-3">
                        <span className="text-3xl">{emoji4}</span>
                        <span className="text-xs text-slate-400 leading-snug">
                          {entry.necesidad.join(", ")}
                        </span>
                      </div>
                    )}
                  </button>

                  {isExp && (
                    <div className="px-4 pb-4 flex flex-col gap-3 border-t border-slate-100 pt-3">
                      <Field label="Estado"     value={`${emoji1} ${entry.estado}`}           color="rose" />
                      <Field label="Intensidad" value={`${entry.intensidad}/10`}               color="pink" />
                      <Field label="Dónde"      value={entry.donde.join(", ")}                color="fuchsia" />
                      <Field label="Necesidad"  value={entry.necesidad.map(n => `${necesidadEmoji(n)} ${n}`).join("  ·  ")} color="violet" />
                      {entry.mood && <Field label="Estado al guardar" value={entry.mood} />}

                      <div className="flex gap-2 mt-1">
                        <button onClick={() => setEditing({ ...entry })}
                          className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold active:scale-95 transition">
                          ✏️ Editar
                        </button>
                        {isConf ? (
                          <>
                            <button onClick={() => deleteEntry(date)}
                              className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold active:scale-95 transition">
                              Confirmar eliminación
                            </button>
                            <button onClick={() => setConfirmDelete(null)}
                              className="px-3 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold active:scale-95 transition">
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDelete(entry.id)}
                            className="flex-1 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-bold active:scale-95 transition">
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

              {/* Estado */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Estado</label>
                <div className="grid grid-cols-2 gap-2">
                  {ESTADO_OPTS.map(opt => (
                    <button key={opt.label} onClick={() => setEditing({ ...editing, estado: opt.label, estadoEmoji: opt.emoji })}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        editing.estado === opt.label ? "bg-rose-100 border-rose-400 text-rose-800 font-semibold" : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      <span className="text-xl">{opt.emoji}</span>{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensidad */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Intensidad: {editing.intensidad}/10</label>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 11 }, (_, i) => (
                    <button key={i} onClick={() => setEditing({ ...editing, intensidad: i })}
                      className={`w-10 h-10 rounded-xl text-sm font-bold border transition-all ${
                        editing.intensidad === i ? "bg-rose-500 text-white border-rose-500" : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >{i}</button>
                  ))}
                </div>
              </div>

              {/* Donde */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Dónde</label>
                <div className="flex flex-col gap-1.5">
                  {DONDE_OPTS.map(opt => (
                    <button key={opt} onClick={() => setEditing({
                      ...editing,
                      donde: editing.donde.includes(opt) ? editing.donde.filter(x => x !== opt) : [...editing.donde, opt],
                    })}
                      className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        editing.donde.includes(opt) ? "bg-pink-100 border-pink-400 text-pink-800 font-semibold" : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >{opt}</button>
                  ))}
                </div>
              </div>

              {/* Necesidad */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Necesidad</label>
                <div className="grid grid-cols-2 gap-2">
                  {NECESIDAD_OPTS.map(opt => (
                    <button key={opt.label} onClick={() => setEditing({
                      ...editing,
                      necesidad: editing.necesidad.includes(opt.label)
                        ? editing.necesidad.filter(x => x !== opt.label)
                        : [...editing.necesidad, opt.label],
                    })}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        editing.necesidad.includes(opt.label) ? "bg-fuchsia-100 border-fuchsia-400 text-fuchsia-800 font-semibold" : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      <span className="text-xl">{opt.emoji}</span>{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={saveEdit}
                className="w-full py-4 rounded-2xl bg-rose-500 text-white font-bold shadow-md shadow-rose-200 active:scale-95 transition mt-2">
                Guardar cambios ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
