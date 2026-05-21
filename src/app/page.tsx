"use client";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { getPlayerProfile } from "@/lib/db";
import { pullFromCloud } from "@/lib/cloudsync";
import { getLevelInfo } from "@/lib/profile";
import {
  getShopBellotas, getShopTitulos,
  getOwned, getEquippedAvatar, setEquippedAvatar,
  getEquippedTitulo, setEquippedTitulo,
  type ShopItem, type TituloItem,
} from "@/lib/shop";

const ANIMALS = [
  { emoji: "🐌", size: "text-4xl", dur: "2.2s", delay: "0s" },
  { emoji: "🐿️", size: "text-5xl", dur: "1.9s", delay: "0.3s" },
  { emoji: "🐱", size: "text-5xl", dur: "2.0s", delay: "0.5s" },
  { emoji: "🐈", size: "text-6xl", dur: "2.4s", delay: "0.7s" },
  { emoji: "🐈‍⬛", size: "text-7xl", dur: "2.1s", delay: "1.0s" },
];

function greeting() {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return "Buenos días ☀️";
  if (h >= 14 && h < 21) return "Buenas tardes 🌤️";
  return "Buenas noches 🌙";
}

/** Bellota iridiscente pequeña para el botón de tienda */
function AcornSmall() {
  return (
    <>
      <style>{`
        @keyframes hue-crystal {
          0%   { filter: hue-rotate(0deg)   saturate(2.4) brightness(1.3); }
          100% { filter: hue-rotate(360deg) saturate(2.4) brightness(1.3); }
        }
      `}</style>
      <span style={{ animation: "hue-crystal 3s linear infinite", display: "inline-block" }}>
        <svg viewBox="0 0 28 38" width="22" height="30">
          <ellipse cx="14" cy="11" rx="12" ry="5.5" fill="#7dd3fc"/>
          {[6,9,12,15,18,21].map(x => (
            <line key={x} x1={x} y1="6" x2={x+2} y2="16" stroke="#38bdf8" strokeWidth="1.4" opacity="0.7"/>
          ))}
          <ellipse cx="14" cy="15.5" rx="12" ry="2.5" fill="#0ea5e9" opacity="0.8"/>
          <line x1="14" y1="5.5" x2="14" y2="2" stroke="#0369a1" strokeWidth="2" strokeLinecap="round"/>
          <ellipse cx="14" cy="28" rx="10" ry="12" fill="#818cf8"/>
          <ellipse cx="9" cy="23" rx="3" ry="4.5" fill="white" fillOpacity="0.35" transform="rotate(-20 9 23)"/>
          <ellipse cx="14" cy="37" rx="4" ry="2" fill="white" fillOpacity="0.2"/>
          <circle cx="24" cy="10" r="1.5" fill="#fef08a" opacity="0.95"/>
          <circle cx="2"  cy="20" r="1"   fill="#f0abfc" opacity="0.9"/>
        </svg>
      </span>
    </>
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
  const [xp,       setXp]       = useState(0);
  const [bellotas, setBellotas] = useState(0);
  const [loaded,   setLoaded]   = useState(false);

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

  useEffect(() => {
    // 1) Pull desde Supabase ANTES de cargar el perfil local → fuente de verdad
    pullFromCloud().finally(() => { loadProfile(); loadEquipped(); });

    // Refresca XP/bellotas al volver a la página (después de una práctica o registro)
    const refresh = () => { loadProfile(); loadEquipped(); };
    const onVis   = () => { if (!document.hidden) refresh(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [loadProfile, loadEquipped]);

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

      {/* ── ZONA SUPERIOR: perfil + acceso tienda ── */}
      <div className="shrink-0 px-5 pt-5 flex flex-col gap-2">

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

        {/* Acceso rápido a la Tienda */}
        <Link href="/tienda"
          className="flex items-center justify-between px-4 py-2 rounded-xl active:scale-95 transition-transform"
          style={{ background: "linear-gradient(90deg,#6366f1,#a855f7,#ec4899)" }}>
          <div className="flex items-center gap-2">
            <AcornSmall />
            <span className="text-white font-bold text-sm">Tienda de recompensas</span>
          </div>
          <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
            <span className="text-white text-xs font-bold">🌰 {loaded ? bellotas : "—"}</span>
          </div>
        </Link>
      </div>

      {/* ── SALUDO + ANIMALES ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-700 tracking-tight mb-1">¡Hola, Vicky!</h1>
          <p className="text-slate-400 text-sm font-medium">{greeting()}</p>
        </div>
        <div className="flex items-end justify-center gap-4 w-full px-2">
          {ANIMALS.map((a, i) => (
            <span key={i} className={`${a.size} select-none drop-shadow-sm`}
              style={{ display: "inline-block", animation: `bounce ${a.dur} ease-in-out infinite`, animationDelay: a.delay }}>
              {a.emoji}
            </span>
          ))}
        </div>
      </div>

      {/* ── BOTONES PRINCIPALES ── */}
      <div className="shrink-0 px-5 pb-10 flex flex-col gap-3">
        <Link href="/registro"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-3xl bg-teal-500 text-white font-bold text-xl shadow-lg shadow-teal-200 active:scale-95 transition-transform">
          <span className="text-2xl">✏️</span> Registro
        </Link>
        <Link href="/formaciones"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-3xl bg-violet-500 text-white font-bold text-xl shadow-lg shadow-violet-200 active:scale-95 transition-transform">
          <span className="text-2xl">🎓</span> Ejercicios
        </Link>
        <Link href="/informacion"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-3xl bg-amber-400 text-white font-bold text-xl shadow-lg shadow-amber-200 active:scale-95 transition-transform">
          <span className="text-2xl">ℹ️</span> Información
        </Link>
        <Link href="/opciones"
          className="flex items-center justify-center gap-3 w-full py-3 rounded-3xl bg-slate-500 text-white font-bold text-base shadow-md shadow-slate-200 active:scale-95 transition-transform">
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
    </div>
  );
}
