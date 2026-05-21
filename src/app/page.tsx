"use client";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { getPlayerProfile, getPregLog } from "@/lib/db";
import { pullFromCloud } from "@/lib/cloudsync";
import { getLevelInfo } from "@/lib/profile";
import {
  getShopBellotas, getShopTitulos,
  getOwned, getEquippedAvatar, setEquippedAvatar,
  getEquippedTitulo, setEquippedTitulo,
  type ShopItem, type TituloItem,
} from "@/lib/shop";
import {
  getMascotConfig, getDaysSinceLastActivity, computeMascotStateFromStats,
  getTamagotchiStats, MASCOT_STATE_INFO, type MascotState, type TamagotchiStats,
} from "@/lib/mascot";
import MisionesModal from "@/components/MisionesModal";

/* ── Mascota ─────────────────────────────────────────────────────────────── */
function MascotDisplay({ state }: { state: MascotState }) {
  const info = MASCOT_STATE_INFO[state];

  return (
    <>
      <style>{`
        @keyframes mascot-muy-feliz {
          0%,100% { transform: translateY(0) scale(1); }
          25%      { transform: translateY(-18px) scale(1.08); }
          75%      { transform: translateY(-9px) scale(1.04); }
        }
        @keyframes mascot-feliz {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-12px); }
        }
        @keyframes mascot-neutral {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.04); }
        }
        @keyframes mascot-triste {
          0%,100% { transform: translateY(0) rotate(-3deg); }
          50%      { transform: translateY(6px) rotate(3deg); }
        }
        @keyframes mascot-dormida {
          0%,100% { transform: scale(1) translateY(0); opacity: 0.85; }
          50%      { transform: scale(1.02) translateY(3px); opacity: 0.7; }
        }
        @keyframes mascot-enfadada {
          0%,100% { transform: translateX(0) rotate(0deg); }
          15%      { transform: translateX(-6px) rotate(-4deg); }
          30%      { transform: translateX(6px) rotate(4deg); }
          45%      { transform: translateX(-5px) rotate(-3deg); }
          60%      { transform: translateX(5px) rotate(3deg); }
          75%      { transform: translateX(-3px) rotate(-2deg); }
        }
        .mascot-muy-feliz { animation: mascot-muy-feliz 0.7s ease-in-out infinite; }
        .mascot-feliz     { animation: mascot-feliz 2s ease-in-out infinite; }
        .mascot-neutral   { animation: mascot-neutral 3s ease-in-out infinite; }
        .mascot-triste    { animation: mascot-triste 3.5s ease-in-out infinite; }
        .mascot-dormida   { animation: mascot-dormida 4s ease-in-out infinite; }
        .mascot-enfadada  { animation: mascot-enfadada 0.8s ease-in-out infinite; }
      `}</style>

      <div className="flex flex-col items-center gap-3 w-full">
        {/* Glow circle behind mascot */}
        <div className="relative flex items-center justify-center">
          <div
            className="absolute rounded-full w-28 h-28 blur-xl opacity-60"
            style={{ background: info.glowColor }}
          />
          <span
            className={`text-8xl select-none relative z-10 ${info.animationClass}`}
            style={{
              filter: `drop-shadow(0 0 16px ${info.glowColor})`,
              ...(state === "triste" || state === "dormida" ? { filter: `drop-shadow(0 0 12px ${info.glowColor}) saturate(0.4) brightness(0.9)` } : {}),
              ...(state === "enfadada" ? { filter: `drop-shadow(0 0 16px ${info.glowColor}) saturate(1.8) hue-rotate(-20deg)` } : {}),
            }}
          >
            {info.emoji}
          </span>
        </div>

        {/* Speech bubble */}
        <div
          className="relative bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2.5 shadow-lg border border-white/60 max-w-[220px]"
          style={{ boxShadow: `0 4px 20px ${info.glowColor}` }}
        >
          {/* Bubble tail */}
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-2 overflow-hidden"
          >
            <div className="w-4 h-4 bg-white/90 border-l border-t border-white/60 rotate-45 -translate-y-2" />
          </div>
          <p className="text-center text-sm font-semibold text-slate-700 leading-snug">
            {info.message}
          </p>
        </div>
      </div>
    </>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return "Buenos días ☀️";
  if (h >= 14 && h < 21) return "Buenas tardes 🌤️";
  return "Buenas noches 🌙";
}

/* ── Escena de fondo según hora del día ──────────────────────────────────── */
type TimeSegment = "madrugada" | "amanecer" | "dia" | "atardecer" | "noche";

function getTimeSegment(): TimeSegment {
  const h = new Date().getHours();
  if (h < 5)  return "madrugada";
  if (h < 8)  return "amanecer";
  if (h < 18) return "dia";
  if (h < 21) return "atardecer";
  return "noche";
}

const STARS_MANY: [number, number][] = [
  [20,15],[60,8],[100,25],[150,10],[200,18],[250,6],[300,20],[350,12],[385,30],
  [40,45],[90,38],[140,50],[190,35],[240,48],[290,40],[340,55],[30,70],[80,62],
  [130,75],[180,60],[230,72],[280,65],[330,78],[45,90],[95,85],[145,95],[195,82],
  [245,92],[295,88],[345,100],[35,110],[85,105],[135,115],[185,102],[235,112],
  [285,108],[335,120],[10,130],[60,125],[110,135],[160,122],[210,132],[260,128],
  [310,138],[360,125],[70,150],[120,145],[170,155],[220,142],[270,152],
];
const STARS_FEW: [number, number][] = [
  [30,20],[70,12],[110,28],[160,15],[210,22],[260,10],[305,25],[365,18],
  [40,50],[90,42],[140,55],[195,40],[245,52],[290,45],[55,80],[105,72],
  [155,85],[205,68],[255,80],[305,75],[355,88],[20,100],[65,95],[115,108],
  [165,95],[215,105],[265,100],[315,110],[365,98],[35,125],[85,118],
  [135,130],[185,115],[235,128],[285,122],[335,135],
];

function SceneBg({ seg }: { seg: TimeSegment }) {
  if (seg === "madrugada") return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gMad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020617"/><stop offset="100%" stopColor="#0f172a"/>
        </linearGradient>
        <mask id="mMad">
          <rect width="400" height="260" fill="white"/>
          <circle cx="338" cy="46" r="21" fill="black"/>
        </mask>
      </defs>
      <rect width="400" height="260" fill="url(#gMad)"/>
      {STARS_MANY.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 1.8 : 1} fill="white" opacity={0.4 + (i % 5) * 0.12}/>
      ))}
      <circle cx="320" cy="55" r="26" fill="#fef9c3" mask="url(#mMad)"/>
      <ellipse cx="0"   cy="270" rx="190" ry="80" fill="#1e1b4b"/>
      <ellipse cx="200" cy="278" rx="230" ry="70" fill="#172554"/>
      <ellipse cx="400" cy="268" rx="175" ry="78" fill="#1e1b4b"/>
    </svg>
  );

  if (seg === "amanecer") return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gAman" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6d28d9"/><stop offset="35%" stopColor="#f97316"/>
          <stop offset="70%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#fde68a"/>
        </linearGradient>
        <radialGradient id="sunAman" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fef9c3"/><stop offset="100%" stopColor="#fb923c"/>
        </radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#gAman)"/>
      <circle cx="200" cy="210" r="60" fill="#fde68a" opacity="0.22"/>
      <circle cx="200" cy="210" r="42" fill="url(#sunAman)"/>
      <g fill="#fcd9b6" opacity="0.8">
        <ellipse cx="70" cy="80" rx="45" ry="18"/><ellipse cx="100" cy="70" rx="35" ry="16"/><ellipse cx="45" cy="85" rx="28" ry="13"/>
      </g>
      <g fill="#fda4af" opacity="0.7">
        <ellipse cx="300" cy="62" rx="40" ry="16"/><ellipse cx="325" cy="53" rx="28" ry="14"/><ellipse cx="278" cy="67" rx="22" ry="11"/>
      </g>
      <ellipse cx="0"   cy="270" rx="190" ry="80" fill="#166534"/>
      <ellipse cx="200" cy="278" rx="230" ry="70" fill="#15803d"/>
      <ellipse cx="400" cy="268" rx="175" ry="78" fill="#166534"/>
    </svg>
  );

  if (seg === "dia") return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gDia" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0284c7"/><stop offset="100%" stopColor="#7dd3fc"/>
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#gDia)"/>
      <circle cx="340" cy="48" r="32" fill="#fde047"/>
      {Array.from({ length: 8 }, (_, i) => {
        const a = i * 45 * Math.PI / 180;
        return <line key={i} x1={340 + 36 * Math.cos(a)} y1={48 + 36 * Math.sin(a)} x2={340 + 50 * Math.cos(a)} y2={48 + 50 * Math.sin(a)} stroke="#fde047" strokeWidth="5" strokeLinecap="round"/>;
      })}
      <g fill="white" opacity="0.95">
        <ellipse cx="80" cy="65" rx="48" ry="22"/><ellipse cx="112" cy="54" rx="36" ry="20"/><ellipse cx="50" cy="70" rx="30" ry="17"/>
      </g>
      <g fill="white" opacity="0.9">
        <ellipse cx="230" cy="45" rx="38" ry="18"/><ellipse cx="258" cy="37" rx="28" ry="17"/><ellipse cx="208" cy="50" rx="22" ry="14"/>
      </g>
      <ellipse cx="0"   cy="270" rx="190" ry="80" fill="#4ade80"/>
      <ellipse cx="200" cy="278" rx="230" ry="72" fill="#22c55e"/>
      <ellipse cx="400" cy="268" rx="175" ry="78" fill="#4ade80"/>
    </svg>
  );

  if (seg === "atardecer") return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gAtard" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4c1d95"/><stop offset="40%" stopColor="#c2410c"/>
          <stop offset="75%" stopColor="#f97316"/><stop offset="100%" stopColor="#fbbf24"/>
        </linearGradient>
        <radialGradient id="sunAtard" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fef9c3"/><stop offset="60%" stopColor="#f97316"/><stop offset="100%" stopColor="#dc2626"/>
        </radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#gAtard)"/>
      <circle cx="70" cy="190" r="60" fill="#fde68a" opacity="0.2"/>
      <circle cx="70" cy="190" r="38" fill="url(#sunAtard)"/>
      <g fill="#fed7aa" opacity="0.65">
        <ellipse cx="220" cy="70" rx="50" ry="20"/><ellipse cx="250" cy="60" rx="35" ry="17"/><ellipse cx="195" cy="75" rx="28" ry="14"/>
      </g>
      <g fill="#f9a8d4" opacity="0.55">
        <ellipse cx="340" cy="100" rx="40" ry="16"/><ellipse cx="365" cy="92" rx="28" ry="14"/><ellipse cx="318" cy="105" rx="22" ry="11"/>
      </g>
      <ellipse cx="0"   cy="270" rx="190" ry="80" fill="#1c1917"/>
      <ellipse cx="200" cy="278" rx="230" ry="72" fill="#292524"/>
      <ellipse cx="400" cy="268" rx="175" ry="78" fill="#1c1917"/>
    </svg>
  );

  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gNoche" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#172554"/><stop offset="100%" stopColor="#1e3a8a"/>
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#gNoche)"/>
      {STARS_FEW.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1.2} fill="white" opacity={0.35 + (i % 6) * 0.1}/>
      ))}
      <circle cx="320" cy="55" r="36" fill="#fef9c3" opacity="0.15"/>
      <circle cx="320" cy="55" r="28" fill="#fef9c3"/>
      <ellipse cx="0"   cy="270" rx="190" ry="80" fill="#1e1b4b"/>
      <ellipse cx="200" cy="278" rx="230" ry="72" fill="#172554"/>
      <ellipse cx="400" cy="268" rx="175" ry="78" fill="#1e1b4b"/>
    </svg>
  );
}


/* ── Modal de avatar/título ─────────────────────────────────────────────── */
function AvatarModal({
  onClose,
  ownedItems,
  ownedTitulos,
  equippedAvatar,
  equippedTituloId,
  onEquipAvatar,
  onEquipTitulo,
}: {
  onClose: () => void;
  ownedItems: ShopItem[];
  ownedTitulos: TituloItem[];
  equippedAvatar: string | null;
  equippedTituloId: string | null;
  onEquipAvatar: (emoji: string | null) => void;
  onEquipTitulo: (id: string | null) => void;
}) {
  const [tab, setTab] = useState<"avatar" | "titulo">("avatar");

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative bg-white rounded-t-3xl px-5 pt-5 pb-10 shadow-2xl max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

        <h3 className="text-base font-bold text-slate-800 mb-4 text-center">Personalizar perfil</h3>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 bg-slate-100 rounded-xl p-1">
          {(["avatar", "titulo"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"
              }`}>
              {t === "avatar" ? "🖼️ Avatar" : "🏷️ Título"}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto">
          {tab === "avatar" && (
            <div>
              {ownedItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">🛒</p>
                  <p className="text-sm text-slate-500 font-medium">Sin artículos comprados aún</p>
                  <p className="text-xs text-slate-400 mt-1">Compra artículos en la Tienda de Bellotas para usarlos como avatar</p>
                </div>
              ) : (
                <>
                  {/* Opción por defecto (ardilla) */}
                  <button
                    onClick={() => onEquipAvatar(null)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 mb-2 transition-all active:scale-[0.98] ${
                      !equippedAvatar ? "border-teal-400 bg-teal-50" : "border-transparent bg-slate-50"
                    }`}
                  >
                    <span className="text-3xl">🐿️</span>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-700">Ardilla (por defecto)</p>
                      <p className="text-[10px] text-slate-400">Avatar original</p>
                    </div>
                    {!equippedAvatar && <span className="ml-auto text-teal-500 font-bold text-sm">✓</span>}
                  </button>
                  {/* Artículos comprados */}
                  {ownedItems.map(item => (
                    <button key={item.id}
                      onClick={() => onEquipAvatar(item.emoji)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 mb-2 transition-all active:scale-[0.98] ${
                        equippedAvatar === item.emoji ? "border-teal-400 bg-teal-50" : "border-transparent bg-slate-50"
                      }`}
                    >
                      <span className="text-3xl">{item.emoji}</span>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-700">{item.name}</p>
                        <p className="text-[10px] text-slate-400">{item.desc || "Artículo desbloqueado"}</p>
                      </div>
                      {equippedAvatar === item.emoji && <span className="ml-auto text-teal-500 font-bold text-sm">✓</span>}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === "titulo" && (
            <div>
              {ownedTitulos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">🏷️</p>
                  <p className="text-sm text-slate-500 font-medium">Sin títulos comprados aún</p>
                  <p className="text-xs text-slate-400 mt-1">Compra títulos en la Tienda de Bellotas para equiparlos</p>
                </div>
              ) : (
                <>
                  {/* Sin título */}
                  <button
                    onClick={() => onEquipTitulo(null)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 mb-2 transition-all active:scale-[0.98] ${
                      !equippedTituloId ? "border-teal-400 bg-teal-50" : "border-transparent bg-slate-50"
                    }`}
                  >
                    <span className="text-xl">—</span>
                    <p className="text-xs font-bold text-slate-700">Sin título</p>
                    {!equippedTituloId && <span className="ml-auto text-teal-500 font-bold text-sm">✓</span>}
                  </button>
                  {ownedTitulos.map(t => (
                    <button key={t.id}
                      onClick={() => onEquipTitulo(t.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 mb-2 transition-all active:scale-[0.98] ${
                        equippedTituloId === t.id ? "border-violet-400 bg-violet-50" : "border-transparent bg-slate-50"
                      }`}
                    >
                      <span className="text-xl">🏷️</span>
                      <p className="flex-1 text-xs font-bold text-slate-700 text-left">{t.text}</p>
                      {equippedTituloId === t.id && <span className="text-violet-500 font-bold text-sm">✓</span>}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <button onClick={onClose}
          className="mt-4 w-full py-3 rounded-2xl bg-teal-600 text-white font-bold text-sm active:scale-95 transition-all">
          Listo ✓
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   HOME
══════════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [timeSegment] = useState<TimeSegment>(getTimeSegment);

  const [xp,       setXp]       = useState(0);
  const [bellotas, setBellotas] = useState(0);
  const [loaded,   setLoaded]   = useState(false);

  /* Mascot + tamagotchi */
  const [mascotState,    setMascotState]    = useState<MascotState>("neutral");
  const [tamaStats,      setTamaStats]      = useState<TamagotchiStats | null>(null);
  const [showMisiones,   setShowMisiones]   = useState(false);

  /* Avatar / título */
  const [equippedAvatar,   setEquippedAvatarState]   = useState<string | null>(null);
  const [equippedTituloId, setEquippedTituloIdState] = useState<string | null>(null);
  const [tituloText,       setTituloText]            = useState<string | null>(null);
  const [showModal,        setShowModal]             = useState(false);

  /* Items de tienda para el modal */
  const [ownedItems,   setOwnedItems]   = useState<ShopItem[]>([]);
  const [ownedTitulos, setOwnedTitulos] = useState<TituloItem[]>([]);

  const loadProfile = useCallback(() => {
    getPlayerProfile()
      .then(p => { setXp(p.xp); setBellotas(p.bellotas); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const loadEquipped = useCallback(() => {
    const avatar  = getEquippedAvatar();
    const titulo  = getEquippedTitulo();
    setEquippedAvatarState(avatar);
    setEquippedTituloIdState(titulo);

    if (titulo) {
      const allTitulos = getShopTitulos();
      const found = allTitulos.find(t => t.id === titulo);
      setTituloText(found?.text ?? null);
    } else {
      setTituloText(null);
    }

    const owned    = getOwned();
    const allBell  = getShopBellotas();
    const allTit   = getShopTitulos();
    setOwnedItems(allBell.filter(i => owned.includes(i.id)));
    setOwnedTitulos(allTit.filter(t => owned.includes(t.id)));
  }, []);

  const loadMascot = useCallback(() => {
    const cfg   = getMascotConfig();
    const stats = getTamagotchiStats();
    setTamaStats(stats);
    Promise.all([getDaysSinceLastActivity(), getPregLog()])
      .then(([, log]) => {
        const today = new Date();
        let streak = 0;
        for (let i = 0; i < 365; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          if (log[d.toISOString().slice(0, 10)]) streak++;
          else break;
        }
        const fresh = getTamagotchiStats();
        setTamaStats(fresh);
        setMascotState(computeMascotStateFromStats(fresh, streak, cfg));
      })
      .catch(() => {
        setMascotState("neutral");
      });
  }, []);

  useEffect(() => {
    // 1) Pull desde Supabase ANTES de cargar el perfil local → fuente de verdad
    pullFromCloud().finally(() => { loadProfile(); loadEquipped(); loadMascot(); });

    // Refresca XP/bellotas al volver a la página (después de una práctica o registro)
    const refresh = () => { loadProfile(); loadEquipped(); loadMascot(); };
    const onVis   = () => { if (!document.hidden) refresh(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [loadProfile, loadEquipped, loadMascot]);

  function handleEquipAvatar(emoji: string | null) {
    setEquippedAvatar(emoji);
    setEquippedAvatarState(emoji);
  }

  function handleEquipTitulo(id: string | null) {
    setEquippedTitulo(id);
    setEquippedTituloIdState(id);
    if (id) {
      const found = ownedTitulos.find(t => t.id === id);
      setTituloText(found?.text ?? null);
    } else {
      setTituloText(null);
    }
  }

  const { level, currentXp, nextLevelXp, progress } = getLevelInfo(xp);
  const avatarEmoji = equippedAvatar ?? "🐿️";

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-sky-100 via-teal-50 to-emerald-100 overflow-hidden">

      {/* ── ZONA SUPERIOR: perfil ── */}
      <div className="shrink-0 px-5 pt-5">

        {/* Tarjeta de perfil */}
        <div className="bg-white/75 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-md flex items-center gap-3">
          {/* Avatar — toca para cambiar */}
          <button
            onClick={() => { loadEquipped(); setShowModal(true); }}
            className="shrink-0 w-14 h-14 rounded-full bg-teal-100 border-2 border-teal-300 flex items-center justify-center text-3xl shadow-sm active:scale-95 transition-transform relative"
          >
            {avatarEmoji}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[9px] shadow-sm">✏️</span>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base font-extrabold text-slate-700 leading-none shrink-0">Vicky</span>
                {tituloText && (
                  <span className="text-[11px] font-bold text-violet-500 leading-none truncate">· {tituloText}</span>
                )}
              </div>
              <span className="flex items-center gap-1 text-sm font-bold text-amber-600 shrink-0">
                🌰 <span>{loaded ? bellotas : "—"}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[10px] font-bold text-white bg-teal-500 px-1.5 py-0.5 rounded-full leading-none">
                Nv.{level}
              </span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-700"
                  style={{ width: `${Math.max(progress * 100, 3)}%` }}
                />
              </div>
              <span className="shrink-0 text-[9px] text-slate-400 font-medium">
                {loaded ? `${currentXp}/${nextLevelXp} XP` : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SALUDO + MASCOTA ── */}
      <div className="flex-1 min-h-0 px-5 py-2 flex flex-col">
        <div className="flex-1 min-h-0 relative rounded-3xl overflow-hidden shadow-xl border border-white/20">
          {/* Fondo de escena */}
          <div className="absolute inset-0">
            <SceneBg seg={timeSegment} />
          </div>
          {/* Grano fino estilo cartón */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,1) 1px, transparent 1px)",
            backgroundSize: "3px 3px",
          }}/>
          {/* Viñeta interior */}
          <div className="absolute inset-0 pointer-events-none rounded-3xl" style={{
            boxShadow: "inset 0 0 60px rgba(0,0,0,0.35)",
          }}/>
          {/* Misiones — icono flotante esquina izquierda */}
          <button
            onClick={() => setShowMisiones(true)}
            className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5 active:scale-95 transition-transform border border-white/20">
            <span className="text-base">📋</span>
          </button>
          {/* Tienda — icono flotante esquina derecha */}
          <Link href="/tienda"
            className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5 active:scale-95 transition-transform border border-white/20">
            <span className="text-base">🛒</span>
            {loaded && <span className="text-[11px] font-bold text-white">{bellotas}🌰</span>}
          </Link>
          {/* Tamagotchi stats — barra inferior */}
          {tamaStats && (
            <div className="absolute bottom-3 left-3 right-3 z-10">
              <div className="bg-black/35 backdrop-blur-sm rounded-2xl px-3 py-2.5 flex flex-col gap-1.5">
                {([
                  { key: "vitalidad", label: "Vitalidad", emoji: "⚡", color: "#fbbf24", val: tamaStats.vitalidad },
                  { key: "salud",     label: "Salud",     emoji: "💚", color: "#34d399", val: tamaStats.salud },
                  { key: "ánimo",     label: "Ánimo",     emoji: "🌸", color: "#c084fc", val: tamaStats.animo },
                ] as const).map(({ key, label, emoji, color, val }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[11px] w-4 text-center">{emoji}</span>
                    <span className="text-[9px] text-white/65 w-11 font-semibold tracking-wide">{label}</span>
                    <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${val}%`, background: color }}
                      />
                    </div>
                    <span className="text-[9px] text-white/60 w-5 text-right font-bold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Contenido */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 pt-10 pb-24">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1"
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>¡Hola, Vicky!</h1>
              <p className="text-white/90 text-sm font-semibold"
                style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>{greeting()}</p>
            </div>
            {/* Mascota */}
            <MascotDisplay state={mascotState} />
          </div>
        </div>
      </div>

      {/* ── BOTONES 2×2 ── */}
      <div className="shrink-0 px-5 pb-6 grid grid-cols-2 gap-2">
        <Link href="/registro"
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/80 border border-teal-200 text-teal-800 font-bold text-sm shadow-sm active:scale-95 transition-transform">
          <span className="text-xl">✏️</span> Registro
        </Link>
        <Link href="/formaciones"
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/80 border border-violet-200 text-violet-800 font-bold text-sm shadow-sm active:scale-95 transition-transform">
          <span className="text-xl">🎓</span> Ejercicios
        </Link>
        <Link href="/informacion"
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/80 border border-amber-200 text-amber-800 font-bold text-sm shadow-sm active:scale-95 transition-transform">
          <span className="text-xl">ℹ️</span> Información
        </Link>
        <Link href="/opciones"
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/80 border border-slate-200 text-slate-600 font-bold text-sm shadow-sm active:scale-95 transition-transform">
          <span className="text-xl">⚙️</span> Ajustes
        </Link>
      </div>

      {/* ── Modal avatar/título ── */}
      {showModal && (
        <AvatarModal
          onClose={() => setShowModal(false)}
          ownedItems={ownedItems}
          ownedTitulos={ownedTitulos}
          equippedAvatar={equippedAvatar}
          equippedTituloId={equippedTituloId}
          onEquipAvatar={handleEquipAvatar}
          onEquipTitulo={handleEquipTitulo}
        />
      )}
      {/* ── Modal misiones ── */}
      {showMisiones && <MisionesModal onClose={() => setShowMisiones(false)} />}
    </div>
  );
}
