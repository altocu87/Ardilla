"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

const BADGE_DEFINITIONS = [
  { key: "first_log", icon: "🌱", title: "Primer paso", description: "Completaste tu primer registro." },
  { key: "five_logs", icon: "⭐", title: "5 registros", description: "Llevas 5 actividades registradas." },
  { key: "ten_logs", icon: "🌟", title: "10 registros", description: "10 actividades completadas. ¡Increíble!" },
  { key: "regulator", icon: "🧘", title: "Reguladora", description: "Usaste 3 estrategias de regulación en un registro." },
  { key: "observer", icon: "👁️", title: "Observadora", description: "Marcaste 5 señales físicas en un registro." },
  { key: "consistent", icon: "🗓️", title: "Constancia", description: "Registraste 3 días seguidos." },
];

export default function Recompensas() {
  const [counts, setCounts] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("activity_logs")
      .select("id", { count: "exact" })
      .then(({ count }) => {
        setCounts({ total: count ?? 0 });
        setLoading(false);
      });
  }, []);

  function isUnlocked(key: string): boolean {
    const { total } = counts;
    if (key === "first_log") return total >= 1;
    if (key === "five_logs") return total >= 5;
    if (key === "ten_logs") return total >= 10;
    return false;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">Cargando logros…</p>
      </div>
    );
  }

  const unlocked = BADGE_DEFINITIONS.filter((b) => isUnlocked(b.key));
  const locked = BADGE_DEFINITIONS.filter((b) => !isUnlocked(b.key));

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Mis logros</h1>
      <p className="text-sm text-slate-500 mb-6">
        {unlocked.length} de {BADGE_DEFINITIONS.length} logros desbloqueados
      </p>

      <div className="w-full bg-slate-200 rounded-full h-2 mb-8">
        <div
          className="bg-amber-400 h-2 rounded-full transition-all"
          style={{ width: `${(unlocked.length / BADGE_DEFINITIONS.length) * 100}%` }}
        />
      </div>

      {unlocked.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-slate-600 mb-3">Desbloqueados ✅</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {unlocked.map((b) => (
              <div key={b.key} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center shadow-sm">
                <div className="text-4xl mb-2">{b.icon}</div>
                <p className="text-sm font-semibold text-amber-800">{b.title}</p>
                <p className="text-xs text-amber-600 mt-1">{b.description}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {locked.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-slate-600 mb-3">Por desbloquear 🔒</h2>
          <div className="grid grid-cols-2 gap-3">
            {locked.map((b) => (
              <div key={b.key} className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-center opacity-60">
                <div className="text-4xl mb-2 grayscale">{b.icon}</div>
                <p className="text-sm font-semibold text-slate-500">{b.title}</p>
                <p className="text-xs text-slate-400 mt-1">{b.description}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
