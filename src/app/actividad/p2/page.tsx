"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EMOTIONS, BODY_R, IMPULSES } from "@/lib/constants";

export default function P2() {
  const router = useRouter();
  const [emotions, setEmotions] = useState<string[]>([]);
  const [bodyR, setBodyR] = useState<string[]>([]);
  const [impulses, setImpulses] = useState<string[]>([]);

  function toggle(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  function next() {
    if (emotions.length === 0) return;
    sessionStorage.setItem("p2", JSON.stringify({ emotions, bodyR, impulses }));
    router.push("/actividad/p3");
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
      <p className="text-xs text-teal-500 font-semibold uppercase tracking-widest mb-1">Paso 2 de 4</p>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">¿Cómo reacciona tu cuerpo?</h1>
      <p className="text-sm text-slate-500 mb-6">Observa sin juzgar.</p>

      <h2 className="text-sm font-semibold text-slate-600 mb-2">Emociones presentes</h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {EMOTIONS.map((e) => (
          <button
            key={e}
            onClick={() => toggle(emotions, setEmotions, e)}
            className={`px-4 py-2 rounded-full border text-sm transition ${
              emotions.includes(e)
                ? "bg-violet-100 border-violet-400 text-violet-800 font-medium"
                : "bg-white border-slate-200 text-slate-600 hover:border-violet-300"
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-600 mb-2">Respuesta corporal</h2>
      <div className="flex flex-col gap-2 mb-6">
        {BODY_R.map((b) => (
          <button
            key={b}
            onClick={() => toggle(bodyR, setBodyR, b)}
            className={`text-left px-4 py-3 rounded-xl border text-sm transition ${
              bodyR.includes(b)
                ? "bg-orange-100 border-orange-400 text-orange-800 font-medium"
                : "bg-white border-slate-200 text-slate-600 hover:border-orange-300"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-600 mb-2">Impulsos que sientes</h2>
      <div className="flex flex-col gap-2 mb-6">
        {IMPULSES.map((i) => (
          <button
            key={i}
            onClick={() => toggle(impulses, setImpulses, i)}
            className={`text-left px-4 py-3 rounded-xl border text-sm transition ${
              impulses.includes(i)
                ? "bg-rose-100 border-rose-400 text-rose-800 font-medium"
                : "bg-white border-slate-200 text-slate-600 hover:border-rose-300"
            }`}
          >
            {i}
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
          onClick={next}
          disabled={emotions.length === 0}
          className="flex-1 py-4 rounded-2xl bg-teal-600 text-white font-semibold text-base shadow-md hover:bg-teal-700 transition disabled:opacity-40"
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}
