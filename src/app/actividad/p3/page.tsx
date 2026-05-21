"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { REGULAT } from "@/lib/constants";

export default function P3() {
  const router = useRouter();
  const [regulat, setRegulat] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  function toggle(val: string) {
    setRegulat((prev) =>
      prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
    );
  }

  function next() {
    if (regulat.length === 0) return;
    sessionStorage.setItem("p3", JSON.stringify({ regulat, notes }));
    router.push("/actividad/p4");
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
      <p className="text-xs text-teal-500 font-semibold uppercase tracking-widest mb-1">Paso 3 de 4</p>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">¿Qué hiciste para regularte?</h1>
      <p className="text-sm text-slate-500 mb-6">Marca las estrategias que aplicaste.</p>

      <div className="flex flex-col gap-2 mb-6">
        {REGULAT.map((r) => (
          <button
            key={r}
            onClick={() => toggle(r)}
            className={`text-left px-4 py-3 rounded-xl border text-sm transition ${
              regulat.includes(r)
                ? "bg-emerald-100 border-emerald-400 text-emerald-800 font-medium"
                : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-600 mb-2">Notas adicionales (opcional)</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        placeholder="¿Algo más que quieras anotar?"
        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-400 resize-none mb-8"
      />

      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-base hover:bg-slate-100 transition"
        >
          ← Atrás
        </button>
        <button
          onClick={next}
          disabled={regulat.length === 0}
          className="flex-1 py-4 rounded-2xl bg-teal-600 text-white font-semibold text-base shadow-md hover:bg-teal-700 transition disabled:opacity-40"
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}
