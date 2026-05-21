"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SIGNALS, EMOTIONS, BODY_R, IMPULSES } from "@/lib/constants";
import { savePregEntry } from "@/lib/db";
import SnailProgress from "@/components/SnailProgress";

const TOTAL_STEPS = 6;

const STEP_LABELS = [
  "¿Qué sensación aparece?",
  "¿Qué pensamiento automático viene?",
  "¿Qué emoción se activa?",
  "¿Qué hace tu cuerpo?",
  "¿Qué impulso aparece?",
  "¿Qué necesitaría tu sistema ahora?",
];
const STEP_HINTS = [
  "Elige la sensación que reconoces ahora mismo",
  "Escribe lo primero que llega, sin filtro",
  "Una sola emoción principal",
  "¿Qué notas en el cuerpo cuando aparece la alarma?",
  "¿Qué quieres hacer de forma automática?",
  "Respira. Observa. ¿Qué necesita tu cuerpo ahora?",
];

const BG_ANIMALS = [
  { emoji: "🐿️", size: "text-4xl", dur: "2.3s", delay: "0s",   left: "5%",  top: "7%"  },
  { emoji: "🐌",  size: "text-5xl", dur: "2.1s", delay: "0.6s", left: "80%", top: "4%"  },
  { emoji: "🐱",  size: "text-5xl", dur: "2.0s", delay: "0.9s", left: "84%", top: "46%" },
  { emoji: "🐈‍⬛", size: "text-6xl", dur: "1.8s", delay: "1.2s", left: "2%",  top: "63%" },
  { emoji: "🐀",  size: "text-4xl", dur: "2.2s", delay: "1.6s", left: "74%", top: "77%" },
];

/* ── Fondo animado ─────────────────────────────────────────────────────────── */
function AnimalsBackground({ speed = false }: { speed?: boolean }) {
  return (
    <>
      {BG_ANIMALS.map((a, i) => (
        <span
          key={i}
          className={`${a.size} select-none absolute pointer-events-none opacity-15`}
          style={{
            left: a.left, top: a.top, display: "inline-block",
            animation: speed
              ? `bounce 0.7s ease-in-out ${i * 0.12}s infinite`
              : `bounce ${a.dur} ease-in-out ${a.delay} infinite`,
          }}
        >
          {a.emoji}
        </span>
      ))}
    </>
  );
}

/* ── Lista de selección única ──────────────────────────────────────────────── */
function Sel({
  options,
  value,
  onChange,
  activeClass,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  activeClass: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`text-left px-4 py-3 rounded-xl border text-sm transition-all active:scale-[0.98] ${
            value === opt ? activeClass : "bg-white border-slate-200 text-slate-600"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ── Textarea ──────────────────────────────────────────────────────────────── */
function TA({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-violet-400 resize-none bg-white leading-relaxed"
    />
  );
}

/* ── Fila del resumen final ────────────────────────────────────────────────── */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-xs text-slate-700 font-medium leading-snug">{value}</span>
    </div>
  );
}

/* ══ PÁGINA PRINCIPAL ════════════════════════════════════════════════════════ */
export default function P2() {
  const router = useRouter();

  const [step,    setStep]    = useState(0);
  const [signal,  setSignal]  = useState("");
  const [thought, setThought] = useState("");
  const [emotion, setEmotion] = useState("");
  const [body,    setBody]    = useState("");
  const [impulse, setImpulse] = useState("");
  const [need,    setNeed]    = useState("");
  const [done,    setDone]    = useState(false);
  const [saving,  setSaving]  = useState(false);

  const ok = [
    !!signal,
    !!thought.trim(),
    !!emotion,
    !!body,
    !!impulse,
    !!need.trim(),
  ][step];

  async function finish() {
    setSaving(true);
    try {
      await savePregEntry({
        situation:   thought,
        signal:      [signal],
        alarm:       [emotion],
        habitual:    [impulse],
        newResponse: [need],
        after:       [body],
        mood:        emotion,
        savedAt:     new Date().toISOString(),
      });
    } catch { /* guardar en segundo plano */ }
    setSaving(false);
    setDone(true);
  }

  function next() {
    if (!ok) return;
    if (step < TOTAL_STEPS - 1) { setStep(s => s + 1); return; }
    finish();
  }

  /* ── Celebración ── */
  if (done) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-violet-100 via-purple-50 to-fuchsia-50 flex flex-col overflow-hidden">
        <AnimalsBackground speed />
        <div className="relative z-10 flex-1 overflow-y-auto px-5 py-8">
          <div className="max-w-xs mx-auto flex flex-col items-center gap-5">
            <div className="text-8xl" style={{ animation: "bounce 0.7s ease-in-out infinite" }}>🗺️</div>
            <h2 className="text-2xl font-bold text-violet-700 text-center">¡Mapa completado!</h2>

            <div className="bg-white/85 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-lg border border-white w-full flex flex-col gap-3">
              <SummaryRow label="Sensación"   value={signal}  />
              <div className="h-px bg-slate-100"/>
              <SummaryRow label="Pensamiento" value={thought} />
              <div className="h-px bg-slate-100"/>
              <SummaryRow label="Emoción"     value={emotion} />
              <div className="h-px bg-slate-100"/>
              <SummaryRow label="Cuerpo"      value={body}    />
              <div className="h-px bg-slate-100"/>
              <SummaryRow label="Impulso"     value={impulse} />
              <div className="h-px bg-slate-100"/>
              <SummaryRow label="Necesidad"   value={need}    />
            </div>

            <div className="bg-violet-50 border border-violet-200 rounded-2xl px-5 py-4 w-full">
              <div className="flex items-start gap-2">
                <span className="text-xl shrink-0">🐌</span>
                <p className="text-sm text-violet-800 italic leading-relaxed">
                  &ldquo;Nombrar lo que pasa ya es un paso. Tu sistema empieza a calmarse cuando lo ves.&rdquo;
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/formaciones")}
              className="w-full py-4 rounded-2xl bg-violet-600 text-white font-bold shadow-lg shadow-violet-200 active:scale-95 transition"
            >
              Volver a Ejercicios
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Formulario ── */
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-violet-100 via-purple-50 to-fuchsia-50 flex flex-col overflow-hidden">
      <AnimalsBackground />

      {/* Cabecera */}
      <div className="shrink-0 bg-white/60 backdrop-blur-sm border-b border-white/50 z-10">
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <div>
            <p className="text-[10px] text-violet-600 font-bold uppercase tracking-widest">
              Práctica 02 · Mapa de hiperalerta
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{STEP_HINTS[step]}</p>
          </div>
          <Link
            href="/formaciones"
            className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold shadow-sm active:scale-95 transition"
          >
            SALIR
          </Link>
        </div>
        <SnailProgress
          step={step}
          total={TOTAL_STEPS}
          railColor="bg-violet-500"
          dotColor="bg-violet-600"
        />
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 z-10">
        <div className="max-w-lg mx-auto">
          <div className="bg-white/85 backdrop-blur-sm rounded-3xl p-5 shadow-xl shadow-violet-100/50">
            <p className="text-[10px] text-violet-500 font-bold uppercase tracking-wider mb-1">
              Paso {step + 1} de {TOTAL_STEPS}
            </p>
            <h2 className="text-lg font-bold text-slate-800 mb-4 leading-snug">
              {STEP_LABELS[step]}
            </h2>

            {/* Paso 1 — Sensación */}
            {step === 0 && (
              <Sel
                options={SIGNALS}
                value={signal}
                onChange={setSignal}
                activeClass="bg-violet-100 border-violet-400 text-violet-800 font-semibold"
              />
            )}

            {/* Paso 2 — Pensamiento */}
            {step === 1 && (
              <TA
                value={thought}
                onChange={setThought}
                placeholder="Escribe lo primero que piensas al notar la sensación…"
              />
            )}

            {/* Paso 3 — Emoción */}
            {step === 2 && (
              <Sel
                options={EMOTIONS}
                value={emotion}
                onChange={setEmotion}
                activeClass="bg-fuchsia-100 border-fuchsia-400 text-fuchsia-800 font-semibold"
              />
            )}

            {/* Paso 4 — Cuerpo */}
            {step === 3 && (
              <Sel
                options={BODY_R}
                value={body}
                onChange={setBody}
                activeClass="bg-purple-100 border-purple-400 text-purple-800 font-semibold"
              />
            )}

            {/* Paso 5 — Impulso */}
            {step === 4 && (
              <Sel
                options={IMPULSES}
                value={impulse}
                onChange={setImpulse}
                activeClass="bg-indigo-100 border-indigo-400 text-indigo-800 font-semibold"
              />
            )}

            {/* Paso 6 — Necesidad */}
            {step === 5 && (
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4">
                  <p className="text-sm text-amber-800 font-medium leading-relaxed">
                    ¿Estoy respondiendo a la señal o a la alarma alrededor de ella?
                  </p>
                </div>
                <TA
                  value={need}
                  onChange={setNeed}
                  placeholder="Una respiración lenta, notar el apoyo del suelo…"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="shrink-0 px-5 pb-10 pt-3 z-10">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-4 rounded-2xl border-2 border-white bg-white/70 text-slate-600 font-bold text-base backdrop-blur-sm active:scale-95 transition-transform"
            >
              ← Atrás
            </button>
          )}
          <button
            onClick={next}
            disabled={!ok || saving}
            className={`py-4 rounded-2xl text-white font-bold text-base shadow-lg active:scale-95 transition-all ${
              step > 0 ? "flex-[2]" : "w-full"
            } ${ok && !saving ? "bg-violet-600 shadow-violet-200" : "bg-slate-300 shadow-none"}`}
          >
            {saving ? "Guardando…"
              : step === TOTAL_STEPS - 1 ? "Completar ✓"
              : "Siguiente →"}
          </button>
        </div>
      </div>
    </div>
  );
}
