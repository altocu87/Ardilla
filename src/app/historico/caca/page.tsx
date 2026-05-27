"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getCacaLog, updateCacaEntry, deleteCacaEntry, CacaEntry, CacaLog } from "@/lib/db";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const CANTIDAD_OPTS = ["Muy poca", "Poca", "Normal", "Mucha", "Caca de vaca", "Evento histórico"];
const CANTIDAD_ICONS: Record<string, string> = {
  "Muy poca": "🔬", "Poca": "🌱", "Normal": "💩",
  "Mucha": "💪", "Caca de vaca": "🐄", "Evento histórico": "🏆",
};
const BRISTOL_OPTS = [
  { n: 1, icon: "🪨", name: "Canicas del infierno", desc: "Bolitas secas y duras" },
  { n: 2, icon: "🪵", name: "Tronco rocoso",         desc: "Compacta y dura" },
  { n: 3, icon: "🌭", name: "Salchicha agrietada",   desc: "Bastante normal" },
  { n: 4, icon: "✨", name: "La perfecta",           desc: "Ideal · Enhorabuena" },
  { n: 5, icon: "🫧", name: "Blandiblú",             desc: "Blanda con bordes suaves" },
  { n: 6, icon: "🌊", name: "Puré marrón",           desc: "Muy blanda, sin forma" },
  { n: 7, icon: "☠️", name: "Apocalipsis",           desc: "Completamente líquida" },
];
const SENSACION_OPTS = [
  { icon: "😎", label: "Fácil" },
  { icon: "😐", label: "Normal" },
  { icon: "😰", label: "Difícil" },
  { icon: "😵", label: "He visto a Dios" },
];

type FlatEntry = CacaEntry & { date: string; idx: number };

function calcStreak(log: CacaLog): number {
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (!log[key]?.length) return i;
  }
  return 365;
}

function topBristol(entries: FlatEntry[]): { n: number; icon: string; name: string } | null {
  const counts: Record<number, number> = {};
  for (const e of entries) counts[e.bristol] = (counts[e.bristol] || 0) + 1;
  const top = Object.entries(counts).sort(([, a], [, b]) => b - a)[0];
  if (!top) return null;
  return BRISTOL_OPTS.find((b) => b.n === Number(top[0])) ?? null;
}

function exportCSV(log: CacaLog) {
  const headers = ["Fecha", "Hora", "Cantidad", "Bristol nº", "Bristol nombre", "Sensación"];
  const rows = Object.entries(log)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([, entries]) =>
      entries.map((e) => {
        const d = new Date(e.savedAt);
        return [
          d.toLocaleDateString("es"),
          d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
          `"${e.cantidad}"`, String(e.bristol), `"${e.bristolName}"`, `"${e.sensacion}"`,
        ].join(",");
      })
    );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `registro-caca-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function MultiBtn({
  options, selected, onChange, activeColor,
}: { options: string[]; selected: string; onChange: (v: string) => void; activeColor: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all active:scale-[0.98] ${
            selected === o ? activeColor : "bg-white border-slate-200 text-slate-600"
          }`}
        >{o}</button>
      ))}
    </div>
  );
}

export default function HistoricoCaca() {
  const [log, setLog] = useState<CacaLog>({});
  const [editing, setEditing] = useState<FlatEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // "date-idx"
  const [expanded, setExpanded] = useState<string | null>(null);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  useEffect(() => {
    async function load() {
      try {
        setLog(await getCacaLog());
      } catch (e) { console.error(e); }
    }
    load();
  }, []);

  const flatEntries: FlatEntry[] = useMemo(() =>
    Object.entries(log)
      .flatMap(([date, arr]) => (arr || []).map((e, idx) => ({ ...e, date, idx })))
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    [log]
  );

  const streak = useMemo(() => calcStreak(log), [log]);
  const topB = useMemo(() => topBristol(flatEntries), [flatEntries]);

  const chartData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - 13 + i);
      const key = d.toISOString().slice(0, 10);
      return {
        label: d.toLocaleDateString("es", { day: "numeric", month: "short" }),
        value: log[key]?.length ? 1 : 0,
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

  async function deleteEntry(date: string, idx: number) {
    const entry = (log[date] || [])[idx];
    if (!entry?.id) return;
    try {
      await deleteCacaEntry(entry.id);
      const updated = { ...log };
      updated[date] = (updated[date] || []).filter((_, i) => i !== idx);
      if (updated[date].length === 0) delete updated[date];
      setLog(updated);
      setConfirmDelete(null);
    } catch (e) { console.error(e); }
  }

  async function saveEdit() {
    if (!editing) return;
    const bristolData = BRISTOL_OPTS.find((b) => b.n === editing.bristol)!;
    const updated_entry: CacaEntry = {
      ...editing,
      bristolName: bristolData.name,
      bristolIcon: bristolData.icon,
    };
    try {
      await updateCacaEntry(editing.id, {
        cantidad: editing.cantidad,
        bristol: editing.bristol,
        bristolName: bristolData.name,
        bristolIcon: bristolData.icon,
        sensacion: editing.sensacion,
      });
      const updated = { ...log };
      updated[editing.date] = (updated[editing.date] || []).map((e, i) =>
        i === editing.idx ? updated_entry : e
      );
      setLog(updated);
      setEditing(null);
    } catch (e) { console.error(e); }
  }

  if (flatEntries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-100 via-orange-50 to-yellow-50 flex flex-col">
        <header className="flex items-center gap-2 px-5 pt-8 pb-4 max-w-lg mx-auto w-full">
          <Link href="/registro" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/70 text-slate-600 text-lg shadow-sm">←</Link>
          <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/70 text-slate-600 text-lg shadow-sm">🏠</Link>
          <h1 className="text-xl font-bold text-slate-800">Log de Caca</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-4">
          <span className="text-6xl">🐱</span>
          <p className="text-slate-500 text-base font-medium">Aún no hay registros.</p>
          <Link href="/registro/caca" className="px-6 py-3 rounded-2xl bg-amber-500 text-white font-bold shadow-md active:scale-95 transition">
            Hacer el primer registro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 pb-8">

        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-white/60 shadow-sm">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              <Link href="/registro" className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-lg">←</Link>
              <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-lg">🏠</Link>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">Log de Caca 💩</h1>
                <p className="text-xs text-slate-400">{flatEntries.length} registros</p>
              </div>
            </div>
            <button onClick={() => exportCSV(log)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-200 active:scale-95 transition">
              <span>📥</span> Exportar
            </button>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 pt-5 flex flex-col gap-5">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
              <p className="text-2xl font-bold text-amber-600">{flatEntries.length}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Registros</p>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
              <p className="text-2xl font-bold text-orange-500">{streak > 0 ? `🔥${streak}` : "0"}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Racha días</p>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
              <p className="text-2xl font-bold text-yellow-600">
                {Math.round((Object.keys(log).filter((k) => {
                  const d = new Date(); d.setDate(d.getDate() - 6);
                  return k >= d.toISOString().slice(0, 10);
                }).length / 7) * 100)}%
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Últ. semana</p>
            </div>
          </div>

          {/* Bristol más frecuente */}
          {topB && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
              <span className="text-3xl">{topB.icon}</span>
              <div>
                <p className="text-xs font-semibold text-slate-400">Bristol más frecuente</p>
                <p className="text-sm font-bold text-slate-700">{topB.n} · {topB.name}</p>
              </div>
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
                const dayEntries = log[cell.key] ?? [];
                const hasEntry = dayEntries.length > 0;
                const isToday = cell.key === new Date().toISOString().slice(0, 10);
                const icons = dayEntries.slice(0, 4).map(e => e.bristolIcon);
                const QUADRANTS = [
                  "absolute top-0 left-0 w-1/2 h-1/2 flex items-center justify-center",
                  "absolute top-0 right-0 w-1/2 h-1/2 flex items-center justify-center",
                  "absolute bottom-0 left-0 w-1/2 h-1/2 flex items-center justify-center",
                  "absolute bottom-0 right-0 w-1/2 h-1/2 flex items-center justify-center",
                ] as const;
                return (
                  <div key={cell.key} title={cell.key}
                    className={`aspect-square rounded-md relative flex items-center justify-center leading-none overflow-hidden ${
                      hasEntry ? "bg-amber-300 shadow-sm shadow-amber-100"
                      : isToday ? "border-2 border-amber-300 bg-amber-50"
                      : cell.isFuture ? "bg-white"
                      : "bg-slate-100"
                    }`}
                  >
                    <span className={`absolute top-0.5 left-1 text-[7px] font-bold leading-none z-10 ${icons.length > 1 ? "invisible" : ""} ${hasEntry ? "text-white/70" : cell.isFuture ? "text-slate-200" : "text-slate-400"}`}>{cell.day}</span>
                    {icons.length === 1 && <span className="text-[26px]">{icons[0]}</span>}
                    {icons.length > 1 && icons.map((icon, ci) => (
                      <span key={ci} className={`${QUADRANTS[ci]} text-[24px] leading-none`}>{icon}</span>
                    ))}
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
                    <Cell key={i} fill={d.value ? (d.isToday ? "#d97706" : "#fcd34d") : "#e2e8f0"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lista de entradas */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Entradas ({flatEntries.length})</p>
            {flatEntries.map((entry) => {
              const key = `${entry.date}-${entry.idx}`;
              const isExpanded = expanded === key;
              const isConfirming = confirmDelete === key;
              const d = new Date(entry.savedAt);
              return (
                <div key={key} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <button onClick={() => setExpanded(isExpanded ? null : key)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{entry.bristolIcon}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-700 capitalize">
                          {d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })} · {entry.bristolName}
                        </p>
                      </div>
                    </div>
                    <span className={`text-slate-400 transition-transform text-lg ${isExpanded ? "rotate-180" : ""}`}>▾</span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 flex flex-col gap-3 border-t border-slate-100 pt-3">
                      <Field label="Cantidad"  value={`${CANTIDAD_ICONS[entry.cantidad] ?? ""} ${entry.cantidad}`} color="amber" />
                      <Field label="Bristol"   value={`${entry.bristolIcon} ${entry.bristol} · ${entry.bristolName}`} color="orange" />
                      <Field label="Sensación" value={`${SENSACION_OPTS.find(s => s.label === entry.sensacion)?.icon ?? ""} ${entry.sensacion}`} color="rose" />

                      <div className="flex gap-2 mt-1">
                        <button onClick={() => setEditing({ ...entry })}
                          className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold active:scale-95 transition">
                          ✏️ Editar
                        </button>
                        {isConfirming ? (
                          <>
                            <button onClick={() => deleteEntry(entry.date, entry.idx)}
                              className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold active:scale-95 transition">
                              Confirmar eliminación
                            </button>
                            <button onClick={() => setConfirmDelete(null)}
                              className="px-3 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold active:scale-95 transition">
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDelete(key)}
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
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Cantidad</label>
                <MultiBtn options={CANTIDAD_OPTS} selected={editing.cantidad}
                  onChange={(v) => setEditing({ ...editing, cantidad: v })}
                  activeColor="bg-amber-100 border-amber-400 text-amber-800 font-semibold border" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Bristol</label>
                <div className="flex flex-col gap-1.5">
                  {BRISTOL_OPTS.map((b) => (
                    <button key={b.n} onClick={() => setEditing({ ...editing, bristol: b.n })}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        editing.bristol === b.n ? "bg-orange-100 border-orange-400 text-orange-800 font-semibold" : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      <span className="text-xl">{b.icon}</span>
                      <span>{b.n} · {b.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Sensación</label>
                <div className="grid grid-cols-2 gap-2">
                  {SENSACION_OPTS.map((s) => (
                    <button key={s.label} onClick={() => setEditing({ ...editing, sensacion: s.label })}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        editing.sensacion === s.label ? "bg-rose-100 border-rose-400 text-rose-800 font-semibold" : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      <span className="text-xl">{s.icon}</span> {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={saveEdit}
                className="w-full py-4 rounded-2xl bg-amber-500 text-white font-bold shadow-md shadow-amber-200 active:scale-95 transition mt-2">
                Guardar cambios ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, value, color }: { label: string; value: string; color?: "amber" | "orange" | "rose" }) {
  const cls: Record<string, string> = {
    amber:  "bg-amber-50 text-amber-800 border-amber-100",
    orange: "bg-orange-50 text-orange-800 border-orange-100",
    rose:   "bg-rose-50 text-rose-800 border-rose-100",
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
