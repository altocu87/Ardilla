"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type Log = {
  id: string;
  intensity: number;
  logged_at: string;
  signals: string[];
  emotions: string[];
  regulation: string[];
  after_effect: string[];
};

export default function Progreso() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("activity_logs")
      .select("id, intensity, logged_at, signals, emotions, regulation, after_effect")
      .order("logged_at", { ascending: true })
      .then(({ data }) => {
        setLogs((data as Log[]) ?? []);
        setLoading(false);
      });
  }, []);

  const chartData = logs.map((l) => ({
    date: new Date(l.logged_at).toLocaleDateString("es", { day: "2-digit", month: "short" }),
    intensidad: l.intensity,
  }));

  const total = logs.length;
  const avgIntensity = total
    ? Math.round((logs.reduce((s, l) => s + l.intensity, 0) / total) * 10) / 10
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">Cargando registros…</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Mi progreso</h1>
      <p className="text-sm text-slate-500 mb-6">Historial de actividades registradas.</p>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-teal-600">{total}</p>
          <p className="text-xs text-slate-500 mt-1">Registros</p>
        </div>
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-violet-600">{avgIntensity}</p>
          <p className="text-xs text-slate-500 mt-1">Intensidad media</p>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-slate-600 mb-3">Intensidad a lo largo del tiempo</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="intensidad" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {logs.length === 0 ? (
        <p className="text-center text-slate-400 text-sm py-12">Aún no hay registros. ¡Empieza tu primera actividad!</p>
      ) : (
        <div className="flex flex-col gap-3">
          {[...logs].reverse().map((l) => (
            <div key={l.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400">
                  {new Date(l.logged_at).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}
                </span>
                <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                  Intensidad {l.intensity}/10
                </span>
              </div>
              {l.emotions?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {l.emotions.map((e) => (
                    <span key={e} className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">{e}</span>
                  ))}
                </div>
              )}
              {l.regulation?.length > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  <span className="font-medium">Regulación:</span> {l.regulation.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
