"use client";

/**
 * SnailProgress — indicador de pasos como caracol acercándose a un helado 🐌🍦
 *
 * Props:
 *  step       — paso actual (0-based)
 *  total      — número total de pasos
 *  railColor  — clase Tailwind del riel relleno ("bg-orange-400", "bg-violet-500"…)
 *  dotColor   — clase Tailwind de los puntos completados
 */
export default function SnailProgress({
  step,
  total,
  railColor,
  dotColor,
}: {
  step: number;
  total: number;
  railColor: string;
  dotColor: string;
}) {
  // Porcentaje de avance (0 → 100) dentro del riel
  const pct = total <= 1 ? 0 : (step / (total - 1)) * 100;

  return (
    <div className="px-5 pt-2 pb-3">
      <div className="flex items-center gap-2">

        {/* ── Riel + caracol ─────────────────────────────────────────── */}
        <div className="relative flex-1" style={{ height: 40 }}>

          {/* Fondo del riel */}
          <div
            className="absolute top-1/2 left-0 right-0 h-1.5 rounded-full bg-slate-200"
            style={{ transform: "translateY(-50%)" }}
          />

          {/* Parte rellena del riel */}
          <div
            className={`absolute top-1/2 left-0 h-1.5 rounded-full transition-all duration-500 ${railColor}`}
            style={{ width: `${pct}%`, transform: "translateY(-50%)" }}
          />

          {/* Puntos de paso */}
          {Array.from({ length: total }).map((_, i) => {
            const dotPct = total <= 1 ? 0 : (i / (total - 1)) * 100;
            const done   = i < step;
            const active = i === step;
            return (
              <div
                key={i}
                className={`absolute top-1/2 rounded-full border-2 border-white transition-all duration-300 ${
                  done || active ? dotColor : "bg-slate-200"
                } ${active ? "w-3.5 h-3.5 shadow-sm" : "w-2.5 h-2.5"}`}
                style={{
                  left: `${dotPct}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            );
          })}

          {/* Caracol 🐌 — se mueve suavemente sobre el riel */}
          <span
            className="absolute select-none transition-all duration-500 leading-none"
            style={{
              left:      `${pct}%`,
              top:       "50%",
              fontSize:  22,
              transform: "translate(-50%, -95%)",
              filter:    "drop-shadow(0 1px 2px rgba(0,0,0,.15))",
            }}
          >
            🐌
          </span>
        </div>

        {/* ── Helado 🍦 (meta) ────────────────────────────────────────── */}
        <span
          className="text-3xl shrink-0 select-none transition-transform duration-300"
          style={{
            filter: step === total - 1
              ? "drop-shadow(0 0 6px rgba(251,191,36,.8))"
              : "none",
            transform: step === total - 1 ? "scale(1.2)" : "scale(1)",
          }}
          title="¡Meta!"
        >
          🍦
        </span>
      </div>

      {/* Texto de paso */}
      <p className="text-center text-[10px] text-slate-400 mt-1 tracking-wide">
        Paso {step + 1} de {total}
      </p>
    </div>
  );
}
