"use client";
import type { TamaVisualState } from "@/lib/tamagotchi";
import type { EquippedClothing, SquirrelClothing } from "@/lib/squirrel-shop";
import type { EvolutionPhase } from "@/lib/tama-evolution";

/* ════════════════════════════════════════════════════
   DUOLINGO-STYLE SQUIRREL  — viewBox 0 0 240 270
   Head: cx=115 cy=108 r=70
   Body: cx=115 cy=213 rx=52 ry=40
   Tail: cubic bezier within viewBox (max-x ≈ 213)
════════════════════════════════════════════════════ */
const C = {
  body:  "#F5A623",
  dark:  "#7C3E00",
  belly: "#FFF3DC",
  ear:   "#F5A0A0",
  sw:    4.5,
};

/* ── Eyes ──────────────────────────────────────── */
function EyePair({ state, cx1=84, cx2=146, cy=106 }: {
  state: TamaVisualState; cx1?: number; cx2?: number; cy?: number;
}) {
  /* Sleeping / cansada — closed arcs with lashes */
  if (state === "durmiendo" || state === "cansada") return (
    <g>
      {[cx1, cx2].map((cx, i) => (
        <g key={i}>
          <path d={`M ${cx-24} ${cy} Q ${cx} ${cy-16} ${cx+24} ${cy}`}
            fill="none" stroke={C.dark} strokeWidth={5} strokeLinecap="round"/>
          {[-12, 0, 12].map((dx, j) => (
            <line key={j} x1={cx+dx} y1={cy-10} x2={cx+dx} y2={cy-18}
              stroke={C.dark} strokeWidth={2.5} strokeLinecap="round"/>
          ))}
        </g>
      ))}
    </g>
  );

  /* Muy feliz / jugando / comiendo — ^ arch */
  if (state === "muy_feliz" || state === "jugando" || state === "comiendo") return (
    <g>
      {[cx1, cx2].map((cx, i) => (
        <path key={i} d={`M ${cx-24} ${cy+6} Q ${cx} ${cy-14} ${cx+24} ${cy+6}`}
          fill="none" stroke={C.dark} strokeWidth={5} strokeLinecap="round"/>
      ))}
    </g>
  );

  /* Triste / hambre — open eyes with teardrops */
  if (state === "triste" || state === "hambre") return (
    <g>
      {[cx1, cx2].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={22} fill="white" stroke={C.dark} strokeWidth={C.sw}/>
          <circle cx={cx+3} cy={cy+4} r={14} fill={C.dark}/>
          <circle cx={cx-5} cy={cy-4} r={6} fill="white"/>
          <circle cx={cx+9} cy={cy-2} r={3} fill="white" opacity={0.7}/>
          <path d={`M ${cx+16} ${cy+10} Q ${cx+20} ${cy+20} ${cx+16} ${cy+25} Q ${cx+12} ${cy+20} ${cx+16} ${cy+10}`}
            fill="#93C5FD" opacity={0.85}/>
        </g>
      ))}
    </g>
  );

  /* Enfadada — narrowed with angry lid */
  if (state === "enfadada") return (
    <g>
      {[cx1, cx2].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={22} fill="white" stroke={C.dark} strokeWidth={C.sw}/>
          <path d={`M ${cx-22} ${cy-5} Q ${cx} ${cy-20} ${cx+22} ${cy-5} L ${cx+22} ${cy-26} L ${cx-22} ${cy-26} Z`}
            fill={C.body}/>
          <path d={`M ${cx-22} ${cy-5} Q ${cx} ${cy-20} ${cx+22} ${cy-5}`}
            fill="none" stroke={C.dark} strokeWidth={3.5} strokeLinecap="round"/>
          <circle cx={cx+2} cy={cy+4} r={13} fill={C.dark}/>
          <circle cx={cx-5} cy={cy-2} r={5} fill="white"/>
        </g>
      ))}
    </g>
  );

  /* Malita — half-closed, pale green tint */
  if (state === "malita") return (
    <g>
      {[cx1, cx2].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={22} fill="#e8f5e4" stroke={C.dark} strokeWidth={C.sw}/>
          <path d={`M ${cx-22} ${cy-2} Q ${cx} ${cy-15} ${cx+22} ${cy-2} L ${cx+22} ${cy-26} L ${cx-22} ${cy-26} Z`}
            fill={C.body} opacity="0.88"/>
          <path d={`M ${cx-22} ${cy-2} Q ${cx} ${cy-15} ${cx+22} ${cy-2}`}
            fill="none" stroke={C.dark} strokeWidth={3.5} strokeLinecap="round"/>
          <circle cx={cx+1} cy={cy+6} r={12} fill="#3d6b35" opacity="0.6"/>
          <circle cx={cx-5} cy={cy} r={4} fill="white" opacity="0.6"/>
        </g>
      ))}
    </g>
  );

  /* Feliz & neutral — open happy eyes (no squint) */
  return (
    <g>
      {[cx1, cx2].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={22} fill="white" stroke={C.dark} strokeWidth={C.sw}/>
          <circle cx={cx+3} cy={cy+4} r={14} fill={C.dark}/>
          <circle cx={cx-5} cy={cy-4} r={6} fill="white"/>
          <circle cx={cx+9} cy={cy-2} r={3} fill="white" opacity={0.7}/>
        </g>
      ))}
    </g>
  );
}

/* ── Eyebrows ───────────────────────────────────── */
function Eyebrows({ state }: { state: TamaVisualState }) {
  if (["durmiendo","cansada","comiendo","muy_feliz","jugando"].includes(state)) return null;
  if (state === "enfadada") return (
    <g stroke={C.dark} strokeWidth={5} strokeLinecap="round">
      <path d="M 63 83 Q 78 76 93 81" fill="none"/>
      <path d="M 137 81 Q 152 76 167 83" fill="none"/>
    </g>
  );
  if (state === "triste" || state === "hambre" || state === "malita") return (
    <g fill="none" stroke={C.dark} strokeWidth={4.5} strokeLinecap="round">
      <path d="M 64 81 Q 76 73 91 79"/>
      <path d="M 139 79 Q 154 73 166 81"/>
    </g>
  );
  return (
    <g fill="none" stroke={C.dark} strokeWidth={4} strokeLinecap="round">
      <path d="M 65 80 Q 79 72 93 78"/>
      <path d="M 137 78 Q 151 72 165 80"/>
    </g>
  );
}

/* ── Mouth ──────────────────────────────────────── */
function Mouth({ state }: { state: TamaVisualState }) {
  const s = { fill: "none" as const, stroke: C.dark, strokeLinecap: "round" as const };
  if (state === "comiendo")  return <ellipse cx="115" cy="126" rx="13" ry="10" fill={C.dark}/>;
  if (state === "muy_feliz" || state === "jugando") return (
    <g>
      <path d="M 82 122 Q 97 136 115 130 Q 133 136 148 122"
        {...s} strokeWidth={5} strokeLinejoin="round"/>
      <path d="M 98 130 Q 115 138 132 130" fill={C.belly} stroke="none"/>
    </g>
  );
  if (state === "feliz") return (
    <path d="M 84 122 Q 115 138 146 122" {...s} strokeWidth={5}/>
  );
  if (state === "triste" || state === "hambre") return (
    <path d="M 88 130 Q 115 120 142 130" {...s} strokeWidth={4.5}/>
  );
  if (state === "enfadada") return (
    <path d="M 85 128 Q 115 120 145 128" {...s} strokeWidth={5}/>
  );
  if (state === "durmiendo" || state === "cansada") return (
    <path d="M 97 124 Q 115 132 133 124" {...s} strokeWidth={3.5}/>
  );
  if (state === "malita") return (
    <path d="M 86 130 Q 96 124 106 130 Q 116 136 126 130 Q 136 124 144 130"
      {...s} strokeWidth={3.5}/>
  );
  return <path d="M 88 122 Q 115 136 142 122" {...s} strokeWidth={4}/>;
}

/* ── Action accessories ─────────────────────────── */
function Accessory({ state }: { state: TamaVisualState }) {
  if (state === "durmiendo") return (
    <g>
      <text x="150" y="62" fontSize="13" fill="#94a3b8" fontWeight="bold"
        style={{ animation: "tama-zzz 2.2s ease-in-out 0s infinite" }}>z</text>
      <text x="163" y="46" fontSize="17" fill="#94a3b8" fontWeight="bold"
        style={{ animation: "tama-zzz 2.2s ease-in-out 0.5s infinite" }}>z</text>
      <text x="178" y="28" fontSize="22" fill="#94a3b8" fontWeight="bold"
        style={{ animation: "tama-zzz 2.2s ease-in-out 1s infinite" }}>Z</text>
    </g>
  );
  if (state === "hambre") return (
    <g>
      <text x="148" y="60" fontSize="20">🍽️</text>
      <text x="18"  y="110" fontSize="14" opacity="0.55">...</text>
    </g>
  );
  if (state === "comiendo") return (
    <text x="16" y="126" fontSize="24" style={{ animation: "tama-chomp 0.35s ease-in-out infinite" }}>🌰</text>
  );
  if (state === "jugando") return (
    <text x="150" y="62" fontSize="22">🎾</text>
  );
  if (state === "muy_feliz") return (
    <g>
      <text x="14"  y="50"  fontSize="14">✨</text>
      <text x="153" y="66"  fontSize="16">⭐</text>
      <text x="16"  y="135" fontSize="12">✨</text>
    </g>
  );
  if (state === "malita") return (
    <g>
      <text x="149" y="60" fontSize="18">🌡️</text>
      <text x="19"  y="90"  fontSize="13" fill="#72b862"
        style={{ animation: "tama-wobble 1.2s ease-in-out infinite" }}>~</text>
      <text x="157" y="100" fontSize="13" fill="#72b862"
        style={{ animation: "tama-wobble 1.2s ease-in-out 0.4s infinite" }}>~</text>
      <text x="22"  y="145" fontSize="13" fill="#72b862"
        style={{ animation: "tama-wobble 1.2s ease-in-out 0.8s infinite" }}>~</text>
    </g>
  );
  return null;
}

/* ── Clothing ───────────────────────────────────── */
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
          <rect x="52" y="170" width="106" height="68" rx="22" fill={body.color} opacity="0.92" stroke={C.dark} strokeWidth="3"/>
          <path d="M 76 170 Q 115 160 154 170" fill="none" stroke={body.color} strokeWidth="9" strokeLinecap="round"/>
        </g>
      )}
      {body?.clothingType === "abrigo" && (
        <g>
          <rect x="50" y="168" width="130" height="72" rx="24" fill={body.color} opacity="0.93" stroke={C.dark} strokeWidth="3"/>
          <path d="M 115 168 L 99 192 L 91 200 L 99 200 L 115 184 L 131 200 L 139 200 L 131 192 Z" fill="white" opacity="0.88"/>
          <circle cx="115" cy="210" r="5" fill="#1e293b"/>
          <circle cx="115" cy="225" r="5" fill="#1e293b"/>
        </g>
      )}
      {neck?.clothingType === "bufanda" && (
        <g>
          <ellipse cx="115" cy="162" rx="42" ry="12" fill={neck.color} stroke={C.dark} strokeWidth="2.5"/>
          <ellipse cx="115" cy="165" rx="38" ry="9" fill={neck.color} opacity="0.75"/>
          <rect x="90" y="159" width="16" height="30" rx="7" fill={neck.color}
            stroke={C.dark} strokeWidth="2" transform="rotate(15 98 172)"/>
        </g>
      )}
      {eyes?.clothingType === "gafas" && (
        <g fill="none" stroke={eyes.color} strokeWidth={4}>
          <circle cx="84" cy="106" r="28"/>
          <circle cx="146" cy="106" r="28"/>
          <line x1="112" y1="106" x2="118" y2="106"/>
          <line x1="22"  y1="104" x2="56"  y2="106"/>
          <line x1="174" y1="106" x2="208" y2="104"/>
        </g>
      )}
      {head?.clothingType === "sombrero" && (
        <g>
          <ellipse cx="115" cy="40" rx="56" ry="13" fill={head.color} stroke={C.dark} strokeWidth="3"/>
          <rect x="75" y="-4" width="80" height="46" rx="10" fill={head.color} stroke={C.dark} strokeWidth="3"/>
          <rect x="75" y="36"  width="80" height="12" rx="4" fill="#991B1B"/>
        </g>
      )}
      {head?.clothingType === "lazo" && (
        <g>
          <path d="M 89 36 Q 79 24 89 32 Q 97 40 115 34 Q 133 40 141 32 Q 151 24 141 36 Q 133 44 115 38 Q 97 44 89 36"
            fill={head.color} stroke={C.dark} strokeWidth="2.5"/>
          <circle cx="115" cy="36" r="8" fill={head.color} stroke={C.dark} strokeWidth="2"/>
        </g>
      )}
      {head?.clothingType === "corona" && (
        <g>
          <path d="M 75 44 L 85 20 L 99 36 L 115 16 L 131 36 L 145 20 L 155 44 Z"
            fill={head.color} stroke="#D97706" strokeWidth="2.5"/>
          <circle cx="115" cy="22" r="6" fill="#F87171"/>
          <circle cx="87"  cy="28" r="4.5" fill="#34D399"/>
          <circle cx="143" cy="28" r="4.5" fill="#60A5FA"/>
        </g>
      )}
    </>
  );
}

/* ── Evolution badge ────────────────────────────── */
function EvoBadge({ phase }: { phase: EvolutionPhase }) {
  if (phase === "bebe")   return null;
  if (phase === "joven")  return <text x="148" y="190" fontSize="16">✨</text>;
  if (phase === "adulta") return (
    <g>
      <circle cx="168" cy="186" r="12" fill="#fbbf24" stroke="#d97706" strokeWidth="2"/>
      <text x="163" y="190" fontSize="11" fontWeight="bold" fill="white">★</text>
    </g>
  );
  /* anciana — reading glasses */
  return (
    <g>
      <circle cx="84"  cy="106" r="26" fill="none" stroke="#94a3b8" strokeWidth="2.5" opacity="0.7"/>
      <circle cx="146" cy="106" r="26" fill="none" stroke="#94a3b8" strokeWidth="2.5" opacity="0.7"/>
      <line x1="110" y1="106" x2="120" y2="106" stroke="#94a3b8" strokeWidth="3"/>
      <line x1="18"  y1="104" x2="58"  y2="106" stroke="#94a3b8" strokeWidth="3"/>
      <line x1="172" y1="106" x2="212" y2="104" stroke="#94a3b8" strokeWidth="3"/>
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
  state, phase = "bebe", equipped = {}, catalog = [], isTickling = false, className = "",
}: Props) {
  const scale = phase === "bebe" ? 0.92 : 1;

  const animMap: Record<TamaVisualState, string> = {
    muy_feliz: "tama-bounce-fast",
    feliz:     "tama-bounce",
    neutral:   "tama-breathe",
    triste:    "tama-droop",
    hambre:    "tama-wobble",
    cansada:   "tama-breathe-slow",
    comiendo:  "tama-chomp-body",
    durmiendo: "tama-breathe-slow",
    jugando:   "tama-bounce-fast",
    enfadada:  "tama-shake",
    malita:    "tama-droop",
  };
  const dur: Record<TamaVisualState, string> = {
    muy_feliz:"0.6s", feliz:"2s", neutral:"3s", triste:"3.5s", hambre:"0.9s",
    cansada:"4s", comiendo:"2s", durmiendo:"4.5s", jugando:"0.65s", enfadada:"0.5s",
    malita:"2.5s",
  };

  const anim = isTickling ? "tama-tickle" : animMap[state];

  return (
    <div className={`select-none ${className}`} style={{ width: "100%", maxWidth: 190 }}>
      <style>{`
        @keyframes tama-bounce-fast {
          0%,100%{transform:translateY(0) scale(1);}
          30%{transform:translateY(-22px) scale(1.07,0.95);}
          55%{transform:translateY(-8px) scale(1.03,0.98);}
        }
        @keyframes tama-bounce {
          0%,100%{transform:translateY(0);}
          50%{transform:translateY(-14px) scale(1.04,0.97);}
        }
        @keyframes tama-breathe {
          0%,100%{transform:scale(1);}
          50%{transform:scale(1.03,1.02);}
        }
        @keyframes tama-breathe-slow {
          0%,100%{transform:scale(1) translateY(0); opacity:0.92;}
          50%{transform:scale(1.015) translateY(4px); opacity:0.78;}
        }
        @keyframes tama-droop {
          0%,100%{transform:translateY(0) rotate(-2deg);}
          50%{transform:translateY(9px) rotate(2deg);}
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
          15%{transform:rotate(-9deg) scale(1.07);}
          30%{transform:rotate(9deg) scale(1.12);}
          45%{transform:rotate(-6deg) scale(1.06);}
          60%{transform:rotate(6deg) scale(1.09);}
          75%{transform:rotate(-4deg) scale(1.04);}
        }
        @keyframes tama-zzz {
          0%{opacity:0;transform:translateY(0);}
          30%{opacity:0.85;}
          100%{opacity:0;transform:translateY(-20px);}
        }
        @keyframes tama-chomp {
          0%,100%{transform:scale(1) rotate(-10deg);}
          50%{transform:scale(1.18) rotate(10deg);}
        }
        .tama-body { transform-origin: center 82%; }
      `}</style>

      <svg
        viewBox="0 0 240 270"
        xmlns="http://www.w3.org/2000/svg"
        className="tama-body w-full h-auto"
        style={{ animation: `${anim} ${dur[state]} ease-in-out infinite`, transform: `scale(${scale})` }}
      >
        {/* ══ COLA ══ (behind everything, drawn first) */}
        {/* Three-layer tail: dark outline → orange fill → warm highlight */}
        <path d="M 158 214 C 203 192 213 138 208 95 C 202 54 180 28 162 46"
          fill="none" stroke={C.dark}    strokeWidth={52} strokeLinecap="round"/>
        <path d="M 158 214 C 203 192 213 138 208 95 C 202 54 180 28 162 46"
          fill="none" stroke={C.body}    strokeWidth={42} strokeLinecap="round"/>
        <path d="M 157 210 C 198 190 207 138 203 97 C 197 60 178 36 163 52"
          fill="none" stroke="#FBD080"   strokeWidth={18} strokeLinecap="round"/>
        {/* Fluffy tail tip highlight */}
        <circle cx="165" cy="50" r="22" fill={C.dark} opacity="0.18"/>

        {/* ══ CUERPO ══ */}
        {/* Shadow */}
        <ellipse cx="115" cy="215" rx="55" ry="43" fill={C.dark} opacity="0.35"/>
        {/* Body */}
        <ellipse cx="115" cy="213" rx="52" ry="40" fill={C.body} stroke={C.dark} strokeWidth={C.sw}/>
        {/* Belly */}
        <ellipse cx="115" cy="220" rx="33" ry="27" fill={C.belly} stroke={C.dark} strokeWidth={3.5}/>
        {/* Sick belly tint */}
        {state === "malita" && (
          <ellipse cx="115" cy="220" rx="33" ry="27" fill="rgba(90,180,70,0.14)"/>
        )}

        {/* ══ PATAS ══ */}
        <ellipse cx="73"  cy="248" rx="22" ry="12" fill={C.dark} opacity="0.4"/>
        <ellipse cx="73"  cy="246" rx="19" ry="10" fill={C.body} stroke={C.dark} strokeWidth={3}/>
        <ellipse cx="157" cy="248" rx="22" ry="12" fill={C.dark} opacity="0.4"/>
        <ellipse cx="157" cy="246" rx="19" ry="10" fill={C.body} stroke={C.dark} strokeWidth={3}/>

        {/* ══ BRAZOS ══ */}
        <ellipse cx="52"  cy="200" rx="15" ry="23" fill={C.dark} opacity="0.35" transform="rotate(-22 52 200)"/>
        <ellipse cx="52"  cy="199" rx="13" ry="21" fill={C.body} stroke={C.dark} strokeWidth={3} transform="rotate(-22 52 199)"/>
        <ellipse cx="178" cy="200" rx="15" ry="23" fill={C.dark} opacity="0.35" transform="rotate(22 178 200)"/>
        <ellipse cx="178" cy="199" rx="13" ry="21" fill={C.body} stroke={C.dark} strokeWidth={3} transform="rotate(22 178 199)"/>
        {/* Hands/paws */}
        <ellipse cx="44"  cy="220" rx="13" ry="9" fill={C.body} stroke={C.dark} strokeWidth={3}/>
        <ellipse cx="186" cy="220" rx="13" ry="9" fill={C.body} stroke={C.dark} strokeWidth={3}/>

        {/* ══ OREJAS ══ (behind head — pointed squirrel ears) */}
        {/* Left ear */}
        <ellipse cx="60" cy="42" rx="19" ry="29" fill={C.dark} transform="rotate(-12 60 42)"/>
        <ellipse cx="60" cy="42" rx="15" ry="25" fill={C.body} stroke={C.dark} strokeWidth={3.5} transform="rotate(-12 60 42)"/>
        <ellipse cx="60" cy="40" rx="8"  ry="15" fill={C.ear} opacity="0.85" transform="rotate(-12 60 40)"/>

        {/* Right ear */}
        <ellipse cx="170" cy="42" rx="19" ry="29" fill={C.dark} transform="rotate(12 170 42)"/>
        <ellipse cx="170" cy="42" rx="15" ry="25" fill={C.body} stroke={C.dark} strokeWidth={3.5} transform="rotate(12 170 42)"/>
        <ellipse cx="170" cy="40" rx="8"  ry="15" fill={C.ear} opacity="0.85" transform="rotate(12 170 40)"/>

        {/* ══ CABEZA ══ */}
        {/* Shadow */}
        <circle cx="115" cy="110" r="74" fill={C.dark} opacity="0.3"/>
        {/* Head */}
        <circle cx="115" cy="108" r="70" fill={C.body} stroke={C.dark} strokeWidth={C.sw}/>
        {/* Sick head tint */}
        {state === "malita" && (
          <circle cx="115" cy="108" r="70" fill="rgba(90,200,70,0.10)"/>
        )}
        {/* Subtle gloss */}
        <circle cx="90"  cy="80"  r="28" fill="#FBD080" opacity="0.18"/>

        {/* ══ MEJILLAS ══ */}
        <circle cx="57"  cy="120" r="22" fill="rgba(255,110,80,0.28)"/>
        <circle cx="173" cy="120" r="22" fill="rgba(255,110,80,0.28)"/>

        {/* ══ CARA ══ */}
        <Eyebrows state={state}/>
        <EyePair   state={state}/>

        {/* Nariz */}
        <ellipse cx="115" cy="119" rx="9" ry="7" fill={C.dark}/>
        <ellipse cx="115" cy="117" rx="5" ry="3.5" fill="#A0522D" opacity="0.55"/>

        <Mouth state={state}/>

        {/* ══ ROPA ══ */}
        <Clothing equipped={equipped} catalog={catalog}/>

        {/* ══ EVOLUCIÓN ══ */}
        <EvoBadge phase={phase}/>

        {/* ══ ACCESORIO ESTADO ══ */}
        <Accessory state={state}/>
      </svg>
    </div>
  );
}
