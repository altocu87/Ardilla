"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SIGNALS, ALARMS, REGULAT, AFTER } from "@/lib/constants";
import { getPregLog, savePregEntry, updatePregEntry } from "@/lib/db";
import { awardXp } from "@/lib/profile";

const DEFAULT_PHRASES = [
  "Cada vez que observas, le quitas poder al síntoma 🌱",
  "Observar no es sufrir, es aprender 💙",
  "Tu sistema nervioso puede aprender calma 🌿",
  "El malestar es temporal, tu capacidad de regularte es permanente ⭐",
  "Hoy también lo intentaste. Eso cuenta 🤍",
  "Notar ya es avanzar 🐌",
  "Cada pequeño paso suma 💪",
  "¡Hola Vicky! Te queremos mucho 🌟",
  "Eres más fuerte de lo que crees 🌸",
  "Cuidarte es lo más valiente que puedes hacer 🦋",
];

function getRandomPhrase(): string {
  try {
    const custom: string[] = JSON.parse(localStorage.getItem("custom_phrases") || "[]");
    const pool = [...DEFAULT_PHRASES, ...custom];
    return pool[Math.floor(Math.random() * pool.length)];
  } catch {
    return DEFAULT_PHRASES[0];
  }
}

const HABITUAL = [
  "Vigilar y comprobar",
  "Pelear contra el síntoma",
  "Controlar la alimentación",
  "Evitar actividades",
  "Buscar soluciones inmediatas",
  "Aislarme",
];

const BG_ANIMALS = [
  { emoji: "🐌", size: "text-4xl", dur: "2.2s", delay: "0s",   left: "6%",  top: "12%" },
  { emoji: "🐿️", size: "text-5xl", dur: "1.9s", delay: "0.4s", left: "78%", top: "7%"  },
  { emoji: "🐱",  size: "text-5xl", dur: "2.0s", delay: "0.6s", left: "82%", top: "44%" },
  { emoji: "🐈",  size: "text-6xl", dur: "2.4s", delay: "0.8s", left: "4%",  top: "62%" },
  { emoji: "🐈‍⬛", size: "text-6xl", dur: "2.1s", delay: "1.1s", left: "72%", top: "72%" },
];

const MOODS = [
  { emoji: "😴", label: "Cansada" },
  { emoji: "😢", label: "Triste"  },
  { emoji: "😐", label: "Normal"  },
  { emoji: "😊", label: "Satisfecha" },
  { emoji: "😄", label: "Contenta"   },
];

type FormData = {
  situation: string;
  signal: string[];
  alarm: string[];
  habitual: string[];
  newResponse: string[];
  after: string[];
};

const EMPTY: FormData = {
  situation: "", signal: [], alarm: [], habitual: [], newResponse: [], after: [],
};

type Step = {
  key: keyof FormData;
  label: string;
  type: "textarea" | "buttons";
  placeholder?: string;
  options?: string[];
  color?: string;
  activeColor?: string;
};

const STEPS: Step[] = [
  { key: "situation", label: "¿Dónde estabas y qué hacías?", type: "textarea", placeholder: "Ej: en casa trabajando, en el transporte…" },
  { key: "signal",    label: "¿Qué notaste en el abdomen?",  type: "buttons", options: SIGNALS,  color: "border-slate-200 text-slate-600", activeColor: "bg-teal-100 border-teal-400 text-teal-800 font-semibold" },
  { key: "alarm",     label: "¿Qué pensamiento, emoción o impulso apareció?", type: "buttons", options: ALARMS, color: "border-slate-200 text-slate-600", activeColor: "bg-rose-100 border-rose-400 text-rose-800 font-semibold" },
  { key: "habitual",  label: "¿Qué hiciste?", type: "buttons", options: HABITUAL, color: "border-slate-200 text-slate-600", activeColor: "bg-orange-100 border-orange-400 text-orange-800 font-semibold" },
  { key: "newResponse", label: "¿Qué probé para reducir la alarma?", type: "buttons", options: REGULAT, color: "border-slate-200 text-slate-600", activeColor: "bg-violet-100 border-violet-400 text-violet-800 font-semibold" },
  { key: "after",     label: "¿Hubo algún cambio?", type: "buttons", options: AFTER, color: "border-slate-200 text-slate-600", activeColor: "bg-sky-100 border-sky-400 text-sky-800 font-semibold" },
];


function Dots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {STEPS.map((_, i) => (
        <div key={i} className={`flex items-center justify-center rounded-full font-bold text-xs transition-all duration-300 ${
          i < step  ? "w-7 h-7 bg-teal-500 text-white"
          : i === step ? "w-8 h-8 bg-white border-2 border-teal-500 text-teal-600 shadow-md scale-110"
          : "w-7 h-7 bg-white/60 border border-slate-300 text-slate-400"
        }`}>
          {i < step ? "✓" : i + 1}
        </div>
      ))}
    </div>
  );
}

function AnimalsBackground({ opacity = "opacity-20", speed = false }: { opacity?: string; speed?: boolean }) {
  return (
    <>
      {BG_ANIMALS.map((a, i) => (
        <span key={i} className={`${a.size} select-none absolute pointer-events-none ${opacity}`}
          style={{ left: a.left, top: a.top, display: "inline-block",
            animation: speed ? `bounce 0.7s ease-in-out infinite` : `bounce ${a.dur} ease-in-out infinite`,
            animationDelay: speed ? `${i * 0.12}s` : a.delay,
          }}>
          {a.emoji}
        </span>
      ))}
    </>
  );
}

function ExitButton() {
  return (
    <Link href="/registro"
      className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold shadow-sm active:scale-95 transition"
    >
      SALIR
    </Link>
  );
}

function toggleOpt(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

export default function RegistroDiario() {
  const router = useRouter();
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(EMPTY);
  const [done, setDone] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [mood, setMood] = useState("");
  const [savedEntryId, setSavedEntryId] = useState("");
  const [xpGained, setXpGained] = useState<{ xp: number; bellotas: number } | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    async function check() {
      try {
        const log = await getPregLog();
        if (log[today]) setAlreadyDone(true);
      } catch (e) { console.error(e); }
    }
    check();
  }, []);

  const current = STEPS[step];
  const rawValue = data[current.key];
  const canAdvance = Array.isArray(rawValue)
    ? (rawValue as string[]).length > 0
    : !!(rawValue as string).trim();
  const isLast = step === STEPS.length - 1;

  function setTextField(val: string) {
    setData((d) => ({ ...d, [current.key]: val }));
  }

  function toggleButton(opt: string) {
    const arr = data[current.key] as string[];
    setData((d) => ({ ...d, [current.key]: toggleOpt(arr, opt) }));
  }

  function next() {
    if (!canAdvance) return;
    if (!isLast) setStep((s) => s + 1);
    else save();
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  async function save() {
    const now = new Date();
    setPhrase(getRandomPhrase());
    setDone(true);
    try {
      const id = await savePregEntry({
        situation: data.situation,
        signal: data.signal,
        alarm: data.alarm,
        habitual: data.habitual,
        newResponse: data.newResponse,
        after: data.after,
        mood: "",
        savedAt: now.toISOString(),
      });
      setSavedEntryId(id);
      setXpGained(awardXp("diario"));
    } catch (e) { console.error(e); }
  }

  async function saveMood(selectedMood: string) {
    setMood(selectedMood);
    if (savedEntryId) {
      try {
        await updatePregEntry(savedEntryId, { mood: selectedMood });
      } catch (e) { console.error(e); }
    }
  }

  /* ── Ya registrado hoy ── */
  if (alreadyDone) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-sky-100 via-teal-50 to-emerald-100 flex flex-col overflow-hidden">
        <AnimalsBackground opacity="opacity-15" />
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
          <div className="text-9xl" style={{ animation: "bounce 2s ease-in-out infinite" }}>🐌</div>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl px-6 py-5 shadow-xl">
            <p className="text-2xl font-bold text-teal-700 mb-1">¡Nenita!</p>
            <p className="text-slate-600 text-base font-medium">Hoy ya has hecho el registro 🌟</p>
          </div>
          <Link href="/registro"
            className="w-full max-w-xs py-4 rounded-2xl bg-teal-500 text-white font-bold shadow-lg shadow-teal-200 active:scale-95 transition text-center"
          >
            Volver al registro
          </Link>
          <button onClick={() => setAlreadyDone(false)}
            className="text-sm text-slate-400 underline underline-offset-2"
          >
            Editar el de hoy de todas formas
          </button>
        </div>
      </div>
    );
  }

  /* ── Celebración + selector de estado ── */
  if (done) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-sky-100 via-teal-50 to-emerald-100 flex flex-col overflow-hidden">
        <AnimalsBackground speed />
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 max-w-xs mx-auto">
          <div className="text-8xl" style={{ animation: "bounce 0.65s ease-in-out infinite" }}>🐿️</div>
          <h2 className="text-2xl font-bold text-teal-700">¡Registro guardado!</h2>
          {xpGained && (
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-2 shadow-md border border-white">
              <span className="text-lg font-bold text-teal-600">+{xpGained.xp} XP</span>
              <span className="text-slate-300">·</span>
              <span className="text-lg font-bold text-amber-600">+{xpGained.bellotas} 🌰</span>
            </div>
          )}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-lg border border-white w-full">
            <p className="text-slate-700 text-sm font-medium leading-relaxed italic">&quot;{phrase}&quot;</p>
          </div>

          {/* Selector de estado de ánimo */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-4 shadow-lg border border-white w-full">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">¿Cómo te quedas?</p>
            <div className="flex justify-around gap-1">
              {MOODS.map((m) => (
                <button key={m.emoji} onClick={() => saveMood(m.emoji)}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all active:scale-95 ${
                    mood === m.emoji ? "bg-teal-100 ring-2 ring-teal-400 shadow-sm" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="text-[9px] text-slate-500 font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => router.push("/registro")}
            className="w-full py-4 rounded-2xl bg-teal-600 text-white font-bold shadow-lg shadow-teal-200 active:scale-95 transition"
          >
            Volver al registro
          </button>
        </div>
      </div>
    );
  }

  /* ── Formulario ── */
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-sky-100 via-teal-50 to-emerald-100 flex flex-col overflow-hidden">
      <AnimalsBackground />

      {/* Cabecera */}
      <div className="shrink-0 bg-white/60 backdrop-blur-sm border-b border-white/50 px-5 pt-5 pb-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-teal-600 font-semibold uppercase tracking-widest">
            Registro diario · Observar el patrón
          </p>
          <ExitButton />
        </div>
        <Dots step={step} />
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white/85 backdrop-blur-sm rounded-3xl p-6 shadow-xl shadow-teal-100/40">
            <p className="text-xs text-teal-500 font-semibold uppercase tracking-wider mb-2">
              Paso {step + 1} de {STEPS.length}
            </p>
            <h2 className="text-xl font-bold text-slate-800 mb-1 leading-snug">{current.label}</h2>

            {current.type === "buttons" && (
              <p className="text-xs text-slate-400 mb-4">Puedes elegir varias respuestas</p>
            )}

            {current.type === "textarea" ? (
              <textarea
                value={rawValue as string}
                onChange={(e) => setTextField(e.target.value)}
                placeholder={current.placeholder}
                rows={5}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 text-base resize-none focus:outline-none focus:border-teal-400 transition-colors placeholder:text-slate-300"
              />
            ) : (
              <div className="flex flex-col gap-2">
                {current.options!.map((opt) => {
                  const selected = (rawValue as string[]).includes(opt);
                  return (
                    <button key={opt} onClick={() => toggleButton(opt)}
                      className={`text-left px-4 py-3 rounded-xl border text-sm transition-all active:scale-[0.98] ${
                        selected ? current.activeColor : `bg-white ${current.color} hover:border-slate-300`
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="shrink-0 px-5 pb-10 pt-3">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 0 && (
            <button onClick={back}
              className="flex-1 py-4 rounded-2xl border-2 border-white bg-white/70 text-slate-600 font-bold text-base backdrop-blur-sm active:scale-95 transition-transform"
            >
              ← Atrás
            </button>
          )}
          <button onClick={next} disabled={!canAdvance}
            className={`py-4 rounded-2xl text-white font-bold text-base shadow-lg active:scale-95 transition-all ${
              step > 0 ? "flex-[2]" : "w-full"
            } ${canAdvance ? "bg-teal-500 shadow-teal-200" : "bg-slate-300 shadow-none"}`}
          >
            {isLast ? "Guardar ✓" : "Siguiente →"}
          </button>
        </div>
      </div>
    </div>
  );
}
