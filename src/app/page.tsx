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
import { getMascotConfig } from "@/lib/mascot";
import {
  getTamaStats, computeVisualState, feedTama, sleepTama, playTama,
  TAMA_MESSAGES, type TamaStats, type TamaVisualState,
} from "@/lib/tamagotchi";
import {
  getEquippedClothing, CLOTHING_CATALOG, getFoodInventory, FOOD_CATALOG,
  getOwnedToys, TOY_CATALOG, isToyOnCooldown, recordToyUse, consumeFood,
  type EquippedClothing,
} from "@/lib/squirrel-shop";
import ChibiArdilla from "@/components/ChibiArdilla";
import MisionesModal from "@/components/MisionesModal";

/* ── Hora del día ─────────────────────────────────────────────── */
type TimeSegment = "madrugada" | "amanecer" | "dia" | "atardecer" | "noche";
function getTimeSegment(): TimeSegment {
  const h = new Date().getHours();
  if (h < 5)  return "madrugada";
  if (h < 8)  return "amanecer";
  if (h < 18) return "dia";
  if (h < 21) return "atardecer";
  return "noche";
}
function greeting() {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return "Buenos días ☀️";
  if (h >= 14 && h < 21) return "Buenas tardes 🌤️";
  return "Buenas noches 🌙";
}

/* ── Escena SVG ───────────────────────────────────────────────── */
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
        <linearGradient id="gMad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#020617"/><stop offset="100%" stopColor="#0f172a"/></linearGradient>
        <mask id="mMad"><rect width="400" height="260" fill="white"/><circle cx="338" cy="46" r="21" fill="black"/></mask>
      </defs>
      <rect width="400" height="260" fill="url(#gMad)"/>
      {STARS_MANY.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i%5===0?1.8:1} fill="white" opacity={0.4+(i%5)*0.12}/>)}
      <circle cx="320" cy="55" r="26" fill="#fef9c3" mask="url(#mMad)"/>
      <ellipse cx="0" cy="270" rx="190" ry="80" fill="#1e1b4b"/><ellipse cx="200" cy="278" rx="230" ry="70" fill="#172554"/><ellipse cx="400" cy="268" rx="175" ry="78" fill="#1e1b4b"/>
    </svg>
  );
  if (seg === "amanecer") return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gAman" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6d28d9"/><stop offset="35%" stopColor="#f97316"/><stop offset="70%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#fde68a"/></linearGradient>
        <radialGradient id="sunAman" cx="50%" cy="50%"><stop offset="0%" stopColor="#fef9c3"/><stop offset="100%" stopColor="#fb923c"/></radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#gAman)"/>
      <circle cx="200" cy="210" r="60" fill="#fde68a" opacity="0.22"/><circle cx="200" cy="210" r="42" fill="url(#sunAman)"/>
      <g fill="#fcd9b6" opacity="0.8"><ellipse cx="70" cy="80" rx="45" ry="18"/><ellipse cx="100" cy="70" rx="35" ry="16"/></g>
      <ellipse cx="0" cy="270" rx="190" ry="80" fill="#166534"/><ellipse cx="200" cy="278" rx="230" ry="70" fill="#15803d"/><ellipse cx="400" cy="268" rx="175" ry="78" fill="#166534"/>
    </svg>
  );
  if (seg === "dia") return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="gDia" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0284c7"/><stop offset="100%" stopColor="#7dd3fc"/></linearGradient></defs>
      <rect width="400" height="260" fill="url(#gDia)"/>
      <circle cx="340" cy="48" r="32" fill="#fde047"/>
      {Array.from({length:8},(_,i)=>{const a=i*45*Math.PI/180;return<line key={i} x1={340+36*Math.cos(a)} y1={48+36*Math.sin(a)} x2={340+50*Math.cos(a)} y2={48+50*Math.sin(a)} stroke="#fde047" strokeWidth="5" strokeLinecap="round"/>;}) }
      <g fill="white" opacity="0.95"><ellipse cx="80" cy="65" rx="48" ry="22"/><ellipse cx="112" cy="54" rx="36" ry="20"/><ellipse cx="50" cy="70" rx="30" ry="17"/></g>
      <g fill="white" opacity="0.9"><ellipse cx="230" cy="45" rx="38" ry="18"/><ellipse cx="258" cy="37" rx="28" ry="17"/></g>
      <ellipse cx="0" cy="270" rx="190" ry="80" fill="#4ade80"/><ellipse cx="200" cy="278" rx="230" ry="72" fill="#22c55e"/><ellipse cx="400" cy="268" rx="175" ry="78" fill="#4ade80"/>
    </svg>
  );
  if (seg === "atardecer") return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gAtard" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4c1d95"/><stop offset="40%" stopColor="#c2410c"/><stop offset="75%" stopColor="#f97316"/><stop offset="100%" stopColor="#fbbf24"/></linearGradient>
        <radialGradient id="sunAtard" cx="50%" cy="50%"><stop offset="0%" stopColor="#fef9c3"/><stop offset="60%" stopColor="#f97316"/><stop offset="100%" stopColor="#dc2626"/></radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#gAtard)"/>
      <circle cx="70" cy="190" r="60" fill="#fde68a" opacity="0.2"/><circle cx="70" cy="190" r="38" fill="url(#sunAtard)"/>
      <g fill="#fed7aa" opacity="0.65"><ellipse cx="220" cy="70" rx="50" ry="20"/><ellipse cx="250" cy="60" rx="35" ry="17"/></g>
      <ellipse cx="0" cy="270" rx="190" ry="80" fill="#1c1917"/><ellipse cx="200" cy="278" rx="230" ry="72" fill="#292524"/><ellipse cx="400" cy="268" rx="175" ry="78" fill="#1c1917"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="gNoche" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#172554"/><stop offset="100%" stopColor="#1e3a8a"/></linearGradient></defs>
      <rect width="400" height="260" fill="url(#gNoche)"/>
      {STARS_FEW.map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%3===0?1.8:1.2} fill="white" opacity={0.35+(i%6)*0.1}/>)}
      <circle cx="320" cy="55" r="36" fill="#fef9c3" opacity="0.15"/><circle cx="320" cy="55" r="28" fill="#fef9c3"/>
      <ellipse cx="0" cy="270" rx="190" ry="80" fill="#1e1b4b"/><ellipse cx="200" cy="278" rx="230" ry="72" fill="#172554"/><ellipse cx="400" cy="268" rx="175" ry="78" fill="#1e1b4b"/>
    </svg>
  );
}

/* ── Modal de avatar/título ───────────────────────────────────── */
function AvatarModal({ onClose, ownedItems, ownedTitulos, equippedAvatar, equippedTituloId, onEquipAvatar, onEquipTitulo }: {
  onClose: () => void; ownedItems: ShopItem[]; ownedTitulos: TituloItem[];
  equippedAvatar: string | null; equippedTituloId: string | null;
  onEquipAvatar: (e: string | null) => void; onEquipTitulo: (id: string | null) => void;
}) {
  const [tab, setTab] = useState<"avatar"|"titulo">("avatar");
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
      <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-10 shadow-2xl max-h-[70vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4"/>
        <h3 className="text-base font-bold text-slate-800 mb-4 text-center">Personalizar perfil</h3>
        <div className="flex gap-2 mb-4 bg-slate-100 rounded-xl p-1">
          {(["avatar","titulo"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab===t?"bg-white text-slate-800 shadow-sm":"text-slate-400"}`}>
              {t==="avatar"?"🖼️ Avatar":"🏷️ Título"}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {tab==="avatar" && (
            <div>
              {ownedItems.length===0 ? (
                <div className="text-center py-8"><p className="text-3xl mb-2">🛒</p><p className="text-sm text-slate-500">Sin artículos comprados aún</p></div>
              ) : (<>
                <button onClick={()=>onEquipAvatar(null)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 mb-2 active:scale-[0.98] ${!equippedAvatar?"border-teal-400 bg-teal-50":"border-transparent bg-slate-50"}`}>
                  <span className="text-3xl">🐿️</span><div className="text-left"><p className="text-xs font-bold text-slate-700">Ardilla (por defecto)</p></div>
                  {!equippedAvatar&&<span className="ml-auto text-teal-500 font-bold text-sm">✓</span>}
                </button>
                {ownedItems.map(item=>(
                  <button key={item.id} onClick={()=>onEquipAvatar(item.emoji)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 mb-2 active:scale-[0.98] ${equippedAvatar===item.emoji?"border-teal-400 bg-teal-50":"border-transparent bg-slate-50"}`}>
                    <span className="text-3xl">{item.emoji}</span><div className="text-left"><p className="text-xs font-bold">{item.name}</p></div>
                    {equippedAvatar===item.emoji&&<span className="ml-auto text-teal-500 font-bold text-sm">✓</span>}
                  </button>
                ))}
              </>)}
            </div>
          )}
          {tab==="titulo" && (
            <div>
              <button onClick={()=>onEquipTitulo(null)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 mb-2 active:scale-[0.98] ${!equippedTituloId?"border-teal-400 bg-teal-50":"border-transparent bg-slate-50"}`}>
                <span className="text-xl">—</span><p className="text-xs font-bold text-slate-700">Sin título</p>
                {!equippedTituloId&&<span className="ml-auto text-teal-500 font-bold text-sm">✓</span>}
              </button>
              {ownedTitulos.map(t=>(
                <button key={t.id} onClick={()=>onEquipTitulo(t.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 mb-2 active:scale-[0.98] ${equippedTituloId===t.id?"border-violet-400 bg-violet-50":"border-transparent bg-slate-50"}`}>
                  <span className="text-xl">🏷️</span><p className="flex-1 text-xs font-bold text-slate-700 text-left">{t.text}</p>
                  {equippedTituloId===t.id&&<span className="text-violet-500 font-bold text-sm">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-3 rounded-2xl bg-teal-600 text-white font-bold text-sm active:scale-95">Listo ✓</button>
      </div>
    </div>
  );
}

/* ── Panel de acción (comida / juguetes) ───────────────────────── */
function ActionPanel({ title, items, onSelect, onClose }: {
  title: string;
  items: { id: string; emoji: string; name: string; desc: string; disabled?: boolean; badge?: string }[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm"/>
      <div className="relative bg-white rounded-t-3xl px-5 pt-4 pb-10 shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3"/>
        <h3 className="text-sm font-bold text-slate-700 mb-3 text-center">{title}</h3>
        {items.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">🛒</p>
            <p className="text-sm text-slate-400">Sin artículos. Compra en la Tienda.</p>
            <Link href="/tienda" onClick={onClose} className="text-xs text-violet-600 underline mt-1 block">Ir a la tienda →</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {items.map(item => (
              <button key={item.id} disabled={item.disabled}
                onClick={() => { onSelect(item.id); onClose(); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all active:scale-[0.97] text-left ${
                  item.disabled ? "bg-slate-50 border-slate-100 opacity-50" : "bg-white border-slate-200 shadow-sm"
                }`}>
                <span className="text-3xl">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
                {item.badge && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">{item.badge}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Stat bar ──────────────────────────────────────────────────── */
function StatBar({ emoji, label, value, color }: { emoji: string; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] w-4 text-center">{emoji}</span>
      <span className="text-[9px] text-white/65 w-11 font-semibold">{label}</span>
      <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }}/>
      </div>
      <span className="text-[9px] text-white/60 w-5 text-right font-bold">{Math.round(value)}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   HOME
════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [timeSegment] = useState<TimeSegment>(getTimeSegment);
  const [xp,       setXp]       = useState(0);
  const [bellotas, setBellotas] = useState(0);
  const [loaded,   setLoaded]   = useState(false);

  /* Tamagotchi */
  const [tamaStats,     setTamaStats]     = useState<TamaStats | null>(null);
  const [visualState,   setVisualState]   = useState<TamaVisualState>("neutral");
  const [currentAction, setCurrentAction] = useState<"comiendo"|"durmiendo"|"jugando"|null>(null);
  const [showFeedPanel, setShowFeedPanel] = useState(false);
  const [showPlayPanel, setShowPlayPanel] = useState(false);

  /* Clothing */
  const [equippedCloth, setEquippedCloth] = useState<EquippedClothing>({});

  /* Avatar / título */
  const [equippedAvatar,   setEquippedAvatarState]   = useState<string | null>(null);
  const [equippedTituloId, setEquippedTituloIdState] = useState<string | null>(null);
  const [tituloText,       setTituloText]            = useState<string | null>(null);
  const [showModal,        setShowModal]             = useState(false);
  const [showMisiones,     setShowMisiones]          = useState(false);
  const [ownedItems,   setOwnedItems]   = useState<ShopItem[]>([]);
  const [ownedTitulos, setOwnedTitulos] = useState<TituloItem[]>([]);

  const loadProfile = useCallback(() => {
    getPlayerProfile()
      .then(p => { setXp(p.xp); setBellotas(p.bellotas); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const loadEquipped = useCallback(() => {
    const avatar = getEquippedAvatar();
    const titulo = getEquippedTitulo();
    setEquippedAvatarState(avatar);
    setEquippedTituloIdState(titulo);
    if (titulo) {
      const found = getShopTitulos().find(t => t.id === titulo);
      setTituloText(found?.text ?? null);
    } else { setTituloText(null); }
    const owned = getOwned();
    setOwnedItems(getShopBellotas().filter(i => owned.includes(i.id)));
    setOwnedTitulos(getShopTitulos().filter(t => owned.includes(t.id)));
    setEquippedCloth(getEquippedClothing());
  }, []);

  const loadTama = useCallback(() => {
    const stats = getTamaStats();
    setTamaStats(stats);
    getPregLog()
      .then(log => {
        const today = new Date();
        let streak = 0;
        for (let i = 0; i < 365; i++) {
          const d = new Date(today); d.setDate(d.getDate() - i);
          if (log[d.toISOString().slice(0,10)]) streak++; else break;
        }
        const cfg = getMascotConfig();
        // Use streak to boost animo threshold
        const s = getTamaStats();
        setTamaStats(s);
        const boosted = streak >= cfg.rachaFeliz
          ? { ...s, animo: Math.min(100, s.animo + 15) } : s;
        setVisualState(computeVisualState(boosted, currentAction ?? undefined));
      })
      .catch(() => {
        setVisualState(computeVisualState(stats, currentAction ?? undefined));
      });
  }, [currentAction]);

  useEffect(() => {
    pullFromCloud().finally(() => { loadProfile(); loadEquipped(); loadTama(); });
    const refresh = () => { loadProfile(); loadEquipped(); loadTama(); };
    const onVis   = () => { if (!document.hidden) refresh(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [loadProfile, loadEquipped, loadTama]);

  function triggerAction(action: "comiendo"|"durmiendo"|"jugando", durationMs = 3000) {
    setCurrentAction(action);
    setVisualState(action);
    setTimeout(() => {
      setCurrentAction(null);
      const s = getTamaStats(); setTamaStats(s);
      setVisualState(computeVisualState(s));
    }, durationMs);
  }

  function handleFeed(foodId: string) {
    const food = FOOD_CATALOG.find(f => f.id === foodId);
    if (!food) return;
    if (!consumeFood(foodId)) return;
    const s = feedTama(food.hambreRestore, food.animoBoost ?? 0);
    setTamaStats(s);
    triggerAction("comiendo", 2500);
  }

  function handleSleep() {
    const s = sleepTama(); setTamaStats(s);
    triggerAction("durmiendo", 3000);
  }

  function handlePlay(toyId: string) {
    const toy = TOY_CATALOG.find(t => t.id === toyId);
    if (!toy || isToyOnCooldown(toyId, toy.cooldownMinutes)) return;
    recordToyUse(toyId);
    const s = playTama(toy.animoBoost); setTamaStats(s);
    triggerAction("jugando", 2500);
  }

  function handleEquipAvatar(emoji: string | null) {
    setEquippedAvatar(emoji); setEquippedAvatarState(emoji);
  }
  function handleEquipTitulo(id: string | null) {
    setEquippedTitulo(id); setEquippedTituloIdState(id);
    if (id) { const found = ownedTitulos.find(t => t.id === id); setTituloText(found?.text ?? null); }
    else setTituloText(null);
  }

  const { level, currentXp, nextLevelXp, progress } = getLevelInfo(xp);
  const avatarEmoji = equippedAvatar ?? "🐿️";

  /* Food inventory for panel */
  const foodInv = getFoodInventory();
  const foodItems = FOOD_CATALOG.map(f => ({
    id: f.id, emoji: f.emoji, name: f.name,
    desc: `+${f.hambreRestore} hambre${f.animoBoost ? ` +${f.animoBoost} ánimo` : ""} · tienes ${foodInv[f.id] ?? 0}`,
    disabled: (foodInv[f.id] ?? 0) === 0,
  })).filter(f => (foodInv[f.id.replace("","")]  || (foodInv as Record<string,number>)[f.id] || 0) >= 0);

  /* Toy inventory for panel */
  const ownedToyIds = getOwnedToys();
  const toyItems = TOY_CATALOG.filter(t => ownedToyIds.includes(t.id)).map(t => {
    const cd = isToyOnCooldown(t.id, t.cooldownMinutes);
    return {
      id: t.id, emoji: t.emoji, name: t.name,
      desc: `+${t.animoBoost} ánimo`,
      disabled: cd,
      badge: cd ? `enfriando…` : undefined,
    };
  });

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-sky-100 via-teal-50 to-emerald-100 overflow-hidden">

      {/* ── Perfil ── */}
      <div className="shrink-0 px-5 pt-5">
        <div className="bg-white/75 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-md flex items-center gap-3">
          <button onClick={() => { loadEquipped(); setShowModal(true); }}
            className="shrink-0 w-14 h-14 rounded-full bg-teal-100 border-2 border-teal-300 flex items-center justify-center text-3xl shadow-sm active:scale-95 relative">
            {avatarEmoji}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[9px] shadow-sm">✏️</span>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base font-extrabold text-slate-700 shrink-0">Vicky</span>
                {tituloText && <span className="text-[11px] font-bold text-violet-500 truncate">· {tituloText}</span>}
              </div>
              <span className="flex items-center gap-1 text-sm font-bold text-amber-600 shrink-0">🌰 {loaded ? bellotas : "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[10px] font-bold text-white bg-teal-500 px-1.5 py-0.5 rounded-full">Nv.{level}</span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-700" style={{ width:`${Math.max(progress*100,3)}%` }}/>
              </div>
              <span className="shrink-0 text-[9px] text-slate-400">{loaded?`${currentXp}/${nextLevelXp} XP`:"—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Escena + chibi ── */}
      <div className="flex-1 min-h-0 px-5 py-2 flex flex-col">
        <div className="flex-1 min-h-0 relative rounded-3xl overflow-hidden shadow-xl border border-white/20">
          <div className="absolute inset-0"><SceneBg seg={timeSegment}/></div>
          <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{ backgroundImage:"radial-gradient(circle,rgba(0,0,0,1) 1px,transparent 1px)", backgroundSize:"3px 3px" }}/>
          <div className="absolute inset-0 pointer-events-none rounded-3xl" style={{ boxShadow:"inset 0 0 60px rgba(0,0,0,0.35)" }}/>

          {/* Iconos superiores */}
          <button onClick={() => setShowMisiones(true)}
            className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5 active:scale-95 border border-white/20">
            <span className="text-base">📋</span>
          </button>
          <Link href="/tienda"
            className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5 active:scale-95 border border-white/20">
            <span className="text-base">🛒</span>
            {loaded && <span className="text-[11px] font-bold text-white">{bellotas}🌰</span>}
          </Link>

          {/* Chibi + texto */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 pt-10 pb-28">
            <div className="text-center mb-1">
              <h1 className="text-2xl font-extrabold text-white tracking-tight"
                style={{ textShadow:"0 2px 12px rgba(0,0,0,0.6)" }}>¡Hola, Vicky!</h1>
              <p className="text-white/85 text-xs font-semibold"
                style={{ textShadow:"0 1px 6px rgba(0,0,0,0.5)" }}>{greeting()}</p>
            </div>
            <ChibiArdilla
              state={visualState}
              equipped={equippedCloth}
              catalog={CLOTHING_CATALOG}
              className="drop-shadow-2xl"
            />
            {/* Bocadillo */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-lg border border-white/60 max-w-[200px] mt-1">
              <p className="text-center text-xs font-semibold text-slate-700 leading-snug">
                {TAMA_MESSAGES[visualState]}
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="absolute bottom-12 left-3 right-3 z-10 flex gap-2">
            <button onClick={() => setShowFeedPanel(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-500/80 backdrop-blur-sm rounded-2xl border border-amber-300/50 active:scale-95 transition-transform">
              <span className="text-base">🍎</span>
              <span className="text-[11px] font-bold text-white">Comer</span>
            </button>
            <button onClick={handleSleep}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-500/80 backdrop-blur-sm rounded-2xl border border-indigo-300/50 active:scale-95 transition-transform">
              <span className="text-base">😴</span>
              <span className="text-[11px] font-bold text-white">Dormir</span>
            </button>
            <button onClick={() => setShowPlayPanel(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500/80 backdrop-blur-sm rounded-2xl border border-emerald-300/50 active:scale-95 transition-transform">
              <span className="text-base">🎾</span>
              <span className="text-[11px] font-bold text-white">Jugar</span>
            </button>
          </div>

          {/* Stat bars */}
          {tamaStats && (
            <div className="absolute bottom-2 left-3 right-3 z-10">
              <div className="bg-black/30 backdrop-blur-sm rounded-xl px-3 py-1.5 flex flex-col gap-1">
                <StatBar emoji="🍖" label="Hambre"  value={tamaStats.hambre}  color="#fbbf24"/>
                <StatBar emoji="⚡" label="Energía" value={tamaStats.energia} color="#818cf8"/>
                <StatBar emoji="🌸" label="Ánimo"   value={tamaStats.animo}   color="#f472b6"/>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Botones 2×2 ── */}
      <div className="shrink-0 px-5 pb-6 grid grid-cols-2 gap-2">
        <Link href="/registro" className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/80 border border-teal-200 text-teal-800 font-bold text-sm shadow-sm active:scale-95">
          <span className="text-xl">✏️</span> Registro
        </Link>
        <Link href="/formaciones" className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/80 border border-violet-200 text-violet-800 font-bold text-sm shadow-sm active:scale-95">
          <span className="text-xl">🎓</span> Ejercicios
        </Link>
        <Link href="/informacion" className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/80 border border-amber-200 text-amber-800 font-bold text-sm shadow-sm active:scale-95">
          <span className="text-xl">ℹ️</span> Información
        </Link>
        <Link href="/opciones" className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/80 border border-slate-200 text-slate-600 font-bold text-sm shadow-sm active:scale-95">
          <span className="text-xl">⚙️</span> Ajustes
        </Link>
      </div>

      {/* ── Modales ── */}
      {showModal && (
        <AvatarModal onClose={() => setShowModal(false)} ownedItems={ownedItems} ownedTitulos={ownedTitulos}
          equippedAvatar={equippedAvatar} equippedTituloId={equippedTituloId}
          onEquipAvatar={handleEquipAvatar} onEquipTitulo={handleEquipTitulo}/>
      )}
      {showMisiones && <MisionesModal onClose={() => setShowMisiones(false)}/>}
      {showFeedPanel && (
        <ActionPanel title="¿Qué le damos de comer?" items={foodItems}
          onSelect={handleFeed} onClose={() => setShowFeedPanel(false)}/>
      )}
      {showPlayPanel && (
        <ActionPanel title="¿Con qué jugamos?" items={toyItems.length > 0 ? toyItems : []}
          onSelect={handlePlay} onClose={() => setShowPlayPanel(false)}/>
      )}
    </div>
  );
}
