"use client";
import type { TamaVisualState, IllnessType } from "@/lib/tamagotchi";
import type { EquippedClothing, SquirrelClothing } from "@/lib/squirrel-shop";
import type { EvolutionPhase } from "@/lib/tama-evolution";

/* ════════════════════════════════════════════════════
   DUOLINGO-STYLE SQUIRREL  — viewBox 0 0 240 270
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
  if (state === "durmiendo" || state === "cansada" || state === "muy_cansada") return (
    <g>
      {[cx1, cx2].map((cx, i) => (
        <g key={i}>
          {state === "muy_cansada" && (
            <ellipse cx={cx} cy={cy+20} rx={20} ry={9} fill="#6b21a8" opacity="0.45"/>
          )}
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

  if (state === "ojeras") return (
    <g>
      {[cx1, cx2].map((cx, i) => (
        <g key={i}>
          {/* Ojera (dark circle) */}
          <ellipse cx={cx} cy={cy+20} rx={20} ry={9} fill="#7c3aed" opacity="0.35"/>
          {/* Ojo medio cerrado */}
          <path d={`M ${cx-24} ${cy} Q ${cx} ${cy-16} ${cx+24} ${cy}`}
            fill="none" stroke={C.dark} strokeWidth={5} strokeLinecap="round"/>
          {[-12, 0, 12].map((dx, j) => (
            <line key={j} x1={cx+dx} y1={cy-10} x2={cx+dx} y2={cy-17}
              stroke={C.dark} strokeWidth={2.5} strokeLinecap="round"/>
          ))}
        </g>
      ))}
    </g>
  );

  if (state === "muy_feliz" || state === "jugando" || state === "comiendo") return (
    <g>
      {[cx1, cx2].map((cx, i) => (
        <path key={i} d={`M ${cx-24} ${cy+6} Q ${cx} ${cy-14} ${cx+24} ${cy+6}`}
          fill="none" stroke={C.dark} strokeWidth={5} strokeLinecap="round"/>
      ))}
    </g>
  );

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
  if (["durmiendo","cansada","muy_cansada","comiendo","muy_feliz","jugando"].includes(state)) return null;
  if (state === "enfadada" || state === "ojeras") return (
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
  if (state === "ojeras") return (
    <path d="M 88 128 Q 115 121 142 128" {...s} strokeWidth={4.5}/>
  );
  if (state === "durmiendo" || state === "cansada" || state === "muy_cansada") return (
    <path d="M 97 124 Q 115 132 133 124" {...s} strokeWidth={3.5}/>
  );
  if (state === "malita") return (
    <path d="M 86 130 Q 96 124 106 130 Q 116 136 126 130 Q 136 124 144 130"
      {...s} strokeWidth={3.5}/>
  );
  return <path d="M 88 122 Q 115 136 142 122" {...s} strokeWidth={4}/>;
}

/* ── Action accessories ─────────────────────────── */
function Accessory({ state, illnessType }: { state: TamaVisualState; illnessType?: IllnessType }) {
  const floatStyle = (delay: string) => ({ animation: `tama-heartfloat 1.5s ease-out ${delay} infinite` } as React.CSSProperties);
  const tearStyle  = (delay: string) => ({ animation: `tama-tearfall 2s ease-in ${delay} infinite` } as React.CSSProperties);
  const waveStyle  = (delay: string) => ({ animation: `tama-wobble 1.2s ease-in-out ${delay} infinite` } as React.CSSProperties);

  if (state === "durmiendo") return (
    <g>
      <text x="150" y="62" fontSize="13" fill="#94a3b8" fontWeight="bold"
        style={{ animation: "tama-zzz 2.2s ease-in-out 0s infinite" }}>z</text>
      <text x="163" y="46" fontSize="17" fill="#94a3b8" fontWeight="bold"
        style={{ animation: "tama-zzz 2.2s ease-in-out 0.5s infinite" }}>z</text>
      <text x="178" y="28" fontSize="22" fill="#94a3b8" fontWeight="bold"
        style={{ animation: "tama-zzz 2.2s ease-in-out 1s infinite" }}>Z</text>
      <text x="16" y="86" fontSize="14" fill="#c4b5fd"
        style={{ animation: "tama-zzz 2.2s ease-in-out 1.5s infinite" }}>🌰</text>
    </g>
  );

  if (state === "muy_cansada") return (
    <g>
      <text x="152" y="66" fontSize="11" fill="#94a3b8" fontWeight="bold" opacity="0.65"
        style={{ animation: "tama-zzz 3s ease-in-out 0s infinite" }}>z</text>
      <text x="163" y="52" fontSize="14" fill="#94a3b8" fontWeight="bold" opacity="0.5"
        style={{ animation: "tama-zzz 3s ease-in-out 0.8s infinite" }}>z</text>
      <text x="88"  y="24" fontSize="14">😩</text>
    </g>
  );

  if (state === "hambre") return (
    <g>
      <text x="148" y="60" fontSize="20">🍽️</text>
      <text x="18"  y="110" fontSize="14" opacity="0.55">...</text>
    </g>
  );

  if (state === "comiendo") return (
    <g>
      <text x="16" y="126" fontSize="24" style={{ animation: "tama-chomp 0.35s ease-in-out infinite" }}>🌰</text>
      <text x="148" y="60" fontSize="14" style={floatStyle("0s")}>✨</text>
      <text x="16"  y="75" fontSize="12" style={floatStyle("0.5s")}>😋</text>
    </g>
  );

  if (state === "jugando") return (
    <g>
      <text x="150" y="62" fontSize="22" style={{ animation: "tama-chomp 0.45s ease-in-out infinite" }}>🎾</text>
      <text x="16"  y="70" fontSize="12" style={floatStyle("0.3s")}>⭐</text>
    </g>
  );

  if (state === "muy_feliz") return (
    <g>
      <text x="14"  y="50"  fontSize="16" style={floatStyle("0s")}>💖</text>
      <text x="153" y="66"  fontSize="15" style={floatStyle("0.3s")}>⭐</text>
      <text x="14"  y="135" fontSize="13" style={floatStyle("0.6s")}>🌰</text>
      <text x="154" y="140" fontSize="14" style={floatStyle("0.9s")}>✨</text>
      <text x="84"  y="28"  fontSize="12" style={floatStyle("1.2s")}>🎉</text>
    </g>
  );

  if (state === "triste" || state === "hambre") return null; // tears already in eyes

  if (state === "triste") return (
    <g>
      <text x="55"  y="155" fontSize="11" fill="#93C5FD" style={tearStyle("0s")}>💧</text>
      <text x="166" y="148" fontSize="11" fill="#93C5FD" style={tearStyle("0.7s")}>💧</text>
    </g>
  );

  if (state === "enfadada") return (
    <g>
      <text x="16"  y="62"  fontSize="14" style={{ animation: "tama-zzz 0.8s ease-in-out 0s infinite" }}>💨</text>
      <text x="153" y="56"  fontSize="14" style={{ animation: "tama-zzz 0.8s ease-in-out 0.3s infinite" }}>💨</text>
      <text x="84"  y="22"  fontSize="16">😤</text>
    </g>
  );

  if (state === "ojeras") return (
    <g>
      <text x="152" y="58" fontSize="14" style={{ animation: "tama-zzz 2.5s ease-in-out 0s infinite" }}>💫</text>
      <text x="16"  y="58" fontSize="14" style={{ animation: "tama-zzz 2.5s ease-in-out 1.2s infinite" }}>💫</text>
      <text x="88"  y="22" fontSize="13">😤</text>
    </g>
  );

  if (state === "malita") {
    /* caca illness — constipation vibes */
    if (illnessType === "caca") return (
      <g>
        <text x="149" y="60" fontSize="18">💩</text>
        <text x="18"  y="90"  fontSize="13" fill="#a16207" style={waveStyle("0s")}>~</text>
        <text x="157" y="100" fontSize="13" fill="#a16207" style={waveStyle("0.4s")}>~</text>
        <text x="22"  y="145" fontSize="13" fill="#a16207" style={waveStyle("0.8s")}>~</text>
      </g>
    );
    /* tired illness */
    if (illnessType === "tired") return (
      <g>
        <text x="149" y="60" fontSize="18">😵‍💫</text>
        <text x="18"  y="90"  fontSize="13" fill="#6366f1" style={waveStyle("0s")}>⚡</text>
        <text x="157" y="100" fontSize="11" fill="#6366f1" style={waveStyle("0.4s")}>⚡</text>
        <text x="22"  y="145" fontSize="12" fill="#6366f1" style={waveStyle("0.8s")}>⚡</text>
      </g>
    );
    /* default / stomach */
    return (
      <g>
        <text x="149" y="60" fontSize="18">🌡️</text>
        <text x="19"  y="90"  fontSize="13" fill="#72b862" style={waveStyle("0s")}>~</text>
        <text x="157" y="100" fontSize="13" fill="#72b862" style={waveStyle("0.4s")}>~</text>
        <text x="22"  y="145" fontSize="13" fill="#72b862" style={waveStyle("0.8s")}>~</text>
      </g>
    );
  }

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
      {/* Capa — renderizar antes para que quede detrás */}
      {body?.clothingType === "capa" && (
        <path d="M 84 162 Q 40 200 22 264 L 208 264 Q 190 200 146 162 Q 131 157 115 155 Q 99 157 84 162 Z"
          fill={body.color} opacity="0.90" stroke={C.dark} strokeWidth="2.5"/>
      )}

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
      {body?.clothingType === "pijama" && (
        <g>
          <rect x="52" y="170" width="126" height="68" rx="22" fill={body.color} opacity="0.90" stroke={C.dark} strokeWidth="3"/>
          <path d="M 76 170 Q 115 160 154 170" fill="none" stroke={body.color} strokeWidth="9" strokeLinecap="round"/>
          {[188, 203, 218].map((y, i) => (
            <path key={i} d={`M 62 ${y} Q 115 ${y+3} 168 ${y}`} fill="none" stroke={C.dark} strokeWidth="2" strokeDasharray="7 5" opacity="0.18"/>
          ))}
        </g>
      )}
      {body?.clothingType === "chaleco" && (
        <g>
          <rect x="62" y="170" width="106" height="64" rx="20" fill={body.color} opacity="0.92" stroke={C.dark} strokeWidth="2.5"/>
          <path d="M 96 170 L 115 193 L 134 170" fill={C.belly} stroke="none"/>
          <circle cx="115" cy="205" r="4" fill="#1e293b" opacity="0.6"/>
          <circle cx="115" cy="220" r="4" fill="#1e293b" opacity="0.6"/>
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
      {neck?.clothingType === "collar" && (
        <g>
          <path d="M 80 163 Q 115 174 150 163" fill="none" stroke="#c4b5a0" strokeWidth="1.5"/>
          {([[85,165],[96,169],[107,171],[115,171.5],[123,171],[134,169],[145,165]] as [number,number][]).map(([cx,cy],i) => (
            <circle key={i} cx={cx} cy={cy} r="5" fill={neck.color} stroke="#b0a080" strokeWidth="1.2"/>
          ))}
        </g>
      )}
      {neck?.clothingType === "pajarita" && (
        <g>
          <path d="M 88 166 L 110 158 L 110 174 Z" fill={neck.color} stroke={C.dark} strokeWidth="2"/>
          <path d="M 142 166 L 120 158 L 120 174 Z" fill={neck.color} stroke={C.dark} strokeWidth="2"/>
          <ellipse cx="115" cy="166" rx="7" ry="8" fill={neck.color} stroke={C.dark} strokeWidth="2"/>
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
      {eyes?.clothingType === "antifaz" && (
        <g>
          <path d="M 42 108 Q 84 92 115 94 Q 146 92 188 108 Q 186 124 146 122 Q 115 124 84 122 Q 44 124 42 108 Z"
            fill={eyes.color} opacity="0.90" stroke={C.dark} strokeWidth="2"/>
          <path d="M 42 108 Q 26 108 22 106" stroke={eyes.color} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
          <path d="M 188 108 Q 204 108 208 106" stroke={eyes.color} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
          <circle cx="84"  cy="108" r="6" fill="white" opacity="0.18"/>
          <circle cx="146" cy="108" r="6" fill="white" opacity="0.18"/>
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
      {head?.clothingType === "gorra" && (
        <g>
          <path d="M 74 52 Q 80 18 115 14 Q 150 18 156 52 Q 136 46 115 44 Q 94 46 74 52 Z"
            fill={head.color} stroke={C.dark} strokeWidth="2.5"/>
          <path d="M 66 56 Q 115 64 164 56 L 160 50 Q 115 58 70 50 Z"
            fill={head.color} stroke={C.dark} strokeWidth="2"/>
          <circle cx="115" cy="17" r="5" fill={C.dark} opacity="0.4"/>
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
      {head?.clothingType === "tapones" && (
        <g>
          <ellipse cx="55" cy="46" rx="8" ry="11" fill={head.color} stroke={C.dark} strokeWidth="2" transform="rotate(-12 55 46)"/>
          <ellipse cx="55" cy="42" rx="5" ry="7"  fill="white" opacity="0.55" transform="rotate(-12 55 42)"/>
          <ellipse cx="175" cy="46" rx="8" ry="11" fill={head.color} stroke={C.dark} strokeWidth="2" transform="rotate(12 175 46)"/>
          <ellipse cx="175" cy="42" rx="5" ry="7"  fill="white" opacity="0.55" transform="rotate(12 175 42)"/>
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
import React from "react";

type Props = {
  state: TamaVisualState;
  phase?:          EvolutionPhase;
  equipped?:       EquippedClothing;
  catalog?:        SquirrelClothing[];
  isTickling?:     boolean;
  illnessType?:    IllnessType;
  heldToyEmoji?:   string;
  className?:      string;
};

export default function ChibiArdilla({
  state, phase = "bebe", equipped = {}, catalog = [],
  isTickling = false, illnessType, heldToyEmoji, className = "",
}: Props) {
  const scale = phase === "bebe" ? 0.92 : 1;

  const animMap: Record<TamaVisualState, string> = {
    muy_feliz:   "tama-dance",
    feliz:       "tama-bounce",
    neutral:     "tama-breathe",
    triste:      "tama-sink",
    hambre:      "tama-wobble",
    cansada:     "tama-breathe-slow",
    muy_cansada: "tama-breathe-slow",
    comiendo:    "tama-chomp-body",
    durmiendo:   "tama-float",
    jugando:     "tama-hop",
    enfadada:    "tama-rage",
    malita:      "tama-nausea",
    ojeras:      "tama-grumpy-tired",
  };
  const dur: Record<TamaVisualState, string> = {
    muy_feliz: "0.7s", feliz: "1.8s", neutral: "3s", triste: "3.5s", hambre: "0.9s",
    cansada: "4s", muy_cansada: "5.5s", comiendo: "2s", durmiendo: "4s",
    jugando: "0.7s", enfadada: "0.45s", malita: "2.8s", ojeras: "2.2s",
  };

  const anim = isTickling ? "tama-tickle" : animMap[state];

  /* Tail wags for happy states */
  const tailAnim = (state === "muy_feliz" || state === "feliz" || isTickling)
    ? "tama-tail-wag 0.7s ease-in-out infinite"
    : "none";

  /* Ear twitch for muy_feliz */
  const earAnim = state === "muy_feliz" || isTickling
    ? "tama-ear-twitch 2s ease-in-out infinite"
    : "none";

  return (
    <div className={`select-none ${className}`} style={{ width: "100%", maxWidth: 190 }}>
      <style>{`
        @keyframes tama-dance {
          0%,100%{transform:translateY(0) rotate(0deg) scale(1);}
          20%{transform:translateY(-20px) rotate(-7deg) scale(1.06,0.95);}
          40%{transform:translateY(-14px) rotate(7deg) scale(1.04,0.97);}
          60%{transform:translateY(-18px) rotate(-5deg) scale(1.05,0.96);}
          80%{transform:translateY(-10px) rotate(5deg) scale(1.03,0.98);}
        }
        @keyframes tama-bounce {
          0%,100%{transform:translateY(0);}
          50%{transform:translateY(-14px) scale(1.04,0.97);}
        }
        @keyframes tama-bounce-fast {
          0%,100%{transform:translateY(0) scale(1);}
          30%{transform:translateY(-22px) scale(1.07,0.95);}
          55%{transform:translateY(-8px) scale(1.03,0.98);}
        }
        @keyframes tama-hop {
          0%,100%{transform:translateY(0) rotate(0);}
          25%{transform:translateY(-26px) rotate(-6deg) scale(1.05,0.94);}
          55%{transform:translateY(-8px) rotate(4deg) scale(1.02,0.98);}
          75%{transform:translateY(-18px) rotate(-3deg) scale(1.04,0.96);}
        }
        @keyframes tama-breathe {
          0%,100%{transform:scale(1);}
          50%{transform:scale(1.03,1.02);}
        }
        @keyframes tama-breathe-slow {
          0%,100%{transform:scale(1) translateY(0); opacity:0.92;}
          50%{transform:scale(1.015) translateY(4px); opacity:0.78;}
        }
        @keyframes tama-float {
          0%,100%{transform:translateY(0) scale(1) rotate(0deg); opacity:0.88;}
          50%{transform:translateY(-10px) scale(1.02) rotate(2deg); opacity:0.72;}
        }
        @keyframes tama-sink {
          0%,100%{transform:translateY(0) rotate(-2deg) scale(1);}
          35%{transform:translateY(12px) rotate(2deg) scale(0.97);}
          65%{transform:translateY(5px) rotate(-1deg) scale(0.98);}
        }
        @keyframes tama-nausea {
          0%,100%{transform:translateY(0) rotate(0) scale(1);}
          25%{transform:translateY(5px) rotate(-4deg) scale(0.98);}
          50%{transform:translateY(8px) rotate(4deg) scale(0.97);}
          75%{transform:translateY(4px) rotate(-3deg) scale(0.99);}
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
        @keyframes tama-rage {
          0%,100%{transform:translateX(0) scale(1);}
          10%{transform:translateX(-11px) rotate(-6deg) scale(1.04);}
          20%{transform:translateX(11px) rotate(6deg) scale(1.06);}
          30%{transform:translateX(-9px) rotate(-5deg) scale(1.04);}
          40%{transform:translateX(9px) rotate(5deg) scale(1.06);}
          55%{transform:translateX(-5px) rotate(-3deg);}
          70%{transform:translateX(5px) rotate(3deg);}
          85%{transform:translateX(-2px);}
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
        @keyframes tama-tail-wag {
          0%,100%{transform:rotate(0deg);}
          30%{transform:rotate(14deg);}
          70%{transform:rotate(-14deg);}
        }
        @keyframes tama-ear-twitch {
          0%,85%,100%{transform:rotate(0deg);}
          90%{transform:rotate(18deg);}
          95%{transform:rotate(-8deg);}
        }
        @keyframes tama-heartfloat {
          0%,25%{opacity:0;transform:translateY(0) scale(0.8);}
          55%{opacity:1;transform:translateY(-18px) scale(1.15);}
          100%{opacity:0;transform:translateY(-40px) scale(0.8);}
        }
        @keyframes tama-tearfall {
          0%{opacity:0;transform:translateY(-4px);}
          25%{opacity:0.9;}
          100%{opacity:0;transform:translateY(22px);}
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
        @keyframes tama-grumpy-tired {
          0%,100%{transform:translateY(0) rotate(0);}
          20%{transform:translateY(5px) rotate(-3deg);}
          45%{transform:translateY(7px) rotate(2deg);}
          65%{transform:translateY(4px) rotate(-2deg);}
          85%{transform:translateY(6px) rotate(1deg);}
        }
        .tama-body { transform-origin: center 82%; }
      `}</style>

      <svg
        viewBox="0 0 240 270"
        xmlns="http://www.w3.org/2000/svg"
        className="tama-body w-full h-auto"
        style={{ animation: `${anim} ${dur[state]} ease-in-out infinite`, transform: `scale(${scale})` }}
      >
        {/* ══ COLA (tail with wag animation) ══ */}
        <g style={{
          transformBox: "fill-box" as const,
          transformOrigin: "bottom center",
          animation: tailAnim,
        }}>
          <path d="M 158 214 C 203 192 213 138 208 95 C 202 54 180 28 162 46"
            fill="none" stroke={C.dark} strokeWidth={52} strokeLinecap="round"/>
          <path d="M 158 214 C 203 192 213 138 208 95 C 202 54 180 28 162 46"
            fill="none" stroke={C.body} strokeWidth={42} strokeLinecap="round"/>
          <path d="M 157 210 C 198 190 207 138 203 97 C 197 60 178 36 163 52"
            fill="none" stroke="#FBD080" strokeWidth={18} strokeLinecap="round"/>
          <circle cx="165" cy="50" r="22" fill={C.dark} opacity="0.18"/>
        </g>

        {/* ══ CUERPO ══ */}
        <ellipse cx="115" cy="215" rx="55" ry="43" fill={C.dark} opacity="0.35"/>
        <ellipse cx="115" cy="213" rx="52" ry="40" fill={C.body} stroke={C.dark} strokeWidth={C.sw}/>
        <ellipse cx="115" cy="220" rx="33" ry="27" fill={C.belly} stroke={C.dark} strokeWidth={3.5}/>
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
        <ellipse cx="44"  cy="220" rx="13" ry="9" fill={C.body} stroke={C.dark} strokeWidth={3}/>
        <ellipse cx="186" cy="220" rx="13" ry="9" fill={C.body} stroke={C.dark} strokeWidth={3}/>

        {/* ══ OREJAS (con ear twitch) ══ */}
        <g style={{ transformBox: "fill-box" as const, transformOrigin: "bottom center", animation: earAnim }}>
          <ellipse cx="60"  cy="42" rx="19" ry="29" fill={C.dark} transform="rotate(-12 60 42)"/>
          <ellipse cx="60"  cy="42" rx="15" ry="25" fill={C.body} stroke={C.dark} strokeWidth={3.5} transform="rotate(-12 60 42)"/>
          <ellipse cx="60"  cy="40" rx="8"  ry="15" fill={C.ear} opacity="0.85" transform="rotate(-12 60 40)"/>
        </g>
        <ellipse cx="170" cy="42" rx="19" ry="29" fill={C.dark} transform="rotate(12 170 42)"/>
        <ellipse cx="170" cy="42" rx="15" ry="25" fill={C.body} stroke={C.dark} strokeWidth={3.5} transform="rotate(12 170 42)"/>
        <ellipse cx="170" cy="40" rx="8"  ry="15" fill={C.ear} opacity="0.85" transform="rotate(12 170 40)"/>

        {/* ══ CABEZA ══ */}
        <circle cx="115" cy="110" r="74" fill={C.dark} opacity="0.3"/>
        <circle cx="115" cy="108" r="70" fill={C.body} stroke={C.dark} strokeWidth={C.sw}/>
        {state === "malita" && (
          <circle cx="115" cy="108" r="70" fill="rgba(90,200,70,0.10)"/>
        )}
        <circle cx="90"  cy="80"  r="28" fill="#FBD080" opacity="0.18"/>

        {/* ══ MEJILLAS ══ */}
        <circle cx="57"  cy="120" r="22" fill="rgba(255,110,80,0.28)"/>
        <circle cx="173" cy="120" r="22" fill="rgba(255,110,80,0.28)"/>

        {/* ══ CARA ══ */}
        <Eyebrows state={state}/>
        <EyePair   state={state}/>
        <ellipse cx="115" cy="119" rx="9" ry="7" fill={C.dark}/>
        <ellipse cx="115" cy="117" rx="5" ry="3.5" fill="#A0522D" opacity="0.55"/>
        <Mouth state={state}/>

        {/* ══ ROPA ══ */}
        <Clothing equipped={equipped} catalog={catalog}/>

        {/* ══ EVOLUCIÓN ══ */}
        <EvoBadge phase={phase}/>

        {/* ══ ACCESORIO ══ */}
        <Accessory state={state} illnessType={illnessType}/>

        {/* ══ JUGUETE EQUIPADO (en la mano, solo en estados tranquilos) ══ */}
        {heldToyEmoji && !["jugando","comiendo","durmiendo","malita"].includes(state) && (
          <g>
            <circle cx="44" cy="222" r="14" fill="white" opacity="0.75" stroke={C.dark} strokeWidth="1.5"/>
            <text x="38" y="228" fontSize="14">{heldToyEmoji}</text>
          </g>
        )}
      </svg>
    </div>
  );
}
