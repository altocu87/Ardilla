"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ALL_ACHIEVEMENTS,
  CATEGORY_INFO,
  getAchievementState,
  formatUnlockDate,
  type Achievement,
  type AchievementCategory,
} from "@/lib/tama-achievements";
import { checkAllAchievements } from "@/lib/achievement-checker";

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Filter = "todas" | AchievementCategory;

// ── Componente tarjeta ────────────────────────────────────────────────────────
function AchievementCard({
  ach,
  unlocked,
  timestamp,
  isNew,
}: {
  ach: Achievement;
  unlocked: boolean;
  timestamp: string | null;
  isNew: boolean;
}) {
  const cat = CATEGORY_INFO[ach.category];
  const isSecret = ach.secret && !unlocked;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-2xl border p-4 transition-all
        ${unlocked
          ? `${cat.bg} ${cat.border} shadow-sm`
          : "bg-slate-50 border-slate-200 opacity-60"
        }
        ${isNew ? "ring-2 ring-yellow-400 ring-offset-1" : ""}
      `}
    >
      {/* Nuevo badge */}
      {isNew && (
        <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
          ¡NUEVO!
        </span>
      )}

      <div className="flex items-start gap-3">
        {/* Emoji */}
        <div className={`text-3xl flex-shrink-0 ${!unlocked ? "grayscale opacity-40" : ""}`}>
          {isSecret ? "🔒" : ach.emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-sm ${unlocked ? "text-slate-800" : "text-slate-400"}`}>
              {isSecret ? "???" : ach.title}
            </span>
            {/* Categoría chip */}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${cat.bg} ${cat.border} ${cat.text}`}>
              {cat.emoji} {cat.label}
            </span>
          </div>

          <p className={`text-xs mt-0.5 ${unlocked ? "text-slate-600" : "text-slate-400"}`}>
            {isSecret ? "Descubre este logro secreto" : ach.desc}
          </p>

          {/* Recompensas */}
          {!isSecret && (
            <div className="flex flex-wrap gap-1 mt-2">
              {ach.rewardBellotas > 0 && (
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full
                  ${unlocked ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"}`}>
                  🌰 {ach.rewardBellotas}
                </span>
              )}
              {ach.rewardDesc && (
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full
                  ${unlocked ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-400"}`}>
                  {ach.rewardDesc}
                </span>
              )}
            </div>
          )}

          {/* Fecha de desbloqueo */}
          {unlocked && timestamp && (
            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
              <span>🏅</span>
              <span>Desbloqueado el {formatUnlockDate(timestamp)}</span>
            </p>
          )}
        </div>

        {/* Check */}
        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5
          ${unlocked ? "bg-green-500" : "bg-slate-200"}`}>
          {unlocked
            ? <span className="text-white text-xs">✓</span>
            : <span className="text-slate-300 text-xs">○</span>
          }
        </div>
      </div>
    </motion.div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function LogrosPage() {
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [timestamps, setTimestamps] = useState<Record<string, string>>({});
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("todas");
  const [checking, setChecking] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  // ── Carga inicial + check ───────────────────────────────────────────────────
  const loadState = useCallback(() => {
    const state = getAchievementState();
    setUnlockedIds(new Set(state.unlocked));
    setTimestamps(state.timestamps ?? {});
  }, []);

  useEffect(() => {
    loadState();
    checkAllAchievements()
      .then(newly => {
        loadState();
        if (newly.length > 0) {
          setNewIds(new Set(newly.map(a => a.id)));
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 4000);
        }
      })
      .catch(console.error)
      .finally(() => setChecking(false));
  }, [loadState]);

  // ── Derivados ──────────────────────────────────────────────────────────────
  const totalCount    = ALL_ACHIEVEMENTS.length;
  const unlockedCount = unlockedIds.size;
  const progress      = Math.round((unlockedCount / totalCount) * 100);

  const categories: { key: Filter; label: string; emoji: string }[] = [
    { key: "todas",     label: "Todas",     emoji: "🏆" },
    ...Object.entries(CATEGORY_INFO).map(([k, v]) => ({
      key: k as AchievementCategory,
      label: v.label,
      emoji: v.emoji,
    })),
  ];

  const filtered = ALL_ACHIEVEMENTS.filter(a =>
    filter === "todas" || a.category === filter
  );

  // Ordenar: primero desbloqueadas (por timestamp desc), luego bloqueadas
  const sorted = [...filtered].sort((a, b) => {
    const aU = unlockedIds.has(a.id);
    const bU = unlockedIds.has(b.id);
    if (aU && !bU) return -1;
    if (!aU && bU) return 1;
    if (aU && bU) {
      const ta = timestamps[a.id] ?? "";
      const tb = timestamps[b.id] ?? "";
      return tb.localeCompare(ta);
    }
    return 0;
  });

  const filteredUnlocked = sorted.filter(a => unlockedIds.has(a.id)).length;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">

      {/* ── Banner de celebración ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center shadow-sm"
          >
            <p className="text-2xl mb-1">🎉</p>
            <p className="font-bold text-yellow-800 text-sm">
              ¡{newIds.size} logro{newIds.size !== 1 ? "s" : ""} desbloqueado{newIds.size !== 1 ? "s" : ""}!
            </p>
            <p className="text-yellow-700 text-xs mt-0.5">Las recompensas ya están en tu cuenta</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          🏆 Mis logros
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {checking ? "Comprobando logros…" : `${unlockedCount} de ${totalCount} desbloqueados`}
        </p>

        {/* Barra de progreso */}
        <div className="mt-3 bg-slate-100 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-amber-400"
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 mt-1">
          <span>{progress}% completado</span>
          <span>{totalCount - unlockedCount} restantes</span>
        </div>
      </div>

      {/* ── Filtros por categoría ────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {categories.map(c => {
          const isActive = filter === c.key;
          const catUnlocked = c.key === "todas"
            ? unlockedCount
            : ALL_ACHIEVEMENTS.filter(a => a.category === c.key && unlockedIds.has(a.id)).length;
          const catTotal = c.key === "todas"
            ? totalCount
            : ALL_ACHIEVEMENTS.filter(a => a.category === c.key).length;
          return (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`flex-shrink-0 flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border transition-all
                ${isActive
                  ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"
                }`}
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
              <span className={`text-[10px] ${isActive ? "text-violet-200" : "text-slate-400"}`}>
                {catUnlocked}/{catTotal}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Contador de filtro activo ────────────────────────────────────── */}
      {filter !== "todas" && (
        <p className="text-xs text-slate-500 mb-3">
          {filteredUnlocked} de {sorted.length} desbloqueados en esta categoría
        </p>
      )}

      {/* ── Lista de logros ──────────────────────────────────────────────── */}
      {checking ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <div className="text-3xl mb-3 animate-bounce">🐿️</div>
          <p className="text-sm">Comprobando logros…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map(ach => (
            <AchievementCard
              key={ach.id}
              ach={ach}
              unlocked={unlockedIds.has(ach.id)}
              timestamp={timestamps[ach.id] ?? null}
              isNew={newIds.has(ach.id)}
            />
          ))}
        </div>
      )}

      {/* ── Footer con stats ─────────────────────────────────────────────── */}
      {!checking && (
        <div className="mt-8 bg-gradient-to-r from-violet-50 to-amber-50 rounded-2xl border border-violet-100 p-4 text-center">
          <p className="text-3xl font-bold text-violet-700">{unlockedCount}</p>
          <p className="text-sm text-violet-600 font-medium">logros conseguidos</p>
          <div className="flex justify-center gap-4 mt-3 text-xs text-slate-500">
            {Object.entries(CATEGORY_INFO).map(([k, v]) => {
              const n = ALL_ACHIEVEMENTS.filter(a => a.category === k && unlockedIds.has(a.id)).length;
              const t = ALL_ACHIEVEMENTS.filter(a => a.category === k).length;
              return (
                <span key={k}>{v.emoji} {n}/{t}</span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
