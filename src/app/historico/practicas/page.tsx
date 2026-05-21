"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getPracticeLogs, deletePracticeLog, type PracticeLogEntry, type PracticeType } from "@/lib/db";

const PRACTICE_INFO: Record<PracticeType, {
  label: string; short: string; emoji: string; accent: string; bg: string; border: string;
}> = {
  p1: { label: "Práctica 1 · Señal y alarma",      short: "P1", emoji: "🟠",
        accent: "text-orange-600", bg: "bg-orange-50",  border: "border-orange-200" },
  p2: { label: "Práctica 2 · Mapa de hiperalerta", short: "P2", emoji: "🟣",
        accent: "text-violet-600", bg: "bg-violet-50",  border: "border-violet-200" },
  p3: { label: "Práctica 3 · Orientación suave",   short: "P3", emoji: "🟢",
        accent: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
};

const P3_TASK_LABELS: Record<string, string> = {
  orient:  "Mirar y nombrar 5 cosas",
  support: "Notar 3 puntos de apoyo",
  exhale:  "Exhalar largo",
  release: "Aflojar un 5%",
  phrase:  "Frase de presencia",
  return:  "Volver a la actividad",
};

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
  };
}

function exportCSV(entries: PracticeLogEntry[]) {
  const headers = ["Fecha", "Hora", "Práctica", "Datos (JSON)"];
  const rows = entries.map(e => {
    const d = new Date(e.loggedAt);
    return [
      d.toLocaleDateString("es"),
      d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
      e.practice.toUpperCase(),
      `"${JSON.stringify(e.data).replace(/"/g, '""')}"`,
    ].join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `practicas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Renderiza el contenido específico de una entrada según la práctica ─── */
function EntryContent({ entry }: { entry: PracticeLogEntry }) {
  const d = entry.data;

  if (entry.practice === "p1") {
    return (
      <div className="flex flex-col gap-2 text-xs">
        <DataRow label="Señal"   value={String(d.signal  ?? "—")} />
        <DataRow label="Alarma"  value={String(d.alarm   ?? "—")} />
        <DataRow label="Tensión liberada" value={String(d.tension ?? "—")} />
      </div>
    );
  }

  if (entry.practice === "p2") {
    return (
      <div className="flex flex-col gap-2 text-xs">
        <DataRow label="Sensación"   value={String(d.signal  ?? "—")} />
        <DataRow label="Pensamiento" value={String(d.thought ?? "—")} />
        <DataRow label="Emoción"     value={String(d.emotion ?? "—")} />
        <DataRow label="Cuerpo"      value={String(d.body    ?? "—")} />
        <DataRow label="Impulso"     value={String(d.impulse ?? "—")} />
        <DataRow label="Necesidad"   value={String(d.need    ?? "—")} />
      </div>
    );
  }

  if (entry.practice === "p3") {
    const completed = (d.completedTasks as string[] | undefined) ?? [];
    const total     = (d.totalTasks as number | undefined) ?? 6;
    return (
      <div className="flex flex-col gap-1 text-xs">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          {completed.length} / {total} pasos
        </p>
        {completed.map(k => (
          <div key={k} className="flex items-center gap-2">
            <span className="text-emerald-500 font-bold">✓</span>
            <span className="text-slate-600">{P3_TASK_LABELS[k] ?? k}</span>
          </div>
        ))}
      </div>
    );
  }

  return <pre className="text-[10px] text-slate-400 overflow-x-auto">{JSON.stringify(d, null, 2)}</pre>;
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-xs text-slate-700 font-medium leading-snug">{value}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
export default function HistoricoPracticas() {
  const [entries,        setEntries]        = useState<PracticeLogEntry[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [filter,         setFilter]         = useState<"all" | PracticeType>("all");
  const [expandedId,     setExpandedId]     = useState<string | null>(null);
  const [confirmDelete,  setConfirmDelete]  = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const data = await getPracticeLogs();
      setEntries(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter(e => e.practice === filter);
  }, [entries, filter]);

  const counts = useMemo(() => {
    const c: Record<PracticeType, number> = { p1: 0, p2: 0, p3: 0 };
    for (const e of entries) c[e.practice]++;
    return c;
  }, [entries]);

  async function handleDelete(id: string) {
    try {
      await deletePracticeLog(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      setConfirmDelete(null);
    } catch (e) { console.error(e); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-fuchsia-50 to-rose-50 pb-20">
      <div className="max-w-lg mx-auto px-4 pt-6">

        {/* Cabecera */}
        <header className="flex items-center gap-3 mb-5">
          <Link href="/formaciones" className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-slate-600 text-lg shadow-sm">←</Link>
          <div className="flex-1">
            <p className="text-[10px] text-violet-500 font-bold uppercase tracking-widest">Histórico</p>
            <h1 className="text-xl font-bold text-slate-800">Prácticas realizadas</h1>
          </div>
          <button onClick={() => exportCSV(filtered)} disabled={filtered.length === 0}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              filtered.length === 0 ? "bg-slate-200 text-slate-400" : "bg-violet-600 text-white shadow-sm"
            }`}>
            📥 CSV
          </button>
        </header>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(["p1", "p2", "p3"] as const).map(p => (
            <div key={p} className={`${PRACTICE_INFO[p].bg} ${PRACTICE_INFO[p].border} border rounded-2xl px-3 py-3 text-center`}>
              <p className="text-2xl">{PRACTICE_INFO[p].emoji}</p>
              <p className={`text-lg font-bold ${PRACTICE_INFO[p].accent}`}>{counts[p]}</p>
              <p className="text-[10px] text-slate-500 font-medium">{PRACTICE_INFO[p].short}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-4 bg-white rounded-xl p-1 shadow-sm">
          {(["all", "p1", "p2", "p3"] as const).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === t ? "bg-violet-100 text-violet-700 shadow-sm" : "text-slate-400"
              }`}>
              {t === "all" ? "Todas" : t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-center text-sm text-slate-400 py-8">Cargando…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white/60 rounded-2xl">
            <p className="text-5xl mb-2">🐌</p>
            <p className="text-sm text-slate-500 font-medium">Sin prácticas registradas aún</p>
            <Link href="/formaciones" className="inline-block mt-3 text-xs text-violet-600 font-bold underline">
              Ir a Ejercicios →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(entry => {
              const info = PRACTICE_INFO[entry.practice];
              const { date, time } = formatDateTime(entry.loggedAt);
              const expanded = expandedId === entry.id;
              return (
                <div key={entry.id} className={`${info.bg} ${info.border} border rounded-2xl overflow-hidden`}>
                  <button onClick={() => setExpandedId(expanded ? null : entry.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left active:scale-[0.99] transition-transform">
                    <span className="text-2xl">{info.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${info.accent} truncate`}>{info.label}</p>
                      <p className="text-[10px] text-slate-500">{date} · {time}</p>
                    </div>
                    <span className={`text-slate-400 text-lg transition-transform ${expanded ? "rotate-180" : ""}`}>▾</span>
                  </button>
                  {expanded && (
                    <div className="px-4 pb-4 border-t border-white/60 pt-3 bg-white/50">
                      <EntryContent entry={entry} />
                      <div className="flex justify-end mt-3">
                        {confirmDelete === entry.id ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleDelete(entry.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[11px] font-bold active:scale-95">
                              Confirmar borrar
                            </button>
                            <button onClick={() => setConfirmDelete(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold active:scale-95">
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(entry.id)}
                            className="text-[11px] text-red-400 hover:text-red-600 font-semibold">
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
        )}
      </div>
    </div>
  );
}
