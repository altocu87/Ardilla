"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { savePregEntry } from "@/lib/db";

/* ── Tareas somáticas ──────────────────────────────────────────────────────── */
const TASKS = [
  { k: "orient",  i: "👀", t: "Mira lentamente a tu alrededor y nombra 5 cosas que ves." },
  { k: "support", i: "🪑", t: "Nota 3 puntos de apoyo: pies, espalda, manos o contacto con la silla." },
  { k: "exhale",  i: "🌬️", t: "Exhala un poco más largo de lo habitual, sin forzar." },
  { k: "release", i: "🧘", t: "Afloja un 5% alguna zona: mandíbula, hombros, manos, abdomen." },
  { k: "phrase",  i: "✨", t: "\"Ahora estoy aquí; en este momento no necesito resolverlo todo.\"" },
  { k: "return",  i: "🌱", t: "Vuelve a la actividad que estabas haciendo, aunque sea despacio." },
] as const;

type TaskKey = typeof TASKS[number]["k"];
type CheckState = Record<TaskKey, boolean>;

const INIT_STATE: CheckState = {
  orient: false, support: false, exhale: false,
  release: false, phrase: false, return: false,
};

/* ── Estados de ánimo de la ardilla (0 → 6 tareas) ────────────────────────── */
const MOODS = [
  { face: "😭", label: "Muy mal...",    color: "text-rose-400"   },
  { face: "😢", label: "Qué difícil",   color: "text-rose-300"   },
  { face: "😟", label: "Poco a poco",   color: "text-orange-400" },
  { face: "😐", label: "A medias",      color: "text-amber-400"  },
  { face: "🙂", label: "¡Vamos!",       color: "text-lime-500"   },
  { face: "😊", label: "¡Casi!",        color: "text-teal-500"   },
  { face: "🤩", label: "¡Con bellota!", color: "text-emerald-600" },
];

const BG_ANIMALS = [
  { emoji: "🐱",  size: "text-4xl", dur: "2.3s", delay: "0s",   left: "4%",  top: "8%"  },
  { emoji: "🐿️", size: "text-5xl", dur: "2.0s", delay: "0.5s", left: "79%", top: "5%"  },
  { emoji: "🐌",  size: "text-5xl", dur: "2.4s", delay: "0.9s", left: "82%", top: "48%" },
  { emoji: "🐈‍⬛", size: "text-6xl", dur: "1.9s", delay: "1.2s", left: "3%",  top: "66%" },
  { emoji: "🐀",  size: "text-4xl", dur: "2.2s", delay: "1.6s", left: "73%", top: "78%" },
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

/* ── Indicador de ardilla ──────────────────────────────────────────────────── */
function SquirrelMoodBar({ count, total }: { count: number; total: number }) {
  const mood    = MOODS[Math.min(count, MOODS.length - 1)];
  const isDone  = count === total;
  const pct     = (count / total) * 100;

  return (
    <div
      className={`rounded-2xl border-2 p-4 transition-all duration-500 ${
        isDone
          ? "bg-emerald-50 border-teal-400 shadow-lg shadow-teal-100/60"
          : "bg-white/70 border-slate-200"
      }`}
    >
      {/* Ardilla + cara + bellota */}
      <div className="flex items-center justify-center gap-3 mb-3">

        {/* Extremo triste */}
        <span className="text-lg opacity-35 select-none">😭</span>

        {/* Conjunto central: ardilla + cara actual + bellota */}
        <div className="flex flex-col items-center">
          <div className="flex items-end gap-1">
            <span
              className="text-5xl select-none transition-all duration-300"
              style={{ filter: isDone ? "drop-shadow(0 0 6px rgba(52,211,153,.7))" : "none" }}
            >
              🐿️
            </span>
            <span
              className="text-4xl leading-none select-none transition-all duration-300 mb-0.5"
            >
              {mood.face}
            </span>
            {/* Bellota: aparece progresivamente */}
            <span
              className="text-4xl leading-none select-none transition-all duration-500"
              style={{
                opacity:   isDone ? 1 : count >= 4 ? 0.3 + (count - 4) * 0.35 : 0,
                transform: isDone ? "scale(1.2)" : "scale(1)",
                filter:    isDone ? "drop-shadow(0 0 8px rgba(251,191,36,.9))" : "none",
              }}
            >
              🌰
            </span>
          </div>
          <p className={`text-xs font-bold mt-1 transition-all duration-300 ${mood.color}`}>
            {mood.label}
          </p>
        </div>

        {/* Extremo feliz */}
        <span
          className={`text-lg select-none transition-all duration-300 ${isDone ? "opacity-100" : "opacity-35"}`}
        >
          🤩
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg,#34d399,#10b981)",
          }}
        />
      </div>
      <p className="text-center text-[10px] text-slate-400 mt-1.5">
        {count} de {total} pasos completados
      </p>
    </div>
  );
}

/* ══ PÁGINA PRINCIPAL ════════════════════════════════════════════════════════ */
export default function P3() {
  const router = useRouter();
  const [ch,     setCh]    = useState<CheckState>(INIT_STATE);
  const [done,   setDone]  = useState(false);
  const [saving, setSaving] = useState(false);

  const count = TASKS.filter(x => ch[x.k]).length;
  const all   = count === TASKS.length;

  function toggle(k: TaskKey) {
    setCh(c => ({ ...c, [k]: !c[k] }));
  }

  async function finish() {
    setSaving(true);
    try {
      await savePregEntry({
        situation:   "Práctica 3 — Orientación suave",
        signal:      TASKS.filter(x => ch[x.k]).map(x => x.k),
        alarm:       [],
        habitual:    [],
        newResponse: TASKS.map(x => x.k),
        after:       [],
        mood:        "orientada",
        savedAt:     new Date().toISOString(),
      });
    } catch { /* no bloquear UI */ }
    setSaving(false);
    setDone(true);
  }

  /* ── Celebración ── */
  if (done) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-teal-100 via-emerald-50 to-cyan-50 flex flex-col overflow-hidden">
        <AnimalsBackground speed />
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center gap-5 max-w-xs mx-auto">

          {/* Ardilla feliz con bellota */}
          <div className="flex items-end justify-center gap-1">
            <span
              className="text-8xl select-none"
              style={{
                animation: "bounce 0.7s ease-in-out infinite",
                filter: "drop-shadow(0 0 10px rgba(52,211,153,.5))",
              }}
            >
              🐿️
            </span>
            <span
              className="text-5xl select-none mb-2"
              style={{
                animation: "bounce 0.7s ease-in-out 0.12s infinite",
                filter: "drop-shadow(0 0 8px rgba(251,191,36,.8))",
              }}
            >
              🌰
            </span>
          </div>

          <h2 className="text-2xl font-bold text-teal-700">¡Orientación completada!</h2>

          {/* Resumen de pasos */}
          <div className="bg-white/85 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-lg border border-white w-full flex flex-col gap-2">
            {TASKS.map(x => (
              <div key={x.k} className="flex items-center gap-2.5">
                <span className="text-teal-500 font-bold text-sm">✓</span>
                <span className="text-base shrink-0">{x.i}</span>
                <p className="text-xs text-slate-600 leading-snug text-left">{x.t}</p>
              </div>
            ))}
          </div>

          {/* Frase del caracol */}
          <div className="bg-teal-50 border border-teal-200 rounded-2xl px-5 py-4 w-full">
            <div className="flex items-start gap-2">
              <span className="text-xl shrink-0">🐌</span>
              <p className="text-sm text-teal-800 italic leading-relaxed">
                &ldquo;Has vuelto al presente. Eso es todo lo que necesitabas hacer.&rdquo;
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/formaciones")}
            className="w-full py-4 rounded-2xl bg-teal-500 text-white font-bold shadow-lg shadow-teal-200 active:scale-95 transition"
          >
            Volver a Ejercicios
          </button>
        </div>
      </div>
    );
  }

  /* ── Pantalla principal (única pantalla) ── */
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-teal-100 via-emerald-50 to-cyan-50 flex flex-col overflow-hidden">
      <AnimalsBackground />

      {/* Cabecera */}
      <div className="shrink-0 bg-white/60 backdrop-blur-sm border-b border-white/50 z-10 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">
              Práctica 03 · Orientación suave
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Marca cada paso al completarlo</p>
          </div>
          <Link
            href="/formaciones"
            className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold shadow-sm active:scale-95 transition"
          >
            SALIR
          </Link>
        </div>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4 z-10">
        <div className="max-w-lg mx-auto flex flex-col gap-4">

          {/* Indicador de ardilla */}
          <SquirrelMoodBar count={count} total={TASKS.length} />

          {/* Instrucción */}
          <div className="flex items-center gap-2 bg-white/60 rounded-xl px-4 py-2.5 border border-teal-100">
            <span className="text-lg">🐌</span>
            <p className="text-xs text-slate-500 leading-snug">
              No tienes que hacerlo perfecto. Cada paso que marques ya cuenta.
            </p>
          </div>

          {/* Lista de tareas */}
          <div className="flex flex-col gap-2.5">
            {TASKS.map(x => {
              const checked = ch[x.k];
              return (
                <button
                  key={x.k}
                  onClick={() => toggle(x.k)}
                  className={`flex items-start gap-3 w-full text-left px-4 py-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] ${
                    checked
                      ? "bg-amber-50 border-teal-400 shadow-sm"
                      : "bg-white/70 border-slate-200"
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center text-sm font-bold transition-all duration-200 mt-0.5 ${
                      checked
                        ? "bg-teal-500 border-teal-500 text-white"
                        : "bg-white border-slate-300 text-transparent"
                    }`}
                  >
                    ✓
                  </div>

                  {/* Icono */}
                  <span className="text-xl shrink-0">{x.i}</span>

                  {/* Texto */}
                  <p
                    className={`text-sm leading-snug transition-all duration-200 flex-1 ${
                      checked
                        ? "line-through text-slate-400"
                        : "text-slate-700"
                    }`}
                    style={{ opacity: checked ? 0.7 : 1 }}
                  >
                    {x.t}
                  </p>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* Botón inferior */}
      <div className="shrink-0 px-5 pb-10 pt-3 z-10">
        <div className="max-w-lg mx-auto">
          <button
            onClick={finish}
            disabled={!all || saving}
            className={`w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg active:scale-95 transition-all ${
              all && !saving
                ? "bg-teal-500 shadow-teal-200"
                : "bg-slate-300 shadow-none cursor-not-allowed"
            }`}
          >
            {saving ? "Guardando…" : all ? "Completar ✓" : `Faltan ${TASKS.length - count} pasos`}
          </button>
        </div>
      </div>
    </div>
  );
}
