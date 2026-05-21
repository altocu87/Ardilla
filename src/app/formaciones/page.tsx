"use client";
import Link from "next/link";
// Rutas de cada práctica (las que aún no tienen página apuntan a formaciones)
const EXERCISE_ROUTES: Record<string, string> = {
  "01": "/actividad/p1",
  "02": "/actividad/p2",
  "03": "/actividad/p3",
};

const EXERCISES = [
  {
    id: "01",
    title: "Señal y alarma",
    subtitle: "Observar sin pelear",
    description:
      "Corta rápidamente el bucle de lucha contra el síntoma mediante la identificación inmediata del malestar y la liberación física de tensión.",
    bg: "from-orange-400 to-amber-500",
    border: "border-orange-300",
    shadow: "shadow-orange-200",
    textLight: "text-orange-50",
    textMid: "text-orange-100",
    badge: "bg-orange-300/40",
  },
  {
    id: "02",
    title: "Mapa de hiperalerta",
    subtitle: "Ampliar conciencia",
    description:
      "Desglosa el síntoma en capas cognitivas y emocionales, ayudando a diferenciar la sensación física real de la alarma mental que esta genera.",
    bg: "from-violet-500 to-purple-600",
    border: "border-violet-300",
    shadow: "shadow-violet-200",
    textLight: "text-violet-50",
    textMid: "text-violet-100",
    badge: "bg-violet-300/40",
  },
  {
    id: "03",
    title: "Orientación suave",
    subtitle: "Volver al presente",
    description:
      "Reduce la ansiedad aguda sacando la atención del foco del dolor abdominal y redirigiéndola al entorno físico a través de los sentidos.",
    bg: "from-teal-400 to-emerald-500",
    border: "border-teal-300",
    shadow: "shadow-teal-200",
    textLight: "text-teal-50",
    textMid: "text-teal-100",
    badge: "bg-teal-300/40",
  },
];

/* Animales decorativos flotando en el fondo */
const BG_ANIMALS = [
  { emoji: "🐿️", style: { top: "6%",  left: "4%",  fontSize: 38, animationDelay: "0s",    animationDuration: "6s"  } },
  { emoji: "🐌", style: { top: "12%", right: "6%", fontSize: 32, animationDelay: "1.2s",  animationDuration: "7s"  } },
  { emoji: "🐈", style: { top: "38%", left: "2%",  fontSize: 34, animationDelay: "0.6s",  animationDuration: "8s"  } },
  { emoji: "🐀", style: { top: "55%", right: "4%", fontSize: 30, animationDelay: "2s",    animationDuration: "6.5s"} },
  { emoji: "🐿️", style: { bottom:"18%",right:"8%", fontSize: 28, animationDelay: "1.8s",  animationDuration: "7.5s"} },
  { emoji: "🐌", style: { bottom:"8%", left: "6%", fontSize: 36, animationDelay: "0.4s",  animationDuration: "9s"  } },
  { emoji: "🐈‍⬛",style: { top: "72%", left: "3%",  fontSize: 26, animationDelay: "3s",    animationDuration: "8s"  } },
  { emoji: "🐀", style: { top: "24%", left:"40%",  fontSize: 20, animationDelay: "2.4s",  animationDuration: "10s" } },
];

export default function Formaciones() {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: "linear-gradient(160deg,#fdf6ec 0%,#f0fdf4 60%,#ede9fe 100%)" }}>

      {/* Animales flotando en el fondo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {BG_ANIMALS.map((a, i) => (
          <span
            key={i}
            className="absolute select-none"
            style={{
              ...a.style,
              opacity: 0.18,
              animation: `float ${a.style.animationDuration} ease-in-out ${a.style.animationDelay} infinite`,
            }}
          >
            {a.emoji}
          </span>
        ))}
      </div>

      {/* Animación flotante CSS */}
      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0px) rotate(-3deg); }
          50%      { transform: translateY(-12px) rotate(3deg); }
        }
        @keyframes pop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        .card-btn:active { animation: pop 0.18s ease; }
      `}</style>

      {/* HEADER */}
      <header className="relative shrink-0 flex items-center gap-3 px-4 py-4 z-10">
        <Link href="/" className="text-slate-500 hover:text-slate-700 text-xl leading-none">←</Link>
        <div className="flex-1">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Ejercicios</p>
          <h1 className="text-lg font-extrabold text-slate-800">Prácticas de regulación</h1>
        </div>
        <Link href="/historico/practicas"
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-100 text-violet-700 text-xs font-bold shadow-sm active:scale-95 transition-transform">
          📋 Log
        </Link>
      </header>

      {/* SUBTÍTULO */}
      <div className="relative px-5 mb-3 z-10">
        <p className="text-sm text-slate-500 leading-snug">
          Elige una práctica y el caracol profe te guía paso a paso.
        </p>
      </div>

      {/* CARDS */}
      <div className="relative flex-1 overflow-y-auto px-4 pb-8 flex flex-col gap-4 z-10">
        {EXERCISES.map((ex) => (
          <Link
            key={ex.id}
            href={EXERCISE_ROUTES[ex.id] ?? "/formaciones"}
            className={`card-btn block w-full text-left rounded-3xl bg-gradient-to-br ${ex.bg} ${ex.shadow} shadow-lg border ${ex.border} p-5 transition-transform active:scale-95`}
          >
            {/* Número y título */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <span className={`text-xs font-bold uppercase tracking-widest ${ex.textMid} opacity-80`}>
                  Práctica {ex.id}
                </span>
                <h2 className={`text-xl font-extrabold ${ex.textLight} leading-tight mt-0.5`}>
                  {ex.title}
                </h2>
              </div>
              <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${ex.badge} ${ex.textLight} mt-1`}>
                {ex.subtitle}
              </span>
            </div>

            {/* Separador */}
            <div className={`w-12 h-0.5 rounded-full mb-3 ${ex.badge}`}/>

            {/* Descripción con caracol profesor */}
            <div className="flex gap-2.5 items-start">
              <span className="text-2xl shrink-0 mt-0.5" role="img" aria-label="caracol profesor">🐌</span>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${ex.textMid} mb-1`}>
                  ¿Para qué sirve?
                </p>
                <p className={`text-sm leading-relaxed ${ex.textLight}`}>
                  {ex.description}
                </p>
              </div>
            </div>

            {/* Flecha */}
            <div className={`flex justify-end mt-3 ${ex.textMid} text-xl`}>→</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
