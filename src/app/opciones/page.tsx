"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const DEFAULT_PHRASES = [
  "¡Hola Vicky! Te queremos mucho 🤍",
  "Cada registro es un paso adelante 🌱",
  "Tus emociones siempre tienen sentido 💙",
  "Eres más fuerte de lo que crees 💪",
  "Hoy también cuenta 🌟",
  "Pequeños pasos, grandes cambios 🐌",
  "Cuidarte es lo más valiente que puedes hacer 🌿",
];

export default function Opciones() {
  const [customPhrases, setCustomPhrases] = useState<string[]>([]);
  const [newPhrase, setNewPhrase] = useState("");
  const [snailImage, setSnailImage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("custom_phrases");
      if (stored) setCustomPhrases(JSON.parse(stored) as string[]);
    } catch {}
    setSnailImage(localStorage.getItem("snail_image"));
  }, []);

  function saveCustomPhrases(phrases: string[]) {
    setCustomPhrases(phrases);
    localStorage.setItem("custom_phrases", JSON.stringify(phrases));
  }

  function addPhrase() {
    const trimmed = newPhrase.trim();
    if (!trimmed) return;
    saveCustomPhrases([...customPhrases, trimmed]);
    setNewPhrase("");
  }

  function removePhrase(idx: number) {
    saveCustomPhrases(customPhrases.filter((_, i) => i !== idx));
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      localStorage.setItem("snail_image", base64);
      setSnailImage(base64);
    };
    reader.readAsDataURL(file);
  }

  function removeSnailImage() {
    localStorage.removeItem("snail_image");
    setSnailImage(null);
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-10">

      {/* Header */}
      <header className="flex items-center gap-3 mb-8">
        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-lg transition-colors">
          ←
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Opciones</h1>
      </header>

      {/* ── Frases motivadoras ── */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-slate-700 mb-1">Frases motivadoras</h2>
        <p className="text-xs text-slate-400 mb-4">Aparecen en la pantalla de inicio, rotando cada varios segundos.</p>

        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Predeterminadas</p>
        <div className="flex flex-col gap-2 mb-5">
          {DEFAULT_PHRASES.map((p, i) => (
            <div key={i} className="bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-500 border border-slate-200">
              {p}
            </div>
          ))}
        </div>

        {customPhrases.length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-teal-600 uppercase tracking-wide mb-2">Tus frases</p>
            <div className="flex flex-col gap-2 mb-4">
              {customPhrases.map((p, i) => (
                <div key={i} className="bg-teal-50 rounded-xl px-4 py-2.5 flex items-center gap-2 border border-teal-200">
                  <span className="flex-1 text-sm text-teal-800">{p}</span>
                  <button
                    onClick={() => removePhrase(i)}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 text-xl leading-none transition-colors shrink-0"
                    aria-label="Eliminar frase"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-2 mt-2">
          <input
            value={newPhrase}
            onChange={e => setNewPhrase(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addPhrase()}
            placeholder="Escribe una frase personalizada…"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 bg-white text-slate-800 placeholder:text-slate-300"
          />
          <button
            onClick={addPhrase}
            className="w-12 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xl active:scale-95 transition-all"
          >
            +
          </button>
        </div>
      </section>

      {/* ── Imagen del caracol ── */}
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-1">Imagen del caracol</h2>
        <p className="text-xs text-slate-400 mb-4">
          Tu imagen aparecerá en el apartado de Formaciones, con sombrero de profe incluido.
        </p>

        {snailImage ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-36 h-36 rounded-2xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={snailImage} alt="Tu caracol" className="w-full h-full object-contain p-2"/>
            </div>
            <div className="flex gap-3">
              <label className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 cursor-pointer hover:border-teal-400 hover:text-teal-600 transition-colors">
                Cambiar imagen
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
              </label>
              <button
                onClick={removeSnailImage}
                className="px-4 py-2 rounded-xl border border-red-200 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-3 border-2 border-dashed border-slate-300 rounded-2xl p-8 cursor-pointer hover:border-teal-400 transition-colors active:scale-98">
            <span className="text-5xl">🐌</span>
            <span className="text-sm font-semibold text-slate-600">Toca para subir una imagen</span>
            <span className="text-xs text-slate-400">PNG, JPG o GIF</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
          </label>
        )}
      </section>

    </div>
  );
}
