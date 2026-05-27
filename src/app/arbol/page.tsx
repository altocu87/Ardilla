"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getPregLog, getPlayerProfile, upsertPlayerProfile } from "@/lib/db";
import {
  TREE_GIFTS,
  getAvailableGift,
  collectGift,
  getHarvestAmount,
  canHarvestToday,
  recordHarvest,
  getCollectedGifts,
  type TreeGift,
} from "@/lib/tree-gifts";

/* ── Etapas del árbol ───────────────────────────────────────────────────── */
const STAGES = [
  { min: 0,  name: "Bellota",          desc: "Tu árbol todavía duerme bajo tierra.",          emoji: "🌰" },
  { min: 1,  name: "Brote",            desc: "Ha brotado. Con cuidado crece.",                emoji: "🌱" },
  { min: 3,  name: "Arbolito",         desc: "Pequeño pero decidido a crecer.",               emoji: "🌿" },
  { min: 7,  name: "Árbol joven",      desc: "Tiene raíces y empieza a dar sombra.",          emoji: "🌲" },
  { min: 14, name: "Árbol en flor",    desc: "Florece. El bosque lo nota.",                   emoji: "🌸" },
  { min: 21, name: "Árbol maduro",     desc: "Un árbol de verdad. Los animales lo visitan.",  emoji: "🌳" },
  { min: 30, name: "Árbol legendario", desc: "El más antiguo del bosque. Indestructible.",    emoji: "✨" },
];

const HABITANTS = [
  { emoji: "🐌", name: "Caracol",    days: 3,  desc: "Sube despacio pero seguro"   },
  { emoji: "🐿️", name: "Ardilla",   days: 7,  desc: "Guarda bellotas en las ramas" },
  { emoji: "🐱", name: "Gato",      days: 14, desc: "Duerme en la rama más alta"   },
  { emoji: "🐀", name: "Rata",      days: 21, desc: "Tiene su despensa aquí"        },
  { emoji: "🪳", name: "Cucaracha", days: 30, desc: "Se instaló para siempre"       },
];

function getStage(total: number) {
  let s = STAGES[0];
  for (const stage of STAGES) { if (total >= stage.min) s = stage; }
  return s;
}
function getNextStage(total: number) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (total >= STAGES[i].min) return STAGES[i + 1] ?? null;
  }
  return STAGES[1];
}
function calcStreak(log: Record<string, unknown>): number {
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (!log[d.toISOString().slice(0, 10)]) return i;
  }
  return 365;
}

/* ── SVG del árbol ──────────────────────────────────────────────────────── */
function TreeSVG({
  total, streak, hasGift, harvestAmt,
}: {
  total: number; streak: number; hasGift: boolean; harvestAmt: number;
}) {
  const stageIdx = STAGES.findIndex(s => s === getStage(total));

  const trunkH  = [0, 18, 40, 65, 85, 100, 108][stageIdx] ?? 108;
  const trunkW  = [0,  7, 10, 13,  16,  18,  20][stageIdx] ?? 20;
  const c1r     = [0, 22, 36, 52,  65,  74,  80][stageIdx] ?? 80;
  const c2r     = [0, 16, 28, 42,  54,  62,  68][stageIdx] ?? 68;
  const c3r     = [0,  9, 18, 30,  40,  48,  54][stageIdx] ?? 54;

  const leafColor1 = streak >= 7 ? "#15803d" : streak >= 3 ? "#16a34a" : streak >= 1 ? "#22c55e" : "#86efac";
  const leafColor2 = streak >= 7 ? "#16a34a" : streak >= 3 ? "#22c55e" : streak >= 1 ? "#4ade80" : "#bbf7d0";
  const leafColor3 = streak >= 7 ? "#22c55e" : streak >= 3 ? "#4ade80" : streak >= 1 ? "#86efac" : "#dcfce7";

  const cx = 150; const groundY = 230;
  const trunkTop = groundY - trunkH;
  const canopyY  = trunkTop - c1r * 0.6;

  const animalPos = [
    { x: cx - 55, y: canopyY + 28 },
    { x: cx + 52, y: canopyY + 18 },
    { x: cx + 10, y: trunkTop + 6 },
    { x: cx - 50, y: canopyY - 12 },
    { x: cx + 40, y: canopyY - 22 },
  ];

  const showFruits = stageIdx >= 5;
  const glow       = stageIdx >= 6;

  return (
    <svg viewBox="0 0 300 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#bae6fd"/>
          <stop offset="100%" stopColor="#e0f2fe"/>
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#86efac"/>
          <stop offset="55%"  stopColor="#4ade80"/>
          <stop offset="100%" stopColor="#15803d"/>
        </linearGradient>
        <linearGradient id="trunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#78350f"/>
          <stop offset="50%"  stopColor="#a16207"/>
          <stop offset="100%" stopColor="#78350f"/>
        </linearGradient>
        {glow && (
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        )}
      </defs>

      {/* Cielo */}
      <rect x="0" y="0" width="300" height="235" fill="url(#sky)"/>
      <circle cx="260" cy="35" r="22" fill="#fde68a" opacity="0.85"/>
      <circle cx="260" cy="35" r="16" fill="#fbbf24"/>
      <g opacity="0.9">
        <ellipse cx="55"  cy="40" rx="28" ry="14" fill="white"/>
        <ellipse cx="72"  cy="34" rx="20" ry="13" fill="white"/>
        <ellipse cx="38"  cy="36" rx="18" ry="11" fill="white"/>
        <ellipse cx="200" cy="55" rx="22" ry="11" fill="white"/>
        <ellipse cx="215" cy="50" rx="16" ry="10" fill="white"/>
      </g>

      {/* Suelo */}
      <ellipse cx="150" cy="232" rx="130" ry="22" fill="#15803d" opacity="0.3"/>
      <rect x="0" y="228" width="300" height="52" fill="url(#ground)"/>
      {[20,45,65,85,110,190,215,235,258,278].map((x, i) => (
        <g key={i} transform={`translate(${x}, 228)`}>
          <line x1="0" y1="0" x2="-3" y2="-8" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="0" y1="0" x2="0"  y2="-9" stroke="#166534" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="0" y1="0" x2="3"  y2="-7" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round"/>
        </g>
      ))}

      {/* Etapa 0: sólo bellota */}
      {stageIdx === 0 && (
        <>
          <text x={cx} y={240} textAnchor="middle" fontSize="32">🌰</text>
          <text x={cx} y={260} textAnchor="middle" fontSize="11" fill="#6b7280" fontFamily="sans-serif">
            Haz tu primer registro
          </text>
        </>
      )}

      {/* Tronco */}
      {stageIdx >= 1 && (
        <rect x={cx - trunkW/2} y={trunkTop} width={trunkW} height={trunkH} rx={trunkW/3} fill="url(#trunk)"/>
      )}

      {/* Raíces */}
      {stageIdx >= 3 && (
        <>
          <path d={`M${cx - trunkW/2},${groundY-4} Q${cx-30},${groundY+8} ${cx-50},${groundY+5}`} fill="none" stroke="#78350f" strokeWidth="4" strokeLinecap="round"/>
          <path d={`M${cx + trunkW/2},${groundY-4} Q${cx+30},${groundY+8} ${cx+50},${groundY+5}`} fill="none" stroke="#78350f" strokeWidth="4" strokeLinecap="round"/>
        </>
      )}

      {/* Copa */}
      {stageIdx >= 1 && c1r > 0 && (
        <>
          <ellipse cx={cx+4} cy={canopyY + c1r*0.55+4} rx={c1r*1.15} ry={c1r*0.55} fill="rgba(0,0,0,0.08)"/>
          <ellipse cx={cx}   cy={canopyY + c1r*0.55}   rx={c1r*1.15} ry={c1r*0.55} fill={leafColor1} filter={glow ? "url(#glow)" : undefined}/>
          {stageIdx >= 2 && <ellipse cx={cx} cy={canopyY}           rx={c2r*1.1}  ry={c2r*0.7}  fill={leafColor2}/>}
          {stageIdx >= 3 && <ellipse cx={cx} cy={canopyY-c3r*0.4}   rx={c3r*0.95} ry={c3r*0.75} fill={leafColor3}/>}
        </>
      )}

      {/* Ramas laterales */}
      {stageIdx >= 4 && (
        <>
          <path d={`M${cx-trunkW/2},${trunkTop+20} Q${cx-45},${trunkTop+5} ${cx-65},${canopyY+25}`} fill="none" stroke="#92400e" strokeWidth="5" strokeLinecap="round"/>
          <path d={`M${cx+trunkW/2},${trunkTop+22} Q${cx+45},${trunkTop+4} ${cx+62},${canopyY+18}`} fill="none" stroke="#92400e" strokeWidth="5" strokeLinecap="round"/>
        </>
      )}

      {/* Flores */}
      {stageIdx >= 4 && (
        <>
          <text x={cx-22} y={canopyY-10}           fontSize="13" textAnchor="middle">🌸</text>
          <text x={cx+25} y={canopyY+5}             fontSize="11" textAnchor="middle">🌸</text>
          <text x={cx-5}  y={canopyY - c3r*0.85}    fontSize="11" textAnchor="middle">🌼</text>
        </>
      )}

      {/* Bellotas en el árbol (cosechables) */}
      {showFruits && harvestAmt > 0 && (
        <>
          <text x={cx-30} y={canopyY+30}  fontSize="14" textAnchor="middle">🌰</text>
          <text x={cx+28} y={canopyY+22}  fontSize="14" textAnchor="middle">🌰</text>
          <text x={cx+12} y={canopyY-8}   fontSize="12" textAnchor="middle">🌰</text>
          {harvestAmt > 6 && <text x={cx-12} y={canopyY-18} fontSize="12" textAnchor="middle">🌰</text>}
        </>
      )}

      {/* Estrellas legendarias */}
      {glow && (
        <>
          <text x={cx-65} y={canopyY-18}           fontSize="12" textAnchor="middle">✨</text>
          <text x={cx+68} y={canopyY-10}            fontSize="12" textAnchor="middle">✨</text>
          <text x={cx}    y={canopyY - c3r*1.15}    fontSize="14" textAnchor="middle">⭐</text>
        </>
      )}

      {/* Regalo disponible */}
      {hasGift && stageIdx >= 1 && (
        <text x={cx - 18} y={canopyY - c3r * 0.6 - 8} fontSize="22" textAnchor="middle"
          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }}>
          🎁
        </text>
      )}

      {/* Animales habitantes */}
      {HABITANTS.map((h, i) => {
        if (streak < h.days) return null;
        const pos = animalPos[i];
        return (
          <text key={i} x={pos.x} y={pos.y} fontSize="17" textAnchor="middle"
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}>
            {h.emoji}
          </text>
        );
      })}
    </svg>
  );
}

/* ── Tarjeta de prenda exclusiva ────────────────────────────────────────── */
function GiftCard({ gift, onCollect }: { gift: TreeGift; onCollect: () => void }) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-3xl overflow-hidden shadow-lg">
      <div className="bg-emerald-500 px-4 py-2 flex items-center gap-2">
        <span className="text-xl">🎁</span>
        <p className="text-white font-black text-sm">¡Hay un regalo para ti!</p>
      </div>
      <div className="px-4 py-4 flex items-center gap-4">
        <span className="text-5xl">{gift.emoji}</span>
        <div className="flex-1">
          <p className="font-black text-slate-800 text-base">{gift.name}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{gift.label}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1.5 uppercase tracking-wide">
            🌳 Exclusivo del árbol · No se vende en ningún lado
          </p>
        </div>
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={onCollect}
          className="w-full py-3 rounded-2xl bg-emerald-500 text-white font-black text-base shadow-md shadow-emerald-200 active:scale-95 transition"
        >
          Recoger {gift.emoji} {gift.name}
        </button>
      </div>
    </div>
  );
}

/* ══ PÁGINA ══════════════════════════════════════════════════════════════════ */
export default function ArbolPage() {
  const [total,       setTotal]       = useState(0);
  const [streak,      setStreak]      = useState(0);
  const [bellotas,    setBellotas]    = useState(0);
  const [loading,     setLoading]     = useState(true);

  // Estados de cosecha y regalo
  const [harvestDone,   setHarvestDone]   = useState(false);
  const [harvestMsg,    setHarvestMsg]    = useState<string | null>(null);
  const [availableGift, setAvailableGift] = useState<TreeGift | null>(null);
  const [collectedGift, setCollectedGift] = useState<TreeGift | null>(null);
  const [collectedIds,  setCollectedIds]  = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [log, profile] = await Promise.all([getPregLog(), getPlayerProfile()]);
        const entries = Object.keys(log).length;
        const s       = calcStreak(log);
        setTotal(entries);
        setStreak(s);
        setBellotas(profile.bellotas ?? 0);

        // Estado cosecha y regalo (localStorage → solo client)
        const alreadyHarvested = !canHarvestToday();
        setHarvestDone(alreadyHarvested);
        setAvailableGift(getAvailableGift(s));
        setCollectedIds(getCollectedGifts());
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  const stage     = useMemo(() => getStage(total),      [total]);
  const nextStage = useMemo(() => getNextStage(total),   [total]);
  const stageIdx  = useMemo(() => STAGES.indexOf(stage), [stage]);

  const harvestAmt = useMemo(
    () => getHarvestAmount(stageIdx, streak),
    [stageIdx, streak]
  );
  const canHarvest = harvestAmt > 0 && !harvestDone;

  const progressPct = useMemo(() => {
    if (!nextStage) return 100;
    return Math.round(((total - stage.min) / (nextStage.min - stage.min)) * 100);
  }, [total, stage, nextStage]);

  /* Cosechar bellotas */
  async function handleHarvest() {
    if (!canHarvest) return;
    recordHarvest();
    setHarvestDone(true);
    const newVal = bellotas + harvestAmt;
    setBellotas(newVal);
    setHarvestMsg(`+${harvestAmt} 🌰 cosechadas del árbol`);
    setTimeout(() => setHarvestMsg(null), 3000);
    try { await upsertPlayerProfile({ bellotas: newVal }); } catch { /* noop */ }
  }

  /* Recoger regalo */
  function handleCollectGift() {
    if (!availableGift) return;
    const gift = collectGift(availableGift.id);
    if (!gift) return;
    setCollectedGift(gift);
    setCollectedIds(getCollectedGifts());
    setAvailableGift(getAvailableGift(streak)); // busca el siguiente si hubiera
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-100 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl block mb-3" style={{ animation: "bounce 1.5s ease-in-out infinite" }}>🌳</span>
          <p className="text-slate-500 font-medium">Cargando tu árbol…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50 to-sky-50 pb-10">

      {/* Cabecera */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-white/60 shadow-sm">
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 max-w-lg mx-auto">
          <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-lg active:scale-95 transition">🏠</Link>
          <div className="flex-1">
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Tu progreso</p>
            <h1 className="text-lg font-black text-slate-800 leading-tight">Árbol del Bosque</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-1.5">
            <span className="text-base">🌰</span>
            <span className="text-sm font-black text-amber-700">{bellotas}</span>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-5">

        {/* Toast de cosecha */}
        {harvestMsg && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white font-black px-6 py-3 rounded-2xl shadow-xl text-sm">
            {harvestMsg}
          </div>
        )}

        {/* Modal de regalo recogido */}
        {collectedGift && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
            <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl">
              <p className="text-6xl mb-3">{collectedGift.emoji}</p>
              <p className="text-xl font-black text-slate-800 mb-1">¡{collectedGift.name}!</p>
              <p className="text-xs text-slate-500 mb-1 leading-snug">
                Se ha añadido a tu armario 👗
              </p>
              <p className="text-[10px] text-emerald-600 font-bold mb-4 uppercase tracking-wide">
                Exclusivo del árbol · Solo tú lo tienes
              </p>
              <button
                onClick={() => setCollectedGift(null)}
                className="w-full py-3 rounded-2xl bg-emerald-500 text-white font-black active:scale-95 transition"
              >
                ¡Qué ilusión! 🌳
              </button>
              <Link href="/armario" className="block mt-2 text-xs text-emerald-600 underline underline-offset-2">
                Ver en el armario →
              </Link>
            </div>
          </div>
        )}

        {/* Árbol SVG */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
          <div className="h-72 w-full">
            <TreeSVG total={total} streak={streak} hasGift={!!availableGift} harvestAmt={canHarvest ? harvestAmt : 0} />
          </div>

          {/* Info de etapa */}
          <div className="px-5 pb-5 pt-2 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{stage.emoji}</span>
              <div>
                <p className="text-base font-black text-slate-800 leading-tight">{stage.name}</p>
                <p className="text-xs text-slate-500 leading-snug">{stage.desc}</p>
              </div>
            </div>
            {nextStage ? (
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
                  <span>Hacia {nextStage.emoji} {nextStage.name}</span>
                  <span>{total}/{nextStage.min} registros</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700" style={{ width: `${progressPct}%` }}/>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 text-right">
                  {nextStage.min - total} {nextStage.min - total === 1 ? "registro más" : "registros más"}
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2 text-center">
                <p className="text-emerald-700 font-bold text-xs">🏆 ¡Árbol legendario desbloqueado!</p>
              </div>
            )}
          </div>
        </div>

        {/* Regalo disponible */}
        {availableGift && (
          <GiftCard gift={availableGift} onCollect={handleCollectGift} />
        )}

        {/* Cosecha de bellotas */}
        {harvestAmt > 0 && (
          <div className={`rounded-3xl overflow-hidden shadow-md border-2 ${canHarvest ? "border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50" : "border-slate-200 bg-white"}`}>
            <div className={`px-4 py-2 flex items-center gap-2 ${canHarvest ? "bg-amber-400" : "bg-slate-100"}`}>
              <span className="text-xl">🌰</span>
              <p className={`font-black text-sm ${canHarvest ? "text-white" : "text-slate-500"}`}>
                {canHarvest ? "¡Hay bellotas para cosechar!" : "Cosechado hoy ✓"}
              </p>
            </div>
            <div className="px-4 py-4 flex items-center gap-4">
              <div className="flex gap-0.5 flex-wrap w-20 shrink-0">
                {Array.from({ length: Math.min(harvestAmt, 10) }).map((_, i) => (
                  <span key={i} className={`text-xl ${canHarvest ? "" : "opacity-30"}`}>🌰</span>
                ))}
              </div>
              <div className="flex-1">
                <p className={`font-black text-lg ${canHarvest ? "text-amber-700" : "text-slate-400"}`}>
                  +{harvestAmt} bellotas
                </p>
                <p className="text-xs text-slate-400 leading-snug">
                  {canHarvest
                    ? "Tu árbol ha producido frutos hoy. ¡Recógelos!"
                    : "Vuelve mañana para la próxima cosecha"}
                </p>
              </div>
            </div>
            {canHarvest && (
              <div className="px-4 pb-4">
                <button
                  onClick={handleHarvest}
                  className="w-full py-3 rounded-2xl bg-amber-400 text-amber-900 font-black text-base shadow-md shadow-amber-200 active:scale-95 transition"
                >
                  Cosechar {harvestAmt} 🌰
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
            <p className="text-2xl font-black text-teal-600">{total}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Registros</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
            <p className="text-2xl font-black text-orange-500">{streak > 0 ? `🔥${streak}` : "0"}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Racha días</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
            <p className="text-2xl font-black text-emerald-600">{stageIdx + 1}/7</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Etapa árbol</p>
          </div>
        </div>

        {/* Regalos del árbol — progresión */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Regalos del árbol</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Prendas exclusivas que solo nacen del árbol</p>
          </div>
          <div className="divide-y divide-slate-50">
            {TREE_GIFTS.map(g => {
              const collected = collectedIds.includes(g.id);
              const available = streak >= g.streakRequired && !collected;
              return (
                <div key={g.id} className={`flex items-center gap-3 px-4 py-3 ${available ? "bg-emerald-50" : ""}`}>
                  <span className={`text-3xl ${collected || available ? "" : "grayscale opacity-40"}`}>{g.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${collected || available ? "text-slate-700" : "text-slate-400"}`}>{g.name}</p>
                    <p className="text-xs text-slate-400 leading-snug">{g.label}</p>
                  </div>
                  {collected ? (
                    <span className="shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">✓ Recogido</span>
                  ) : available ? (
                    <span className="shrink-0 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-300 px-2 py-1 rounded-full animate-pulse">¡Disponible!</span>
                  ) : (
                    <span className="shrink-0 text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full">Racha {g.streakRequired}d</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Habitantes del árbol */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Habitantes</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Los animales del bosque que viven en tu árbol</p>
          </div>
          <div className="divide-y divide-slate-50">
            {HABITANTS.map(h => {
              const unlocked = streak >= h.days;
              return (
                <div key={h.name} className={`flex items-center gap-3 px-4 py-3 ${unlocked ? "" : "opacity-40"}`}>
                  <span className={`text-3xl ${unlocked ? "" : "grayscale"}`}>{h.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700">{h.name}</p>
                    <p className="text-xs text-slate-400">{h.desc}</p>
                  </div>
                  {unlocked
                    ? <span className="shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">✓ Vive aquí</span>
                    : <span className="shrink-0 text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full">Racha {h.days}d</span>
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <Link href="/registro/diario"
          className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-base text-center shadow-md shadow-emerald-200 active:scale-95 transition">
          🌱 Hacer un registro y que crezca
        </Link>

      </div>
    </div>
  );
}
