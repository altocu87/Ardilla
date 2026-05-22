"use client";
import type { TamaVisualState } from "@/lib/tamagotchi";
import type { EquippedClothing, SquirrelClothing } from "@/lib/squirrel-shop";

/* ════════════════════════════════════════════════════
   HELPERS DE EXPRESIÓN
════════════════════════════════════════════════════ */
function Eyes({ state }: { state: TamaVisualState }) {
  // Sleeping / cansada → líneas horizontales
  if (state === "durmiendo" || state === "cansada") return (
    <g>
      <line x1="44" y1="80" x2="68" y2="80" stroke="#2D1B00" strokeWidth="4" strokeLinecap="round"/>
      <line x1="44" y1="80" x2="50" y2="85" stroke="#2D1B00" strokeWidth="2" strokeLinecap="round"/>
      <line x1="56" y1="80" x2="57" y2="86" stroke="#2D1B00" strokeWidth="2" strokeLinecap="round"/>
      <line x1="65" y1="80" x2="64" y2="85" stroke="#2D1B00" strokeWidth="2" strokeLinecap="round"/>
      <line x1="92" y1="80" x2="116" y2="80" stroke="#2D1B00" strokeWidth="4" strokeLinecap="round"/>
      <line x1="92" y1="80" x2="95" y2="85" stroke="#2D1B00" strokeWidth="2" strokeLinecap="round"/>
      <line x1="104" y1="80" x2="104" y2="86" stroke="#2D1B00" strokeWidth="2" strokeLinecap="round"/>
      <line x1="113" y1="80" x2="111" y2="85" stroke="#2D1B00" strokeWidth="2" strokeLinecap="round"/>
    </g>
  );

  // Muy feliz / comiendo / jugando → arcos ^ (UwU)
  if (state === "muy_feliz" || state === "comiendo" || state === "jugando") return (
    <g>
      <path d="M 43 86 Q 56 70 69 86" fill="none" stroke="#2D1B00" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M 91 86 Q 104 70 117 86" fill="none" stroke="#2D1B00" strokeWidth="3.5" strokeLinecap="round"/>
    </g>
  );

  // Triste / hambre → ojos con lágrima
  if (state === "triste" || state === "hambre") return (
    <g>
      <circle cx="56" cy="82" r="14" fill="white"/>
      <circle cx="58" cy="85" r="9"  fill="#2D1B00"/>
      <circle cx="52" cy="79" r="3"  fill="white"/>
      <path d="M 50 91 Q 48 98 50 102 Q 53 98 50 91" fill="#93C5FD" opacity="0.9"/>
      <circle cx="104" cy="82" r="14" fill="white"/>
      <circle cx="106" cy="85" r="9"  fill="#2D1B00"/>
      <circle cx="100" cy="79" r="3"  fill="white"/>
      <path d="M 110 91 Q 112 98 110 102 Q 107 98 110 91" fill="#93C5FD" opacity="0.9"/>
    </g>
  );

  // Enfadada → ojos normales pequeños
  if (state === "enfadada") return (
    <g>
      <circle cx="56" cy="83" r="13" fill="white"/>
      <circle cx="59" cy="86" r="8"  fill="#2D1B00"/>
      <circle cx="53" cy="80" r="2.5" fill="white"/>
      <circle cx="104" cy="83" r="13" fill="white"/>
      <circle cx="107" cy="86" r="8"  fill="#2D1B00"/>
      <circle cx="101" cy="80" r="2.5" fill="white"/>
    </g>
  );

  // Feliz / neutral → ojos normales grandes con brillo
  return (
    <g>
      <circle cx="56" cy="80" r="15" fill="white"/>
      <circle cx="60" cy="83" r="10" fill="#2D1B00"/>
      <circle cx="54" cy="76" r="4"  fill="white"/>
      <circle cx="65" cy="75" r="2"  fill="rgba(255,255,255,0.8)"/>
      <circle cx="104" cy="80" r="15" fill="white"/>
      <circle cx="108" cy="83" r="10" fill="#2D1B00"/>
      <circle cx="102" cy="76" r="4"  fill="white"/>
      <circle cx="113" cy="75" r="2"  fill="rgba(255,255,255,0.8)"/>
    </g>
  );
}

function Eyebrows({ state }: { state: TamaVisualState }) {
  if (state === "durmiendo" || state === "cansada" || state === "comiendo") return null;

  if (state === "enfadada") return (
    <g stroke="#2D1B00" strokeWidth="3" strokeLinecap="round">
      <line x1="42" y1="62" x2="70" y2="68"/>
      <line x1="90" y1="68" x2="118" y2="62"/>
    </g>
  );

  if (state === "triste" || state === "hambre") return (
    <g fill="none" stroke="#2D1B00" strokeWidth="2.5" strokeLinecap="round">
      <path d="M 42 66 Q 56 59 70 65"/>
      <path d="M 90 65 Q 104 59 118 66"/>
    </g>
  );

  if (state === "muy_feliz" || state === "feliz" || state === "jugando") return (
    <g fill="none" stroke="#2D1B00" strokeWidth="2.5" strokeLinecap="round">
      <path d="M 43 63 Q 56 56 70 62"/>
      <path d="M 90 62 Q 104 56 117 63"/>
    </g>
  );

  return (
    <g fill="none" stroke="#2D1B00" strokeWidth="2" strokeLinecap="round">
      <path d="M 44 65 Q 56 59 69 64"/>
      <path d="M 91 64 Q 104 59 116 65"/>
    </g>
  );
}

function Mouth({ state }: { state: TamaVisualState }) {
  if (state === "comiendo") return (
    <ellipse cx="80" cy="108" rx="10" ry="8" fill="#5C2D0A"/>
  );
  if (state === "muy_feliz" || state === "jugando") return (
    <path d="M 64 106 Q 72 116 80 111 Q 88 116 96 106"
      fill="none" stroke="#5C2D0A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  );
  if (state === "feliz") return (
    <path d="M 66 106 Q 80 118 94 106"
      fill="none" stroke="#5C2D0A" strokeWidth="3" strokeLinecap="round"/>
  );
  if (state === "triste" || state === "hambre") return (
    <path d="M 66 112 Q 80 104 94 112"
      fill="none" stroke="#5C2D0A" strokeWidth="3" strokeLinecap="round"/>
  );
  if (state === "enfadada") return (
    <line x1="66" y1="110" x2="94" y2="110" stroke="#5C2D0A" strokeWidth="3" strokeLinecap="round"/>
  );
  if (state === "durmiendo" || state === "cansada") return (
    <path d="M 72 108 Q 80 113 88 108"
      fill="none" stroke="#5C2D0A" strokeWidth="2" strokeLinecap="round"/>
  );
  return (
    <path d="M 68 107 Q 80 116 92 107"
      fill="none" stroke="#5C2D0A" strokeWidth="2.5" strokeLinecap="round"/>
  );
}

/* ════════════════════════════════════════════════════
   ACCESSORY (acción en curso)
════════════════════════════════════════════════════ */
function ActionAccesory({ state }: { state: TamaVisualState }) {
  if (state === "durmiendo") return (
    <g className="tama-zzz" style={{ animation: "tama-zzz 2s ease-in-out infinite" }}>
      <text x="112" y="58" fontSize="13" fill="#94a3b8" fontWeight="bold" opacity="0.9">z</text>
      <text x="122" y="44" fontSize="17" fill="#94a3b8" fontWeight="bold" opacity="0.7">z</text>
      <text x="134" y="28" fontSize="21" fill="#94a3b8" fontWeight="bold" opacity="0.5">Z</text>
    </g>
  );
  if (state === "hambre") return (
    <g>
      <text x="108" y="60" fontSize="20">🍽️</text>
      <path d="M 114 68 Q 118 72 114 76 Q 110 72 114 68" fill="#fbbf24" opacity="0.8"/>
    </g>
  );
  if (state === "comiendo") return (
    <g style={{ animation: "tama-chomp 0.4s ease-in-out infinite" }}>
      <text x="16" y="118" fontSize="24">🌰</text>
    </g>
  );
  if (state === "jugando") return (
    <g>
      <text x="106" y="55" fontSize="20">🎾</text>
    </g>
  );
  if (state === "muy_feliz") return (
    <g>
      <text x="18"  y="52" fontSize="12">✨</text>
      <text x="120" y="60" fontSize="14">⭐</text>
      <text x="22"  y="120" fontSize="10">✨</text>
    </g>
  );
  return null;
}

/* ════════════════════════════════════════════════════
   ROPA (capas sobre el personaje)
════════════════════════════════════════════════════ */
function Clothing({ equipped, catalog }: { equipped: EquippedClothing; catalog: SquirrelClothing[] }) {
  const get = (slot: string) => {
    const id = equipped[slot as keyof EquippedClothing];
    return id ? catalog.find(c => c.id === id) : undefined;
  };
  const head = get("head");
  const neck = get("neck");
  const body = get("body");
  const eyes = get("eyes");

  return (
    <>
      {/* Jersey */}
      {body?.clothingType === "jersey" && (
        <g>
          <rect x="50" y="133" width="60" height="54" rx="14" fill={body.color} opacity="0.92"/>
          <path d="M 66 133 Q 80 126 94 133" fill="none" stroke={body.color} strokeWidth="7" strokeLinecap="round"/>
          <line x1="80" y1="148" x2="80" y2="168" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
        </g>
      )}
      {/* Abrigo */}
      {body?.clothingType === "abrigo" && (
        <g>
          <rect x="48" y="131" width="64" height="58" rx="16" fill={body.color} opacity="0.93"/>
          <path d="M 80 131 L 68 152 L 62 158 L 68 158 L 80 144 L 92 158 L 98 158 L 92 152 Z"
            fill="white" opacity="0.88"/>
          <circle cx="80" cy="163" r="3.5" fill="#1e293b"/>
          <circle cx="80" cy="173" r="3.5" fill="#1e293b"/>
        </g>
      )}
      {/* Bufanda */}
      {neck?.clothingType === "bufanda" && (
        <g>
          <ellipse cx="80" cy="128" rx="28" ry="9" fill={neck.color}/>
          <ellipse cx="80" cy="130" rx="25" ry="7" fill={neck.color} opacity="0.75"/>
          <rect x="58" y="126" width="12" height="24" rx="5" fill={neck.color}
            transform="rotate(18 64 134)"/>
        </g>
      )}
      {/* Gafas */}
      {eyes?.clothingType === "gafas" && (
        <g fill="none" stroke={eyes.color} strokeWidth="3.5">
          <circle cx="56" cy="80" r="18"/>
          <circle cx="104" cy="80" r="18"/>
          <line x1="74" y1="80" x2="86" y2="80"/>
          <line x1="22" y1="78" x2="38" y2="80"/>
          <line x1="122" y1="80" x2="138" y2="78"/>
        </g>
      )}
      {/* Sombrero hongo */}
      {head?.clothingType === "sombrero" && (
        <g>
          <ellipse cx="80" cy="30" rx="46" ry="11" fill={head.color}/>
          <rect x="50" y="-14" width="60" height="44" rx="8" fill={head.color}/>
          <rect x="50" y="20" width="60" height="11" rx="3" fill="#991B1B"/>
        </g>
      )}
      {/* Lazo */}
      {head?.clothingType === "lazo" && (
        <g>
          <path d="M 70 28 Q 62 16 70 24 Q 76 30 80 26 Q 84 30 90 24 Q 98 16 90 28 Q 84 33 80 28 Q 76 33 70 28"
            fill={head.color}/>
          <circle cx="80" cy="27" r="6" fill={head.color} opacity="0.85"/>
        </g>
      )}
      {/* Corona */}
      {head?.clothingType === "corona" && (
        <g>
          <path d="M 50 34 L 58 12 L 70 26 L 80 8 L 90 26 L 102 12 L 110 34 Z"
            fill={head.color} stroke="#D97706" strokeWidth="1.5"/>
          <circle cx="80" cy="14" r="5"  fill="#F87171"/>
          <circle cx="61" cy="18" r="3.5" fill="#34D399"/>
          <circle cx="99" cy="18" r="3.5" fill="#60A5FA"/>
        </g>
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════ */
type Props = {
  state: TamaVisualState;
  equipped?: EquippedClothing;
  catalog?: SquirrelClothing[];
  className?: string;
};

export default function ChibiArdilla({ state, equipped = {}, catalog = [], className = "" }: Props) {
  // CSS animations
  const bodyAnim: Record<TamaVisualState, string> = {
    muy_feliz:  "tama-bounce-fast",
    feliz:      "tama-bounce",
    neutral:    "tama-breathe",
    triste:     "tama-droop",
    hambre:     "tama-wobble",
    cansada:    "tama-droop",
    comiendo:   "tama-chomp-body",
    durmiendo:  "tama-breathe-slow",
    jugando:    "tama-bounce-fast",
    enfadada:   "tama-shake",
  };

  return (
    <div className={`relative ${className}`} style={{ width: "100%", maxWidth: 180 }}>
      <style>{`
        @keyframes tama-bounce-fast {
          0%,100%{transform:translateY(0) scale(1);}
          30%{transform:translateY(-22px) scale(1.06);}
          60%{transform:translateY(-10px) scale(1.03);}
        }
        @keyframes tama-bounce {
          0%,100%{transform:translateY(0);}
          50%{transform:translateY(-14px);}
        }
        @keyframes tama-breathe {
          0%,100%{transform:scale(1);}
          50%{transform:scale(1.035);}
        }
        @keyframes tama-breathe-slow {
          0%,100%{transform:scale(1) translateY(0); opacity:0.85;}
          50%{transform:scale(1.02) translateY(4px); opacity:0.7;}
        }
        @keyframes tama-droop {
          0%,100%{transform:translateY(0) rotate(-2deg);}
          50%{transform:translateY(8px) rotate(2deg);}
        }
        @keyframes tama-wobble {
          0%,100%{transform:rotate(0deg);}
          20%{transform:rotate(-5deg);}
          40%{transform:rotate(5deg);}
          60%{transform:rotate(-3deg);}
          80%{transform:rotate(3deg);}
        }
        @keyframes tama-shake {
          0%,100%{transform:translateX(0);}
          15%{transform:translateX(-7px) rotate(-4deg);}
          30%{transform:translateX(7px) rotate(4deg);}
          45%{transform:translateX(-5px) rotate(-3deg);}
          60%{transform:translateX(5px) rotate(3deg);}
          75%{transform:translateX(-3px);}
        }
        @keyframes tama-chomp-body {
          0%,100%{transform:scale(1);}
          50%{transform:scale(1.025) translateY(-3px);}
        }
        @keyframes tama-zzz {
          0%{opacity:0; transform:translateY(0);}
          30%{opacity:1;}
          100%{opacity:0; transform:translateY(-18px);}
        }
        .tama-body { transform-origin: center bottom; }
      `}</style>

      <svg
        viewBox="0 0 160 220"
        xmlns="http://www.w3.org/2000/svg"
        className={`tama-body w-full h-auto ${bodyAnim[state]}`}
        style={{ animation: `${bodyAnim[state]} ${
          state === "muy_feliz" || state === "jugando" ? "0.65s" :
          state === "enfadada" ? "0.55s" :
          state === "wobble" ? "0.8s" :
          state === "durmiendo" || state === "cansada" ? "4s" : "2.5s"
        } ease-in-out infinite` }}
      >
        {/* ── COLA (detrás de todo) ── */}
        <path
          d="M 95 180 C 140 165 168 108 160 56 C 153 14 118 -3 90 16 C 77 25 75 43 86 53"
          fill="none" stroke="#C4742A" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round"
        />
        <path
          d="M 95 170 C 135 157 160 105 153 58 C 147 20 116 5 92 22 C 81 30 80 44 88 52"
          fill="none" stroke="#E8A85A" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"
        />

        {/* ── CUERPO ── */}
        <ellipse cx="80" cy="160" rx="32" ry="30" fill="#C4742A"/>
        {/* Barriga */}
        <ellipse cx="80" cy="165" rx="21" ry="19" fill="#F0C87A"/>
        {/* Piernas */}
        <ellipse cx="60" cy="186" rx="13" ry="9" fill="#B5631A"/>
        <ellipse cx="100" cy="186" rx="13" ry="9" fill="#B5631A"/>
        {/* Patitas */}
        <ellipse cx="54" cy="192" rx="10" ry="6" fill="#9A4E10"/>
        <ellipse cx="106" cy="192" rx="10" ry="6" fill="#9A4E10"/>
        {/* Brazos */}
        <ellipse cx="50" cy="152" rx="11" ry="18" fill="#C4742A"
          transform="rotate(-22 50 152)"/>
        <ellipse cx="110" cy="152" rx="11" ry="18" fill="#C4742A"
          transform="rotate(22 110 152)"/>
        {/* Manitas */}
        <ellipse cx="42" cy="165" rx="9" ry="6" fill="#B5631A"/>
        <ellipse cx="118" cy="165" rx="9" ry="6" fill="#B5631A"/>

        {/* ── OREJAS (antes de la cabeza) ── */}
        <circle cx="40" cy="36" r="22" fill="#C4742A"/>
        <circle cx="120" cy="36" r="22" fill="#C4742A"/>

        {/* ── CABEZA ── */}
        <circle cx="80" cy="84" r="54" fill="#C4742A"/>
        {/* Lustre de cabeza */}
        <circle cx="65" cy="66" r="22" fill="#D4883A" opacity="0.28"/>

        {/* ── OREJAS INTERIOR ── */}
        <circle cx="40" cy="38" r="13" fill="#F08080"/>
        <circle cx="120" cy="38" r="13" fill="#F08080"/>

        {/* ── CARA ── */}
        {/* Mejillas */}
        <circle cx="30" cy="96" r="17" fill="rgba(255,120,100,0.28)"/>
        <circle cx="130" cy="96" r="17" fill="rgba(255,120,100,0.28)"/>

        <Eyebrows state={state}/>
        <Eyes state={state}/>

        {/* Nariz */}
        <ellipse cx="80" cy="102" rx="6" ry="5" fill="#8B4513"/>

        <Mouth state={state}/>

        {/* ── ROPA ── */}
        <Clothing equipped={equipped} catalog={catalog}/>

        {/* ── ACCESORIOS DE ESTADO ── */}
        <ActionAccesory state={state}/>
      </svg>
    </div>
  );
}
