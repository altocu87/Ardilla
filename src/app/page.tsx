"use client";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { getPlayerProfile, getPregLog } from "@/lib/db";
import { pullFromCloud } from "@/lib/cloudsync";
import { getLevelInfo } from "@/lib/profile";
import {
  getShopTitulos, getShopAvatares,
  getOwned, getEquippedAvatar, setEquippedAvatar,
  getEquippedTitulo, setEquippedTitulo,
  type TituloItem, type AvatarItem,
} from "@/lib/shop";
import { getMascotConfig } from "@/lib/mascot";
import {
  getTamaStats, saveTamaStats, computeVisualState, feedTama, sleepTama, playTama,
  cureIllness, getContextualMessage, ILLNESS_INFO,
  type TamaStats, type TamaVisualState, type IllnessType, type MessageContext,
} from "@/lib/tamagotchi";
import { syncCacaIllness, getRegistroContext, type RegistroContext } from "@/lib/registro-sync";
import {
  getEquippedClothing, CLOTHING_CATALOG, getFoodInventory, FOOD_CATALOG, MEDICINE_CATALOG,
  getOwnedToys, TOY_CATALOG, isToyOnCooldown, recordToyUse, consumeFood,
  getEquippedToy,
  type EquippedClothing,
} from "@/lib/squirrel-shop";
import {
  getEvolutionData, tickDailyEvolution, recordTap, isNightTime,
  getEvolutionProgress, PHASE_INFO, type EvolutionPhase,
} from "@/lib/tama-evolution";
import { tryUnlock, type Achievement } from "@/lib/tama-achievements";
import ChibiArdilla from "@/components/ChibiArdilla";
import MisionesModal from "@/components/MisionesModal";
import TamaMiniGame from "@/components/TamaMiniGame";
import MemoryCardGame from "@/components/MemoryCardGame";
import SopaDeLetras from "@/components/SopaDeLetras";

/* ── Frases de bienvenida del caracol ───────────────────────────── */
const WELCOME_PHRASES = [
  /* Caracol */
  "Los caracoles llevamos nuestra casa a cuestas. Tú llevas tu fuerza. Absolutamente imponente. 🐌",
  "Aunque voy despacio, siempre llego. Y tú también llegas, Vicky. Siempre. 🐌",
  "Mi concha = tu zona de confort. Pero hoy volviste. Bravísima. 🐌",
  "Los grandes éxitos se construyen despacio. Como yo. Como tú. Sigue así. 🐌",
  "No soy rápido pero soy constante. Igual que tú, Vicky. Orgulloso de ti. 🐌",
  "¡Hoy vuelves! Lo sabía. Los caracoles tenemos instinto para las personas especiales. 🐌",
  "Yo dejo un rastro de brillo donde paso. Tú también, aunque no lo veas. 🐌",
  "Caracol de honor: llevas más racha que yo subiendo una montaña. Impresionante. 🐌",
  "Hoy el caracol se quita la concha en señal de respeto. Eso es mucho, ¿sabes? 🐌",
  "Mi velocidad máxima + tu energía de hoy = una combinación imbatible. 🐌",
  "Soy el caracol más orgulloso del bosque en este momento. Y es por ti. 🐌",
  "El caracol dice: despacio pero sin parar. Eso eres tú todos los días. 🐌",
  "He recorrido todo el jardín para decirte esto: eres increíble, Vicky. 🐌",
  "Los caracoles vivimos mucho tiempo. Y yo voy a estar aquí animándote siempre. 🐌",
  "Concha nueva desbloqueada: la de los campeones. Hoy te la mereces tú. 🐌",
  /* Ardilla */
  "La ardilla sabe que has vuelto. Y ya está dando saltos de alegría. 🐿️",
  "Bellota a bellota se hace el árbol más grande. Tú ya eres un árbol enorme, Vicky. 🐿️",
  "La ardilla guardó esta bellota especial para cuando aparecieras hoy. Toma. 🌰",
  "Ardilla nivel: muy orgullosa de tenerte aquí. Nivel máximo desbloqueado. 🐿️",
  "No todas las ardillas tienen a alguien como tú. Ella sí. Qué suerte tan grande. 🐿️",
  "La ardilla ha estado esperándote subida a su árbol favorito. Ya puede bajar feliz. 🐿️",
  "El bosque entero sabe que hoy has venido. Se nota el buen ambiente. 🌳",
  "La ardilla colecciona bellotas. Tú coleccionas días de esfuerzo. Los tuyos valen más. 🐿️",
  "Ardilla confidencial: cada vez que apareces, ella mejora un poco más. Magia pura. 🐿️",
  "La ardilla dice que eres la mejor cuidadora del bosque. Y la ardilla no miente. 🐿️",
  /* Gato */
  "Miau. El gato del bosque dice que eres absolutamente espectacular. 🐱",
  "Los gatos duermen 16 horas y siguen siendo majestuosos. Tú con lo que duermas ya eres una reina. 🐱",
  "El gato te mira fijo. No es acoso. Es admiración pura y dura. 🐱",
  "Miau = 'hoy también lo vas a petar, Vicky' en idioma gato. Traducción garantizada. 🐱",
  "El gato del bosque ha dejado un ronroneo especial justo aquí para ti. Shhh, escúchalo. 🐱",
  "Los gatos solo muestran afecto a personas especiales. Hoy el gato ronronea. Ya sabes. 🐱",
  "El gato ha ignorado a todos hoy menos a ti. Eso en el mundo felino es un oscar. 🐱",
  "Miau miau miau = 'Vicky, estoy muy orgulloso de ti' en gato bosquero. 🐱",
  "El gato se ha enrollado en tus pies. No te muevas. Momento sagrado. 🐱",
  "Los gatos tienen 9 vidas. Tú tienes una y la estás aprovechando de lujo. 🐱",
  /* Mixtas con todos */
  "El caracol, la ardilla y el gato del bosque han formado un comité de bienvenida. Para ti. ✨",
  "Informe oficial del bosque: Vicky apareció hoy. Estado del bosque: eufórico. 🌿",
  "Esta bellota es tuya. Te la has ganado solo por aparecer hoy. 🌰",
  "Hoy también aquí. Eso ya es mucho, Vicky. Más de lo que crees. ✨",
  "El bosque estaba esperando exactamente esto: que abrieras la app hoy. 🍃",
  "Datos oficiales: personas increíbles que han entrado hoy = 1. Esa eres tú. 📊",
  "El comité de animales del bosque ha votado por unanimidad: Vicky mola mucho. 🗳️",
  "Notificación del bosque: alguien genial acaba de llegar. Spoiler: eres tú. 🔔",
];

function pickWelcomePhrase(): string {
  return WELCOME_PHRASES[Math.floor(Math.random() * WELCOME_PHRASES.length)];
}

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
function AvatarModal({ onClose, avatarItems, ownedIds, ownedTitulos, equippedAvatar, equippedTituloId, onEquipAvatar, onEquipTitulo }: {
  onClose: () => void;
  avatarItems: AvatarItem[];
  ownedIds: string[];
  ownedTitulos: TituloItem[];
  equippedAvatar: string | null; equippedTituloId: string | null;
  onEquipAvatar: (id: string | null) => void; onEquipTitulo: (id: string | null) => void;
}) {
  const [tab, setTab] = useState<"avatar"|"titulo">("avatar");
  const availableAvatares = avatarItems.filter(av => (av.price ?? 0) === 0 || ownedIds.includes(av.id));
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
              <button onClick={()=>onEquipAvatar(null)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 mb-3 active:scale-[0.98] ${!equippedAvatar?"border-teal-400 bg-teal-50":"border-transparent bg-slate-50"}`}>
                <span className="text-3xl">🐿️</span>
                <div className="text-left"><p className="text-xs font-bold text-slate-700">Ardilla (por defecto)</p></div>
                {!equippedAvatar&&<span className="ml-auto text-teal-500 font-bold text-sm">✓</span>}
              </button>
              {availableAvatares.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-3xl mb-2">🛒</p>
                  <p className="text-sm text-slate-500">Sin avatares disponibles.<br/>Ve a la Tienda para conseguir más.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableAvatares.map(av=>(
                    <button key={av.id} onClick={()=>onEquipAvatar(av.id)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all active:scale-[0.97] ${equippedAvatar===av.id?"border-teal-400 bg-teal-50":"border-transparent bg-slate-50"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={av.img64} alt={av.name} className="w-14 h-14 rounded-lg object-cover border border-slate-200"/>
                      <p className="text-[9px] font-semibold text-slate-600 text-center leading-tight">{av.name}</p>
                      {equippedAvatar===av.id&&<span className="text-[8px] font-bold text-teal-500">✓ Activo</span>}
                    </button>
                  ))}
                </div>
              )}
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
function ActionPanel({ title, items, onSelect, onClose, extraActions }: {
  title: string;
  items: { id: string; emoji: string; name: string; desc: string; disabled?: boolean; badge?: string }[];
  onSelect: (id: string) => void;
  onClose: () => void;
  extraActions?: { label: string; emoji: string; onClick: () => void }[];
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm"/>
      <div className="relative bg-white rounded-t-3xl px-5 pt-4 pb-10 shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3"/>
        <h3 className="text-sm font-bold text-slate-700 mb-3 text-center">{title}</h3>
        {extraActions && extraActions.map((a, i) => (
          <button key={i} onClick={() => { a.onClick(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-3 mb-2 rounded-2xl bg-violet-500 text-white font-bold text-sm active:scale-95 shadow-md">
            <span className="text-lg">{a.emoji}</span>
            {a.label}
          </button>
        ))}
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

/* ── Stats compactos ───────────────────────────────────────────── */
function StatsRow({
  stats, evoPhase, onOpenMedicine,
}: {
  stats: TamaStats; evoPhase: EvolutionPhase; onOpenMedicine: () => void;
}) {
  const bars = [
    { emoji: "🍖", label: "Hambre",  value: stats.hambre,  color: "#f59e0b" },
    { emoji: "⚡", label: "Energía", value: stats.energia, color: "#818cf8" },
    { emoji: "🌸", label: "Ánimo",   value: stats.animo,   color: "#f472b6" },
  ];
  const evoProg   = getEvolutionProgress();
  const evoPct    = Math.min(100, (evoProg.daysFor / evoProg.daysNeeded) * 100);
  const phaseInfo = PHASE_INFO[evoPhase];
  const illnessInfo = stats.illness ? ILLNESS_INFO[stats.illness] : null;

  return (
    <div>
      {illnessInfo && (
        <button onClick={onOpenMedicine}
          className={`w-full flex items-center gap-1.5 mb-1.5 rounded-xl px-2 py-1.5 border active:scale-[0.98] transition-transform ${illnessInfo.badgeColor}`}>
          <span className="text-sm">{illnessInfo.emoji}</span>
          <span className="text-[10px] font-bold flex-1 text-left">{illnessInfo.name} · {illnessInfo.desc}</span>
          <span className="text-[9px] font-bold shrink-0">Curar →</span>
        </button>
      )}
      <div className="flex gap-2">
        {bars.map(b => (
          <div key={b.label} className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-slate-500 font-semibold">{b.emoji} {b.label}</span>
              <span className="text-[9px] font-bold text-slate-400">{Math.round(b.value)}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${b.value}%`, background: b.color }}/>
            </div>
          </div>
        ))}
      </div>
      {evoProg.nextPhase && (
        <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-100">
          <span className="text-[9px]">{phaseInfo.emoji}</span>
          <span className="text-[9px] text-slate-400 font-semibold shrink-0">Evolución</span>
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-violet-500 rounded-full transition-all duration-1000"
              style={{ width: `${evoPct}%` }}/>
          </div>
          <span className="text-[9px] text-slate-400 shrink-0">{evoProg.daysFor}/{evoProg.daysNeeded}d</span>
          <span className="text-[9px]">{PHASE_INFO[evoProg.nextPhase].emoji}</span>
        </div>
      )}
    </div>
  );
}

/* ── Medicine modal ─────────────────────────────────────────────── */
function MedicineModal({
  illness, onCure, onClose,
}: {
  illness: IllnessType; onCure: () => void; onClose: () => void;
}) {
  const [wrongId, setWrongId] = useState<string | null>(null);
  const illnessInfo = ILLNESS_INFO[illness];

  function handleSelect(medId: string) {
    if (medId === illnessInfo.medicineId) {
      onCure();
    } else {
      setWrongId(medId);
      setTimeout(() => setWrongId(null), 1200);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
      <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-10 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4"/>
        <div className={`rounded-2xl p-3 mb-4 border flex items-center gap-3 ${illnessInfo.badgeColor}`}>
          <span className="text-3xl">{illnessInfo.emoji}</span>
          <div>
            <p className="text-sm font-extrabold">{illnessInfo.name}</p>
            <p className="text-xs opacity-80">{illnessInfo.desc}</p>
          </div>
        </div>
        <p className="text-xs font-bold text-slate-600 mb-3 text-center">¿Qué medicina necesita? 🤔</p>
        {wrongId && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3 text-center">
            <p className="text-xs font-bold text-red-600">¡Esa no es la medicina adecuada! 😅</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {MEDICINE_CATALOG.map(med => (
            <button key={med.id} onClick={() => handleSelect(med.id)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all active:scale-[0.97] ${
                wrongId === med.id
                  ? "bg-red-50 border-red-300"
                  : "bg-white border-slate-200 shadow-sm"
              }`}>
              <span className="text-3xl">{med.emoji}</span>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-700">{med.name}</p>
                <p className="text-xs text-slate-400">{med.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Icono percha (Armario) ────────────────────────────────────── */
function HangerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 22 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M11 1.5 C13.5 1.5 14.5 3.5 13 5 C12.2 6 11 6.5 11 6.5"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M1.5 15 Q6.5 7.5 11 6.5 Q15.5 7.5 20.5 15"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <line x1="1.5" y1="15" x2="20.5" y2="15"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

/* ── Toast de logro ────────────────────────────────────────────── */
function AchievementToast({ ach }: { ach: Achievement }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
      style={{ animation: "slideDown 0.4s ease-out" }}>
      <div className="bg-amber-500 text-white rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3 min-w-[240px]">
        <span className="text-2xl">{ach.emoji}</span>
        <div>
          <p className="text-xs font-black">¡Logro desbloqueado!</p>
          <p className="text-sm font-bold">{ach.title}</p>
          <p className="text-[10px] opacity-80">+{ach.rewardBellotas} 🌰</p>
        </div>
      </div>
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
  const [showFeedPanel,     setShowFeedPanel]     = useState(false);
  const [showPlayPanel,     setShowPlayPanel]     = useState(false);
  const [showMiniGame,      setShowMiniGame]      = useState(false);
  const [showMemoryGame,    setShowMemoryGame]    = useState(false);
  const [showSopaLetras,    setShowSopaLetras]    = useState(false);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [tamaMessage,       setTamaMessage]       = useState("");

  /* Evolution & tickle */
  const [evolutionPhase, setEvolutionPhase] = useState<EvolutionPhase>("bebe");
  const [isTickling,     setIsTickling]     = useState(false);
  const [achToast,       setAchToast]       = useState<Achievement | null>(null);
  const tapTimesRef = useRef<number[]>([]);
  const achTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const regCtxRef   = useRef<MessageContext>({});

  /* Clothing & toy */
  const [equippedCloth, setEquippedCloth] = useState<EquippedClothing>({});
  const [equippedToyId, setEquippedToyId] = useState<string | null>(null);

  /* Avatar / título */
  const [equippedAvatar,   setEquippedAvatarState]   = useState<string | null>(null);
  const [equippedTituloId, setEquippedTituloIdState] = useState<string | null>(null);
  const [tituloText,       setTituloText]            = useState<string | null>(null);
  const [showModal,        setShowModal]             = useState(false);
  const [showMisiones,     setShowMisiones]          = useState(false);
  const [welcomePhrase,    setWelcomePhrase]         = useState<string | null>(null);
  const [ownedTitulos, setOwnedTitulos] = useState<TituloItem[]>([]);
  const [avatarItems,  setAvatarItems]  = useState<AvatarItem[]>([]);
  const [ownedIds,     setOwnedIds]     = useState<string[]>([]);

  function showAchievement(ach: Achievement) {
    if (achTimerRef.current) clearTimeout(achTimerRef.current);
    setAchToast(ach);
    achTimerRef.current = setTimeout(() => setAchToast(null), 3200);
  }

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
setOwnedTitulos(getShopTitulos().filter(t => (t.price ?? 0) === 0 || owned.includes(t.id)));
    const allAvatares = getShopAvatares();
    setAvatarItems(allAvatares);
    setOwnedIds(owned);
    setEquippedCloth(getEquippedClothing());
    setEquippedToyId(getEquippedToy());
  }, []);

  const loadTama = useCallback(() => {
    const stats = getTamaStats();
    setTamaStats(stats);

    /* Evolution tick (once per day) */
    const avgStats = (stats.hambre + stats.energia + stats.animo) / 3;
    const newPhase = tickDailyEvolution(avgStats);
    const evo = getEvolutionData();
    setEvolutionPhase(evo.phase);
    if (newPhase) {
      if (newPhase === "joven")   { const a = tryUnlock("grew_up"); if (a) showAchievement(a); }
      if (newPhase === "adulta")  { const a = tryUnlock("adult");   if (a) showAchievement(a); }
      if (newPhase === "anciana") { const a = tryUnlock("wise");    if (a) showAchievement(a); }
    }

    getPregLog()
      .then(log => {
        const today = new Date();
        let streak = 0;
        for (let i = 0; i < 365; i++) {
          const d = new Date(today); d.setDate(d.getDate() - i);
          if (log[d.toISOString().slice(0,10)]) streak++; else break;
        }
        const cfg = getMascotConfig();
        const s = getTamaStats();
        setTamaStats(s);
        const boosted = streak >= cfg.rachaFeliz
          ? { ...s, animo: Math.min(100, s.animo + 15) } : s;

        const isNight = isNightTime();
        const vs = isNight && !currentAction ? "durmiendo" : computeVisualState(boosted, currentAction ?? undefined);
        setVisualState(vs);
        setTamaMessage(getContextualMessage(vs, streak, regCtxRef.current));
      })
      .catch(() => {
        const isNight = isNightTime();
        const vs = isNight && !currentAction ? "durmiendo" : computeVisualState(stats, currentAction ?? undefined);
        setVisualState(vs);
        setTamaMessage(getContextualMessage(vs, 0, regCtxRef.current));
      });
  }, [currentAction]);

  /* Bienvenida del caracol — una vez por sesión */
  useEffect(() => {
    if (!sessionStorage.getItem("welcomed")) {
      sessionStorage.setItem("welcomed", "1");
      setWelcomePhrase(pickWelcomePhrase());
    }
  }, []);

  /* Sync registro context once on mount */
  useEffect(() => {
    getRegistroContext()
      .then((ctx: RegistroContext) => {
        const illness = getTamaStats().illness;
        regCtxRef.current = {
          tristeza:    ctx.tristeza,
          cacaIllness: illness === "caca" && (ctx.hasConstipation || ctx.hasDiarrhea),
        };
      })
      .catch(() => {});

    syncCacaIllness()
      .then(triggered => { if (triggered) loadTama(); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setTamaMessage(getContextualMessage(action, 0));
    setTimeout(() => {
      setCurrentAction(null);
      const s = getTamaStats(); setTamaStats(s);
      const isNight = isNightTime();
      const vs = isNight ? "durmiendo" : computeVisualState(s);
      setVisualState(vs);
      setTamaMessage(getContextualMessage(vs, 0));
    }, durationMs);
  }

  function handleFeed(foodId: string) {
    const food = FOOD_CATALOG.find(f => f.id === foodId);
    if (!food) return;
    if (!consumeFood(foodId)) return;
    let s;
    if (food.curesIllness && tamaStats?.illness === food.curesIllness) {
      s = cureIllness();
      const a = tryUnlock("cured_sick");
      if (a) showAchievement(a);
    } else {
      s = feedTama(food.hambreRestore, food.animoBoost ?? 0);
    }
    setTamaStats(s);
    triggerAction("comiendo", 2500);
  }

  function handleMedicineCure() {
    const s = cureIllness();
    setTamaStats(s);
    const a = tryUnlock("cured_sick");
    if (a) showAchievement(a);
    setShowMedicineModal(false);
    const vs = computeVisualState(s);
    setVisualState(vs);
    setTamaMessage("¡Me siento mucho mejor! 💖");
    setTimeout(() => setTamaMessage(getContextualMessage(vs, 0)), 3000);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleMemoryGameFinish(moves: number, _timeSeconds?: number) {
    const animoBoost = moves <= 12 ? 30 : moves <= 16 ? 22 : moves <= 20 ? 14 : moves <= 28 ? 8 : 4;
    const s = getTamaStats();
    s.animo     = Math.min(100, s.animo + animoBoost);
    s.lastSaved = new Date().toISOString();
    saveTamaStats(s);
    setTamaStats({ ...s });
    const vs = computeVisualState(s);
    setVisualState(vs);
    setTamaMessage(getContextualMessage(vs, 0));
    setShowMemoryGame(false);
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

  /* Tap directly on the squirrel */
  function tapSquirrel() {
    const now = Date.now();
    tapTimesRef.current = [...tapTimesRef.current.filter(t => now - t < 2000), now];

    /* Small animo boost */
    const s = getTamaStats();
    s.animo = Math.min(100, s.animo + 2);
    s.lastSaved = new Date().toISOString();
    saveTamaStats(s);
    setTamaStats({ ...s });

    /* Evolution tap record + achievements */
    const { totalTaps } = recordTap();
    const ach1 = tryUnlock("first_tap");
    if (ach1) showAchievement(ach1);
    if (totalTaps >= 50)  { const a = tryUnlock("tap_50");  if (a) showAchievement(a); }
    if (totalTaps >= 200) { const a = tryUnlock("tap_200"); if (a) showAchievement(a); }

    /* Tickle: 5 rapid taps */
    if (tapTimesRef.current.length >= 5) {
      tapTimesRef.current = [];
      setIsTickling(true);
      setVisualState("muy_feliz");
      const a = tryUnlock("tickle");
      if (a) showAchievement(a);
      setTimeout(() => {
        setIsTickling(false);
        const fresh = getTamaStats();
        const vs = computeVisualState(fresh);
        setVisualState(vs);
        setTamaMessage(getContextualMessage(vs, 0));
      }, 1500);
    }
  }

  function handleMiniGameFinish(score: number) {
    const animoBoost = score >= 20 ? 40 : score >= 15 ? 30 : score >= 10 ? 20 : score >= 5 ? 10 : 3;
    const s = getTamaStats();
    s.animo = Math.min(100, s.animo + animoBoost);
    s.lastSaved = new Date().toISOString();
    saveTamaStats(s);
    setTamaStats({ ...s });
    const vs = computeVisualState(s);
    setVisualState(vs);
    setTamaMessage(getContextualMessage(vs, 0));
    if (score >= 10) { const a = tryUnlock("minigame_5");   if (a) showAchievement(a); }
    if (score >= 20) { const a = tryUnlock("minigame_pro"); if (a) showAchievement(a); }
    setShowMiniGame(false);
  }

  async function handleSopaFinish(foundCount: number) {
    const bonus = foundCount >= 4 ? 30 : foundCount >= 3 ? 20 : foundCount >= 2 ? 10 : 5;
    const s = getTamaStats();
    s.animo = Math.min(100, s.animo + 15);
    s.lastSaved = new Date().toISOString();
    saveTamaStats(s); setTamaStats({ ...s });
    setVisualState(computeVisualState(s));
    setTamaMessage(getContextualMessage(computeVisualState(s), 0));
    try {
      const p = await import("@/lib/db").then(m => m.getPlayerProfile());
      await import("@/lib/db").then(m => m.upsertPlayerProfile({ bellotas: p.bellotas + bonus }));
      setBellotas(p.bellotas + bonus);
    } catch { /* noop */ }
    { const a = tryUnlock("memory_any"); if (a) showAchievement(a); }
    setShowSopaLetras(false);
  }

  function handleEquipAvatar(id: string | null) {
    setEquippedAvatar(id); setEquippedAvatarState(id);
  }
  function handleEquipTitulo(id: string | null) {
    setEquippedTitulo(id); setEquippedTituloIdState(id);
    if (id) { const found = ownedTitulos.find(t => t.id === id); setTituloText(found?.text ?? null); }
    else setTituloText(null);
  }

  const { level, currentXp, nextLevelXp, progress } = getLevelInfo(xp);
  const equippedAvatarItem = avatarItems.find(a => a.id === equippedAvatar) ?? null;
  const heldToyEmoji = equippedToyId
    ? TOY_CATALOG.find(t => t.id === equippedToyId)?.emoji ?? undefined
    : undefined;
  const totalEquipped = Object.keys(equippedCloth).length + (equippedToyId ? 1 : 0);

  const foodInv = getFoodInventory();
  const foodItems = FOOD_CATALOG.map(f => ({
    id: f.id, emoji: f.emoji, name: f.name,
    desc: `+${f.hambreRestore} hambre${f.animoBoost ? ` +${f.animoBoost} ánimo` : ""} · tienes ${foodInv[f.id] ?? 0}`,
    disabled: (foodInv[f.id] ?? 0) === 0,
  }));

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

  const phaseInfo = PHASE_INFO[evolutionPhase];

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-sky-100 via-teal-50 to-emerald-100 overflow-hidden">

      {/* Achievement toast */}
      {achToast && <AchievementToast ach={achToast}/>}

      {/* ── Perfil ── */}
      <div className="shrink-0 px-4 pt-4">
        <div className="bg-white/75 backdrop-blur-sm rounded-2xl px-4 py-2.5 shadow-md flex items-center gap-3">
          <button onClick={() => { loadEquipped(); setShowModal(true); }}
            className="shrink-0 relative w-12 h-12 active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-full bg-teal-100 border-2 border-teal-300 overflow-hidden flex items-center justify-center text-2xl shadow-sm">
              {equippedAvatarItem ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={equippedAvatarItem.img64} alt="avatar" className="w-full h-full object-cover"/>
              ) : (
                <span className="text-2xl">🐿️</span>
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[9px] shadow-sm">✏️</span>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-extrabold text-slate-700 shrink-0">Vicky</span>
                {tituloText && <span className="text-[10px] font-bold text-violet-500 truncate">· {tituloText}</span>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600">🌰 {loaded ? bellotas : "—"}</span>
                <Link href="/opciones" className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 text-base active:scale-95 transition-all" title="Ajustes">⚙️</Link>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[9px] font-bold text-white bg-teal-500 px-1.5 py-0.5 rounded-full">Nv.{level}</span>
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-700" style={{ width:`${Math.max(progress*100,3)}%` }}/>
              </div>
              <span className="shrink-0 text-[9px] text-slate-400">{loaded?`${currentXp}/${nextLevelXp}`:"—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Escena ── */}
      <div className="flex-1 min-h-0 px-4 py-2">
        <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-xl border border-white/20">
          <div className="absolute inset-0"><SceneBg seg={timeSegment}/></div>
          <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{ backgroundImage:"radial-gradient(circle,rgba(0,0,0,1) 1px,transparent 1px)", backgroundSize:"3px 3px" }}/>
          <div className="absolute inset-0 pointer-events-none rounded-3xl" style={{ boxShadow:"inset 0 0 60px rgba(0,0,0,0.35)" }}/>

          {/* Top icons — izquierda: misiones + logros + estadísticas */}
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
            <button onClick={() => setShowMisiones(true)}
              className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5 active:scale-95 border border-white/20">
              <span className="text-sm">📋</span>
            </button>
            <Link href="/logros"
              className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5 active:scale-95 border border-white/20">
              <span className="text-sm">🏆</span>
            </Link>
            <Link href="/estadisticas"
              className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5 active:scale-95 border border-white/20">
              <span className="text-sm">📊</span>
            </Link>
          </div>

          {/* Evolution phase badge */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/20">
            <span className="text-xs">{phaseInfo.emoji}</span>
            <span className="text-[10px] font-bold text-white">{phaseInfo.label}</span>
          </div>

          {/* Top icons — derecha: tienda + armario */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 items-end">
            <Link href="/tienda"
              className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5 active:scale-95 border border-white/20">
              <span className="text-sm">🛒</span>
              {loaded && <span className="text-[10px] font-bold text-white">{bellotas}🌰</span>}
            </Link>
            <Link href="/armario"
              className="relative flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full p-2 active:scale-95 border border-white/20">
              <HangerIcon className="w-[18px] h-[14px] text-white"/>
              {totalEquipped > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-pink-500 rounded-full text-[8px] font-extrabold text-white flex items-center justify-center px-1 shadow-sm">
                  {totalEquipped}
                </span>
              )}
            </Link>
          </div>

          {/* Chibi + greeting + bubble */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 pt-8 pb-3">
            <div className="text-center mb-0.5">
              <h1 className="text-xl font-extrabold text-white tracking-tight"
                style={{ textShadow:"0 2px 12px rgba(0,0,0,0.6)" }}>¡Hola, Vicky!</h1>
              <p className="text-white/85 text-[11px] font-semibold"
                style={{ textShadow:"0 1px 6px rgba(0,0,0,0.5)" }}>{greeting()}</p>
            </div>

            {/* Tappable squirrel */}
            <button
              onClick={tapSquirrel}
              className="active:scale-95 transition-transform duration-75 focus:outline-none"
              style={{ background: "none", border: "none", padding: 0 }}>
              <ChibiArdilla
                state={visualState}
                phase={evolutionPhase}
                equipped={equippedCloth}
                catalog={CLOTHING_CATALOG}
                isTickling={isTickling}
                illnessType={tamaStats?.illness ?? undefined}
                heldToyEmoji={heldToyEmoji}
                className="drop-shadow-2xl"
              />
            </button>

            {/* Speech bubble */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-1.5 shadow-lg border border-white/60 max-w-[210px]">
              <p className="text-center text-xs font-semibold text-slate-700 leading-snug">
                {tamaMessage || "..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats (outside the scene) ── */}
      {tamaStats && (
        <div className="shrink-0 px-4 py-1">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-3 py-2 border border-white/60 shadow-sm">
            <StatsRow stats={tamaStats} evoPhase={evolutionPhase} onOpenMedicine={() => setShowMedicineModal(true)}/>
          </div>
        </div>
      )}

      {/* ── Acción (outside the scene) ── */}
      <div className="shrink-0 px-4 pb-1 flex gap-2">
        <button onClick={() => setShowFeedPanel(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 rounded-2xl shadow-sm active:scale-95 transition-transform">
          <span className="text-base">🍎</span>
          <span className="text-xs font-bold text-white">Comer</span>
        </button>
        <button onClick={handleSleep}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-500 rounded-2xl shadow-sm active:scale-95 transition-transform">
          <span className="text-base">😴</span>
          <span className="text-xs font-bold text-white">Dormir</span>
        </button>
        <button onClick={() => setShowPlayPanel(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 rounded-2xl shadow-sm active:scale-95 transition-transform">
          <span className="text-base">🎾</span>
          <span className="text-xs font-bold text-white">Jugar</span>
        </button>
      </div>

      {/* ── Botones ── */}
      <div className="shrink-0 px-4 pb-5 grid grid-cols-3 gap-2">
        <Link href="/registro" className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white/80 border border-teal-200 text-teal-800 font-bold text-sm shadow-sm active:scale-95">
          <span className="text-base">✏️</span> Registro
        </Link>
        <Link href="/formaciones" className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white/80 border border-violet-200 text-violet-800 font-bold text-sm shadow-sm active:scale-95">
          <span className="text-base">🎓</span> Ejercicios
        </Link>
        <Link href="/informacion" className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white/80 border border-amber-200 text-amber-800 font-bold text-sm shadow-sm active:scale-95">
          <span className="text-base">ℹ️</span> Info
        </Link>
      </div>

      {/* ── Modales ── */}
      {showModal && (
        <AvatarModal onClose={() => setShowModal(false)}
          avatarItems={avatarItems} ownedIds={ownedIds}
          ownedTitulos={ownedTitulos}
          equippedAvatar={equippedAvatar} equippedTituloId={equippedTituloId}
          onEquipAvatar={handleEquipAvatar} onEquipTitulo={handleEquipTitulo}/>
      )}
      {showMisiones && <MisionesModal onClose={() => setShowMisiones(false)}/>}
      {showFeedPanel && (
        <ActionPanel title="¿Qué le damos de comer?" items={foodItems}
          onSelect={handleFeed} onClose={() => setShowFeedPanel(false)}/>
      )}
      {showPlayPanel && (
        <ActionPanel
          title="¿Con qué jugamos?"
          items={toyItems}
          onSelect={handlePlay}
          onClose={() => setShowPlayPanel(false)}
          extraActions={[
            { label: "¡Atrapa bellotas!", emoji: "🌰", onClick: () => setShowMiniGame(true) },
            { label: "Memoria animal",    emoji: "🃏", onClick: () => setShowMemoryGame(true) },
            { label: "Sopa de letras",    emoji: "🔤", onClick: () => setShowSopaLetras(true) },
          ]}
        />
      )}
      {showMiniGame && (
        <TamaMiniGame
          onFinish={handleMiniGameFinish}
          onClose={() => setShowMiniGame(false)}
        />
      )}
      {showMemoryGame && (
        <MemoryCardGame
          onFinish={handleMemoryGameFinish}
          onClose={() => setShowMemoryGame(false)}
        />
      )}
      {showSopaLetras && (
        <SopaDeLetras
          onFinish={handleSopaFinish}
          onClose={() => setShowSopaLetras(false)}
        />
      )}
      {showMedicineModal && tamaStats?.illness && (
        <MedicineModal
          illness={tamaStats.illness}
          onCure={handleMedicineCure}
          onClose={() => setShowMedicineModal(false)}
        />
      )}

      <style>{`
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);     opacity: 1; }
        }
        @keyframes snail-bounce {
          0%,100% { transform: translateY(0) rotate(-4deg); }
          50%      { transform: translateY(-10px) rotate(4deg); }
        }
        @keyframes welcome-in {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Modal bienvenida del caracol */}
      {welcomePhrase && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-6"
          style={{ background: "rgba(2,6,23,0.65)", backdropFilter: "blur(6px)" }}
          onClick={() => setWelcomePhrase(null)}
        >
          <div
            className="relative bg-white rounded-3xl shadow-2xl px-7 pt-8 pb-7 max-w-xs w-full text-center flex flex-col items-center gap-4"
            style={{ animation: "welcome-in 0.35s cubic-bezier(.34,1.56,.64,1) both" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Caracol animado */}
            <div style={{ animation: "snail-bounce 1.4s ease-in-out infinite" }}
              className="text-[80px] leading-none drop-shadow-lg select-none">
              🐌
            </div>

            <div>
              <p className="text-[11px] font-bold text-violet-400 uppercase tracking-widest mb-1">
                ¡Hola, Vicky!
              </p>
              <p className="text-sm font-semibold text-slate-700 leading-snug">
                {welcomePhrase}
              </p>
            </div>

            <button
              onClick={() => setWelcomePhrase(null)}
              className="mt-1 w-full py-3 rounded-2xl bg-violet-600 text-white font-bold text-sm active:scale-95 transition-transform shadow-md"
            >
              ¡Gracias, caracol! ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
