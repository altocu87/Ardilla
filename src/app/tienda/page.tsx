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
import {
  FOOD_CATALOG, CLOTHING_CATALOG, TOY_CATALOG,
  getFoodInventory, getOwnedClothing, getOwnedToys,
  addFood, addOwnedClothing, addOwnedToy,
  getEquippedClothing, toggleClothing,
  type EquippedClothing,
} from "@/lib/squirrel-shop";

type Tab = "bellotas" | "rata" | "avatares" | "titulos" | "comida" | "ropa" | "juguetes";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "bellotas",  label: "Bellotas",  emoji: "🌰" },
  { id: "rata",      label: "La Rata",   emoji: "🐀" },
  { id: "comida",    label: "Comida",    emoji: "🍎" },
  { id: "ropa",      label: "Ropa",      emoji: "👗" },
  { id: "juguetes",  label: "Juguetes",  emoji: "🎮" },
  { id: "avatares",  label: "Avatares",  emoji: "🖼️" },
  { id: "titulos",   label: "Títulos",   emoji: "🏷️" },
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

  // Squirrel shop
  const [foodInv,       setFoodInv]       = useState<Record<string,number>>({});
  const [ownedCloth,    setOwnedCloth]    = useState<string[]>([]);
  const [ownedToys,     setOwnedToys]     = useState<string[]>([]);
  const [equippedCloth, setEquippedCloth] = useState<EquippedClothing>({});

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
    setFoodInv(getFoodInventory());
    setOwnedCloth(getOwnedClothing());
    setOwnedToys(getOwnedToys());
    setEquippedCloth(getEquippedClothing());
  }, []);

  // Recarga títulos si el cloudsync actualiza localStorage después del montaje
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "shop_titulos" || e.key === null) {
        setTitulos(getShopTitulos());
      }
    }
    window.addEventListener("storage", onStorage);
    // Forzar recarga tras 800ms (tiempo estimado de cloudsync)
    const t = setTimeout(() => setTitulos(getShopTitulos()), 800);
    return () => { window.removeEventListener("storage", onStorage); clearTimeout(t); };
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

  async function buyTitulo(t: TituloItem) {
    const price = t.price ?? 0;
    if (owned.includes(t.id) || bellotas < price || buying) return;
    setBuying(t.id);
    try {
      const newBell = bellotas - price;
      await upsertPlayerProfile({ bellotas: newBell });
      const newOwned = [...owned, t.id];
      setOwned(newOwned);
      setOwnedState(newOwned);
      setBellotas(newBell);
      showToast(`¡Título "${t.text}" desbloqueado! 🏷️`);
    } catch (e) { console.error(e); }
    setBuying(null);
  }

  async function buyAvatarItem(av: AvatarItem) {
    const price = av.price ?? 0;
    if (price === 0 || owned.includes(av.id) || bellotas < price || buying) return;
    setBuying(av.id);
    try {
      const newBell = bellotas - price;
      await upsertPlayerProfile({ bellotas: newBell });
      const newOwned = [...owned, av.id];
      setOwned(newOwned);
      setOwnedState(newOwned);
      setBellotas(newBell);
      showToast(`¡Avatar "${av.name}" desbloqueado! 🖼️`);
    } catch (e) { console.error(e); }
    setBuying(null);
  }

  async function buySquirrelItem(id: string, price: number, type: "food"|"clothing"|"toy") {
    if (bellotas < price || buying) return;
    if (type === "clothing" && ownedCloth.includes(id)) return;
    if (type === "toy"      && ownedToys.includes(id))  return;
    setBuying(id);
    try {
      const newBell = bellotas - price;
      await upsertPlayerProfile({ bellotas: newBell });
      setBellotas(newBell);
      if (type === "food")     { addFood(id);          setFoodInv(getFoodInventory()); }
      if (type === "clothing") { addOwnedClothing(id); setOwnedCloth(getOwnedClothing()); }
      if (type === "toy")      { addOwnedToy(id);      setOwnedToys(getOwnedToys()); }
      const names: Record<string,string> = {
        ...Object.fromEntries(FOOD_CATALOG.map(f=>[f.id,f.name])),
        ...Object.fromEntries(CLOTHING_CATALOG.map(c=>[c.id,c.name])),
        ...Object.fromEntries(TOY_CATALOG.map(t=>[t.id,t.name])),
      };
      showToast(`¡${names[id] ?? id} comprado! ✓`);
    } catch(e) { console.error(e); }
    setBuying(null);
  }

  function handleToggleClothing(id: string) {
    const newEq = toggleClothing(id);
    setEquippedCloth({...newEq});
    showToast("Ropa actualizada ✓");
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
            <div className="rounded-2xl p-4 text-center relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,#1a0a00,#3b1a08,#5c2a10)" }}>
              {/* detalles decorativos */}
              <span className="absolute top-2 left-3 text-xs opacity-20 select-none">🌑🌑🌑</span>
              <span className="absolute bottom-2 right-3 text-xs opacity-20 select-none">🌑🌑🌑</span>
              <span className="text-5xl drop-shadow-lg">🐀</span>
              <p className="text-amber-200 font-extrabold text-base mt-1 tracking-wide">La Tienda de La Rata</p>
              <p className="text-amber-400/80 text-[11px] mt-1 italic leading-snug">
                &ldquo;Artículos carísimos para una rata muy caprichosa.<br/>
                ¿De verdad crees que te lo mereces?&rdquo;
              </p>
              <div className="mt-2 inline-block bg-amber-900/40 border border-amber-700/40 rounded-full px-3 py-0.5">
                <span className="text-[10px] text-amber-300 font-bold tracking-wider uppercase">⚠️ Precios de rata tacaña</span>
              </div>
            </div>
            {itemsRata.length === 0 ? (
              <EmptyShop emoji="🐀" text="La Rata aún no ha decidido qué vender. Añade artículos en Ajustes." />
            ) : itemsRata.map(item => (
              <ItemCard key={item.id} item={item} accentGrad="from-amber-900 to-stone-800" />
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
                  const price = av.price ?? 0;
                  const isOwned = price === 0 || owned.includes(av.id);
                  const canAfford = bellotas >= price;
                  const isEq = eqAvatar === av.id;
                  const isBuying = buying === av.id;
                  return (
                    <div key={av.id} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                      isEq ? "border-violet-500 bg-violet-50 shadow-md shadow-violet-200"
                      : "border-slate-200 bg-white"
                    }`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={av.img64} alt={av.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200"/>
                      <p className="text-[10px] font-semibold text-slate-600 text-center leading-tight">{av.name}</p>
                      {price > 0 && <span className="text-[9px] font-bold text-amber-600">🌰 {price}</span>}
                      {isEq && <span className="text-[9px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded-full">Equipado ✓</span>}
                      {isOwned ? (
                        <button onClick={() => equipAvatar(av.id)}
                          className={`w-full px-2 py-1 rounded-xl text-[10px] font-bold active:scale-95 transition-all ${
                            isEq ? "bg-violet-200 text-violet-800" : "bg-violet-100 text-violet-700"
                          }`}>
                          {isEq ? "Desequipar" : "Equipar"}
                        </button>
                      ) : (
                        <button onClick={() => buyAvatarItem(av)} disabled={!canAfford || !!isBuying}
                          className={`w-full px-2 py-1 rounded-xl text-[10px] font-bold active:scale-95 transition-all ${
                            canAfford ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-400"
                          }`}>
                          {isBuying ? "…" : canAfford ? "Comprar" : "Sin 🌰"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: COMIDA ══ */}
        {tab === "comida" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-400 px-1">Dale de comer a la ardilla 🌰 · se consume al usarla desde inicio</p>
            {FOOD_CATALOG.map(food => {
              const qty      = foodInv[food.id] ?? 0;
              const canAfford = bellotas >= food.price;
              const isBuying  = buying === food.id;
              return (
                <div key={food.id} className="rounded-2xl border p-4 shadow-sm bg-white">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center text-2xl shadow-sm shrink-0">
                      {food.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-700">{food.name}</p>
                        {qty > 0 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">×{qty} en mochila</span>}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{food.desc}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">+{food.hambreRestore} hambre{food.animoBoost ? ` · +${food.animoBoost} ánimo` : ""}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-extrabold text-amber-700">🌰 {food.price}</span>
                        <button onClick={() => buySquirrelItem(food.id, food.price, "food")} disabled={!canAfford || !!isBuying}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold active:scale-95 ${canAfford ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md" : "bg-slate-100 text-slate-400"}`}>
                          {isBuying ? "…" : canAfford ? "Comprar" : "Sin 🌰"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ TAB: ROPA ══ */}
        {tab === "ropa" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-400 px-1">Compra ropa y equípasela a la ardilla · se verá en la pantalla principal</p>
            {CLOTHING_CATALOG.map(item => {
              const owned     = ownedCloth.includes(item.id);
              const equipped  = equippedCloth[item.slot] === item.id;
              const canAfford = bellotas >= item.price;
              const isBuying  = buying === item.id;
              return (
                <div key={item.id} className={`rounded-2xl border-2 p-4 shadow-sm bg-white transition-all ${equipped ? "border-violet-300 bg-violet-50" : "border-transparent"}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm shrink-0 border border-slate-100"
                      style={{ background: item.color + "22" }}>
                      {item.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-slate-700">{item.name}</p>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full capitalize">{item.slot}</span>
                        {equipped && <span className="text-[9px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded-full">Puesta ✓</span>}
                      </div>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-extrabold text-amber-700">🌰 {item.price}</span>
                        {!owned ? (
                          <button onClick={() => buySquirrelItem(item.id, item.price, "clothing")} disabled={!canAfford || !!isBuying}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold active:scale-95 ${canAfford ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md" : "bg-slate-100 text-slate-400"}`}>
                            {isBuying ? "…" : canAfford ? "Comprar" : "Sin 🌰"}
                          </button>
                        ) : (
                          <button onClick={() => handleToggleClothing(item.id)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold active:scale-95 ${equipped ? "bg-violet-200 text-violet-800" : "bg-violet-100 text-violet-700"}`}>
                            {equipped ? "Quitar" : "Poner"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ TAB: JUGUETES ══ */}
        {tab === "juguetes" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-400 px-1">Usa los juguetes desde la pantalla principal para subir el ánimo</p>
            {TOY_CATALOG.map(toy => {
              const owned     = ownedToys.includes(toy.id);
              const canAfford = bellotas >= toy.price;
              const isBuying  = buying === toy.id;
              return (
                <div key={toy.id} className={`rounded-2xl border p-4 shadow-sm bg-white ${owned ? "opacity-70" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-2xl shadow-sm shrink-0">
                      {toy.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-700">{toy.name}</p>
                        {owned && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">Tuyo ✓</span>}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{toy.desc}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">+{toy.animoBoost} ánimo · recarga {toy.cooldownMinutes} min</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-extrabold text-amber-700">🌰 {toy.price}</span>
                        <button onClick={() => buySquirrelItem(toy.id, toy.price, "toy")} disabled={owned || !canAfford || !!isBuying}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold active:scale-95 ${
                            owned ? "bg-slate-100 text-slate-400 cursor-default"
                            : canAfford ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md"
                            : "bg-slate-100 text-slate-400"}`}>
                          {isBuying ? "…" : owned ? "✓ Tuyo" : canAfford ? "Comprar" : "Sin 🌰"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ TAB: TÍTULOS ══ */}
        {tab === "titulos" && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-400 px-1">Compra y equipa títulos para Vicky</p>
            {titulos.length === 0 ? (
              <EmptyShop emoji="🏷️" text="Cargando títulos…" />
            ) : titulos.map(t => {
              const price = t.price ?? 0;
              const isOwned = price === 0 || owned.includes(t.id);
              const canAfford = bellotas >= price;
              const isEq = eqTitulo === t.id;
              const isBuying = buying === t.id;
              return (
                <div key={t.id} className={`rounded-2xl border-2 px-4 py-3 bg-white transition-all ${
                  isEq ? "border-amber-400 bg-amber-50 shadow-md" : "border-slate-200"
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-bold block truncate ${isEq ? "text-amber-800" : "text-slate-700"}`}>{t.text}</span>
                      {price > 0 && <span className="text-xs font-bold text-amber-600">🌰 {price}</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isEq && <span className="text-[9px] font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">Equipado ✓</span>}
                      {!isOwned ? (
                        <button onClick={() => buyTitulo(t)} disabled={!canAfford || !!isBuying}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                            canAfford ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md" : "bg-slate-100 text-slate-400"
                          }`}>
                          {isBuying ? "…" : canAfford ? "Comprar" : "Sin 🌰"}
                        </button>
                      ) : (
                        <button onClick={() => equipTitulo(t.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                            isEq ? "bg-amber-200 text-amber-800" : "bg-violet-100 text-violet-700"
                          }`}>
                          {isEq ? "Desequipar" : "Equipar"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
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
