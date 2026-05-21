"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SIGNALS, ALARMS } from "@/lib/constants";

export default function P1() {
  const router = useRouter();
  const [signals, setSignals] = useState<string[]>([]);
  const [alarms, setAlarms] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(5);

  function toggle(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  function next() {
    if (signals.length === 0) return;
    sessionStorage.setItem("p1", JSON.stringify({ signals, alarms, intensity }));
    router.push("/actividad/p2");
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
      <p className="text-xs text-teal-500 font-semibold uppercase tracking-widest mb-1">Paso 1 de 4</p>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">¿Qué señales notas?</h1>
      <p className="text-sm text-slate-500 mb-6">Marca todo lo que sientes en este momento.</p>

      <h2 className="text-sm font-semibold text-slate-600 mb-2">Señales físicas</h2>
      <div className="flex flex-col gap-2 mb-6">
        {SIGNALS.map((s) => (
          <button
            key={s}
            onClick={() => toggle(signals, setSignals, s)}
            className={`text-left px-4 py-3 rounded-xl border text-sm transition ${
              signals.includes(s)
                ? "bg-teal-100 border-teal-400 text-teal-800 font-medium"
                : "bg-white border-slate-200 text-slate-600 hover:border-teal-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-600 mb-2">Señales de alarma</h2>
      <div className="flex flex-col gap-2 mb-6">
        {ALARMS.map((a) => (
          <button
            key={a}
            onClick={() => toggle(alarms, setAlarms, a)}
            className={`text-left px-4 py-3 rounded-xl border text-sm transition ${
              alarms.includes(a)
                ? "bg-rose-100 border-rose-400 text-rose-800 font-medium"
                : "bg-white border-slate-200 text-slate-600 hover:border-rose-300"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-600 mb-2">
        Intensidad general: <span className="text-teal-600 font-bold">{intensity}/10</span>
      </h2>
      <input
        type="range"
        min={1}
        max={10}
        value={intensity}
        onChange={(e) => setIntensity(Number(e.target.value))}
        className="w-full accent-teal-600 mb-8"
      />

      <button
        onClick={next}
        disabled={signals.length === 0}
        className="w-full py-4 rounded-2xl bg-teal-600 text-white font-semibold text-base shadow-md hover:bg-teal-700 transition disabled:opacity-40"
      >
        Continuar →
      </button>
    </div>
  );
}
