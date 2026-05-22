"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

/* ── Pantalla de PIN ──────────────────────────────────────────────────────── */
const PIN_CORRECTO = "8553";

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin]       = useState("");
  const [error, setError]   = useState(false);
  const [shake, setShake]   = useState(false);

  function handleKey(k: string | number) {
    if (k === "⌫") {
      setPin(p => p.slice(0, -1));
      setError(false);
      return;
    }
    if (pin.length >= 4) return;
    const next = pin + String(k);
    setPin(next);
    setError(false);
    if (next.length === 4) {
      if (next === PIN_CORRECTO) {
        onUnlock();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => { setShake(false); setPin(""); }, 700);
      }
    }
  }

  return (
    <>
      <style>{`
        @keyframes caracol-rage {
          0%,100% { transform: rotate(-8deg) scale(1.05); }
          50%      { transform: rotate(8deg) scale(1.12); }
        }
        @keyframes pin-shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-10px); }
          40%      { transform: translateX(10px); }
          60%      { transform: translateX(-8px); }
          80%      { transform: translateX(8px); }
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 px-6 select-none">

        {/* Caracol enfadado */}
        <div style={{ animation: "caracol-rage 0.6s ease-in-out infinite" }}
          className="text-[110px] leading-none mb-1 drop-shadow-[0_0_24px_rgba(239,68,68,0.8)]">
          🐌
        </div>
        <div className="flex gap-1 text-2xl mb-3">😡💢😡</div>

        {/* Mensaje */}
        <p className="text-red-500 font-black text-lg text-center uppercase tracking-widest leading-tight mb-1">
          ⚠️ ESTA ZONA ESTÁ RESTRINGIDA
        </p>
        <p className="text-yellow-400 font-black text-base text-center uppercase tracking-wider mb-8">
          SOLO PARA CARACOLES 🐌
        </p>

        {/* Indicador de dígitos */}
        <div
          className="flex gap-4 mb-7"
          style={shake ? { animation: "pin-shake 0.6s ease-in-out" } : {}}
        >
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
              pin.length > i
                ? error ? "bg-red-500 border-red-500" : "bg-yellow-400 border-yellow-400"
                : "border-slate-500"
            }`} />
          ))}
        </div>

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-3 w-60">
          {[1,2,3,4,5,6,7,8,9,"","0","⌫"].map((k, i) => (
            <button
              key={i}
              onClick={() => k !== "" && handleKey(k)}
              disabled={k === ""}
              className={`h-14 rounded-2xl font-bold text-xl transition-all active:scale-90 ${
                k === "" ? "invisible" :
                k === "⌫" ? "bg-slate-800 text-red-400 hover:bg-slate-700" :
                "bg-slate-800 text-white hover:bg-slate-700"
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm font-bold mt-5 animate-bounce">
            ❌ PIN incorrecto, ¡impostor! Esto es zona caracol 🐌
          </p>
        )}
      </div>
    </>
  );
}
import {
  registerServiceWorker, subscribeToPush, unsubscribeFromPush,
  isPushSubscribed, sendTestNotification, getNotificationPermission,
} from "@/lib/notifications";
import {
  getSchedules, upsertSchedule, deleteSchedule, toggleSchedule, sendNow,
  DAYS_LABELS, CONDITION_LABELS, type NotifSchedule, type ConditionType,
} from "@/lib/schedules";
import { DEFAULT_PHRASES } from "@/lib/phrases";
import {
  getShopBellotas, saveShopBellotas,
  getShopRata,     saveShopRata,
  getShopAvatares, saveShopAvatares,
  getShopTitulos,  saveShopTitulos,
  cleanupLegacyDefaults,
  ShopItem, AvatarItem, TituloItem,
} from "@/lib/shop";
import { getPlayerProfile, upsertPlayerProfile, exportAllLogs } from "@/lib/db";
import { pushToCloud, pullFromCloud, pushAllToCloud } from "@/lib/cloudsync";
import {
  getRewardsConfig, saveRewardsConfig,
  ACTIVITY_KEYS, ACTIVITY_LABELS, DEFAULT_REWARDS,
  type RewardsConfig,
} from "@/lib/rewards";
import {
  getMascotConfig, saveMascotConfig, DEFAULT_MASCOT_CONFIG,
  type MascotConfig,
} from "@/lib/mascot";

const EMOJIS_BELL = ["🌰","🎁","🎮","🎵","🌈","🎭","🌟","⭐","🏆","🎯","💎","👑","🌸","🦋","🎨","🧸","🪄","🍀","🌺","🎠","🪆","🫧","🌙","✨","🎪"];
const EMOJIS_RATA = ["🐀","🐭","🧀","🔮","🗡️","🧙","💀","🦇","⚡","🌑","💫","🃏","🎲","🌙","🔴","🕷️","👁️","☠️","🪄","🎴","🧪","🌑","🔪","🎭","🕰️"];

/* ═══════════════════════════════════════════════════════════════════════════
   SUBCOMPONENTES
══════════════════════════════════════════════════════════════════════════════ */

/* ── Sección colapsable ───────────────────────────────────────────────────── */
function Section({
  title, emoji, badge, children, defaultOpen = false,
}: {
  title: string; emoji: string; badge?: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span className="text-sm font-bold text-slate-700">{title}</span>
          {badge && (
            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">{badge}</span>
          )}
        </div>
        <span className={`text-slate-400 text-lg transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && <div className="px-4 pb-4 border-t border-slate-100 pt-3 flex flex-col gap-3">{children}</div>}
    </div>
  );
}

/* ── Formulario de item de tienda ────────────────────────────────────────── */
function ShopItemForm({
  onAdd, emojiSuggestions, accentColor,
}: {
  onAdd: (item: Omit<ShopItem, "id">) => void;
  emojiSuggestions: string[];
  accentColor: string;
}) {
  const [emoji, setEmoji] = useState("🌰");
  const [name,  setName]  = useState("");
  const [desc,  setDesc]  = useState("");
  const [price, setPrice] = useState("");

  function submit() {
    if (!name.trim() || !price.trim()) return;
    onAdd({ emoji, name: name.trim(), desc: desc.trim(), price: Number(price) });
    setName(""); setDesc(""); setPrice(""); setEmoji("🌰");
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 shadow-sm">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Emoji</p>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-10 h-10 rounded-xl ${accentColor} flex items-center justify-center text-xl shrink-0`}>{emoji}</div>
          <input value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={4}
            className="w-16 border border-slate-200 rounded-xl px-2 py-2 text-center text-lg focus:outline-none focus:border-violet-400 bg-white"/>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {emojiSuggestions.map(e => (
            <button key={e} onClick={() => setEmoji(e)}
              className={`w-9 h-9 rounded-xl text-lg transition-all ${emoji === e ? "bg-violet-100 border-2 border-violet-400" : "bg-slate-50 border border-slate-200"}`}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre *</p>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Peluche de apoyo"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 bg-white placeholder:text-slate-300"/>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Descripción</p>
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción corta"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 bg-white placeholder:text-slate-300"/>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Precio en 🌰 *</p>
        <input value={price} onChange={e => setPrice(e.target.value.replace(/\D/g,""))} placeholder="Ej: 50" inputMode="numeric"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 bg-white placeholder:text-slate-300"/>
      </div>
      <button onClick={submit} disabled={!name.trim() || !price.trim()}
        className={`w-full py-3 rounded-2xl text-white font-bold text-sm transition-all active:scale-95 ${
          name.trim() && price.trim() ? "bg-violet-600 shadow-md" : "bg-slate-200 text-slate-400"
        }`}>
        + Añadir artículo
      </button>
    </div>
  );
}

/* ── Lista de items con edición inline ────────────────────────────────────── */
function ShopItemList({ items, onRemove, onUpdate, accentColor }: {
  items: ShopItem[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, data: Omit<ShopItem, "id">) => void;
  accentColor: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmoji, setEditEmoji] = useState("");
  const [editName,  setEditName]  = useState("");
  const [editDesc,  setEditDesc]  = useState("");
  const [editPrice, setEditPrice] = useState("");

  function startEdit(item: ShopItem) {
    setEditingId(item.id); setEditEmoji(item.emoji);
    setEditName(item.name); setEditDesc(item.desc); setEditPrice(String(item.price));
  }
  function saveEdit(id: string) {
    if (!editName.trim() || !editPrice.trim()) return;
    onUpdate(id, { emoji: editEmoji, name: editName.trim(), desc: editDesc.trim(), price: Number(editPrice) });
    setEditingId(null);
  }

  if (items.length === 0) return (
    <p className="text-xs text-slate-400 text-center py-4">Sin artículos aún. Añade el primero arriba.</p>
  );

  return (
    <div className="flex flex-col gap-2">
      {items.map(item => (
        <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {editingId === item.id ? (
            <div className="p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input value={editEmoji} onChange={e => setEditEmoji(e.target.value)} maxLength={4}
                  className="w-14 border border-slate-200 rounded-lg px-2 py-1.5 text-center text-lg focus:outline-none focus:border-violet-400"/>
                <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre"
                  className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-violet-400"/>
                <input value={editPrice} onChange={e => setEditPrice(e.target.value.replace(/\D/g,""))}
                  placeholder="🌰" inputMode="numeric"
                  className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-violet-400"/>
              </div>
              <input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Descripción"
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-violet-400"/>
              <div className="flex gap-2">
                <button onClick={() => saveEdit(item.id)}
                  className="flex-1 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold active:scale-95">Guardar ✓</button>
                <button onClick={() => setEditingId(null)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold active:scale-95">Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className={`w-9 h-9 rounded-lg ${accentColor} flex items-center justify-center text-lg shrink-0`}>{item.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">{item.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{item.price} 🌰 · {item.desc || "Sin descripción"}</p>
              </div>
              <button onClick={() => startEdit(item)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-violet-400 hover:bg-violet-50 text-sm shrink-0">✏️</button>
              <button onClick={() => onRemove(item.id)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 text-lg leading-none shrink-0">×</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Frases colapsable ───────────────────────────────────────────────────── */
function PhraseSection({ phrases }: { phrases: string[] }) {
  const [open, setOpen] = useState(false);
  const preview = phrases.slice(0, 3);
  return (
    <div>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-left mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Predeterminadas</span>
          <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">{phrases.length}</span>
        </div>
        <span className={`text-slate-400 text-lg transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {!open ? (
        <div className="flex flex-col gap-1.5">
          {preview.map((p, i) => (
            <div key={i} className="bg-slate-50 rounded-xl px-4 py-2 text-xs text-slate-400 border border-slate-100 italic truncate">&ldquo;{p}&rdquo;</div>
          ))}
          <p className="text-[10px] text-slate-400 text-center mt-0.5">… y {phrases.length - 3} más</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
          {phrases.map((p, i) => (
            <div key={i} className="bg-slate-50 rounded-xl px-4 py-2.5 text-xs text-slate-500 border border-slate-200 leading-snug">{p}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Fila de recompensa editable ────────────────────────────────────────── */
function RewardRow({
  actKey, cfg, onChange,
}: {
  actKey: keyof RewardsConfig;
  cfg: RewardsConfig;
  onChange: (k: keyof RewardsConfig, field: "xp" | "bellotas", val: number) => void;
}) {
  const info = ACTIVITY_LABELS[actKey];
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-lg shrink-0">{info.emoji}</span>
      <p className="flex-1 text-xs font-medium text-slate-600 leading-tight">{info.label}</p>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-teal-600 font-bold">XP</span>
        <input
          type="number" min={0} max={999}
          value={cfg[actKey].xp}
          onChange={e => onChange(actKey, "xp", Math.max(0, parseInt(e.target.value) || 0))}
          className="w-14 border border-slate-200 rounded-lg px-1.5 py-1 text-xs text-center focus:outline-none focus:border-teal-400"
        />
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-amber-600 font-bold">🌰</span>
        <input
          type="number" min={0} max={999}
          value={cfg[actKey].bellotas}
          onChange={e => onChange(actKey, "bellotas", Math.max(0, parseInt(e.target.value) || 0))}
          className="w-14 border border-slate-200 rounded-lg px-1.5 py-1 text-xs text-center focus:outline-none focus:border-amber-400"
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════════════════════════════════════════ */
export default function Opciones() {
  /* ── PIN gate ───────────────────────────────────────────────────────────── */
  const [pinUnlocked, setPinUnlocked] = useState(false);

  /* ── Estado ─────────────────────────────────────────────────────────────── */
  const [rewardsCfg,    setRewardsCfg]    = useState<RewardsConfig>(DEFAULT_REWARDS);
  const [rewardsSaved,  setRewardsSaved]  = useState(false);

  const [customPhrases, setCustomPhrases] = useState<string[]>([]);
  const [newPhrase,     setNewPhrase]     = useState("");
  const [snailImage,    setSnailImage]    = useState<string | null>(null);

  const [shopBell,    setShopBell]    = useState<ShopItem[]>([]);
  const [shopRata,    setShopRata]    = useState<ShopItem[]>([]);
  const [shopAv,      setShopAv]      = useState<AvatarItem[]>([]);
  const [shopTitulos, setShopTitulos] = useState<TituloItem[]>([]);
  const [newTitulo,   setNewTitulo]   = useState("");

  const [newTituloPrice,    setNewTituloPrice]    = useState("");
  const [editingTituloId,   setEditingTituloId]   = useState<string | null>(null);
  const [editingTituloText, setEditingTituloText] = useState("");
  const [editingTituloPrice, setEditingTituloPrice] = useState("");

  const [adminMsg,   setAdminMsg]   = useState<string | null>(null);
  const [exporting,  setExporting]  = useState(false);

  /* ── Mascota ─────────────────────────────────────────────────────────────── */
  const [mascotCfg,   setMascotCfg]   = useState<MascotConfig>(DEFAULT_MASCOT_CONFIG);
  const [mascotSaved, setMascotSaved] = useState(false);

  const [notifStatus,    setNotifStatus]    = useState<"loading"|"granted"|"denied"|"default"|"unsupported">("loading");
  const [notifSubbed,    setNotifSubbed]    = useState(false);
  const [notifWorking,   setNotifWorking]   = useState(false);
  const [schedules,      setSchedules]      = useState<NotifSchedule[]>([]);
  const [schedForm,      setSchedForm]      = useState<Omit<NotifSchedule,"id"|"last_sent_at">>({
    emoji: "🐿️", title: "", body: "", hour: 10, minute: 0, days: [1,2,3,4,5,6,0], active: true,
    condition_type: null, condition_days: 1,
  });
  const [editingSchedId, setEditingSchedId] = useState<string|null>(null);

  const avInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    cleanupLegacyDefaults();
    try {
      const stored = localStorage.getItem("custom_phrases");
      if (stored) setCustomPhrases(JSON.parse(stored) as string[]);
    } catch {}
    setSnailImage(localStorage.getItem("snail_image"));
    setShopBell(getShopBellotas());
    setShopRata(getShopRata());
    setShopAv(getShopAvatares());
    setShopTitulos(getShopTitulos());
    setRewardsCfg(getRewardsConfig());
    setMascotCfg(getMascotConfig());
    registerServiceWorker();
    getNotificationPermission().then((perm) => {
      if (!("Notification" in window) || !("PushManager" in window)) {
        setNotifStatus("unsupported");
      } else {
        setNotifStatus(perm as "granted"|"denied"|"default");
      }
    });
    isPushSubscribed().then(setNotifSubbed);
    getSchedules().then(setSchedules);
  }, []);

  function showAdminMsg(msg: string) {
    setAdminMsg(msg);
    setTimeout(() => setAdminMsg(null), 3000);
  }

  /* ── Recompensas ─────────────────────────────────────────────────────────── */
  function handleRewardChange(k: keyof RewardsConfig, field: "xp" | "bellotas", val: number) {
    setRewardsCfg(prev => ({ ...prev, [k]: { ...prev[k], [field]: val } }));
    setRewardsSaved(false);
  }
  function saveRewards() {
    saveRewardsConfig(rewardsCfg);
    setRewardsSaved(true);
    setTimeout(() => setRewardsSaved(false), 2000);
  }
  function resetRewards() {
    setRewardsCfg({ ...DEFAULT_REWARDS });
    saveRewardsConfig({ ...DEFAULT_REWARDS });
    showAdminMsg("✓ Recompensas restauradas a valores por defecto");
  }

  /* ── Mascota ─────────────────────────────────────────────────────────────── */
  function saveMascot() {
    saveMascotConfig(mascotCfg);
    setMascotSaved(true);
    setTimeout(() => setMascotSaved(false), 2000);
  }


  /* ── Frases ──────────────────────────────────────────────────────────────── */
  function saveCustomPhrases(phrases: string[]) {
    setCustomPhrases(phrases);
    localStorage.setItem("custom_phrases", JSON.stringify(phrases));
    pushToCloud("custom_phrases", phrases);
  }
  function addPhrase() { const t = newPhrase.trim(); if (!t) return; saveCustomPhrases([...customPhrases, t]); setNewPhrase(""); }
  function removePhrase(i: number) { saveCustomPhrases(customPhrases.filter((_, j) => j !== i)); }

  /* ── Imagen del caracol ──────────────────────────────────────────────────── */
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      localStorage.setItem("snail_image", b64); setSnailImage(b64);
      pushToCloud("snail_image", b64);
    };
    reader.readAsDataURL(file);
  }
  function removeSnailImage() {
    localStorage.removeItem("snail_image"); setSnailImage(null);
    pushToCloud("snail_image", "");
  }

  /* ── Bellotas ────────────────────────────────────────────────────────────── */
  function addBell(item: Omit<ShopItem,"id">) {
    const updated = [...shopBell, { ...item, id: `b_${Date.now()}` }];
    setShopBell(updated); saveShopBellotas(updated);
  }
  function removeBell(id: string) { const u = shopBell.filter(i => i.id !== id); setShopBell(u); saveShopBellotas(u); }
  function updateBell(id: string, data: Omit<ShopItem,"id">) {
    const u = shopBell.map(i => i.id === id ? { ...i, ...data } : i); setShopBell(u); saveShopBellotas(u);
  }

  /* ── Rata ────────────────────────────────────────────────────────────────── */
  function addRata(item: Omit<ShopItem,"id">) {
    const updated = [...shopRata, { ...item, id: `r_${Date.now()}` }];
    setShopRata(updated); saveShopRata(updated);
  }
  function removeRata(id: string) { const u = shopRata.filter(i => i.id !== id); setShopRata(u); saveShopRata(u); }
  function updateRata(id: string, data: Omit<ShopItem,"id">) {
    const u = shopRata.map(i => i.id === id ? { ...i, ...data } : i); setShopRata(u); saveShopRata(u);
  }

  /* ── Avatares ────────────────────────────────────────────────────────────── */
  function handleAvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      const name = file.name.replace(/\.[^.]+$/, "");
      const updated = [...shopAv, { id: `av_${Date.now()}`, name, img64: b64, price: 0 }];
      setShopAv(updated); saveShopAvatares(updated);
    };
    reader.readAsDataURL(file);
    if (avInputRef.current) avInputRef.current.value = "";
  }
  function removeAv(id: string) { const u = shopAv.filter(a => a.id !== id); setShopAv(u); saveShopAvatares(u); }
  function updateAvPrice(id: string, price: number) {
    const u = shopAv.map(a => a.id === id ? { ...a, price } : a);
    setShopAv(u); saveShopAvatares(u);
  }

  /* ── Títulos ─────────────────────────────────────────────────────────────── */
  function addTitulo() {
    const t = newTitulo.trim(); if (!t) return;
    const updated = [...shopTitulos, { id: `t_${Date.now()}`, text: t, price: Number(newTituloPrice) || 0 }];
    setShopTitulos(updated); saveShopTitulos(updated); setNewTitulo(""); setNewTituloPrice("");
  }
  function removeTitulo(id: string) { const u = shopTitulos.filter(t => t.id !== id); setShopTitulos(u); saveShopTitulos(u); }
  function startEditTitulo(t: TituloItem) { setEditingTituloId(t.id); setEditingTituloText(t.text); setEditingTituloPrice(String(t.price ?? 0)); }
  function saveEditTitulo(id: string) {
    const text = editingTituloText.trim(); if (!text) return;
    const u = shopTitulos.map(t => t.id === id ? { ...t, text, price: Number(editingTituloPrice) || 0 } : t);
    setShopTitulos(u); saveShopTitulos(u); setEditingTituloId(null);
  }

  /* ── Notificaciones ─────────────────────────────────────────────────────── */
  async function handleToggleNotif() {
    setNotifWorking(true);
    if (notifSubbed) {
      await unsubscribeFromPush();
      setNotifSubbed(false);
      showAdminMsg("🔕 Notificaciones desactivadas");
    } else {
      const result = await subscribeToPush();
      if (result.ok) { setNotifSubbed(true); setNotifStatus("granted"); showAdminMsg("🔔 ¡Notificaciones activadas!"); }
      else showAdminMsg(`❌ ${result.error}`);
    }
    setNotifWorking(false);
  }
  async function handleTestNotif() {
    setNotifWorking(true);
    const result = await sendTestNotification();
    showAdminMsg(result.ok ? "✓ Notificación de prueba enviada" : `❌ ${result.error}`);
    setNotifWorking(false);
  }

  /* ── Programación ───────────────────────────────────────────────────────── */
  function toggleSchedDay(day: number) {
    setSchedForm(f => ({ ...f, days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day] }));
  }
  async function saveSchedule() {
    if (!schedForm.title.trim() || !schedForm.body.trim() || schedForm.days.length === 0) return;
    await upsertSchedule(editingSchedId ? { ...schedForm, id: editingSchedId } : { ...schedForm });
    const updated = await getSchedules();
    setSchedules(updated);
    setEditingSchedId(null);
    setSchedForm({ emoji: "🐿️", title: "", body: "", hour: 10, minute: 0, days: [1,2,3,4,5,6,0], active: true, condition_type: null, condition_days: 1 });
    showAdminMsg("✓ Notificación guardada");
  }
  function startEditSched(s: NotifSchedule) {
    setEditingSchedId(s.id);
    setSchedForm({ emoji: s.emoji, title: s.title, body: s.body, hour: s.hour, minute: s.minute, days: s.days, active: s.active, condition_type: s.condition_type, condition_days: s.condition_days ?? 1 });
  }
  async function removeSched(id: string) { await deleteSchedule(id); setSchedules(prev => prev.filter(s => s.id !== id)); }
  async function toggleSched(id: string, active: boolean) { await toggleSchedule(id, active); setSchedules(prev => prev.map(s => s.id === id ? { ...s, active } : s)); }
  async function sendSchedNow(s: NotifSchedule) { await sendNow(s); showAdminMsg(`✓ Enviada: ${s.emoji} ${s.title}`); }

  /* ── Exportar ────────────────────────────────────────────────────────────── */
  async function handleExport() {
    setExporting(true);
    try {
      const data = await exportAllLogs();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `ardilla_export_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showAdminMsg("✓ Datos exportados correctamente");
    } catch { showAdminMsg("❌ Error al exportar datos"); }
    setExporting(false);
  }

  /* ── Admin ───────────────────────────────────────────────────────────────── */
  async function resetDailyAwards() {
    try {
      const profile = await getPlayerProfile();
      await upsertPlayerProfile({ ...profile, dailyAwards: {} });
      showAdminMsg("✓ Premios diarios reiniciados");
    } catch { showAdminMsg("Error al reiniciar"); }
  }
  async function pullCloud() {
    try {
      await pullFromCloud();
      showAdminMsg("✓ Datos descargados de la nube. Recarga la página.");
    } catch { showAdminMsg("Error al descargar"); }
  }
  async function pushCloud() {
    try {
      await pushAllToCloud();
      showAdminMsg("✓ Datos subidos a la nube");
    } catch { showAdminMsg("Error al subir"); }
  }

  async function resetAllProgress() {
    try {
      await upsertPlayerProfile({ xp: 0, bellotas: 0, dailyAwards: {}, streakAwards: [] });
      showAdminMsg("✓ Progreso reiniciado a cero");
    } catch { showAdminMsg("Error al reiniciar"); }
  }

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-20">

      {!pinUnlocked && <PinGate onUnlock={() => setPinUnlocked(true)} />}

      {/* Cabecera */}
      <header className="flex items-center gap-3 mb-8">
        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-lg transition-colors">←</Link>
        <h1 className="text-xl font-bold text-slate-800">Ajustes</h1>
      </header>

      <div className="flex flex-col gap-3">

        {/* ══ 1. RECOMPENSAS (siempre abierta, destacada) ══════════════════════ */}
        <div className="border-2 border-teal-300 rounded-2xl overflow-hidden bg-gradient-to-br from-teal-50 to-emerald-50 shadow-md">
          <div className="px-4 py-3 bg-white/60 border-b border-teal-200 flex items-center gap-2">
            <span className="text-xl">🏅</span>
            <span className="text-sm font-bold text-teal-800">Recompensas por actividad</span>
          </div>
          <div className="px-4 py-3 flex flex-col gap-3">
            <p className="text-xs text-slate-500">
              XP y bellotas 🌰 que ganan los 6 tipos de actividad (una vez al día).
            </p>
            <div className="bg-white border border-slate-200 rounded-2xl px-3 py-1 shadow-sm">
              {ACTIVITY_KEYS.map(k => (
                <RewardRow key={k} actKey={k} cfg={rewardsCfg} onChange={handleRewardChange} />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={saveRewards}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold active:scale-95 transition-all ${
                  rewardsSaved ? "bg-emerald-500" : "bg-teal-600 shadow-sm"
                }`}>
                {rewardsSaved ? "✓ Guardado" : "Guardar cambios"}
              </button>
              <button onClick={resetRewards}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 text-sm font-medium active:scale-95 transition-all">
                Restablecer
              </button>
            </div>
          </div>
        </div>

        {/* ══ 2. TIENDA DE BELLOTAS ═══════════════════════════════════════════ */}
        <Section title="Tienda de Bellotas" emoji="🌰" badge={`${shopBell.length} artículos`}>
          <ShopItemForm onAdd={addBell} emojiSuggestions={EMOJIS_BELL} accentColor="bg-amber-100"/>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Artículos ({shopBell.length})
            </p>
            <ShopItemList items={shopBell} onRemove={removeBell} onUpdate={updateBell} accentColor="bg-amber-100"/>
          </div>
        </Section>

        {/* ══ 3. TIENDA DE LA RATA ════════════════════════════════════════════ */}
        <Section title="Tienda de La Rata" emoji="🐀" badge={`${shopRata.length} artículos`}>
          <ShopItemForm onAdd={addRata} emojiSuggestions={EMOJIS_RATA} accentColor="bg-violet-100"/>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Artículos ({shopRata.length})
            </p>
            <ShopItemList items={shopRata} onRemove={removeRata} onUpdate={updateRata} accentColor="bg-violet-100"/>
          </div>
        </Section>

        {/* ══ 4. AVATARES ═════════════════════════════════════════════════════ */}
        <Section title="Avatares" emoji="🖼️" badge={shopAv.length > 0 ? `${shopAv.length}` : undefined}>
          <p className="text-xs text-slate-500 -mt-1">Imágenes que Vicky puede equipar como foto de perfil.</p>
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-2xl py-4 cursor-pointer hover:border-violet-400 transition-colors">
            <span className="text-2xl">📸</span>
            <span className="text-sm font-semibold text-slate-600">Subir avatar</span>
            <input ref={avInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvUpload}/>
          </label>
          {shopAv.length > 0 && (
            <div className="flex flex-col gap-2">
              {shopAv.map(av => (
                <div key={av.id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={av.img64} alt={av.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200"/>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-slate-700 truncate block">{av.name}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] text-amber-600">🌰</span>
                      <input
                        type="number" min={0}
                        value={av.price ?? 0}
                        onChange={e => updateAvPrice(av.id, Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 border border-slate-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-[10px] text-slate-400">(0 = gratis)</span>
                    </div>
                  </div>
                  <button onClick={() => removeAv(av.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ══ 5. TÍTULOS ══════════════════════════════════════════════════════ */}
        <Section title="Títulos" emoji="🏷️" badge={shopTitulos.length > 0 ? `${shopTitulos.length}` : undefined}>
          <p className="text-xs text-slate-500 -mt-1">Títulos que aparecen al lado del nombre de Vicky.</p>
          <div className="flex flex-col gap-2">
            <input value={newTitulo} onChange={e => setNewTitulo(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTitulo()}
              placeholder="Ej: Maestra de la Calma 🌿"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 bg-white placeholder:text-slate-300"/>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 flex-1 border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                <span className="text-sm shrink-0">🌰</span>
                <input value={newTituloPrice} onChange={e => setNewTituloPrice(e.target.value.replace(/\D/g, ""))}
                  placeholder="Precio (0 = gratis)" inputMode="numeric"
                  className="flex-1 text-sm focus:outline-none placeholder:text-slate-300 min-w-0"/>
              </div>
              <button onClick={addTitulo} disabled={!newTitulo.trim()}
                className={`w-11 rounded-xl font-bold text-xl active:scale-95 transition-all ${newTitulo.trim() ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-400"}`}>+</button>
            </div>
          </div>
          {shopTitulos.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {shopTitulos.map(t => (
                <div key={t.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {editingTituloId === t.id ? (
                    <div className="flex flex-col gap-2 px-3 py-2">
                      <input value={editingTituloText} onChange={e => setEditingTituloText(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && saveEditTitulo(t.id)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-violet-400"/>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1 flex-1 border border-slate-200 rounded-lg px-2 py-1.5">
                          <span className="text-xs shrink-0">🌰</span>
                          <input value={editingTituloPrice} onChange={e => setEditingTituloPrice(e.target.value.replace(/\D/g, ""))}
                            inputMode="numeric" placeholder="0"
                            className="flex-1 text-xs focus:outline-none min-w-0 placeholder:text-slate-300"/>
                        </div>
                        <button onClick={() => saveEditTitulo(t.id)}
                          className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold active:scale-95">✓</button>
                        <button onClick={() => setEditingTituloId(null)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold active:scale-95">✗</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <span className="text-sm">🏷️</span>
                      <span className="flex-1 text-xs font-semibold text-slate-700">{t.text}</span>
                      {(t.price ?? 0) > 0 && <span className="text-[10px] font-bold text-amber-600">🌰 {t.price}</span>}
                      <button onClick={() => startEditTitulo(t)}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-violet-400 hover:bg-violet-50 text-sm">✏️</button>
                      <button onClick={() => removeTitulo(t.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 text-lg leading-none">×</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ══ 6. FRASES MOTIVADORAS ═══════════════════════════════════════════ */}
        <Section title="Frases motivadoras" emoji="💬">
          <p className="text-xs text-slate-400 -mt-1">Aparecen en la pantalla de celebración al guardar un registro.</p>
          <PhraseSection phrases={DEFAULT_PHRASES} />
          {customPhrases.length > 0 && (
            <>
              <p className="text-[11px] font-semibold text-teal-600 uppercase tracking-wide">Tus frases</p>
              <div className="flex flex-col gap-2">
                {customPhrases.map((p, i) => (
                  <div key={i} className="bg-teal-50 rounded-xl px-4 py-2.5 flex items-center gap-2 border border-teal-200">
                    <span className="flex-1 text-sm text-teal-800">{p}</span>
                    <button onClick={() => removePhrase(i)}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 text-xl leading-none shrink-0">×</button>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="flex gap-2">
            <input value={newPhrase} onChange={e => setNewPhrase(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addPhrase()}
              placeholder="Escribe una frase personalizada…"
              className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 bg-white text-slate-800 placeholder:text-slate-300"/>
            <button onClick={addPhrase}
              className="w-12 bg-teal-600 text-white rounded-xl font-bold text-xl active:scale-95 transition-all">+</button>
          </div>
        </Section>

        {/* ══ 7. IMAGEN DEL CARACOL ═══════════════════════════════════════════ */}
        <Section title="Imagen del caracol" emoji="🐌">
          <p className="text-xs text-slate-400 -mt-1">Tu imagen aparecerá en Formaciones con sombrero de profe.</p>
          {snailImage ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-36 h-36 rounded-2xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={snailImage} alt="Tu caracol" className="w-full h-full object-contain p-2"/>
              </div>
              <div className="flex gap-3">
                <label className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 cursor-pointer hover:border-teal-400 transition-colors">
                  Cambiar imagen
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
                </label>
                <button onClick={removeSnailImage}
                  className="px-4 py-2 rounded-xl border border-red-200 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center gap-3 border-2 border-dashed border-slate-300 rounded-2xl p-8 cursor-pointer hover:border-teal-400 transition-colors">
              <span className="text-5xl">🐌</span>
              <span className="text-sm font-semibold text-slate-600">Toca para subir una imagen</span>
              <span className="text-xs text-slate-400">PNG, JPG o GIF</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
            </label>
          )}
        </Section>

        {/* ══ 8. MASCOTA ══════════════════════════════════════════════════════ */}
        <Section title="Mascota" emoji="🐿️">
          <p className="text-xs text-slate-400 -mt-1">
            Personaliza el comportamiento y nombre de la ardilla mascota.
          </p>

          {/* Nombre */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre de la mascota</p>
            <input
              value={mascotCfg.nombre}
              onChange={e => { setMascotCfg(prev => ({ ...prev, nombre: e.target.value })); setMascotSaved(false); }}
              placeholder="Ardilla"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 bg-white placeholder:text-slate-300"
            />
          </div>

          {/* Threshold inputs */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-base">🥳</span>
                <p className="text-xs font-medium text-slate-600">Días de racha para &ldquo;muy feliz&rdquo;</p>
              </div>
              <input
                type="number" min={1} max={99}
                value={mascotCfg.rachaFeliz}
                onChange={e => { const n = Math.max(1, parseInt(e.target.value)||1); setMascotCfg(prev=>({...prev,rachaFeliz:n})); setMascotSaved(false); }}
                className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-teal-400 shrink-0"
              />
            </div>
          </div>

          <button onClick={saveMascot}
            className={`w-full py-2.5 rounded-xl text-white text-sm font-bold active:scale-95 transition-all ${
              mascotSaved ? "bg-emerald-500" : "bg-teal-600 shadow-sm"
            }`}>
            {mascotSaved ? "✓ Guardado" : "Guardar configuración"}
          </button>
        </Section>

        {/* ══ 9. PROGRAMAR NOTIFICACIONES ══════════════════════════════════════ */}
        <Section title="Programar notificaciones" emoji="📅" badge={schedules.length > 0 ? `${schedules.length}` : undefined}>
          <p className="text-xs text-slate-400 -mt-1">Define qué notificaciones quieres enviar automáticamente y a qué hora.</p>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{editingSchedId ? "Editando" : "Nueva notificación"}</p>
            <div className="flex gap-2">
              <input value={schedForm.emoji} onChange={e => setSchedForm(f => ({ ...f, emoji: e.target.value }))} maxLength={4}
                className="w-14 border border-slate-200 rounded-xl px-2 py-2.5 text-center text-xl focus:outline-none focus:border-purple-400"/>
              <input value={schedForm.title} onChange={e => setSchedForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Título (ej: ¡Hora de practicar!)"
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 placeholder:text-slate-300"/>
            </div>
            <textarea value={schedForm.body} onChange={e => setSchedForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Mensaje (ej: Recuerda registrar cómo te sientes hoy 🌿)" rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 resize-none placeholder:text-slate-300"/>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Hora</p>
              <select value={schedForm.hour} onChange={e => setSchedForm(f => ({ ...f, hour: Number(e.target.value) }))}
                className="border border-slate-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-purple-400">
                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2,"0")}:00</option>)}
              </select>
              <p className="text-[10px] text-slate-400">hora española (GMT+1)</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Días</p>
              <div className="flex gap-1.5">
                {[1,2,3,4,5,6,0].map(d => (
                  <button key={d} onClick={() => toggleSchedDay(d)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${schedForm.days.includes(d) ? "bg-purple-500 text-white" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                    {DAYS_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>
            {/* Condición */}
            <div className="border border-slate-200 rounded-xl p-3 flex flex-col gap-2 bg-slate-50">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Condición (opcional)</p>
                <button
                  onClick={() => setSchedForm(f => ({ ...f, condition_type: f.condition_type ? null : "no_any" }))}
                  className={`w-9 h-5 rounded-full transition-colors relative ${schedForm.condition_type ? "bg-purple-400" : "bg-slate-300"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${schedForm.condition_type ? "translate-x-4" : "translate-x-0.5"}`}/>
                </button>
              </div>
              {schedForm.condition_type && (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] text-slate-500 leading-snug">Solo enviar si <strong>no ha registrado</strong> en los últimos:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min={1} max={30} value={schedForm.condition_days}
                      onChange={e => setSchedForm(f => ({ ...f, condition_days: Math.max(1, parseInt(e.target.value)||1) }))}
                      className="w-14 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-purple-400"/>
                    <span className="text-xs text-slate-500">días de</span>
                    <select
                      value={schedForm.condition_type}
                      onChange={e => setSchedForm(f => ({ ...f, condition_type: e.target.value as ConditionType }))}
                      className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-purple-400">
                      {(Object.entries(CONDITION_LABELS) as [ConditionType, string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={saveSchedule} disabled={!schedForm.title.trim() || !schedForm.body.trim() || schedForm.days.length === 0}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold active:scale-95 transition-all ${schedForm.title.trim() && schedForm.body.trim() && schedForm.days.length > 0 ? "bg-purple-500 shadow-sm" : "bg-slate-200 text-slate-400"}`}>
                {editingSchedId ? "Guardar cambios" : "+ Añadir"}
              </button>
              {editingSchedId && (
                <button onClick={() => { setEditingSchedId(null); setSchedForm({ emoji:"🐿️",title:"",body:"",hour:10,minute:0,days:[1,2,3,4,5,6,0],active:true,condition_type:null,condition_days:1 }); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 text-sm font-medium active:scale-95">Cancelar</button>
              )}
            </div>
          </div>
          {schedules.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">Sin notificaciones programadas aún.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {schedules.map(s => (
                <div key={s.id} className={`rounded-xl border shadow-sm overflow-hidden ${s.active ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100"}`}>
                  <div className="flex items-center gap-3 px-3 py-3">
                    <span className="text-2xl shrink-0">{s.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${s.active ? "text-slate-700" : "text-slate-400"}`}>{s.title}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{s.body}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-purple-600">{String(s.hour).padStart(2,"0")}:00</span>
                        <span className="text-[10px] text-slate-400">{[1,2,3,4,5,6,0].filter(d => s.days.includes(d)).map(d => DAYS_LABELS[d]).join(" ")}</span>
                        {s.condition_type && (
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                            si {s.condition_days}d sin {CONDITION_LABELS[s.condition_type]}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => toggleSched(s.id, !s.active)}
                      className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${s.active ? "bg-purple-400" : "bg-slate-200"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${s.active ? "translate-x-5" : "translate-x-0.5"}`}/>
                    </button>
                  </div>
                  <div className="flex border-t border-slate-100">
                    <button onClick={() => sendSchedNow(s)} className="flex-1 py-2 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors">▶ Enviar ahora</button>
                    <button onClick={() => startEditSched(s)} className="flex-1 py-2 text-[11px] font-semibold text-violet-500 hover:bg-violet-50 transition-colors border-l border-slate-100">✏️ Editar</button>
                    <button onClick={() => removeSched(s.id)} className="flex-1 py-2 text-[11px] font-semibold text-red-400 hover:bg-red-50 transition-colors border-l border-slate-100">🗑 Borrar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ══ 10. NOTIFICACIONES ═══════════════════════════════════════════════ */}
        <div className="border-2 border-purple-200 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 shadow-md">
          <div className="px-4 py-3 bg-white/60 border-b border-purple-100 flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <span className="text-sm font-bold text-purple-800">Notificaciones push</span>
            {notifSubbed && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Activas</span>}
          </div>
          <div className="px-4 py-4 flex flex-col gap-3">
            {notifStatus === "unsupported" ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-amber-800">Navegador no compatible</p>
                <p className="text-xs text-amber-600 mt-1 leading-snug">Requiere iOS 16.4+ con la app añadida a la pantalla de inicio.</p>
              </div>
            ) : (
              <>
                <div className="bg-white/80 border border-purple-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-600 leading-snug">Recibe recordatorios y avisos directamente en tu móvil. 🌿</p>
                  {notifStatus !== "granted" && notifStatus !== "loading" && (
                    <p className="text-[11px] text-purple-500 mt-1.5">⚠️ Para iOS: añade la app a la pantalla de inicio y abre desde allí.</p>
                  )}
                </div>
                <button onClick={handleToggleNotif} disabled={notifWorking || notifStatus === "denied"}
                  className={`w-full py-3 rounded-2xl text-white font-bold text-sm active:scale-95 transition-all shadow-sm ${
                    notifWorking ? "bg-slate-300" : notifSubbed ? "bg-rose-400" : notifStatus === "denied" ? "bg-slate-300 text-slate-500" : "bg-purple-500"
                  }`}>
                  {notifWorking ? "Procesando…" : notifSubbed ? "🔕 Desactivar" : notifStatus === "denied" ? "Permiso bloqueado (ajusta en Ajustes)" : "🔔 Activar notificaciones"}
                </button>
                {notifSubbed && (
                  <button onClick={handleTestNotif} disabled={notifWorking}
                    className="w-full py-2.5 rounded-xl border border-purple-200 bg-white text-purple-700 text-sm font-semibold active:scale-95 transition-all">
                    🐿️ Enviar notificación de prueba
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ══ 11. EXPORTAR DATOS ═══════════════════════════════════════════════ */}
        <Section title="Exportar datos" emoji="📤">
          <p className="text-xs text-slate-400 -mt-1">
            Descarga todos los registros (diario, caca, emocional, prácticas) en un archivo JSON.
          </p>
          <button onClick={handleExport} disabled={exporting}
            className={`w-full py-3 rounded-2xl text-white font-bold text-sm active:scale-95 transition-all ${
              exporting ? "bg-slate-300" : "bg-teal-600 shadow-sm"
            }`}>
            {exporting ? "Exportando…" : "📥 Descargar todos los logs"}
          </button>
        </Section>

        {/* ══ 12. ADMINISTRACIÓN ══════════════════════════════════════════════ */}
        <Section title="Administración" emoji="🔧">
          <p className="text-xs text-slate-400 -mt-1">Sincronización con Supabase y reinicio de datos.</p>

          {/* Sincronización */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 flex flex-col gap-2">
            <div>
              <p className="text-sm font-semibold text-sky-800">☁️ Sincronización con la nube</p>
              <p className="text-xs text-sky-600 mt-0.5 leading-snug">
                Los cambios se suben automáticamente. Usa estos botones para forzar la sincronización entre dispositivos.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={pullCloud}
                className="flex-1 px-3 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold active:scale-95 shadow-sm">
                ⬇️ Bajar de la nube
              </button>
              <button onClick={pushCloud}
                className="flex-1 px-3 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold active:scale-95 shadow-sm">
                ⬆️ Subir a la nube
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Reiniciar premios diarios</p>
                <p className="text-xs text-slate-400 mt-0.5">Permite volver a ganar XP hoy.</p>
              </div>
              <button onClick={resetDailyAwards}
                className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold active:scale-95 shadow-sm">
                Reiniciar
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
              <div>
                <p className="text-sm font-semibold text-red-700">Reiniciar todo el progreso</p>
                <p className="text-xs text-red-400 mt-0.5">Pone XP y bellotas a 0. Irreversible.</p>
              </div>
              <button onClick={resetAllProgress}
                className="shrink-0 px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold active:scale-95 shadow-sm">
                Reset
              </button>
            </div>
          </div>
        </Section>

      </div>

      {/* Toast */}
      {adminMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl whitespace-nowrap">
          {adminMsg}
        </div>
      )}

    </div>
  );
}
