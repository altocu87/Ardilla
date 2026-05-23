"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import ChibiArdilla from "@/components/ChibiArdilla";
import {
  CLOTHING_CATALOG, TOY_CATALOG,
  getOwnedClothing, getDayClothing, setDayClothing, toggleDayClothing,
  getNightClothing, setNightClothing, toggleNightClothing,
  getOwnedToys, getEquippedToy, setEquippedToy,
  SLEEP_ITEM_IDS, SLEEP_ITEM_MAX_NIGHTS, getSleepItemNights,
  type EquippedClothing, type ClothingSlot,
} from "@/lib/squirrel-shop";
import { isNightTime } from "@/lib/tama-evolution";

const SLOT_INFO: Record<ClothingSlot, { label: string; emoji: string }> = {
  head:  { label: "Cabeza", emoji: "👑" },
  neck:  { label: "Cuello", emoji: "🧣" },
  body:  { label: "Cuerpo", emoji: "🧥" },
  eyes:  { label: "Ojos",   emoji: "👓" },
};
const SLOTS: ClothingSlot[] = ["head", "neck", "body", "eyes"];

type SetTab = "day" | "night";

export default function Armario() {
  const [tab,          setTab]          = useState<SetTab>(() => isNightTime() ? "night" : "day");
  const [ownedCloth,   setOwnedCloth]   = useState<string[]>([]);
  const [dayEq,        setDayEq]        = useState<EquippedClothing>({});
  const [nightEq,      setNightEq]      = useState<EquippedClothing>({});
  const [ownedToys,    setOwnedToys]    = useState<string[]>([]);
  const [equippedToy,  setEquippedToyState] = useState<string | null>(null);
  const [toast,        setToast]        = useState<string | null>(null);

  useEffect(() => {
    setOwnedCloth(getOwnedClothing());
    setDayEq(getDayClothing());
    setNightEq(getNightClothing());
    setOwnedToys(getOwnedToys());
    setEquippedToyState(getEquippedToy());
  }, []);

  const equippedCloth = tab === "day" ? dayEq : nightEq;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  function handleToggleClothing(id: string) {
    const item = CLOTHING_CATALOG.find(c => c.id === id);
    if (!item) return;
    if (tab === "day") {
      const newEq = toggleDayClothing(id);
      setDayEq({ ...newEq });
      showToast(Object.values(newEq).includes(id) ? `${item.emoji} ${item.name} → día ✓` : "Quitado del set de día");
    } else {
      const newEq = toggleNightClothing(id);
      setNightEq({ ...newEq });
      showToast(Object.values(newEq).includes(id) ? `${item.emoji} ${item.name} → noche ✓` : "Quitado del set de noche");
    }
  }

  function handleToggleToy(id: string) {
    const newId = equippedToy === id ? null : id;
    setEquippedToy(newId);
    setEquippedToyState(newId);
    const toy = TOY_CATALOG.find(t => t.id === id);
    showToast(newId ? `${toy?.emoji} ${toy?.name} equipado ✓` : "Juguete guardado");
  }

  function quitarTodo() {
    if (tab === "day") {
      const empty: EquippedClothing = {};
      setDayClothing(empty); setDayEq({});
    } else {
      const empty: EquippedClothing = {};
      setNightClothing(empty); setNightEq({});
    }
    showToast("Todo quitado 👗");
  }

  const heldToyEmoji = equippedToy
    ? TOY_CATALOG.find(t => t.id === equippedToy)?.emoji
    : undefined;

  // For each slot, get owned items that can go in the current tab
  const ownedBySlot = SLOTS.map(slot => {
    const all = CLOTHING_CATALOG.filter(c => c.slot === slot && ownedCloth.includes(c.id));
    // In night tab, show sleep items first
    if (tab === "night") {
      const sleep = all.filter(c => SLEEP_ITEM_IDS.includes(c.id));
      const rest  = all.filter(c => !SLEEP_ITEM_IDS.includes(c.id));
      return { slot, items: [...sleep, ...rest] };
    }
    return { slot, items: all };
  });

  const ownedToyItems = TOY_CATALOG.filter(t => ownedToys.includes(t.id));
  const totalEquipped = Object.keys(equippedCloth).length + (equippedToy ? 1 : 0);

  return (
    <div className="min-h-screen pb-10" style={{ background: "linear-gradient(160deg,#f5f3ff 0%,#fdf4ff 50%,#f0fdf4 100%)" }}>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3.5">
          <Link href="/"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-lg active:scale-95 transition-transform">
            ←
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-800 leading-tight">Armario</h1>
            <p className="text-[10px] text-slate-400">Sets de día y noche para la ardilla</p>
          </div>
          <Link href="/tienda"
            className="text-[11px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-full active:scale-95 transition-transform">
            🛒 Tienda
          </Link>
        </div>

        {/* Tabs día / noche */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex gap-2 bg-slate-100 rounded-2xl p-1">
            <button
              onClick={() => setTab("day")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === "day"
                  ? "bg-amber-400 text-white shadow-sm"
                  : "text-slate-500"
              }`}
            >
              ☀️ Set de día
            </button>
            <button
              onClick={() => setTab("night")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === "night"
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "text-slate-500"
              }`}
            >
              🌙 Set de noche
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-4">

        {/* Descripción del set activo */}
        <div className={`rounded-2xl px-4 py-3 text-xs font-medium leading-snug border ${
          tab === "day"
            ? "bg-amber-50 border-amber-200 text-amber-800"
            : "bg-indigo-50 border-indigo-200 text-indigo-800"
        }`}>
          {tab === "day"
            ? "☀️ Ropa que lleva la ardilla durante el día. Se activa automáticamente de 8:00 a 22:00."
            : "🌙 Ropa para dormir. Se activa de 22:00 a 8:00 y cuando la mandas a dormir. Los ítems de sueño reducen las noches malas."}
        </div>

        {/* Vista previa */}
        <div className={`bg-white rounded-3xl shadow-md border overflow-hidden ${
          tab === "day" ? "border-amber-100" : "border-indigo-100"
        }`}>
          <div className="px-4 pt-4 pb-1 flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {tab === "day" ? "☀️ Vista set de día" : "🌙 Vista set de noche"}
            </p>
            {Object.keys(equippedCloth).length > 0 && (
              <button onClick={quitarTodo}
                className="text-[10px] font-semibold text-red-400 bg-red-50 px-2.5 py-1 rounded-full active:scale-95">
                Quitar todo
              </button>
            )}
          </div>
          <div className="flex items-center justify-center py-2">
            <ChibiArdilla
              state={tab === "night" ? "durmiendo" : "neutral"}
              equipped={equippedCloth}
              catalog={CLOTHING_CATALOG}
              heldToyEmoji={tab === "day" ? heldToyEmoji : undefined}
            />
          </div>
          {totalEquipped > 0 && (
            <div className="px-4 pb-4 flex flex-wrap gap-1.5">
              {SLOTS.map(slot => {
                const id = equippedCloth[slot];
                if (!id) return null;
                const item = CLOTHING_CATALOG.find(c => c.id === id);
                if (!item) return null;
                return (
                  <button key={slot} onClick={() => handleToggleClothing(id)}
                    className={`flex items-center gap-1 text-[10px] font-semibold border px-2 py-0.5 rounded-full active:scale-95 ${
                      tab === "day"
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-indigo-100 text-indigo-700 border-indigo-200"
                    }`}>
                    {item.emoji} {item.name} ×
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Estado vacío */}
        {ownedCloth.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center gap-3 text-center shadow-sm">
            <span className="text-6xl">🛍️</span>
            <p className="text-sm font-bold text-slate-600">El armario está vacío</p>
            <p className="text-xs text-slate-400 leading-snug">
              Visita la tienda para comprar<br/>ropa para la ardilla
            </p>
            <Link href="/tienda"
              className="mt-2 px-6 py-3 rounded-2xl bg-violet-600 text-white font-bold text-sm active:scale-95 shadow-md">
              Ir a la Tienda 🛒
            </Link>
          </div>
        )}

        {/* Ropa por slot */}
        {ownedBySlot.map(({ slot, items }) => items.length === 0 ? null : (
          <div key={slot} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
              <span className="text-lg">{SLOT_INFO[slot].emoji}</span>
              <p className="text-sm font-bold text-slate-700 flex-1">{SLOT_INFO[slot].label}</p>
              <span className="text-[10px] text-slate-400 shrink-0">
                {items.length} pieza{items.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="p-3 grid grid-cols-3 gap-2.5">
              {items.map(item => {
                const isEquipped  = equippedCloth[slot] === item.id;
                const isSleepItem = SLEEP_ITEM_IDS.includes(item.id);
                const nights      = isSleepItem ? getSleepItemNights(item.id) : 0;
                const accentEq    = tab === "day"
                  ? "border-amber-400 bg-amber-50 shadow-sm shadow-amber-100"
                  : "border-indigo-400 bg-indigo-50 shadow-sm shadow-indigo-100";
                const badgeCls    = isEquipped
                  ? (tab === "day" ? "bg-amber-200 text-amber-800" : "bg-indigo-200 text-indigo-800")
                  : "bg-slate-200 text-slate-500";
                return (
                  <button key={item.id} onClick={() => handleToggleClothing(item.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95 ${
                      isEquipped ? accentEq : "border-slate-200 bg-slate-50"
                    } ${isSleepItem && tab === "day" ? "opacity-60" : ""}`}
                    title={isSleepItem && tab === "day" ? "Ítem de sueño — mejor en el set de noche" : undefined}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-white"
                      style={{ background: item.color + "33" }}>
                      {item.emoji}
                    </div>
                    <p className="text-[9px] font-semibold text-slate-600 text-center leading-tight line-clamp-2 w-full">
                      {item.name}
                    </p>
                    {isSleepItem && (
                      <div className="w-full flex flex-col items-center gap-0.5">
                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${nights <= 3 ? "bg-red-400" : nights <= 6 ? "bg-amber-400" : "bg-emerald-400"}`}
                            style={{ width: `${(nights / SLEEP_ITEM_MAX_NIGHTS) * 100}%` }}
                          />
                        </div>
                        <span className="text-[7px] font-bold text-slate-400">🌙 {nights}/{SLEEP_ITEM_MAX_NIGHTS}</span>
                      </div>
                    )}
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${badgeCls}`}>
                      {isEquipped ? "✓ Puesto" : tab === "day" ? "Día" : "Noche"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Juguetes (solo en set de día) */}
        {tab === "day" && ownedToyItems.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
              <span className="text-lg">🧸</span>
              <p className="text-sm font-bold text-slate-700 flex-1">Juguetes</p>
              <span className="text-[10px] text-slate-400">{ownedToyItems.length}</span>
            </div>
            <div className="p-3 grid grid-cols-3 gap-2.5">
              {ownedToyItems.map(toy => {
                const isEquipped = equippedToy === toy.id;
                return (
                  <button key={toy.id} onClick={() => handleToggleToy(toy.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95 ${
                      isEquipped
                        ? "border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-100"
                        : "border-slate-200 bg-slate-50"
                    }`}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-2xl shadow-sm border border-white">
                      {toy.emoji}
                    </div>
                    <p className="text-[9px] font-semibold text-slate-600 text-center leading-tight line-clamp-2 w-full">
                      {toy.name}
                    </p>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                      isEquipped ? "bg-emerald-200 text-emerald-700" : "bg-slate-200 text-slate-500"
                    }`}>
                      {isEquipped ? "✓ Con ella" : "Llevar"}
                    </span>
                  </button>
                );
              })}
            </div>
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
