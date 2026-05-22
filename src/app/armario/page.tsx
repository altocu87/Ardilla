"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import ChibiArdilla from "@/components/ChibiArdilla";
import {
  CLOTHING_CATALOG, TOY_CATALOG,
  getOwnedClothing, getEquippedClothing, toggleClothing,
  getOwnedToys, getEquippedToy, setEquippedToy,
  type EquippedClothing, type ClothingSlot,
} from "@/lib/squirrel-shop";

const SLOT_INFO: Record<ClothingSlot, { label: string; emoji: string; desc: string }> = {
  head:  { label: "Cabeza",  emoji: "👑", desc: "Sombreros, lazos y coronas" },
  neck:  { label: "Cuello",  emoji: "🧣", desc: "Bufandas, collares y pajaritas" },
  body:  { label: "Cuerpo",  emoji: "🧥", desc: "Jerseys, abrigos y capas" },
  eyes:  { label: "Ojos",    emoji: "👓", desc: "Gafas y accesorios" },
};

const SLOTS: ClothingSlot[] = ["head", "neck", "body", "eyes"];

export default function Armario() {
  const [ownedCloth,    setOwnedCloth]    = useState<string[]>([]);
  const [equippedCloth, setEquippedCloth] = useState<EquippedClothing>({});
  const [ownedToys,     setOwnedToys]     = useState<string[]>([]);
  const [equippedToy,   setEquippedToyState] = useState<string | null>(null);
  const [toast,         setToast]         = useState<string | null>(null);

  useEffect(() => {
    setOwnedCloth(getOwnedClothing());
    setEquippedCloth(getEquippedClothing());
    setOwnedToys(getOwnedToys());
    setEquippedToyState(getEquippedToy());
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  function handleToggleClothing(id: string) {
    const newEq = toggleClothing(id);
    setEquippedCloth({ ...newEq });
    const item = CLOTHING_CATALOG.find(c => c.id === id);
    const wasEquipped = Object.values(newEq).includes(id);
    showToast(wasEquipped ? `${item?.emoji} ${item?.name} puesto ✓` : "Ropa quitada");
  }

  function handleToggleToy(id: string) {
    const newId = equippedToy === id ? null : id;
    setEquippedToy(newId);
    setEquippedToyState(newId);
    const toy = TOY_CATALOG.find(t => t.id === id);
    showToast(newId ? `${toy?.emoji} ${toy?.name} equipado ✓` : "Juguete guardado");
  }

  function quitarTodo() {
    const slots: ClothingSlot[] = ["head", "neck", "body", "eyes"];
    slots.forEach(slot => {
      const id = equippedCloth[slot];
      if (id) toggleClothing(id);
    });
    setEquippedCloth({});
    setEquippedToy(null);
    setEquippedToyState(null);
    showToast("Todo quitado 👗");
  }

  const heldToyEmoji = equippedToy
    ? TOY_CATALOG.find(t => t.id === equippedToy)?.emoji
    : undefined;

  const ownedBySlot = SLOTS.map(slot => ({
    slot,
    items: CLOTHING_CATALOG.filter(c => c.slot === slot && ownedCloth.includes(c.id)),
  }));

  const ownedToyItems = TOY_CATALOG.filter(t => ownedToys.includes(t.id));
  const totalOwned = ownedCloth.length + ownedToys.length;
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
            <p className="text-[10px] text-slate-400">
              {totalOwned} artículo{totalOwned !== 1 ? "s" : ""} · {totalEquipped} puesto{totalEquipped !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/tienda"
            className="text-[11px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-full active:scale-95 transition-transform">
            🛒 Tienda
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-4">

        {/* Vista previa */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
          <div className="px-4 pt-4 pb-1 flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vista previa</p>
            {totalEquipped > 0 && (
              <button onClick={quitarTodo}
                className="text-[10px] font-semibold text-red-400 bg-red-50 px-2.5 py-1 rounded-full active:scale-95">
                Quitar todo
              </button>
            )}
          </div>
          <div className="flex items-center justify-center py-2">
            <ChibiArdilla
              state="neutral"
              equipped={equippedCloth}
              catalog={CLOTHING_CATALOG}
              heldToyEmoji={heldToyEmoji}
            />
          </div>
          {/* Prendas activas */}
          {totalEquipped > 0 && (
            <div className="px-4 pb-4 flex flex-wrap gap-1.5">
              {SLOTS.map(slot => {
                const id = equippedCloth[slot];
                if (!id) return null;
                const item = CLOTHING_CATALOG.find(c => c.id === id);
                if (!item) return null;
                return (
                  <button key={slot} onClick={() => handleToggleClothing(id)}
                    className="flex items-center gap-1 text-[10px] font-semibold bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full active:scale-95">
                    {item.emoji} {item.name} ×
                  </button>
                );
              })}
              {equippedToy && (() => {
                const toy = TOY_CATALOG.find(t => t.id === equippedToy);
                return toy ? (
                  <button onClick={() => handleToggleToy(equippedToy)}
                    className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full active:scale-95">
                    {toy.emoji} {toy.name} ×
                  </button>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* Estado vacío */}
        {totalOwned === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center gap-3 text-center shadow-sm">
            <span className="text-6xl">🛍️</span>
            <p className="text-sm font-bold text-slate-600">El armario está vacío</p>
            <p className="text-xs text-slate-400 leading-snug">
              Visita la tienda para comprar<br/>ropa y juguetes para la ardilla
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
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700">{SLOT_INFO[slot].label}</p>
                <p className="text-[10px] text-slate-400">{SLOT_INFO[slot].desc}</p>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">
                {items.length} pieza{items.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="p-3 grid grid-cols-3 gap-2.5">
              {items.map(item => {
                const isEquipped = equippedCloth[slot] === item.id;
                return (
                  <button key={item.id} onClick={() => handleToggleClothing(item.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95 ${
                      isEquipped
                        ? "border-violet-400 bg-violet-50 shadow-sm shadow-violet-100"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-white"
                      style={{ background: item.color + "33" }}>
                      {item.emoji}
                    </div>
                    <p className="text-[9px] font-semibold text-slate-600 text-center leading-tight line-clamp-2 w-full">
                      {item.name}
                    </p>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                      isEquipped
                        ? "bg-violet-200 text-violet-700"
                        : "bg-slate-200 text-slate-500"
                    }`}>
                      {isEquipped ? "✓ Puesto" : "Quitar"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Juguetes */}
        {ownedToyItems.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
              <span className="text-lg">🧸</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700">Juguetes</p>
                <p className="text-[10px] text-slate-400">La ardilla lleva el equipado en la mano</p>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">
                {ownedToyItems.length} juguete{ownedToyItems.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="p-3 grid grid-cols-3 gap-2.5">
              {ownedToyItems.map(toy => {
                const isEquipped = equippedToy === toy.id;
                return (
                  <button key={toy.id} onClick={() => handleToggleToy(toy.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95 ${
                      isEquipped
                        ? "border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-100"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-2xl shadow-sm border border-white">
                      {toy.emoji}
                    </div>
                    <p className="text-[9px] font-semibold text-slate-600 text-center leading-tight line-clamp-2 w-full">
                      {toy.name}
                    </p>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                      isEquipped
                        ? "bg-emerald-200 text-emerald-700"
                        : "bg-slate-200 text-slate-500"
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
