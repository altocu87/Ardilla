"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SIGNALS, ALARMS } from "@/lib/constants";
import { savePracticeLog } from "@/lib/db";
import SnailProgress from "@/components/SnailProgress";
import { getRandomRegulatoryPhrase, type RegulatoryPhrase } from "@/lib/phrases";
import { awardXp, type AwardResult } from "@/lib/profile";

const TENSION_ZONES = ["Mandíbula", "Hombros", "Manos", "Abdomen"];
const TOTAL_STEPS   = 4;

const BG_ANIMALS = [
  { emoji: "🐿️", size: "text-4xl", dur: "2.2s", delay: "0s",   left: "4%",  top: "8%"  },
  { emoji: "🐌",  size: "text-5xl", dur: "2.0s", delay: "0.5s", left: "78%", top: "5%"  },
  { emoji: "🐈",  size: "text-5xl", dur: "2.4s", delay: "0.8s", left: "82%", top: "45%" },
  { emoji: "🐈‍⬛", size: "text-6xl", dur: "1.9s", delay: "1.1s", left: "3%",  top: "65%" },
  { emoji: "🐀",  size: "text-4xl", dur: "2.1s", delay: "1.5s", left: "72%", top: "75%" },
];

const STEP_LABELS = [
  "¿Qué señal notas en el abdomen?",
  "¿Qué alarma aparece?",
  "Frase reguladora",
  "Suelta un 5% de tensión",
];
const STEP_HINTS = [
  "Elige la que más se acerca ahora mismo",
  "Elige la reacción mental que noto",
  "Lee despacio. No hace falta hacer nada más.",
  "Toca la zona donde puedes soltar un poco",
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

/* ══ PÁGINA PRINCIPAL ════════════════════════════════════════════════════════ */
export default function P1() {
  const router  = useRouter();
  const [step,    setStep]    = useState(0);
  const [signal,  setSignal]  = useState("");
  const [alarm,   setAlarm]   = useState("");
  const [tension, setTension] = useState("");
  const [done,       setDone]       = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [regulPhrase, setRegulPhrase] = useState<RegulatoryPhrase | null>(null);
  const [xpGained,   setXpGained]   = useState<AwardResult | null>(null);

  const ok = [!!signal, !!alarm, true, !!tension][step];

  async function finish() {
    setSaving(true);
    try {
      await savePracticeLog("p1", { signal, alarm, tension });
    } catch { /* no bloquear UI */ }
    try {
      const award = await awardXp("p1");
      setXpGained(award);
    } catch { /* no bloquear UI */ }
    setSaving(false);
    setRegulPhrase(getRandomRegulatoryPhrase());
    setDone(true);
  }

  function next() {
    if (!ok) return;
    if (step < TOTAL_STEPS - 1) { setStep(s => s + 1); return; }
    finish();
  }

  /* ── Celebración ── */
  if (done) {
    const categoryColors: Record<string, { bg: string; border: string; badge: string; text: string; label: string }> = {
      patitas:  { bg: "bg-orange-50",  border: "border-orange-200", badge: "bg-orange-100 text-orange-700", text: "text-orange-900", label: "text-orange-500" },
      cabeza:   { bg: "bg-sky-50",     border: "border-sky-200",    badge: "bg-sky-100 text-sky-700",       text: "text-sky-900",   label: "text-sky-500"   },
      corazon:  { bg: "bg-rose-50",    border: "border-rose-200",   badge: "bg-rose-100 text-rose-700",     text: "text-rose-900",  label: "text-rose-500"  },
    };
    const cc = regulPhrase ? (categoryColors[regulPhrase.category] ?? categoryColors.patitas) : categoryColors.patitas;

    return (
      <div className="fixed inset-0 bg-gradient-to-b from-orange-100 via-amber-50 to-yellow-50 flex flex-col overflow-hidden">
        <AnimalsBackground speed />
        <div className="relative z-10 flex-1 overflow-y-auto px-6 py-10">
          <div className="max-w-xs mx-auto flex flex-col items-center text-center gap-5">
            <div className="text-8xl" style={{ animation: "bounce 0.7s ease-in-out infinite" }}>🌟</div>
            <h2 className="text-2xl font-bold text-orange-700">¡Práctica completada!</h2>

            {/* Badge XP */}
            {xpGained && (
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-2 shadow-md border border-white">
                <span className="text-base font-bold text-teal-600">+{xpGained.xp} XP</span>
                <span className="text-slate-300">·</span>
                <span className="text-base font-bold text-amber-600">+{xpGained.bellotas} 🌰</span>
              </div>
            )}

            {/* Resumen */}
            <div className="bg-white/85 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-lg border border-white w-full text-left flex flex-col gap-3">
              <SummaryRow label="Señal"           value={signal}  />
              <div className="h-px bg-slate-100"/>
              <SummaryRow label="Alarma"          value={alarm}   />
              <div className="h-px bg-slate-100"/>
              <SummaryRow label="Tensión liberada" value={`${tension} →`} />
            </div>

            {/* Frase clásica */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 w-full">
              <p className="text-sm text-amber-800 italic leading-relaxed text-center">
                &ldquo;Esto es incómodo, pero ahora mismo puedo observarlo sin pelear.&rdquo;
              </p>
            </div>

            {/* Frase reguladora */}
            {regulPhrase && (
              <div className={`${cc.bg} ${cc.border} border-2 rounded-2xl px-5 py-4 w-full shadow-md`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{regulPhrase.emoji}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${cc.label}`}>
                    {regulPhrase.label}
                  </span>
                </div>
                <p className={`text-sm font-semibold leading-relaxed text-left ${cc.text}`}>
                  &ldquo;{regulPhrase.text}&rdquo;
                </p>
                <p className="text-[10px] text-slate-400 mt-3 text-right italic">
                  Repítela tres veces, respirando hondo 🌬️
                </p>
              </div>
            )}

            <button
              onClick={() => router.push("/formaciones")}
              className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold shadow-lg shadow-orange-200 active:scale-95 transition"
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
    <div className="fixed inset-0 bg-gradient-to-b from-orange-100 via-amber-50 to-yellow-50 flex flex-col overflow-hidden">
      <AnimalsBackground />

      {/* Cabecera */}
      <div className="shrink-0 bg-white/60 backdrop-blur-sm border-b border-white/50 z-10">
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <div>
            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">
              Práctica 01 · Señal y alarma
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{STEP_HINTS[step]}</p>
          </div>
          <button
            onClick={() => {
              const hasProgress = !!signal || !!alarm || !!tension;
              if (hasProgress && !confirm("¿Salir sin guardar? Perderás lo que llevas hecho.")) return;
              router.push("/formaciones");
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold shadow-md active:scale-95 transition"
          >
            <span className="text-base leading-none">✕</span>
            SALIR
          </button>
        </div>
        <SnailProgress
          step={step}
          total={TOTAL_STEPS}
          railColor="bg-orange-400"
          dotColor="bg-orange-500"
        />
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 z-10">
        <div className="max-w-lg mx-auto">
          <div className="bg-white/85 backdrop-blur-sm rounded-3xl p-5 shadow-xl shadow-orange-100/50">
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mb-1">
              Paso {step + 1} de {TOTAL_STEPS}
            </p>
            <h2 className="text-lg font-bold text-slate-800 mb-4 leading-snug">
              {STEP_LABELS[step]}
            </h2>

            {step === 0 && (
              <Sel
                options={SIGNALS}
                value={signal}
                onChange={setSignal}
                activeClass="bg-orange-100 border-orange-400 text-orange-800 font-semibold"
              />
            )}

            {step === 1 && (
              <Sel
                options={ALARMS}
                value={alarm}
                onChange={setAlarm}
                activeClass="bg-rose-100 border-rose-400 text-rose-800 font-semibold"
              />
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-6 text-center">
                  <p className="text-base text-amber-900 italic leading-relaxed font-medium">
                    &ldquo;Esto es incómodo, pero ahora mismo puedo observarlo sin pelear.&rdquo;
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-white/70 rounded-2xl px-4 py-3 border border-orange-100">
                  <span className="text-2xl mt-0.5">🐌</span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Lee esta frase en voz baja o en silencio. No tienes que creerla del todo. Solo observar.
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-2">
                {TENSION_ZONES.map(zone => (
                  <button
                    key={zone}
                    onClick={() => setTension(zone)}
                    className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 text-sm font-bold transition-all active:scale-[0.98] ${
                      tension === zone
                        ? "bg-orange-100 border-orange-400 text-orange-800 shadow-md shadow-orange-100"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <span>{zone}</span>
                    <span className={tension === zone ? "text-orange-500" : "text-slate-300"}>→</span>
                  </button>
                ))}
                {tension && (
                  <p className="text-[11px] text-slate-400 text-center mt-1">
                    Toca la zona, suelta el aire despacio, deja caer {tension.toLowerCase()}.
                  </p>
                )}
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
            } ${ok && !saving ? "bg-orange-500 shadow-orange-200" : "bg-slate-300 shadow-none"}`}
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-xs text-slate-700 font-medium leading-snug">{value}</span>
    </div>
  );
}
