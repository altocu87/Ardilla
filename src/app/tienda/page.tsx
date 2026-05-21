"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getPlayerProfile, upsertPlayerProfile } from "@/lib/db";
import { getLevelInfo } from "@/lib/profile";
import {
  getShopBellotas, getShopRata, getShopAvatares, getShopTitulos,
  getOwned, setOwned,
  getEquippedAvatar, setEquippedAvatar,
  getEquippedTitulo, setEquippedTitulo,
  ShopItem, AvatarItem, TituloItem,
} from "@/lib/shop";

type Tab = "bellotas" | "rata" | "avatares" | "titulos";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "bellotas", label: "Bellotas",  emoji: "🌰" },
  { id: "rata",     label: "La Rata",   emoji: "🐀" },
  { id: "avatares", label: "Avatares",  emoji: "🖼️" },
  { id: "titulos",  label: "Títulos",   emoji: "🏷️" },
];

const EARN_ROWS = [
  { emoji: "🐿️", label: "Registro diario",    xp: 30, bell: 5   },
  { emoji: "🌸", label: "Registro emocional", xp: 20, bell: 4   },
  { emoji: "💩", label: "Registro caca",      xp: 15, bell: 3   },
  { emoji: "🔥", label: "Racha 3 días",       xp: 0,  bell: 10  },
  { emoji: "🏅", label: "Racha 7 días",       xp: 50, bell: 25  },
  { emoji: "🥈", label: "Racha 14 días",      xp: 100,bell: 50  },
  { emoji: "🥇", label: "Racha 30 días",      xp: 200,bell: 100 },
];

export default function Tienda() {
  const [tab,       setTab]       = useState<Tab>("bellotas");
  const [bellotas,  setBellotas]  = useState(0);
  const [xp,        setXp]        = useState(0);
  const [loaded,    setLoaded]    = useState(false);
  const [owned,     setOwnedState] = useState<string[]>([]);
  const [eqAvatar,  setEqAvatar]  = useState<string | null>(null);
  const [eqTitulo,  setEqTitulo]  = useState<string | null>(null);
  const [buying,    setBuying]    = useState<string | null>(null);
  const [toast,     setToast]     = useState<string | null>(null);
  const [showEarn,  setShowEarn]  = useState(false);

  // shop items
  const [itemsBell, setItemsBell]   = useState<ShopItem[]>([]);
  const [itemsRata, setItemsRata]   = useState<ShopItem[]>([]);
  const [avatares,  setAvatares]    = useState<AvatarItem[]>([]);
  const [titulos,   setTitulos]     = useState<TituloItem[]>([]);

  useEffect(() => {
    getPlayerProfile()
      .then(p => { setBellotas(p.bellotas); setXp(p.xp); setLoaded(true); })
      .catch(() => setLoaded(true));
    setOwnedState(getOwned());
    setEqAvatar(getEquippedAvatar());
    setEqTitulo(getEquippedTitulo());
    setItemsBell(getShopBellotas());
    setItemsRata(getShopRata());
    setAvatares(getShopAvatares());
    setTitulos(getShopTitulos());
  }, []);

  const { level } = getLevelInfo(xp);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function buyItem(item: ShopItem) {
    if (owned.includes(item.id) || bellotas < item.price || buying) return;
    setBuying(item.id);
    try {
      const newBell = bellotas - item.price;
      await upsertPlayerProfile({ bellotas: newBell });
      const newOwned = [...owned, item.id];
      setOwned(newOwned);
      setOwnedState(newOwned);
      setBellotas(newBell);
      showToast(`¡${item.name} desbloqueado! ${item.emoji}`);
    } catch (e) { console.error(e); }
    setBuying(null);
  }

  function equipAvatar(id: string) {
    const newId = eqAvatar === id ? null : id;
    setEquippedAvatar(newId);
    setEqAvatar(newId);
    showToast(newId ? "Avatar equipado ✓" : "Avatar desequipado");
  }

  function equipTitulo(id: string) {
    const newId = eqTitulo === id ? null : id;
    setEquippedTitulo(newId);
    setEqTitulo(newId);
    showToast(newId ? "Título equipado ✓" : "Título desequipado");
  }

  // ── shared item card ──────────────────────────────────────────────────────
  function ItemCard({ item, accentGrad }: { item: ShopItem; accentGrad: string }) {
    const isOwned   = owned.includes(item.id);
    const canAfford = bellotas >= item.price;
    const isBuying  = buying === item.id;
    return (
      <div className={`rounded-2xl border p-4 shadow-sm bg-white transition-opacity ${isOwned ? "opacity-60" : ""}`}>
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accentGrad} flex items-center justify-center text-2xl shadow-sm shrink-0`}>
            {item.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-700 leading-tight">{item.name}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="flex items-center gap-1 text-sm font-extrabold text-amber-700">
                🌰 {item.price}
              </span>
              <button
                onClick={() => buyItem(item)}
                disabled={isOwned || !canAfford || !!isBuying}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  isOwned   ? "bg-slate-100 text-slate-400 cursor-default"
                  : canAfford ? `bg-gradient-to-br ${accentGrad} text-white shadow-md`
                  : "bg-slate-100 text-slate-400 cursor-default"
                }`}
              >
                {isBuying ? "…" : isOwned ? "✓ Tuyo" : canAfford ? "Comprar" : "Sin 🌰"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: "linear-gradient(160deg,#f5f3ff 0%,#fdf4ff 50%,#fef9ee 100%)" }}>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-sm border-b border-white/60 shadow-sm">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-lg">←</Link>
              <div>
                <h1 className="text-base font-bold text-slate-800 leading-tight">Tienda de recompensas</h1>
                <p className="text-[10px] text-slate-400">Nv.{level} · {loaded ? bellotas : "—"} 🌰</p>
              </div>
            </div>
            <button onClick={() => setShowEarn(v => !v)}
              className="text-[10px] font-semibold text-violet-600 bg-violet-50 px-2 py-1 rounded-full">
              {showEarn ? "Ocultar" : "¿Cómo ganar 🌰?"}
            </button>
          </div>

          {/* Cómo ganar bellotas (colapsable) */}
          {showEarn && (
            <div className="px-5 pb-3">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex flex-col gap-1.5">
                {EARN_ROWS.map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{r.emoji}</span>
                      <span className="text-xs text-slate-600 font-medium">{r.label}</span>
                    </div>
                    <div className="flex gap-1.5">
                      {r.xp > 0 && <span className="text-[9px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded-full">+{r.xp} XP</span>}
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">+{r.bell} 🌰</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex px-5 pb-2 gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  tab === t.id
                    ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                    : "bg-white text-slate-500 border-slate-200"
                }`}>
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-3">

        {/* ══ TAB: BELLOTAS ══ */}
        {tab === "bellotas" && (
          <>
            <p className="text-xs text-slate-400 px-1">Artículos de la Tienda de Bellotas</p>
            {itemsBell.length === 0 ? (
              <EmptyShop emoji="🌰" text="Aún no hay artículos. Añádelos en Ajustes." />
            ) : itemsBell.map(item => (
              <ItemCard key={item.id} item={item} accentGrad="from-amber-400 to-orange-500" />
            ))}
          </>
        )}

        {/* ══ TAB: LA RATA ══ */}
        {tab === "rata" && (
          <div className="flex flex-col gap-3">
            {/* Banner temático */}
            <div className="rounded-2xl p-4 text-center"
              style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81,#4c1d95)" }}>
              <span className="text-4xl">🐀</span>
              <p className="text-white font-extrabold mt-1">Tienda de La Rata</p>
              <p className="text-violet-300 text-xs mt-0.5">Artículos misteriosos y especiales</p>
            </div>
            {itemsRata.length === 0 ? (
              <EmptyShop emoji="🐀" text="Aún no hay artículos de La Rata. Añádelos en Ajustes." />
            ) : itemsRata.map(item => (
              <ItemCard key={item.id} item={item} accentGrad="from-violet-600 to-purple-800" />
            ))}
          </div>
        )}

        {/* ══ TAB: AVATARES ══ */}
        {tab === "avatares" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-400 px-1">Toca un avatar para equiparlo</p>
            {avatares.length === 0 ? (
              <EmptyShop emoji="🖼️" text="Aún no hay avatares. Añádelos en Ajustes." />
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {avatares.map(av => {
                  const isEq = eqAvatar === av.id;
                  return (
                    <button key={av.id} onClick={() => equipAvatar(av.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-95 ${
                        isEq ? "border-violet-500 bg-violet-50 shadow-md shadow-violet-200" : "border-slate-200 bg-white"
                      }`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={av.img64} alt={av.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200"/>
                      <p className="text-[10px] font-semibold text-slate-600 text-center leading-tight">{av.name}</p>
                      {isEq && <span className="text-[9px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded-full">Equipado ✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: TÍTULOS ══ */}
        {tab === "titulos" && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-400 px-1">Toca un título para equiparlo</p>
            {titulos.length === 0 ? (
              <EmptyShop emoji="🏷️" text="Aún no hay títulos. Añádelos en Ajustes." />
            ) : titulos.map(t => {
              const isEq = eqTitulo === t.id;
              return (
                <button key={t.id} onClick={() => equipTitulo(t.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                    isEq ? "border-amber-400 bg-amber-50 shadow-md" : "border-slate-200 bg-white"
                  }`}>
                  <span className={`text-sm font-bold ${isEq ? "text-amber-800" : "text-slate-700"}`}>{t.text}</span>
                  {isEq && <span className="text-[9px] font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full shrink-0">Equipado ✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}

function EmptyShop({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <span className="text-5xl opacity-40">{emoji}</span>
      <p className="text-sm text-slate-400">{text}</p>
      <Link href="/opciones" className="text-xs text-violet-600 underline underline-offset-2">
        Ir a Ajustes →
      </Link>
    </div>
  );
}
