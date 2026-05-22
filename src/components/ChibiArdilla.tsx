"use client";
import type { TamaVisualState } from "@/lib/tamagotchi";
import type { EquippedClothing, SquirrelClothing } from "@/lib/squirrel-shop";
import type { EvolutionPhase } from "@/lib/tama-evolution";

/* ════════════════════════════════════════════════════
   DUOLINGO-STYLE SQUIRREL
   viewBox: "0 0 200 260"
   Colors: body #F5A623 | outline #7C3E00 | belly #FFF3DC
════════════════════════════════════════════════════ */

const C = { body: "#F5A623", dark: "#7C3E00", belly: "#FFF3DC", ear: "#F08080", sw: 4.5 };

/* ── Eyes ───────────────────────────────────────────────────── */
function EyePair({ state, cx1=72, cx2=128, cy=92 }: {
  state: TamaVisualState; cx1?: number; cx2?: number; cy?: number;
}) {
  /* Sleeping / cansada → closed with lashes */
  if (state === "durmiendo" || state === "cansada") return (
    <g>
      {[cx1, cx2].map((cx, i) => (
        <g key={i}>
          <path d={`M ${cx-26} ${cy} Q ${cx} ${cy-18} ${cx+26} ${cy}`}
            fill="none" stroke={C.dark} strokeWidth={5} strokeLinecap="round"/>
          {[-14,-2,10,21].map((dx, j) => (
            <line key={j}
              x1={cx+dx} y1={cy-Math.abs(dx<5?14:10)} x2={cx+dx} y2={cy-Math.abs(dx<5?14:10)-7}
              stroke={C.dark} strokeWidth={2.5} strokeLinecap="round"/>
          ))}
        </g>
      ))}
    </g>
  );

  /* Muy feliz / jugando / comiendo → arcos ^ */
  if (state === "muy_feliz" || state === "jugando" || state === "comiendo") return (
    <g>
      {[cx1, cx2].map((cx, i) => (
        <path key={i} d={`M ${cx-26} ${cy+8} Q ${cx} ${cy-14} ${cx+26} ${cy+8}`}
          fill="none" stroke={C.dark} strokeWidth={5} strokeLinecap="round"/>
      ))}
    </g>
  );

  /* Triste / hambre → normal with teardrops */
  if (state === "triste" || state === "hambre") return (
    <g>
      {[cx1, cx2].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={cy+2} r={27} fill="white" stroke={C.dark} strokeWidth={C.sw}/>
          <circle cx={cx+4} cy={cy+6} r={17} fill={C.dark}/>
          <circle cx={cx-6} cy={cy-5} r={7} fill="white"/>
          <circle cx={cx+10} cy={cy-4} r={3.5} fill="white" opacity={0.7}/>
          {/* Teardrop */}
          <path d={`M ${cx+18} ${cy+12} Q ${cx+22} ${cy+22} ${cx+18} ${cy+27} Q ${cx+14} ${cy+22} ${cx+18} ${cy+12}`}
            fill="#93C5FD" opacity={0.9}/>
        </g>
      ))}
    </g>
  );

  /* Enfadada → narrowed eyes with V brows */
  if (state === "enfadada") return (
    <g>
      {[cx1, cx2].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={26} fill="white" stroke={C.dark} strokeWidth={C.sw}/>
          {/* Angry top-lid */}
          <path d={`M ${cx-26} ${cy-6} Q ${cx} ${cy-22} ${cx+26} ${cy-6} L ${cx+26} ${cy-26} L ${cx-26} ${cy-26} Z`}
            fill={C.body}/>
          <path d={`M ${cx-26} ${cy-6} Q ${cx} ${cy-22} ${cx+26} ${cy-6}`}
            fill="none" stroke={C.dark} strokeWidth={3.5} strokeLinecap="round"/>
          <circle cx={cx+2} cy={cy+4} r={16} fill={C.dark}/>
          <circle cx={cx-6} cy={cy-4} r={5} fill="white"/>
        </g>
      ))}
    </g>
  );

  /* Feliz → slightly squinted (D-shape, flat top) */
  if (state === "feliz") return (
    <g>
      {[cx1, cx2].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={27} fill="white" stroke={C.dark} strokeWidth={C.sw}/>
          {/* Squint top eyelid */}
          <path d={`M ${cx-27} ${cy-4} Q ${cx} ${cy-20} ${cx+27} ${cy-4} L ${cx+27} ${cy-30} L ${cx-27} ${cy-30} Z`}
            fill={C.body}/>
          <path d={`M ${cx-27} ${cy-4} Q ${cx} ${cy-20} ${cx+27} ${cy-4}`}
            fill="none" stroke={C.dark} strokeWidth={3.5} strokeLinecap="round"/>
          <circle cx={cx+4} cy={cy+4} r={17} fill={C.dark}/>
          <circle cx={cx-6} cy={cy-3} r={7} fill="white"/>
          <circle cx={cx+10} cy={cy-2} r={3.5} fill="white" opacity={0.7}/>
        </g>
      ))}
    </g>
  );

  /* Neutral / default → big open eyes */
  return (
    <g>
      {[cx1, cx2].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={27} fill="white" stroke={C.dark} strokeWidth={C.sw}/>
          <circle cx={cx+4} cy={cy+4} r={17} fill={C.dark}/>
          <circle cx={cx-6} cy={cy-4} r={7} fill="white"/>
          <circle cx={cx+10} cy={cy-2} r={3.5} fill="white" opacity={0.7}/>
        </g>
      ))}
    </g>
  );
}

/* ── Eyebrows ───────────────────────────────────────────────── */
function Eyebrows({ state }: { state: TamaVisualState }) {
  if (state === "durmiendo" || state === "cansada" || state === "comiendo" ||
      state === "muy_feliz" || state === "jugando") return null;

  if (state === "enfadada") return (
    <g stroke={C.dark} strokeWidth={5} strokeLinecap="round">
      <path d="M 46 62 Q 66 54 86 60" fill="none"/>
      <path d="M 114 60 Q 134 54 154 62" fill="none"/>
    </g>
  );
  if (state === "triste" || state === "hambre") return (
    <g fill="none" stroke={C.dark} strokeWidth={4.5} strokeLinecap="round">
      <path d="M 46 60 Q 58 52 78 58"/>
      <path d="M 122 58 Q 142 52 154 60"/>
    </g>
  );
  if (state === "feliz") return (
    <g fill="none" stroke={C.dark} strokeWidth={4.5} strokeLinecap="round">
      <path d="M 46 58 Q 66 50 84 56"/>
      <path d="M 116 56 Q 134 50 154 58"/>
    </g>
  );
  return (
    <g fill="none" stroke={C.dark} strokeWidth={4} strokeLinecap="round">
      <path d="M 48 62 Q 66 55 83 60"/>
      <path d="M 117 60 Q 134 55 152 62"/>
    </g>
  );
}

/* ── Mouth ──────────────────────────────────────────────────── */
function Mouth({ state }: { state: TamaVisualState }) {
  const s = { fill: "none" as const, stroke: C.dark, strokeLinecap: "round" as const };
  if (state === "comiendo") return (
    <ellipse cx="100" cy="122" rx="14" ry="11" fill={C.dark}/>
  );
  if (state === "muy_feliz" || state === "jugando") return (
    <g>
      <path d="M 70 118 Q 84 132 100 127 Q 116 132 130 118"
        {...s} strokeWidth={5} strokeLinejoin="round"/>
      <path d="M 86 127 Q 100 136 114 127" fill={C.belly} stroke="none"/>
    </g>
  );
  if (state === "feliz") return (
    <path d="M 72 118 Q 100 134 128 118" {...s} strokeWidth={5}/>
  );
  if (state === "triste" || state === "hambre") return (
    <path d="M 74 126 Q 100 116 126 126" {...s} strokeWidth={4.5}/>
  );
  if (state === "enfadada") return (
    <path d="M 72 124 Q 100 116 128 124" {...s} strokeWidth={5}/>
  );
  if (state === "durmiendo" || state === "cansada") return (
    <path d="M 84 122 Q 100 130 116 122" {...s} strokeWidth={3.5}/>
  );
  return <path d="M 76 118 Q 100 132 124 118" {...s} strokeWidth={4}/>;
}

/* ── Action accessories ─────────────────────────────────────── */
function Accessory({ state }: { state: TamaVisualState }) {
  if (state === "durmiendo") return (
    <g>
      <text x="136" y="58" fontSize="14" fill="#94a3b8" fontWeight="bold"
        style={{ animation: "tama-zzz 2.2s ease-in-out 0s infinite" }}>z</text>
      <text x="148" y="42" fontSize="18" fill="#94a3b8" fontWeight="bold"
        style={{ animation: "tama-zzz 2.2s ease-in-out 0.5s infinite" }}>z</text>
      <text x="162" y="24" fontSize="22" fill="#94a3b8" fontWeight="bold"
        style={{ animation: "tama-zzz 2.2s ease-in-out 1s infinite" }}>Z</text>
    </g>
  );
  if (state === "hambre") return (
    <g>
      <text x="132" y="58" fontSize="22">🍽️</text>
      <text x="20"  y="110" fontSize="16" opacity="0.6">...</text>
    </g>
  );
  if (state === "comiendo") return (
    <text x="18" y="122" fontSize="26" style={{ animation: "tama-chomp 0.35s ease-in-out infinite" }}>🌰</text>
  );
  if (state === "jugando") return (
    <text x="132" y="60" fontSize="22">🎾</text>
  );
  if (state === "muy_feliz") return (
    <g>
      <text x="16"  y="52"  fontSize="14">✨</text>
      <text x="134" y="64"  fontSize="16">⭐</text>
      <text x="18"  y="130" fontSize="12">✨</text>
    </g>
  );
  return null;
}

/* ── Clothing ───────────────────────────────────────────────── */
function Clothing({ equipped, catalog }: { equipped: EquippedClothing; catalog: SquirrelClothing[] }) {
  const get = (slot: string) => {
    const id = equipped[slot as keyof EquippedClothing];
    return id ? catalog.find(c => c.id === id) : undefined;
  };
  const head = get("head"); const neck = get("neck");
  const body = get("body"); const eyes = get("eyes");
  return (
    <>
      {body?.clothingType === "jersey" && (
        <g>
          <rect x="48" y="165" width="104" height="70" rx="22" fill={body.color} opacity="0.92" stroke={C.dark} strokeWidth="3"/>
          <path d="M 72 165 Q 100 156 128 165" fill="none" stroke={body.color} strokeWidth="9" strokeLinecap="round"/>
        </g>
      )}
      {body?.clothingType === "abrigo" && (
        <g>
          <rect x="46" y="163" width="108" height="74" rx="24" fill={body.color} opacity="0.93" stroke={C.dark} strokeWidth="3"/>
          <path d="M 100 163 L 84 188 L 76 196 L 84 196 L 100 180 L 116 196 L 124 196 L 116 188 Z" fill="white" opacity="0.88"/>
          <circle cx="100" cy="204" r="5" fill="#1e293b"/>
          <circle cx="100" cy="220" r="5" fill="#1e293b"/>
        </g>
      )}
      {neck?.clothingType === "bufanda" && (
        <g>
          <ellipse cx="100" cy="160" rx="40" ry="12" fill={neck.color} stroke={C.dark} strokeWidth="2.5"/>
          <ellipse cx="100" cy="163" rx="36" ry="9" fill={neck.color} opacity="0.75"/>
          <rect x="74" y="157" width="16" height="30" rx="7" fill={neck.color}
            stroke={C.dark} strokeWidth="2" transform="rotate(15 82 168)"/>
        </g>
      )}
      {eyes?.clothingType === "gafas" && (
        <g fill="none" stroke={eyes.color} strokeWidth={4.5}>
          <circle cx="72" cy="92" r="32"/>
          <circle cx="128" cy="92" r="32"/>
          <line x1="100" y1="92" x2="96" y2="92"/>
          <line x1="18"  y1="90" x2="40" y2="92"/>
          <line x1="160" y1="92" x2="182" y2="90"/>
        </g>
      )}
      {head?.clothingType === "sombrero" && (
        <g>
          <ellipse cx="100" cy="28" rx="54" ry="13" fill={head.color} stroke={C.dark} strokeWidth="3"/>
          <rect x="60" y="-16" width="80" height="46" rx="10" fill={head.color} stroke={C.dark} strokeWidth="3"/>
          <rect x="60" y="22"  width="80" height="13" rx="4" fill="#991B1B"/>
        </g>
      )}
      {head?.clothingType === "lazo" && (
        <g>
          <path d="M 74 24 Q 64 12 74 20 Q 82 28 100 22 Q 118 28 126 20 Q 136 12 126 24 Q 118 32 100 26 Q 82 32 74 24"
            fill={head.color} stroke={C.dark} strokeWidth="2.5"/>
          <circle cx="100" cy="24" r="8" fill={head.color} stroke={C.dark} strokeWidth="2"/>
        </g>
      )}
      {head?.clothingType === "corona" && (
        <g>
          <path d="M 60 32 L 70 8 L 84 24 L 100 4 L 116 24 L 130 8 L 140 32 Z"
            fill={head.color} stroke="#D97706" strokeWidth="2.5"/>
          <circle cx="100" cy="12" r="6" fill="#F87171"/>
          <circle cx="72"  cy="16" r="4.5" fill="#34D399"/>
          <circle cx="128" cy="16" r="4.5" fill="#60A5FA"/>
        </g>
      )}
    </>
  );
}

/* ── Evolution badge ────────────────────────────────────────── */
function EvoBadge({ phase }: { phase: EvolutionPhase }) {
  if (phase === "bebe")   return null;
  if (phase === "joven")  return <text x="130" y="182" fontSize="16">✨</text>;
  if (phase === "adulta") return (
    <g>
      <circle cx="154" cy="178" r="12" fill="#fbbf24" stroke="#d97706" strokeWidth="2"/>
      <text x="149" y="182" fontSize="11" fontWeight="bold" fill="white">★</text>
    </g>
  );
  /* anciana */
  return (
    <g>
      <circle cx="72"  cy="92"  r="32" fill="none" stroke="#94a3b8" strokeWidth="2" opacity="0.6"/>
      <circle cx="128" cy="92"  r="32" fill="none" stroke="#94a3b8" strokeWidth="2" opacity="0.6"/>
      <line x1="100" y1="92" x2="96" y2="92" stroke="#94a3b8" strokeWidth="3"/>
      <line x1="18"  y1="90" x2="40" y2="92" stroke="#94a3b8" strokeWidth="3"/>
      <line x1="160" y1="92" x2="182" y2="90" stroke="#94a3b8" strokeWidth="3"/>
    </g>
  );
}

/* ════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════ */
type Props = {
  state: TamaVisualState;
  phase?: EvolutionPhase;
  equipped?: EquippedClothing;
  catalog?: SquirrelClothing[];
  isTickling?: boolean;
  className?: string;
};

export default function ChibiArdilla({
  state, phase = "joven", equipped = {}, catalog = [], isTickling = false, className = "",
}: Props) {
  const scale = phase === "bebe" ? 0.88 : 1;

  const animMap: Record<TamaVisualState, string> = {
    muy_feliz:  "tama-bounce-fast",
    feliz:      "tama-bounce",
    neutral:    "tama-breathe",
    triste:     "tama-droop",
    hambre:     "tama-wobble",
    cansada:    "tama-breathe-slow",
    comiendo:   "tama-chomp-body",
    durmiendo:  "tama-breathe-slow",
    jugando:    "tama-bounce-fast",
    enfadada:   "tama-shake",
  };
  const dur: Record<TamaVisualState, string> = {
    muy_feliz:"0.6s", feliz:"2.2s", neutral:"3s", triste:"3.5s", hambre:"0.9s",
    cansada:"4s", comiendo:"2.2s", durmiendo:"4.5s", jugando:"0.65s", enfadada:"0.5s",
  };

  const anim = isTickling ? "tama-tickle" : animMap[state];

  return (
    <div className={`select-none ${className}`} style={{ width: "100%", maxWidth: 180 }}>
      <style>{`
        @keyframes tama-bounce-fast {
          0%,100%{transform:translateY(0) scale(1);}
          30%{transform:translateY(-24px) scale(1.07,0.95);}
          55%{transform:translateY(-10px) scale(1.03,0.98);}
        }
        @keyframes tama-bounce {
          0%,100%{transform:translateY(0);}
          50%{transform:translateY(-16px) scale(1.04,0.97);}
        }
        @keyframes tama-breathe {
          0%,100%{transform:scale(1);}
          50%{transform:scale(1.03,1.02);}
        }
        @keyframes tama-breathe-slow {
          0%,100%{transform:scale(1) translateY(0); opacity:0.9;}
          50%{transform:scale(1.015) translateY(4px); opacity:0.75;}
        }
        @keyframes tama-droop {
          0%,100%{transform:translateY(0) rotate(-2deg);}
          50%{transform:translateY(10px) rotate(2deg);}
        }
        @keyframes tama-wobble {
          0%,100%{transform:rotate(0);}
          20%{transform:rotate(-6deg);}
          40%{transform:rotate(6deg);}
          60%{transform:rotate(-4deg);}
          80%{transform:rotate(4deg);}
        }
        @keyframes tama-shake {
          0%,100%{transform:translateX(0);}
          15%{transform:translateX(-8px) rotate(-4deg);}
          30%{transform:translateX(8px) rotate(4deg);}
          50%{transform:translateX(-6px) rotate(-3deg);}
          70%{transform:translateX(6px) rotate(3deg);}
          85%{transform:translateX(-3px);}
        }
        @keyframes tama-chomp-body {
          0%,100%{transform:scale(1);}
          50%{transform:scale(1.03) translateY(-4px);}
        }
        @keyframes tama-tickle {
          0%,100%{transform:rotate(0) scale(1);}
          15%{transform:rotate(-8deg) scale(1.06);}
          30%{transform:rotate(8deg) scale(1.1);}
          45%{transform:rotate(-6deg) scale(1.06);}
          60%{transform:rotate(6deg) scale(1.08);}
          75%{transform:rotate(-4deg) scale(1.04);}
        }
        @keyframes tama-zzz {
          0%{opacity:0;transform:translateY(0);}
          30%{opacity:0.9;}
          100%{opacity:0;transform:translateY(-20px);}
        }
        @keyframes tama-chomp {
          0%,100%{transform:scale(1) rotate(-10deg);}
          50%{transform:scale(1.15) rotate(10deg);}
        }
        .tama-body { transform-origin: center 85%; }
      `}</style>

      <svg
        viewBox="0 0 200 260"
        xmlns="http://www.w3.org/2000/svg"
        className={`tama-body w-full h-auto`}
        style={{
          animation: `${anim} ${dur[state]} ease-in-out infinite`,
          transform: `scale(${scale})`,
        }}
      >
        {/* ── COLA ── */}
        <path d="M 142 228 C 190 210 218 155 208 92 C 200 42 165 20 136 34"
          fill="none" stroke={C.dark} strokeWidth={58} strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 142 228 C 190 210 218 155 208 92 C 200 42 165 20 136 34"
          fill="none" stroke={C.body} strokeWidth={48} strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 142 218 C 184 202 210 150 200 94 C 193 49 162 28 138 40"
          fill="none" stroke="#FBBF60" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round"/>

        {/* ── CUERPO ── */}
        <ellipse cx="100" cy="208" rx="56" ry="46" fill={C.dark}/>
        <ellipse cx="100" cy="208" rx="52" ry="42" fill={C.body} stroke={C.dark} strokeWidth={C.sw}/>
        {/* Barriga */}
        <ellipse cx="100" cy="214" rx="36" ry="30" fill={C.belly} stroke={C.dark} strokeWidth={3.5}/>
        {/* Patas */}
        <ellipse cx="62"  cy="244" rx="20" ry="13" fill={C.dark}/>
        <ellipse cx="62"  cy="242" rx="18" ry="11" fill={C.body} stroke={C.dark} strokeWidth={3}/>
        <ellipse cx="138" cy="244" rx="20" ry="13" fill={C.dark}/>
        <ellipse cx="138" cy="242" rx="18" ry="11" fill={C.body} stroke={C.dark} strokeWidth={3}/>
        {/* Brazos */}
        <ellipse cx="46"  cy="198" rx="18" ry="26" fill={C.dark}/>
        <ellipse cx="46"  cy="197" rx="15" ry="23" fill={C.body} stroke={C.dark} strokeWidth={3}
          transform="rotate(-20 46 197)"/>
        <ellipse cx="154" cy="198" rx="18" ry="26" fill={C.dark}/>
        <ellipse cx="154" cy="197" rx="15" ry="23" fill={C.body} stroke={C.dark} strokeWidth={3}
          transform="rotate(20 154 197)"/>
        {/* Manitas */}
        <ellipse cx="38"  cy="220" rx="14" ry="10" fill={C.body} stroke={C.dark} strokeWidth={3}/>
        <ellipse cx="162" cy="220" rx="14" ry="10" fill={C.body} stroke={C.dark} strokeWidth={3}/>

        {/* ── OREJAS (antes de la cabeza) ── */}
        <circle cx="54"  cy="28" r="30" fill={C.dark}/>
        <circle cx="54"  cy="28" r="26" fill={C.body} stroke={C.dark} strokeWidth={C.sw}/>
        <circle cx="146" cy="28" r="30" fill={C.dark}/>
        <circle cx="146" cy="28" r="26" fill={C.body} stroke={C.dark} strokeWidth={C.sw}/>

        {/* ── CABEZA ── */}
        <circle cx="100" cy="95" r="76" fill={C.dark}/>
        <circle cx="100" cy="95" r="72" fill={C.body} stroke={C.dark} strokeWidth={C.sw}/>
        {/* Lustre */}
        <circle cx="80"  cy="72" r="28" fill="#FBBF60" opacity="0.22"/>

        {/* ── OREJAS INTERIOR ── */}
        <circle cx="54"  cy="30" r="15" fill={C.ear} stroke={C.dark} strokeWidth={2.5}/>
        <circle cx="146" cy="30" r="15" fill={C.ear} stroke={C.dark} strokeWidth={2.5}/>

        {/* ── CARA ── */}
        {/* Mejillas */}
        <circle cx="32"  cy="108" r="20" fill="rgba(255,140,100,0.35)"/>
        <circle cx="168" cy="108" r="20" fill="rgba(255,140,100,0.35)"/>

        <Eyebrows state={state}/>
        <EyePair   state={state}/>

        {/* Nariz */}
        <ellipse cx="100" cy="122" rx="10" ry="8" fill={C.dark}/>
        <ellipse cx="100" cy="120" rx="6" ry="4" fill="#A0522D" opacity="0.6"/>

        <Mouth state={state}/>

        {/* ── ROPA ── */}
        <Clothing equipped={equipped} catalog={catalog}/>

        {/* ── EVOLUCIÓN ── */}
        <EvoBadge phase={phase}/>

        {/* ── ACCESORIO ESTADO ── */}
        <Accessory state={state}/>
      </svg>
    </div>
  );
}
