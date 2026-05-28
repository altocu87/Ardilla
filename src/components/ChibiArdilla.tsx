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

  /* Pedos: ojos entrecerrados con cara de "¿qué?" */
  if (state === "pedos") return (
    <g>
      {[cx1, cx2].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={22} fill="white" stroke={C.dark} strokeWidth={C.sw}/>
          <circle cx={cx+(i===0?2:3)} cy={cy+5} r={13} fill={C.dark}/>
          <circle cx={cx-5} cy={cy-3} r={5} fill="white"/>
          {/* Párpado entrecerrado */}
          <path d={`M ${cx-22} ${cy+2} Q ${cx} ${cy-12} ${cx+22} ${cy+2}`}
            fill={C.body} stroke={C.body} strokeWidth={1}/>
        </g>
      ))}
    </g>
  );

  /* Eructando: boca abierta, ojos de orgullo */
  if (state === "eructando") return (
    <g>
      {[cx1, cx2].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={22} fill="white" stroke={C.dark} strokeWidth={C.sw}/>
          <circle cx={cx+3} cy={cy+3} r={15} fill={C.dark}/>
          <circle cx={cx-5} cy={cy-5} r={7} fill="white"/>
          <circle cx={cx+8} cy={cy-3} r={3} fill="white" opacity={0.7}/>
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
  if (["durmiendo","cansada","muy_cansada","comiendo","muy_feliz","jugando","eructando"].includes(state)) return null;
  if (state === "pedos") return (
    <g fill="none" stroke={C.dark} strokeWidth={5} strokeLinecap="round">
      <path d="M 63 83 Q 78 76 93 81" fill="none"/>
      <path d="M 137 81 Q 152 76 167 83" fill="none"/>
    </g>
  );
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
  if (state === "pedos") return (
    <path d="M 90 124 Q 105 134 115 128 Q 125 134 140 124" {...s} strokeWidth={4}/>
  );
  if (state === "eructando") return (
    <g>
      <ellipse cx="115" cy="132" rx="24" ry="20" fill={C.dark}/>
      <ellipse cx="115" cy="136" rx="18" ry="13" fill="#3d1000"/>
      <ellipse cx="115" cy="143" rx="12" ry="6" fill="white" opacity="0.12"/>
    </g>
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

  if (state === "pedos") return (
    <g>
      {/* Nubes de gas verde saliendo del culo (parte trasera-derecha) */}
      <circle cx="162" cy="248" r="9"  fill="#86efac" opacity="0.85"
        style={{ animation: "tama-gas 1.1s ease-out 0s infinite" }}/>
      <circle cx="174" cy="236" r="7"  fill="#4ade80" opacity="0.75"
        style={{ animation: "tama-gas 1.1s ease-out 0.25s infinite" }}/>
      <circle cx="184" cy="222" r="10" fill="#86efac" opacity="0.65"
        style={{ animation: "tama-gas 1.1s ease-out 0.5s infinite" }}/>
      <circle cx="178" cy="207" r="7"  fill="#bbf7d0" opacity="0.55"
        style={{ animation: "tama-gas 1.1s ease-out 0.75s infinite" }}/>
      {/* Moscas */}
      <text x="172" y="200" fontSize="13"
        style={{ animation: "tama-fly 0.7s ease-in-out 0s infinite" }}>🪰</text>
      <text x="155" y="188" fontSize="11"
        style={{ animation: "tama-fly 0.7s ease-in-out 0.35s infinite" }}>🪰</text>
      <text x="190" y="190" fontSize="10"
        style={{ animation: "tama-fly 0.7s ease-in-out 0.6s infinite" }}>🪰</text>
      {/* Emoji de asco flotando */}
      <text x="16" y="60" fontSize="16"
        style={{ animation: "tama-zzz 1.8s ease-out 0.2s infinite" }}>🤢</text>
    </g>
  );

  if (state === "eructando") return (
    <g>
      {/* Ondas de sonido saliendo de la boca */}
      <text x="138" y="118" fontSize="18"
        style={{ animation: "tama-wave 0.5s ease-out 0s infinite" }}>〰️</text>
      <text x="154" y="106" fontSize="22"
        style={{ animation: "tama-wave 0.5s ease-out 0.15s infinite" }}>〰️</text>
      <text x="170" y="92"  fontSize="18"
        style={{ animation: "tama-wave 0.5s ease-out 0.3s infinite" }}>〰️</text>
      {/* Notas musicales volando */}
      <text x="16"  y="55" fontSize="16"
        style={{ animation: "tama-heartfloat 1s ease-out 0s infinite" }}>🎵</text>
      <text x="154" y="50" fontSize="14"
        style={{ animation: "tama-heartfloat 1s ease-out 0.4s infinite" }}>🎶</text>
      {/* Expresión de "¿qué?" del entorno */}
      <text x="16" y="130" fontSize="13"
        style={{ animation: "tama-zzz 0.9s ease-out 0.2s infinite" }}>💨</text>
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

  if (state === "triste") return null; // tears already in eyes (handled by EyePair)

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
      {/* Capa — renderizar antes para que quede detrás, sin clipPath (es una capa que vuela) */}
      {body?.clothingType === "capa" && (
        <path d="M 84 162 Q 40 200 22 264 L 208 264 Q 190 200 146 162 Q 131 157 115 155 Q 99 157 84 162 Z"
          fill={body.color} opacity="0.90" stroke={C.dark} strokeWidth="2.5"/>
      )}

      {body?.clothingType === "jersey" && (
        <g clipPath="url(#sq-body-clip)">
          <rect x="50" y="169" width="130" height="88" rx="22" fill={body.color} opacity="0.92" stroke={C.dark} strokeWidth="3"/>
          <path d="M 76 175 Q 115 162 154 175" fill="none" stroke={body.color} strokeWidth="9" strokeLinecap="round"/>
        </g>
      )}
      {body?.clothingType === "abrigo" && (
        <g clipPath="url(#sq-body-clip)">
          <rect x="50" y="168" width="130" height="90" rx="22" fill={body.color} opacity="0.93" stroke={C.dark} strokeWidth="3"/>
          <path d="M 115 172 L 99 196 L 91 204 L 99 204 L 115 188 L 131 204 L 139 204 L 131 196 Z" fill="white" opacity="0.88"/>
          <circle cx="115" cy="214" r="5" fill="#1e293b"/>
          <circle cx="115" cy="230" r="5" fill="#1e293b"/>
        </g>
      )}
      {body?.clothingType === "pijama" && (
        <g clipPath="url(#sq-body-clip)">
          <rect x="50" y="169" width="130" height="88" rx="22" fill={body.color} opacity="0.90" stroke={C.dark} strokeWidth="3"/>
          <path d="M 76 175 Q 115 162 154 175" fill="none" stroke={body.color} strokeWidth="9" strokeLinecap="round"/>
          {[190, 206, 222].map((y, i) => (
            <path key={i} d={`M 58 ${y} Q 115 ${y+3} 172 ${y}`} fill="none" stroke={C.dark} strokeWidth="2" strokeDasharray="7 5" opacity="0.18"/>
          ))}
        </g>
      )}
      {body?.clothingType === "chaleco" && (
        <g clipPath="url(#sq-body-clip)">
          <rect x="50" y="169" width="130" height="88" rx="20" fill={body.color} opacity="0.92" stroke={C.dark} strokeWidth="2.5"/>
          <path d="M 96 174 L 115 198 L 134 174" fill={C.belly} stroke="none"/>
          <circle cx="115" cy="210" r="4" fill="#1e293b" opacity="0.6"/>
          <circle cx="115" cy="226" r="4" fill="#1e293b" opacity="0.6"/>
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
    pedos:       "tama-pedo-push",
    eructando:   "tama-eructo",
  };
  const dur: Record<TamaVisualState, string> = {
    muy_feliz: "0.7s", feliz: "1.8s", neutral: "3s", triste: "3.5s", hambre: "0.9s",
    cansada: "4s", muy_cansada: "5.5s", comiendo: "2s", durmiendo: "4s",
    jugando: "0.7s", enfadada: "0.45s", malita: "2.8s", ojeras: "2.2s",
    pedos: "0.55s", eructando: "0.25s",
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
        @keyframes tama-pedo-push {
          0%,100%{transform:translateY(0) rotate(0) scale(1);}
          20%{transform:translateY(6px) rotate(3deg) scale(0.97,1.03);}
          40%{transform:translateY(10px) rotate(-2deg) scale(0.96,1.05);}
          60%{transform:translateY(6px) rotate(2deg) scale(0.98,1.02);}
          80%{transform:translateY(3px) rotate(-1deg) scale(0.99,1.01);}
        }
        @keyframes tama-eructo {
          0%,100%{transform:translate(0,0) rotate(0deg) scale(1);}
          10%{transform:translate(-5px,-3px) rotate(-3deg) scale(1.04);}
          20%{transform:translate(5px,3px)  rotate(3deg)  scale(1.06);}
          30%{transform:translate(-7px,-2px) rotate(-4deg) scale(1.05);}
          40%{transform:translate(7px,2px)  rotate(4deg)  scale(1.07);}
          50%{transform:translate(-5px,-3px) rotate(-3deg) scale(1.04);}
          60%{transform:translate(5px,1px)  rotate(3deg)  scale(1.05);}
          70%{transform:translate(-3px,-1px) rotate(-2deg) scale(1.03);}
          80%{transform:translate(3px,1px)  rotate(2deg)  scale(1.02);}
          90%{transform:translate(-1px,0)   rotate(-1deg) scale(1.01);}
        }
        @keyframes tama-gas {
          0%{opacity:0;transform:translateY(0) scale(0.4);}
          40%{opacity:0.85;transform:translateY(-14px) scale(1);}
          100%{opacity:0;transform:translateY(-38px) scale(1.5);}
        }
        @keyframes tama-fly {
          0%,100%{transform:translate(0,0) rotate(0deg);}
          25%{transform:translate(4px,-5px) rotate(18deg);}
          50%{transform:translate(-3px,-9px) rotate(-12deg);}
          75%{transform:translate(5px,-4px) rotate(22deg);}
        }
        @keyframes tama-wave {
          0%{opacity:0;transform:translateX(0) scale(0.6);}
          45%{opacity:0.9;transform:translateX(8px) scale(1.1);}
          100%{opacity:0;transform:translateX(22px) scale(1.5);}
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
          {/* Fluffy tip */}
          <circle cx="165" cy="50" r="26" fill={C.dark} opacity="0.18"/>
          <circle cx="164" cy="48" r="20" fill="#FBD080" opacity="0.55"/>
        </g>

        {/* ══ CUERPO — forma orgánica de pera, no círculo ══ */}
        {/* Shadow */}
        <path d="M 89 178 C 61 192 57 229 71 255 Q 115 266 159 255 C 173 229 169 192 141 178 Q 128 171 115 171 Q 102 171 89 178 Z"
          fill={C.dark} opacity="0.28"/>
        {/* Torso */}
        <path d="M 90 176 C 63 190 59 227 73 252 Q 115 263 157 252 C 171 227 167 190 140 176 Q 127 169 115 169 Q 103 169 90 176 Z"
          fill={C.body} stroke={C.dark} strokeWidth={C.sw}/>
        {/* Belly */}
        <ellipse cx="115" cy="217" rx="34" ry="28" fill={C.belly} stroke={C.dark} strokeWidth={3.5}/>
        {state === "malita" && (
          <path d="M 90 176 C 63 190 59 227 73 252 Q 115 263 157 252 C 171 227 167 190 140 176 Q 127 169 115 169 Q 103 169 90 176 Z"
            fill="rgba(90,200,70,0.10)"/>
        )}

        {/* ══ PATAS — con dedos para parecer patas reales ══ */}
        {/* Left foot */}
        <ellipse cx="76"  cy="257" rx="23" ry="12" fill={C.dark} opacity="0.4"/>
        <ellipse cx="76"  cy="255" rx="21" ry="10" fill={C.body} stroke={C.dark} strokeWidth={3}/>
        <ellipse cx="64"  cy="250" rx="9"  ry="7"  fill={C.body} stroke={C.dark} strokeWidth={2.5}/>
        <ellipse cx="76"  cy="248" rx="9"  ry="7"  fill={C.body} stroke={C.dark} strokeWidth={2.5}/>
        <ellipse cx="88"  cy="250" rx="9"  ry="7"  fill={C.body} stroke={C.dark} strokeWidth={2.5}/>
        {/* Right foot */}
        <ellipse cx="154" cy="257" rx="23" ry="12" fill={C.dark} opacity="0.4"/>
        <ellipse cx="154" cy="255" rx="21" ry="10" fill={C.body} stroke={C.dark} strokeWidth={3}/>
        <ellipse cx="142" cy="250" rx="9"  ry="7"  fill={C.body} stroke={C.dark} strokeWidth={2.5}/>
        <ellipse cx="154" cy="248" rx="9"  ry="7"  fill={C.body} stroke={C.dark} strokeWidth={2.5}/>
        <ellipse cx="166" cy="250" rx="9"  ry="7"  fill={C.body} stroke={C.dark} strokeWidth={2.5}/>

        {/* ══ BRAZOS — formas de brazo real, no elipses flotantes ══ */}
        {/* Left arm shadow */}
        <path d="M 67 189 C 46 196 36 218 43 234 Q 52 242 63 235 C 60 220 62 202 75 192 Z"
          fill={C.dark} opacity="0.28"/>
        {/* Left arm */}
        <path d="M 68 188 C 48 195 38 216 45 232 Q 54 240 64 233 C 61 218 63 200 76 191 Z"
          fill={C.body} stroke={C.dark} strokeWidth={3}/>
        {/* Right arm shadow */}
        <path d="M 163 189 C 184 196 194 218 187 234 Q 178 242 167 235 C 170 220 168 202 155 192 Z"
          fill={C.dark} opacity="0.28"/>
        {/* Right arm */}
        <path d="M 162 188 C 182 195 192 216 185 232 Q 176 240 166 233 C 169 218 167 200 154 191 Z"
          fill={C.body} stroke={C.dark} strokeWidth={3}/>
        {/* Paws */}
        <ellipse cx="46"  cy="228" rx="14" ry="10" fill={C.body} stroke={C.dark} strokeWidth={2.5}/>
        <ellipse cx="184" cy="228" rx="14" ry="10" fill={C.body} stroke={C.dark} strokeWidth={2.5}/>

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
        {/* clipPath que sigue la silueta del cuerpo + brazos para que la ropa no salga fuera */}
        <defs>
          <clipPath id="sq-body-clip">
            <path d="M 85 172 C 56 186 52 224 67 255 Q 115 267 163 255 C 178 224 174 186 145 172 Q 130 165 115 165 Q 100 165 85 172 Z"/>
            <ellipse cx="46" cy="220" rx="20" ry="16"/>
            <ellipse cx="184" cy="220" rx="20" ry="16"/>
          </clipPath>
        </defs>
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
