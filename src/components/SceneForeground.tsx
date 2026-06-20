import type { TimeSegment, WeatherKind, SeasonKind } from "@/lib/scene";

/* ════════════════════════════════════════════════════
   PRIMER PLANO DE LA ESCENA — viewBox 0 0 400 260
   Capa sobre <SceneBg>: suelo, árbol, madriguera, follaje,
   clima y decoración. Transparente salvo lo que pinta, para
   que el cielo de SceneBg se vea por arriba. Ids con prefijo fg-.
════════════════════════════════════════════════════ */

const GRASS: [number, number, number][] = [ // x, base-y, alto
  [16,236,10],[40,240,8],[60,238,12],[84,242,9],[118,240,11],[150,243,8],
  [196,239,10],[228,242,9],[300,243,9],[368,240,10],[390,242,8],
];
const FLOWERS: [number, number, string][] = [
  [50,236,"#f783ac"],[210,240,"#ffd43b"],[286,237,"#da77f2"],[150,238,"#ff8787"],
];
const MUSHROOMS: [number, number][] = [[96,243],[256,245]];
const DROPS = [10,30,50,70,90,110,130,150,170,190,210,230,250,270,290,310,350,370,390];

type GP = {
  ground: string; ground2: string; trunk: string; trunkDark: string;
  burrow: string; burrowDark: string; grass: string; bush: string; bush2: string;
  canopy: [string, string, string];
};

function palette(seg: TimeSegment, season: SeasonKind): GP {
  const isNight = seg === "noche" || seg === "madrugada";

  const canopySeason: Record<SeasonKind, [string, string, string]> = {
    otono:    ["#e8590c", "#f08c00", "#d9480f"],
    invierno: ["#7c93a8", "#92a8bb", "#6b8195"],
    primavera:["#51cf66", "#69db7c", "#40c057"],
    verano:   ["#2f9e44", "#37b24d", "#2b8a3e"],
  };
  const canopy: [string, string, string] = isNight
    ? ["#1f4d33", "#246b3d", "#173d28"]            // verde oscuro de noche
    : canopySeason[season];

  if (isNight) return {
    ground:"#1f3a32", ground2:"#152823", trunk:"#3e2a16", trunkDark:"#2a1c0e",
    burrow:"#140d06", burrowDark:"#070402", grass:"#1c4a30", bush:"#1f3a32", bush2:"#152823", canopy,
  };
  if (seg === "amanecer") return {
    ground:"#4a8a46", ground2:"#367a38", trunk:"#74471c", trunkDark:"#583414",
    burrow:"#3a2412", burrowDark:"#1c1208", grass:"#2f7a3a", bush:"#4a8a46", bush2:"#367a38", canopy,
  };
  if (seg === "atardecer") return {
    ground:"#356b3a", ground2:"#264e2b", trunk:"#5e3a18", trunkDark:"#472b12",
    burrow:"#2e1d0f", burrowDark:"#150d06", grass:"#28602f", bush:"#356b3a", bush2:"#264e2b", canopy,
  };
  return { // día
    ground:"#3f9142", ground2:"#2f7a34", trunk:"#7c4a1e", trunkDark:"#5e3514",
    burrow:"#3b2412", burrowDark:"#1c1208", grass:"#2b8a3e", bush:"#3f9142", bush2:"#2f7a34", canopy,
  };
}

export default function SceneForeground({
  seg, weather = "clear", season = "verano",
}: { seg: TimeSegment; weather?: WeatherKind; season?: SeasonKind }) {
  const p = palette(seg, season);
  const isNight = seg === "noche" || seg === "madrugada";
  const showFlowers = (season === "primavera" || season === "verano") && !isNight;

  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice"
      className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes fg-rain { 0%{transform:translateY(-30px);opacity:0;} 12%{opacity:.65;} 100%{transform:translateY(150px);opacity:0;} }
        @keyframes fg-snow { 0%{transform:translateY(-20px) translateX(0);opacity:0;} 15%{opacity:.95;} 100%{transform:translateY(160px) translateX(12px);opacity:0;} }
        @keyframes fg-leaf { 0%{transform:translateY(-20px) rotate(0);opacity:0;} 15%{opacity:.95;} 100%{transform:translateY(170px) rotate(340deg) translateX(-8px);opacity:0;} }
        @keyframes fg-fog  { 0%,100%{transform:translateX(0);opacity:.16;} 50%{transform:translateX(20px);opacity:.3;} }
        @keyframes fg-sway { 0%,100%{transform:rotate(0deg);} 50%{transform:rotate(2deg);} }
      `}</style>

      {/* ── Árbol (derecha, con balanceo suave) ── */}
      <g style={{ transformBox: "fill-box", transformOrigin: "center bottom", animation: "fg-sway 6s ease-in-out infinite" }}>
        <path d="M 318 236 Q 314 182 326 152 L 348 152 Q 356 186 350 236 Z" fill={p.trunk} stroke={p.trunkDark} strokeWidth="2"/>
        <path d="M 326 175 q 8 -6 18 -4" fill="none" stroke={p.trunkDark} strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="330" cy="120" rx="58" ry="46" fill={p.canopy[0]}/>
        <ellipse cx="300" cy="136" rx="40" ry="34" fill={p.canopy[2]}/>
        <ellipse cx="362" cy="132" rx="40" ry="34" fill={p.canopy[1]}/>
        <ellipse cx="332" cy="100" rx="42" ry="34" fill={p.canopy[1]}/>
        <ellipse cx="318" cy="112" rx="20" ry="16" fill="#ffffff" opacity="0.10"/>
      </g>

      {/* ── Suelo ── */}
      <path d="M 0 224 Q 100 208 200 216 T 400 214 L 400 260 L 0 260 Z" fill={p.ground}/>
      <path d="M 0 240 Q 120 230 240 236 T 400 236 L 400 260 L 0 260 Z" fill={p.ground2}/>

      {/* ── Madriguera (base del árbol = hogar) ── */}
      <ellipse cx="332" cy="227" rx="31" ry="23" fill={p.burrow}/>
      <ellipse cx="332" cy="226" rx="24" ry="17" fill={p.burrowDark}/>
      <path d="M 303 231 Q 332 213 361 231" fill="none" stroke={p.trunkDark} strokeWidth="4" strokeLinecap="round"/>

      {/* ── Hierba ── */}
      <g stroke={p.grass} strokeWidth="2.5" strokeLinecap="round">
        {GRASS.map(([x, y, h], i) => (
          <g key={i}>
            <line x1={x} y1={y} x2={x - 3} y2={y - h}/>
            <line x1={x} y1={y} x2={x} y2={y - h - 2}/>
            <line x1={x} y1={y} x2={x + 3} y2={y - h}/>
          </g>
        ))}
      </g>

      {/* ── Setas ── */}
      {MUSHROOMS.map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 3} y={y - 6} width="6" height="9" rx="3" fill="#ffe8cc"/>
          <ellipse cx={x} cy={y - 6} rx="9" ry="6" fill="#e03131"/>
          <circle cx={x - 3} cy={y - 7} r="1.4" fill="white"/>
          <circle cx={x + 3} cy={y - 5} r="1.2" fill="white"/>
        </g>
      ))}

      {/* ── Flores (primavera/verano de día) ── */}
      {showFlowers && FLOWERS.map(([x, y, c], i) => (
        <g key={i}>
          <line x1={x} y1={y} x2={x} y2={y - 9} stroke="#2b8a3e" strokeWidth="2"/>
          {[0, 72, 144, 216, 288].map((a, j) => (
            <circle key={j} cx={x + 4.5 * Math.cos(a * Math.PI / 180)} cy={(y - 9) + 4.5 * Math.sin(a * Math.PI / 180)} r="2.8" fill={c}/>
          ))}
          <circle cx={x} cy={y - 9} r="2.4" fill="#ffd43b"/>
        </g>
      ))}

      {/* ── Arbusto de primer plano (izquierda) ── */}
      <ellipse cx="30" cy="246" rx="42" ry="24" fill={p.bush2}/>
      <ellipse cx="60" cy="250" rx="32" ry="18" fill={p.bush}/>

      {/* ── Clima ── */}
      {weather === "rain" && (
        <g stroke="#bcd6ff" strokeWidth="2" strokeLinecap="round" opacity="0.7">
          {DROPS.map((x, i) => (
            <line key={i} x1={x} y1={0} x2={x - 6} y2={14}
              style={{ animation: `fg-rain ${0.7 + (i % 4) * 0.15}s linear infinite`, animationDelay: `${(i % 7) * 0.12}s` }}/>
          ))}
        </g>
      )}
      {weather === "snow" && (
        <g fill="white" opacity="0.92">
          {DROPS.map((x, i) => (
            <circle key={i} cx={x} cy={0} r={i % 3 === 0 ? 2.2 : 1.5}
              style={{ animation: `fg-snow ${2.2 + (i % 4) * 0.4}s linear infinite`, animationDelay: `${(i % 6) * 0.3}s` }}/>
          ))}
        </g>
      )}
      {weather === "leaves" && (
        <g>
          {DROPS.map((x, i) => (
            <path key={i} d="M -4 0 Q 0 -5 4 0 Q 0 5 -4 0 Z" transform={`translate(${x} 0)`}
              fill={["#e8590c", "#f08c00", "#d9480f"][i % 3]}
              style={{ animation: `fg-leaf ${3 + (i % 4) * 0.5}s linear infinite`, animationDelay: `${(i % 6) * 0.4}s` }}/>
          ))}
        </g>
      )}
      {weather === "fog" && (
        <g fill="white">
          <ellipse cx="120" cy="160" rx="130" ry="30" style={{ animation: "fg-fog 9s ease-in-out infinite" }}/>
          <ellipse cx="300" cy="185" rx="120" ry="26" style={{ animation: "fg-fog 11s ease-in-out infinite", animationDelay: "1.5s" }}/>
        </g>
      )}
    </svg>
  );
}
