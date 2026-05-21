"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  getShopBellotas, saveShopBellotas,
  getShopRata,     saveShopRata,
  getShopAvatares, saveShopAvatares,
  getShopTitulos,  saveShopTitulos,
  cleanupLegacyDefaults,
  ShopItem, AvatarItem, TituloItem,
} from "@/lib/shop";
import { getPlayerProfile, upsertPlayerProfile } from "@/lib/db";

const DEFAULT_PHRASES = [
  "¡Hola Vicky! Te queremos mucho 🤍",
  "Cada registro es un paso adelante 🌱",
  "Tus emociones siempre tienen sentido 💙",
  "Eres más fuerte de lo que crees 💪",
  "Hoy también cuenta 🌟",
  "Pequeños pasos, grandes cambios 🐌",
  "Cuidarte es lo más valiente que puedes hacer 🌿",
];

const EMOJIS_BELL = ["🌰","🎁","🎮","🎵","🌈","🎭","🌟","⭐","🏆","🎯","💎","👑","🌸","🦋","🎨","🧸","🪄","🍀","🌺","🎠","🪆","🫧","🌙","✨","🎪"];
const EMOJIS_RATA = ["🐀","🐭","🧀","🔮","🗡️","🧙","💀","🦇","⚡","🌑","💫","🃏","🎲","🌙","🔴","🕷️","👁️","☠️","🪄","🎴","🧪","🌑","🔪","🎭","🕰️"];

/* ── Formulario de item de tienda ────────────────────────────────────────── */
function ShopItemForm({
  onAdd,
  emojiSuggestions,
  accentColor,
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
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Emoji del artículo</p>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-10 h-10 rounded-xl ${accentColor} flex items-center justify-center text-xl shrink-0`}>
            {emoji}
          </div>
          <input
            value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={4}
            className="w-16 border border-slate-200 rounded-xl px-2 py-2 text-center text-lg focus:outline-none focus:border-violet-400 bg-white"
          />
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
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="Ej: Peluche de apoyo"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 bg-white placeholder:text-slate-300"/>
      </div>

      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Descripción</p>
        <input value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="Descripción corta del artículo"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 bg-white placeholder:text-slate-300"/>
      </div>

      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Precio en 🌰 *</p>
        <input value={price} onChange={e => setPrice(e.target.value.replace(/\D/g,""))}
          placeholder="Ej: 50" inputMode="numeric"
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
    setEditingId(item.id);
    setEditEmoji(item.emoji);
    setEditName(item.name);
    setEditDesc(item.desc);
    setEditPrice(String(item.price));
  }
  function cancelEdit() { setEditingId(null); }
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
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  placeholder="Nombre"
                  className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-violet-400"/>
                <input value={editPrice} onChange={e => setEditPrice(e.target.value.replace(/\D/g,""))}
                  placeholder="🌰" inputMode="numeric"
                  className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-violet-400"/>
              </div>
              <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
                placeholder="Descripción"
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-violet-400"/>
              <div className="flex gap-2">
                <button onClick={() => saveEdit(item.id)}
                  className="flex-1 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold active:scale-95 transition-all">
                  Guardar ✓
                </button>
                <button onClick={cancelEdit}
                  className="flex-1 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold active:scale-95 transition-all">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className={`w-9 h-9 rounded-lg ${accentColor} flex items-center justify-center text-lg shrink-0`}>
                {item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">{item.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{item.price} 🌰 · {item.desc || "Sin descripción"}</p>
              </div>
              <button onClick={() => startEdit(item)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-violet-400 hover:bg-violet-50 text-sm shrink-0 transition-colors">
                ✏️
              </button>
              <button onClick={() => onRemove(item.id)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 text-lg leading-none shrink-0 transition-colors">
                ×
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Sección colapsable ───────────────────────────────────────────────────── */
function Section({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span className="text-sm font-bold text-slate-700">{title}</span>
        </div>
        <span className={`text-slate-400 text-lg transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && <div className="px-4 pb-4 border-t border-slate-100 pt-3 flex flex-col gap-3">{children}</div>}
    </div>
  );
}

/* ══ PÁGINA PRINCIPAL ════════════════════════════════════════════════════════ */
export default function Opciones() {
  const [customPhrases, setCustomPhrases] = useState<string[]>([]);
  const [newPhrase,     setNewPhrase]     = useState("");
  const [snailImage,    setSnailImage]    = useState<string | null>(null);

  const [shopBell,    setShopBell]    = useState<ShopItem[]>([]);
  const [shopRata,    setShopRata]    = useState<ShopItem[]>([]);
  const [shopAv,      setShopAv]      = useState<AvatarItem[]>([]);
  const [shopTitulos, setShopTitulos] = useState<TituloItem[]>([]);
  const [newTitulo,   setNewTitulo]   = useState("");

  // Edición de título
  const [editingTituloId,   setEditingTituloId]   = useState<string | null>(null);
  const [editingTituloText, setEditingTituloText] = useState("");

  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  const avInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Limpia artículos por defecto de versiones anteriores
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
  }, []);

  function showAdminMsg(msg: string) {
    setAdminMsg(msg);
    setTimeout(() => setAdminMsg(null), 3000);
  }

  // ── frases ────────────────────────────────────────────────────────────────
  function saveCustomPhrases(phrases: string[]) {
    setCustomPhrases(phrases);
    localStorage.setItem("custom_phrases", JSON.stringify(phrases));
  }
  function addPhrase() {
    const t = newPhrase.trim(); if (!t) return;
    saveCustomPhrases([...customPhrases, t]); setNewPhrase("");
  }
  function removePhrase(i: number) { saveCustomPhrases(customPhrases.filter((_, j) => j !== i)); }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      localStorage.setItem("snail_image", b64);
      setSnailImage(b64);
    };
    reader.readAsDataURL(file);
  }
  function removeSnailImage() { localStorage.removeItem("snail_image"); setSnailImage(null); }

  // ── Bellotas ──────────────────────────────────────────────────────────────
  function addBell(item: Omit<ShopItem,"id">) {
    const updated = [...shopBell, { ...item, id: `b_${Date.now()}` }];
    setShopBell(updated); saveShopBellotas(updated);
  }
  function removeBell(id: string) {
    const updated = shopBell.filter(i => i.id !== id);
    setShopBell(updated); saveShopBellotas(updated);
  }
  function updateBell(id: string, data: Omit<ShopItem,"id">) {
    const updated = shopBell.map(i => i.id === id ? { ...i, ...data } : i);
    setShopBell(updated); saveShopBellotas(updated);
  }

  // ── Rata ──────────────────────────────────────────────────────────────────
  function addRata(item: Omit<ShopItem,"id">) {
    const updated = [...shopRata, { ...item, id: `r_${Date.now()}` }];
    setShopRata(updated); saveShopRata(updated);
  }
  function removeRata(id: string) {
    const updated = shopRata.filter(i => i.id !== id);
    setShopRata(updated); saveShopRata(updated);
  }
  function updateRata(id: string, data: Omit<ShopItem,"id">) {
    const updated = shopRata.map(i => i.id === id ? { ...i, ...data } : i);
    setShopRata(updated); saveShopRata(updated);
  }

  // ── Avatares ──────────────────────────────────────────────────────────────
  function handleAvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      const name = file.name.replace(/\.[^.]+$/, "");
      const updated = [...shopAv, { id: `av_${Date.now()}`, name, img64: b64 }];
      setShopAv(updated); saveShopAvatares(updated);
    };
    reader.readAsDataURL(file);
    if (avInputRef.current) avInputRef.current.value = "";
  }
  function removeAv(id: string) {
    const updated = shopAv.filter(a => a.id !== id);
    setShopAv(updated); saveShopAvatares(updated);
  }

  // ── Títulos ───────────────────────────────────────────────────────────────
  function addTitulo() {
    const t = newTitulo.trim(); if (!t) return;
    const updated = [...shopTitulos, { id: `t_${Date.now()}`, text: t }];
    setShopTitulos(updated); saveShopTitulos(updated); setNewTitulo("");
  }
  function removeTitulo(id: string) {
    const updated = shopTitulos.filter(t => t.id !== id);
    setShopTitulos(updated); saveShopTitulos(updated);
  }
  function startEditTitulo(t: TituloItem) {
    setEditingTituloId(t.id);
    setEditingTituloText(t.text);
  }
  function saveEditTitulo(id: string) {
    const text = editingTituloText.trim(); if (!text) return;
    const updated = shopTitulos.map(t => t.id === id ? { ...t, text } : t);
    setShopTitulos(updated); saveShopTitulos(updated);
    setEditingTituloId(null);
  }

  // ── Admin: reiniciar premios diarios ─────────────────────────────────────
  async function resetDailyAwards() {
    try {
      const profile = await getPlayerProfile();
      await upsertPlayerProfile({ ...profile, dailyAwards: {} });
      showAdminMsg("✓ Premios diarios reiniciados");
    } catch { showAdminMsg("Error al reiniciar"); }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-16">

      <header className="flex items-center gap-3 mb-8">
        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-lg transition-colors">←</Link>
        <h1 className="text-xl font-bold text-slate-800">Ajustes</h1>
      </header>

      {/* ══ FRASES MOTIVADORAS ══ */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-slate-700 mb-1">Frases motivadoras</h2>
        <p className="text-xs text-slate-400 mb-4">Aparecen en la pantalla de celebración al guardar un registro.</p>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Predeterminadas</p>
        <div className="flex flex-col gap-2 mb-5">
          {DEFAULT_PHRASES.map((p, i) => (
            <div key={i} className="bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-500 border border-slate-200">{p}</div>
          ))}
        </div>
        {customPhrases.length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-teal-600 uppercase tracking-wide mb-2">Tus frases</p>
            <div className="flex flex-col gap-2 mb-4">
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
        <div className="flex gap-2 mt-2">
          <input value={newPhrase} onChange={e => setNewPhrase(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addPhrase()}
            placeholder="Escribe una frase personalizada…"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 bg-white text-slate-800 placeholder:text-slate-300"/>
          <button onClick={addPhrase}
            className="w-12 bg-teal-600 text-white rounded-xl font-bold text-xl active:scale-95 transition-all">+</button>
        </div>
      </section>

      {/* ══ IMAGEN DEL CARACOL ══ */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-slate-700 mb-1">Imagen del caracol</h2>
        <p className="text-xs text-slate-400 mb-4">Tu imagen aparecerá en Formaciones con sombrero de profe.</p>
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
      </section>

      {/* ══ GESTIÓN DE TIENDAS ══ */}
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-700 mb-1">Gestión de la Tienda</h2>
        <p className="text-xs text-slate-400 mb-4">Añade, edita y elimina artículos de cada sección.</p>
      </div>

      <div className="flex flex-col gap-3 mb-10">

        {/* ── Tienda de Bellotas ── */}
        <Section title="Tienda de Bellotas" emoji="🌰">
          <ShopItemForm onAdd={addBell} emojiSuggestions={EMOJIS_BELL} accentColor="bg-amber-100"/>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Artículos ({shopBell.length})
            </p>
            <ShopItemList items={shopBell} onRemove={removeBell} onUpdate={updateBell} accentColor="bg-amber-100"/>
          </div>
        </Section>

        {/* ── Tienda de La Rata ── */}
        <Section title="Tienda de La Rata" emoji="🐀">
          <ShopItemForm onAdd={addRata} emojiSuggestions={EMOJIS_RATA} accentColor="bg-violet-100"/>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Artículos ({shopRata.length})
            </p>
            <ShopItemList items={shopRata} onRemove={removeRata} onUpdate={updateRata} accentColor="bg-violet-100"/>
          </div>
        </Section>

        {/* ── Avatares ── */}
        <Section title="Avatares" emoji="🖼️">
          <div>
            <p className="text-xs text-slate-500 mb-3">Sube imágenes pequeñas (PNG, JPG, GIF).</p>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-2xl py-4 cursor-pointer hover:border-violet-400 transition-colors">
              <span className="text-2xl">📸</span>
              <span className="text-sm font-semibold text-slate-600">Subir avatar</span>
              <input ref={avInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvUpload}/>
            </label>
          </div>
          {shopAv.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Avatares subidos ({shopAv.length})</p>
              <div className="flex flex-col gap-2">
                {shopAv.map(av => (
                  <div key={av.id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={av.img64} alt={av.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200"/>
                    <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{av.name}</span>
                    <button onClick={() => removeAv(av.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 text-lg leading-none">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* ── Títulos ── */}
        <Section title="Títulos" emoji="🏷️">
          <div>
            <p className="text-xs text-slate-500 mb-3">Añade títulos que Vicky podrá equipar en la tienda.</p>
            <div className="flex gap-2">
              <input value={newTitulo} onChange={e => setNewTitulo(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTitulo()}
                placeholder="Ej: Maestra de la Calma 🌿"
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 bg-white placeholder:text-slate-300"/>
              <button onClick={addTitulo}
                className="w-11 bg-violet-600 text-white rounded-xl font-bold text-xl active:scale-95 transition-all">+</button>
            </div>
          </div>
          {shopTitulos.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Títulos ({shopTitulos.length})</p>
              <div className="flex flex-col gap-1.5">
                {shopTitulos.map(t => (
                  <div key={t.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {editingTituloId === t.id ? (
                      <div className="flex items-center gap-2 px-3 py-2">
                        <input value={editingTituloText} onChange={e => setEditingTituloText(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && saveEditTitulo(t.id)}
                          className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-violet-400"/>
                        <button onClick={() => saveEditTitulo(t.id)}
                          className="px-2 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold active:scale-95">✓</button>
                        <button onClick={() => setEditingTituloId(null)}
                          className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold active:scale-95">✗</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <span className="text-sm">🏷️</span>
                        <span className="flex-1 text-xs font-semibold text-slate-700">{t.text}</span>
                        <button onClick={() => startEditTitulo(t)}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-violet-400 hover:bg-violet-50 text-sm transition-colors">✏️</button>
                        <button onClick={() => removeTitulo(t.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 text-lg leading-none transition-colors">×</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

      </div>

      {/* ══ ADMINISTRACIÓN ══ */}
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-700 mb-1">Administración</h2>
        <p className="text-xs text-slate-400 mb-4">Opciones para reiniciar datos del sistema de recompensas.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Reiniciar premios diarios</p>
            <p className="text-xs text-slate-400 mt-0.5">Permite volver a ganar XP hoy si hubo algún error.</p>
          </div>
          <button onClick={resetDailyAwards}
            className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold active:scale-95 transition-all shadow-sm">
            Reiniciar
          </button>
        </div>
      </div>

      {/* Toast admin */}
      {adminMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl whitespace-nowrap">
          {adminMsg}
        </div>
      )}

    </div>
  );
}
