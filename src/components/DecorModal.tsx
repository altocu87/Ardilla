"use client";
import { useEffect, useState } from "react";
import {
  DECOR_CATALOG, getOwnedDecor, getEquippedDecor, buyDecor, toggleDecor,
} from "@/lib/room-decor";

export default function DecorModal({
  bellotas, onClose, onChanged,
}: { bellotas: number; onClose: () => void; onChanged: () => void }) {
  const [owned, setOwned] = useState<string[]>([]);
  const [equipped, setEquipped] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try { setOwned(getOwnedDecor()); setEquipped(getEquippedDecor()); } catch { /* SSR */ }
  }, []);

  function refresh() {
    setOwned(getOwnedDecor());
    setEquipped(getEquippedDecor());
    onChanged();
  }

  async function handleBuy(id: string) {
    const res = await buyDecor(id);
    if (!res.ok) {
      setMsg(res.reason ?? "No se pudo comprar");
      setTimeout(() => setMsg(null), 2200);
      return;
    }
    refresh();
  }

  function handleToggle(id: string) {
    toggleDecor(id);
    refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-4 mb-1 shrink-0" />

        <div className="px-5 pt-2 pb-3 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">Mi madriguera 🏡</h2>
            <p className="text-xs text-slate-400">Decora la escena de la ardilla</p>
          </div>
          <span className="text-sm font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">{bellotas}🌰</span>
        </div>

        {msg && (
          <div className="mx-5 mb-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-center">
            {msg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 pb-4 grid grid-cols-2 gap-3">
          {DECOR_CATALOG.map(item => {
            const isOwned = owned.includes(item.id);
            const isOn = equipped.includes(item.id);
            return (
              <div key={item.id}
                className={`rounded-2xl border-2 p-3 flex flex-col gap-2 transition-all ${
                  isOn ? "bg-teal-50 border-teal-300" : isOwned ? "bg-slate-50 border-slate-200" : "bg-white border-slate-100"
                }`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{item.emoji}</span>
                  <p className="font-bold text-sm text-slate-700 leading-tight">{item.name}</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug flex-1">{item.desc}</p>
                {isOwned ? (
                  <button onClick={() => handleToggle(item.id)}
                    className={`w-full py-2 rounded-xl text-xs font-bold active:scale-95 transition-all ${
                      isOn ? "bg-teal-500 text-white" : "bg-slate-200 text-slate-600"
                    }`}>
                    {isOn ? "Puesta ✓" : "Poner"}
                  </button>
                ) : (
                  <button onClick={() => handleBuy(item.id)}
                    disabled={bellotas < item.price}
                    className={`w-full py-2 rounded-xl text-xs font-bold active:scale-95 transition-all ${
                      bellotas < item.price ? "bg-slate-100 text-slate-300" : "bg-amber-400 text-amber-950"
                    }`}>
                    {item.price}🌰
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-5 pb-8 shrink-0">
          <button onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-slate-800 text-white font-bold text-sm active:scale-95 transition-all">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
