"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getEmocionalLog, saveEmocionalEntry, updateEmocionalEntry } from "@/lib/db";
import { awardXp } from "@/lib/profile";
import { getRandomPhrase as getCentralPhrase } from "@/lib/phrases";
import { generarSobre, type SobreReward } from "@/lib/sobre";
import { completeMission, type MissionCompletionResult } from "@/lib/missions";
import { applyActivityToStats } from "@/lib/mascot";
import SobreModal from "@/components/SobreModal";

export const ESTADO_OPTS = [
  { emoji: "😌", label: "Calma" },
  { emoji: "😤", label: "Tensión" },
  { emoji: "⚡", label: "Prisa" },
  { emoji: "😶", label: "Desconexión" },
  { emoji: "🧊", label: "Bloqueo" },
  { emoji: "😢", label: "Tristeza" },
  { emoji: "😠", label: "Rabia" },
  { emoji: "😰", label: "Inquietud" },
];

export const NECESIDAD_OPTS = [
  { emoji: "🚧", label: "Un límite" },
  { emoji: "😴", label: "Descanso" },
  { emoji: "🔍", label: "Claridad" },
  { emoji: "🤝", label: "Apoyo" },
  { emoji: "🌊", label: "Movimiento suave" },
  { emoji: "🤫", label: "Silencio" },
  { emoji: "🗣️", label: "Pedir algo" },
  { emoji: "✋", label: "Parar" },
];

const DONDE_OPTS = ["Pecho", "Garganta", "Abdomen", "Mandíbula", "Espalda", "Manos", "Piernas"];


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

const TOTAL_STEPS = 4;

function getRandomPhrase() { return getCentralPhrase(); }

function AnimalsBackground({ speed = false }: { speed?: boolean }) {
  return (
    <>
      {BG_ANIMALS.map((a, i) => (
        <span key={i} className={`${a.size} select-none absolute pointer-events-none opacity-20`}
          style={{ left: a.left, top: a.top, display: "inline-block",
            animation: speed
              ? `bounce 0.7s ease-in-out ${i * 0.12}s infinite`
              : `bounce ${a.dur} ease-in-out ${a.delay} infinite`,
          }}>
          {a.emoji}
        </span>
      ))}
    </>
  );
}

function Dots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} className={`flex items-center justify-center rounded-full font-bold text-xs transition-all duration-300 ${
          i < step    ? "w-7 h-7 bg-rose-500 text-white"
          : i === step ? "w-8 h-8 bg-white border-2 border-rose-500 text-rose-600 shadow-md scale-110"
          : "w-7 h-7 bg-white/60 border border-slate-300 text-slate-400"
        }`}>
          {i < step ? "✓" : i + 1}
        </div>
      ))}
    </div>
  );
}

const STEP_LABELS = [
  "¿Qué estado domina ahora?",
  "¿Dónde lo noto?",
  "¿Qué intensidad tiene?",
  "¿Qué necesito hoy en pequeño?",
];
const STEP_HINTS = [
  "Elige el estado que más se acerca",
  "Puedes elegir varias zonas del cuerpo",
  "No busques exactitud, busca orientación · 0 a 10",
  "Puedes elegir varias",
];

export default function RegistroEmocional() {
  const router = useRouter();
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [step, setStep] = useState(0);

  const [estado, setEstado]       = useState<{ emoji: string; label: string } | null>(null);
  const [donde, setDonde]         = useState<string[]>([]);
  const [intensidad, setIntensidad] = useState<number | null>(null);
  const [necesidad, setNecesidad] = useState<string[]>([]);

  const [done, setDone]                 = useState(false);
  const [phrase, setPhrase]             = useState("");
  const [mood, setMood]                 = useState("");
  const [savedEntryId, setSavedEntryId] = useState("");
  const [xpGained, setXpGained]         = useState<import("@/lib/profile").AwardResult | null>(null);
  const [sobreData, setSobreData] = useState<SobreReward | null>(null);
  const [misionResult, setMisionResult] = useState<MissionCompletionResult | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    getEmocionalLog()
      .then(log => { if (log[today]) setAlreadyDone(true); })
      .catch(console.error);
  }, []);

  const canAdvance =
    (step === 0 && estado !== null) ||
    (step === 1 && donde.length > 0) ||
    (step === 2 && intensidad !== null) ||
    (step === 3 && necesidad.length > 0);

  function toggleDonde(v: string) {
    setDonde(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  }

  function toggleNecesidad(label: string) {
    setNecesidad(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]);
  }

  function next() {
    if (!canAdvance) return;
    if (step < TOTAL_STEPS - 1) { setStep(s => s + 1); return; }
    save();
  }

  async function save() {
    const now = new Date();
    setPhrase(getRandomPhrase());
    setDone(true);
    try {
      const id = await saveEmocionalEntry({
        estado: estado!.label,
        estadoEmoji: estado!.emoji,
        donde,
        intensidad: intensidad!,
        necesidad,
        mood: "",
        savedAt: now.toISOString(),
      });
      setSavedEntryId(id);
    } catch (e) { console.error("saveEmocionalEntry error:", e); }
    try {
      setXpGained(await awardXp("emocional"));
    } catch (e) { console.error("awardXp error:", e); }
    try {
      const mision = await completeMission("emocional");
      setMisionResult(mision);
    } catch (e) { console.error("completeMission error:", e); }
    try { applyActivityToStats("emocional"); } catch { /* noop */ }
    setSobreData(generarSobre());
  }

  async function saveMood(selectedMood: string) {
    setMood(selectedMood);
    if (savedEntryId) {
      try { await updateEmocionalEntry(savedEntryId, { mood: selectedMood }); }
      catch (e) { console.error(e); }
    }
  }

  /* ── Ya registrado hoy ── */
  if (alreadyDone) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-rose-100 via-pink-50 to-fuchsia-100 flex flex-col overflow-hidden">
        <AnimalsBackground />
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
          <div className="text-9xl" style={{ animation: "bounce 2s ease-in-out infinite" }}>🌸</div>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl px-6 py-5 shadow-xl">
            <p className="text-2xl font-bold text-rose-600 mb-1">¡Ya está!</p>
            <p className="text-slate-600 text-base font-medium">Hoy ya has hecho tu minuto emocional 🌟</p>
          </div>
          <Link href="/registro"
            className="w-full max-w-xs py-4 rounded-2xl bg-rose-500 text-white font-bold shadow-lg shadow-rose-200 active:scale-95 transition text-center"
          >
            Volver al registro
          </Link>
          <button onClick={() => setAlreadyDone(false)} className="text-sm text-slate-400 underline underline-offset-2">
            Editar el de hoy de todas formas
          </button>
        </div>
      </div>
    );
  }

  /* ── Celebración ── */
  if (done) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-rose-100 via-pink-50 to-fuchsia-100 flex flex-col overflow-hidden">
        <AnimalsBackground speed />
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 max-w-xs mx-auto">
          <div className="text-8xl" style={{ animation: "bounce 0.65s ease-in-out infinite" }}>🌸</div>
          <h2 className="text-2xl font-bold text-rose-600">¡Minuto completado!</h2>
          {xpGained && (
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-2 shadow-md border border-white">
              <span className="text-lg font-bold text-rose-500">+{xpGained.xp} XP</span>
              <span className="text-slate-300">·</span>
              <span className="text-lg font-bold text-amber-600">+{xpGained.bellotas} 🌰</span>
              {xpGained.multiplier && (
                <span className="text-xs font-bold text-violet-500 bg-violet-100 px-1.5 py-0.5 rounded-full">×{xpGained.multiplier}</span>
              )}
            </div>
          )}
          {misionResult && (
            <div className="flex items-center gap-2 bg-emerald-500 rounded-2xl px-4 py-2 shadow-md w-full justify-center">
              <span className="text-xl">{misionResult.mission.emoji}</span>
              <div className="text-left">
                <p className="text-white text-xs font-extrabold leading-tight">¡Misión completada!</p>
                <p className="text-emerald-100 text-[10px]">{misionResult.mission.label} · +{misionResult.mission.bellotas}🌰 +{misionResult.mission.xp}XP{misionResult.isBonus ? ` · BONUS +${misionResult.bonusBellotas}🌰 +${misionResult.bonusXp}XP` : ""}</p>
              </div>
            </div>
          )}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-lg border border-white w-full">
            <p className="text-slate-700 text-sm font-medium leading-relaxed italic">&quot;{phrase}&quot;</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-4 shadow-lg border border-white w-full">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">¿Cómo te quedas?</p>
            <div className="flex justify-around gap-1">
              {MOODS.map((m) => (
                <button key={m.emoji} onClick={() => saveMood(m.emoji)}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all active:scale-95 ${
                    mood === m.emoji ? "bg-rose-100 ring-2 ring-rose-400 shadow-sm" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="text-[9px] text-slate-500 font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => router.push("/registro")}
            className="w-full py-4 rounded-2xl bg-rose-500 text-white font-bold shadow-lg shadow-rose-200 active:scale-95 transition"
          >
            Volver al registro
          </button>
        </div>
        {sobreData && <SobreModal reward={sobreData} onClose={() => setSobreData(null)} />}
      </div>
    );
  }

  /* ── Formulario ── */
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-rose-100 via-pink-50 to-fuchsia-100 flex flex-col overflow-hidden">
      <AnimalsBackground />

      {/* Cabecera */}
      <div className="shrink-0 bg-white/60 backdrop-blur-sm border-b border-white/50 px-5 pt-5 pb-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-rose-500 font-semibold uppercase tracking-widest">
            Registro emocional · 1 minuto
          </p>
          <Link href="/registro"
            className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold shadow-sm active:scale-95 transition"
          >
            SALIR
          </Link>
        </div>
        <Dots step={step} />
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white/85 backdrop-blur-sm rounded-3xl p-6 shadow-xl shadow-rose-100/40">
            <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider mb-2">
              Paso {step + 1} de {TOTAL_STEPS}
            </p>
            <h2 className="text-xl font-bold text-slate-800 mb-1 leading-snug">{STEP_LABELS[step]}</h2>
            <p className="text-xs text-slate-400 mb-4">{STEP_HINTS[step]}</p>

            {/* Paso 1: estado */}
            {step === 0 && (
              <div className="grid grid-cols-2 gap-2">
                {ESTADO_OPTS.map((opt) => (
                  <button key={opt.label} onClick={() => setEstado(opt)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-[0.97] ${
                      estado?.label === opt.label
                        ? "bg-rose-100 border-rose-400 text-rose-800"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Paso 2: donde */}
            {step === 1 && (
              <div className="flex flex-col gap-2">
                {DONDE_OPTS.map((opt) => (
                  <button key={opt} onClick={() => toggleDonde(opt)}
                    className={`text-left px-4 py-3 rounded-xl border text-sm transition-all active:scale-[0.98] ${
                      donde.includes(opt)
                        ? "bg-pink-100 border-pink-400 text-pink-800 font-semibold"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >{opt}</button>
                ))}
              </div>
            )}

            {/* Paso 3: intensidad */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  {Array.from({ length: 11 }, (_, i) => (
                    <button key={i} onClick={() => setIntensidad(i)}
                      className={`w-12 h-12 rounded-2xl text-base font-bold border transition-all active:scale-95 ${
                        intensidad === i
                          ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200"
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >{i}</button>
                  ))}
                </div>
                {intensidad !== null && (
                  <div className="text-center mt-1">
                    <p className="text-3xl font-bold text-rose-500">{intensidad}/10</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {intensidad <= 2 ? "Muy leve"
                        : intensidad <= 4 ? "Leve"
                        : intensidad <= 6 ? "Moderada"
                        : intensidad <= 8 ? "Alta"
                        : "Muy alta"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Paso 4: necesidad */}
            {step === 3 && (
              <div className="grid grid-cols-2 gap-2">
                {NECESIDAD_OPTS.map((opt) => (
                  <button key={opt.label} onClick={() => toggleNecesidad(opt.label)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-[0.97] ${
                      necesidad.includes(opt.label)
                        ? "bg-fuchsia-100 border-fuchsia-400 text-fuchsia-800"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-left leading-tight">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="shrink-0 px-5 pb-10 pt-3">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-4 rounded-2xl border-2 border-white bg-white/70 text-slate-600 font-bold text-base backdrop-blur-sm active:scale-95 transition-transform"
            >
              ← Atrás
            </button>
          )}
          <button onClick={next} disabled={!canAdvance}
            className={`py-4 rounded-2xl text-white font-bold text-base shadow-lg active:scale-95 transition-all ${
              step > 0 ? "flex-[2]" : "w-full"
            } ${canAdvance ? "bg-rose-500 shadow-rose-200" : "bg-slate-300 shadow-none"}`}
          >
            {step === TOTAL_STEPS - 1 ? "Guardar ✓" : "Siguiente →"}
          </button>
        </div>
      </div>
    </div>
  );
}
