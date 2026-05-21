"use client";
import Link from "next/link";
import { useState } from "react";

const BRISTOL = [
  { type: 1, emoji: "🟤", label: "Tipo 1", desc: "Bolitas duras y separadas", nota: "Estreñimiento severo", color: "#7c3aed" },
  { type: 2, emoji: "🟤", label: "Tipo 2", desc: "Con forma pero superficie irregular y grumosa", nota: "Estreñimiento leve", color: "#92400e" },
  { type: 3, emoji: "🟡", label: "Tipo 3", desc: "Con forma y grietas en la superficie", nota: "Normal-duro", color: "#b45309" },
  { type: 4, emoji: "🟢", label: "Tipo 4 ✓", desc: "Continua, suave y bien formada", nota: "¡Ideal!", color: "#16a34a" },
  { type: 5, emoji: "🟡", label: "Tipo 5", desc: "Trozos blandos con bordes bien definidos", nota: "Tendencia blanda", color: "#ca8a04" },
  { type: 6, emoji: "🟠", label: "Tipo 6", desc: "Esponjosa, con bordes irregulares", nota: "Diarrea leve", color: "#ea580c" },
  { type: 7, emoji: "🔴", label: "Tipo 7", desc: "Líquida o acuosa, sin partes sólidas", nota: "Diarrea", color: "#dc2626" },
];

const MODULOS = [
  { icon: "🧠", title: "¿Qué son las emociones?", desc: "Las emociones son respuestas del organismo, no problemas ni debilidades. Tienen tres capas: señales corporales, impulso de acción y narrativa mental.", color: "#0d9488" },
  { icon: "💡", title: "La función de las emociones", desc: "Cada emoción (miedo, rabia, tristeza, alegría…) tiene una función adaptativa. Reconocerla ayuda a entender qué necesitas.", color: "#7c3aed" },
  { icon: "🫀", title: "Cómo se sienten en el cuerpo", desc: "El cuerpo habla antes que la mente. Aprender a leer sus señales es la base para regular las emociones con más seguridad.", color: "#dc2626" },
  { icon: "🪜", title: "Acercarte sin desbordarte", desc: "Un método de 6 pasos para acercarte a lo que sientes poco a poco: seguridad, sensación, intensidad, necesidad, microdosis y etiqueta suave.", color: "#d97706" },
];

type Section = "bristol" | "modulos" | "app" | null;

export default function Informacion() {
  const [open, setOpen] = useState<Section>(null);

  function toggle(s: Section) {
    setOpen(prev => (prev === s ? null : s));
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">

      {/* Header */}
      <header className="px-4 pt-14 pb-6 bg-white border-b border-slate-100 sticky top-0 z-10">
        <Link href="/" className="text-slate-400 text-sm mb-3 block">← Inicio</Link>
        <h1 className="text-2xl font-bold text-slate-800">Información</h1>
      </header>

      <div className="px-4 pt-5 flex flex-col gap-3 max-w-lg mx-auto">

        {/* ── Sobre la app ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => toggle("app")}
            className="w-full flex items-center gap-4 px-5 py-4 text-left"
          >
            <span className="text-3xl">🌿</span>
            <div className="flex-1">
              <p className="font-bold text-slate-800">Sobre esta app</p>
              <p className="text-xs text-slate-400">Qué es y cómo usarla</p>
            </div>
            <span className="text-slate-300 text-lg transition-transform duration-200"
              style={{ transform: open === "app" ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
          </button>

          {open === "app" && (
            <div className="px-5 pb-5 border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                Esta app es una herramienta de apoyo terapéutico para ayudarte a conectar con tus emociones, registrar cómo te sientes y aprender a regularte poco a poco.
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">✏️</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Registro Vicky</p>
                    <p className="text-xs text-slate-500">Anota señales físicas, emociones, impulsos y estrategias de regulación que has usado.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">💩</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Registro Caca</p>
                    <p className="text-xs text-slate-500">Control diario del tránsito intestinal usando la Escala de Bristol.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">🎓</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Ejercicios</p>
                    <p className="text-xs text-slate-500">Cuatro módulos psicoeducativos para entender tus emociones y aprender a regularte.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Escala de Bristol ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => toggle("bristol")}
            className="w-full flex items-center gap-4 px-5 py-4 text-left"
          >
            <span className="text-3xl">💩</span>
            <div className="flex-1">
              <p className="font-bold text-slate-800">Escala de Bristol</p>
              <p className="text-xs text-slate-400">Los 7 tipos de heces y qué significan</p>
            </div>
            <span className="text-slate-300 text-lg transition-transform duration-200"
              style={{ transform: open === "bristol" ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
          </button>

          {open === "bristol" && (
            <div className="pb-4 border-t border-slate-100">
              {BRISTOL.map(b => (
                <div key={b.type} className="flex items-center gap-4 px-5 py-3 border-b border-slate-50 last:border-0">
                  {/* Indicador de color */}
                  <div
                    className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: b.color }}
                  >
                    {b.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{b.label}</p>
                    <p className="text-xs text-slate-500 truncate">{b.desc}</p>
                  </div>
                  <span
                    className="text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full"
                    style={{ color: b.color, background: b.color + "18" }}
                  >
                    {b.nota}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Módulos de ejercicios ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => toggle("modulos")}
            className="w-full flex items-center gap-4 px-5 py-4 text-left"
          >
            <span className="text-3xl">🎓</span>
            <div className="flex-1">
              <p className="font-bold text-slate-800">Los 4 ejercicios</p>
              <p className="text-xs text-slate-400">Qué aprenderás en cada módulo</p>
            </div>
            <span className="text-slate-300 text-lg transition-transform duration-200"
              style={{ transform: open === "modulos" ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
          </button>

          {open === "modulos" && (
            <div className="pb-4 border-t border-slate-100">
              {MODULOS.map((m, i) => (
                <div key={i} className="flex gap-4 px-5 py-4 border-b border-slate-50 last:border-0">
                  <div
                    className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center text-xl"
                    style={{ background: m.color + "20" }}
                  >
                    {m.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 mb-0.5">{m.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
              <div className="px-5 pt-3">
                <Link
                  href="/formaciones"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white font-semibold text-sm active:scale-95 transition-transform"
                  style={{ background: "#7c3aed" }}
                >
                  Ir a Ejercicios →
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
