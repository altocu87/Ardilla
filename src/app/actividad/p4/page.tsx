"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AFTER } from "@/lib/constants";
import { createClient } from "@/lib/supabase";

export default function P4() {
  const router = useRouter();
  const [after, setAfter] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  function toggle(val: string) {
    setAfter((prev) =>
      prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
    );
  }

  async function save() {
    if (after.length === 0) return;
    setSaving(true);
    try {
      const p1 = JSON.parse(sessionStorage.getItem("p1") || "{}");
      const p2 = JSON.parse(sessionStorage.getItem("p2") || "{}");
      const p3 = JSON.parse(sessionStorage.getItem("p3") || "{}");

      const supabase = createClient();
      const { error } = await supabase.from("activity_logs").insert([
        {
          signals: p1.signals ?? [],
          alarms: p1.alarms ?? [],
          intensity: p1.intensity ?? 5,
          emotions: p2.emotions ?? [],
          body_reactions: p2.bodyR ?? [],
          impulses: p2.impulses ?? [],
          regulation: p3.regulat ?? [],
          notes: p3.notes ?? "",
          after_effect: after,
          logged_at: new Date().toISOString(),
        },
      ]);

      if (!error) {
        sessionStorage.removeItem("p1");
        sessionStorage.removeItem("p2");
        sessionStorage.removeItem("p3");
        setDone(true);
      } else {
        alert("Error al guardar: " + error.message);
      }
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-teal-700 mb-2">¡Registro guardado!</h2>
        <p className="text-slate-500 text-sm mb-8">Bien hecho. Cada registro cuenta.</p>
        <button
          onClick={() => router.push("/")}
          className="w-full max-w-xs py-4 rounded-2xl bg-teal-600 text-white font-semibold shadow-md hover:bg-teal-700 transition"
        >
          Volver al inicio
        </button>
        <button
          onClick={() => router.push("/progreso")}
          className="mt-3 w-full max-w-xs py-4 rounded-2xl border border-teal-200 text-teal-700 font-semibold hover:bg-teal-50 transition"
        >
          Ver mi progreso
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
      <p className="text-xs text-teal-500 font-semibold uppercase tracking-widest mb-1">Paso 4 de 4</p>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">¿Cómo te quedaste?</h1>
      <p className="text-sm text-slate-500 mb-6">¿Notaste algún efecto de lo que hiciste?</p>

      <div className="flex flex-col gap-2 mb-8">
        {AFTER.map((a) => (
          <button
            key={a}
            onClick={() => toggle(a)}
            className={`text-left px-4 py-3 rounded-xl border text-sm transition ${
              after.includes(a)
                ? "bg-sky-100 border-sky-400 text-sky-800 font-medium"
                : "bg-white border-slate-200 text-slate-600 hover:border-sky-300"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-base hover:bg-slate-100 transition"
        >
          ← Atrás
        </button>
        <button
          onClick={save}
          disabled={after.length === 0 || saving}
          className="flex-1 py-4 rounded-2xl bg-teal-600 text-white font-semibold text-base shadow-md hover:bg-teal-700 transition disabled:opacity-40"
        >
          {saving ? "Guardando…" : "Guardar ✓"}
        </button>
      </div>
    </div>
  );
}
