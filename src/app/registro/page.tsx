"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getPregLog, getCacaLog } from "@/lib/db";

function SquirrelIcon() {
  return (
    <svg viewBox="0 0 120 130" width="110" height="110" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="90" cy="68" rx="22" ry="36" fill="#d4893a" transform="rotate(15 90 68)" />
      <ellipse cx="89" cy="67" rx="15" ry="27" fill="#e8a84e" transform="rotate(15 89 67)" />
      <ellipse cx="58" cy="88" rx="24" ry="26" fill="#c47830" />
      <ellipse cx="58" cy="91" rx="14" ry="18" fill="#f0c87a" />
      <ellipse cx="58" cy="52" rx="21" ry="20" fill="#c47830" />
      <ellipse cx="43" cy="35" rx="8" ry="12" fill="#c47830" />
      <ellipse cx="73" cy="35" rx="8" ry="12" fill="#c47830" />
      <ellipse cx="43" cy="36" rx="5" ry="8" fill="#f0a0a0" />
      <ellipse cx="73" cy="36" rx="5" ry="8" fill="#f0a0a0" />
      <circle cx="51" cy="50" r="4.5" fill="#1a0a00" />
      <circle cx="65" cy="50" r="4.5" fill="#1a0a00" />
      <circle cx="52" cy="48.5" r="1.8" fill="white" />
      <circle cx="66" cy="48.5" r="1.8" fill="white" />
      <ellipse cx="58" cy="57" rx="3.5" ry="2.5" fill="#c05030" />
      <ellipse cx="45" cy="57" rx="5" ry="3.5" fill="#e8906080" />
      <ellipse cx="71" cy="57" rx="5" ry="3.5" fill="#e8906080" />
      <ellipse cx="40" cy="82" rx="9" ry="7" fill="#c47830" transform="rotate(-30 40 82)" />
      <ellipse cx="76" cy="82" rx="9" ry="7" fill="#c47830" transform="rotate(30 76 82)" />
      <ellipse cx="58" cy="107" rx="13" ry="6" fill="#6b3a1f" />
      <rect x="47" y="106" width="22" height="5" rx="2" fill="#5a2e10" />
      <line x1="58" y1="101" x2="58" y2="96" stroke="#4a2508" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="58" cy="116" rx="11" ry="12" fill="#a0622a" />
      <ellipse cx="58" cy="116" rx="8" ry="9" fill="#b87835" />
    </svg>
  );
}

function LitterBoxIcon() {
  return (
    <svg viewBox="0 0 130 120" width="120" height="110" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="55" width="110" height="55" rx="10" fill="#b0c4d8" />
      <rect x="18" y="62" width="94" height="42" rx="7" fill="#e8d898" />
      <ellipse cx="35" cy="90" rx="8" ry="4" fill="#d4c078" />
      <ellipse cx="60" cy="95" rx="10" ry="4" fill="#d4c078" />
      <ellipse cx="90" cy="88" rx="7" ry="3.5" fill="#d4c078" />
      <ellipse cx="48" cy="82" rx="6" ry="3" fill="#c8b460" />
      <ellipse cx="78" cy="92" rx="8" ry="3.5" fill="#c8b460" />
      <rect x="10" y="55" width="110" height="10" rx="8" fill="#9ab4cc" />
      <ellipse cx="65" cy="58" rx="20" ry="18" fill="#f0a050" />
      <circle cx="65" cy="36" r="18" fill="#f0a050" />
      <polygon points="50,24 44,8 58,20" fill="#f0a050" />
      <polygon points="80,24 86,8 72,20" fill="#f0a050" />
      <polygon points="51,23 46,11 57,20" fill="#f0c0a0" />
      <polygon points="79,23 84,11 73,20" fill="#f0c0a0" />
      <circle cx="58" cy="33" r="4" fill="#1a1a2e" />
      <circle cx="72" cy="33" r="4" fill="#1a1a2e" />
      <circle cx="59" cy="31.5" r="1.8" fill="white" />
      <circle cx="73" cy="31.5" r="1.8" fill="white" />
      <ellipse cx="65" cy="39" rx="3" ry="2" fill="#e06080" />
      <path d="M 62 41 Q 65 44 68 41" stroke="#c04060" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <line x1="65" y1="39" x2="40" y2="36" stroke="#88440088" strokeWidth="1.2" />
      <line x1="65" y1="39" x2="40" y2="40" stroke="#88440088" strokeWidth="1.2" />
      <line x1="65" y1="39" x2="90" y2="36" stroke="#88440088" strokeWidth="1.2" />
      <line x1="65" y1="39" x2="90" y2="40" stroke="#88440088" strokeWidth="1.2" />
      <ellipse cx="52" cy="38" rx="5" ry="3.5" fill="#f0806060" />
      <ellipse cx="78" cy="38" rx="5" ry="3.5" fill="#f0806060" />
      <circle cx="30" cy="77" r="3" fill="#c8a050" />
      <circle cx="27" cy="72" r="2" fill="#c8a050" />
      <circle cx="31" cy="71" r="2" fill="#c8a050" />
      <circle cx="35" cy="72" r="2" fill="#c8a050" />
      <circle cx="100" cy="80" r="3" fill="#c8a050" />
      <circle cx="97" cy="75" r="2" fill="#c8a050" />
      <circle cx="101" cy="74" r="2" fill="#c8a050" />
      <circle cx="105" cy="75" r="2" fill="#c8a050" />
    </svg>
  );
}

function AcornIcon({ filled, diamond, isToday }: { filled: boolean; diamond: boolean; isToday: boolean }) {
  if (diamond) {
    return (
      <svg viewBox="0 0 28 36" width="26" height="34" style={{ animation: "iridescent 2.5s linear infinite", filter: "saturate(1.8) brightness(1.15)" }}>
        <ellipse cx="14" cy="12" rx="11" ry="5.5" fill="#7dd3fc" />
        {[6,9,12,15,18,21].map(x => <line key={x} x1={x} y1="11" x2={x+1} y2="16" stroke="#38bdf8" strokeWidth="0.8"/>)}
        <line x1="14" y1="6" x2="14" y2="2" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="14" cy="27" rx="10" ry="11" fill="#a5f3fc" />
        <ellipse cx="10" cy="22" rx="3" ry="4" fill="white" fillOpacity="0.4" transform="rotate(-15 10 22)"/>
        <ellipse cx="16" cy="30" rx="2" ry="1.5" fill="white" fillOpacity="0.3"/>
      </svg>
    );
  }
  if (!filled && isToday) {
    return (
      <svg viewBox="0 0 28 36" width="26" height="34">
        <ellipse cx="14" cy="12" rx="11" ry="5.5" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
        <line x1="14" y1="6" x2="14" y2="2" stroke="#0d9488" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="14" cy="27" rx="10" ry="11" fill="none" stroke="#0d9488" strokeWidth="1.5"/>
      </svg>
    );
  }
  if (!filled) {
    return (
      <svg viewBox="0 0 28 36" width="26" height="34">
        <ellipse cx="14" cy="12" rx="11" ry="5.5" fill="#e2e8f0"/>
        <line x1="14" y1="6" x2="14" y2="2" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="14" cy="27" rx="10" ry="11" fill="#f1f5f9"/>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 28 36" width="26" height="34">
      <ellipse cx="14" cy="12" rx="11" ry="5.5" fill="#6b3a1f"/>
      {[6,9,12,15,18,21].map(x => <line key={x} x1={x} y1="11" x2={x+1} y2="16" stroke="#4a2508" strokeWidth="0.8"/>)}
      <line x1="14" y1="6" x2="14" y2="2" stroke="#4a2508" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="14" cy="27" rx="10" ry="11" fill="#a0622a"/>
      <ellipse cx="10" cy="22" rx="3" ry="4" fill="white" fillOpacity="0.2" transform="rotate(-15 10 22)"/>
    </svg>
  );
}

function formatLastDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  const timeStr = d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Hoy a las ${timeStr}`;
  return `${d.toLocaleDateString("es", { day: "numeric", month: "short" })} · ${timeStr}`;
}

function calcStreak(log: Record<string, unknown>): number {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (log[key]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getWeekDots(log: Record<string, unknown>) {
  const labels = ["L", "M", "X", "J", "V", "S", "D"];
  const today = new Date();
  const dow = today.getDay(); // 0=dom
  const mondayOffset = (dow + 6) % 7;
  return labels.map((label, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - mondayOffset + i);
    const key = d.toISOString().slice(0, 10);
    const isToday = i === mondayOffset;
    return { label, hasEntry: !!log[key], isToday };
  });
}

export default function Registro() {
  const [lastDiario, setLastDiario] = useState<string | null>(null);
  const [lastCaca, setLastCaca] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [weekDots, setWeekDots] = useState<{ label: string; hasEntry: boolean; isToday: boolean }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [pregLog, cacaLog] = await Promise.all([getPregLog(), getCacaLog()]);
        const pregDates = Object.keys(pregLog).sort().reverse();
        if (pregDates.length > 0) setLastDiario(pregLog[pregDates[0]]?.savedAt ?? null);
        setStreak(calcStreak(pregLog));
        setWeekDots(getWeekDots(pregLog));
        const allCaca = Object.values(cacaLog).flat().sort((a, b) => b.savedAt.localeCompare(a.savedAt));
        if (allCaca.length > 0) setLastCaca(allCaca[0].savedAt);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-teal-50 to-emerald-100 flex flex-col pb-20">
      <div className="max-w-lg mx-auto w-full px-5 pt-10 flex flex-col gap-5">

        <div className="flex items-center justify-between mb-1">
          <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/70 text-slate-600 text-lg shadow-sm">🏠</Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-700 tracking-tight">Registro</h1>
            <p className="text-slate-400 text-sm mt-1">¿Qué quieres registrar hoy?</p>
          </div>
          <div className="w-9" />
        </div>

        {/* Racha + mini-semana con bellotas */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-sm flex items-center gap-4">
          <style>{`@keyframes iridescent { 0% { filter: hue-rotate(0deg) saturate(1.8) brightness(1.15); } 100% { filter: hue-rotate(360deg) saturate(1.8) brightness(1.15); } }`}</style>
          <div className="flex flex-col items-center min-w-[48px]">
            <span className="text-xl">{streak >= 1 ? "🔥" : "💤"}</span>
            <span className="text-lg font-bold text-slate-700 leading-tight">{streak}</span>
            <span className="text-[10px] text-slate-400 font-medium">{streak === 1 ? "día" : "días"}</span>
          </div>
          <div className="w-px h-10 bg-slate-200" />
          <div className="flex-1 flex justify-between items-end gap-0.5">
            {(() => {
              const lastIdx = weekDots.map(d => d.hasEntry).lastIndexOf(true);
              return weekDots.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <AcornIcon filled={d.hasEntry} diamond={d.hasEntry && i === lastIdx} isToday={d.isToday} />
                  <span className={`text-[9px] font-semibold ${d.isToday ? "text-teal-500" : "text-slate-300"}`}>{d.label}</span>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Registro Diario */}
        <div className="flex gap-3 items-stretch">
          <Link
            href="/registro/diario"
            className="flex flex-col items-center justify-center gap-3 flex-1 py-8 rounded-3xl bg-teal-500 text-white shadow-xl shadow-teal-200 active:scale-95 transition-transform"
          >
            <div className="bg-white/20 rounded-2xl p-3">
              <SquirrelIcon />
            </div>
            <span className="text-2xl font-bold tracking-tight">Registro Diario</span>
            {lastDiario ? (
              <span className="text-teal-100 text-xs font-medium">Último: {formatLastDate(lastDiario)}</span>
            ) : (
              <span className="text-teal-100 text-xs font-medium">Sin registros aún</span>
            )}
          </Link>
          <Link
            href="/historico/diario"
            className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-3xl bg-teal-100 text-teal-700 shadow-md active:scale-95 transition-transform min-w-[72px]"
          >
            <span className="text-5xl">📋</span>
            <span className="text-xs font-bold text-center">Log</span>
          </Link>
        </div>

        {/* Registro de Caca */}
        <div className="flex gap-3 items-stretch">
          <Link
            href="/registro/caca"
            className="flex flex-col items-center justify-center gap-3 flex-1 py-8 rounded-3xl bg-amber-400 text-white shadow-xl shadow-amber-200 active:scale-95 transition-transform"
          >
            <div className="bg-white/20 rounded-2xl p-3">
              <LitterBoxIcon />
            </div>
            <span className="text-2xl font-bold tracking-tight">Registro de Caca</span>
            {lastCaca ? (
              <span className="text-amber-100 text-xs font-medium">Último: {formatLastDate(lastCaca)}</span>
            ) : (
              <span className="text-amber-100 text-xs font-medium">Sin registros aún</span>
            )}
          </Link>
          <Link
            href="/historico/caca"
            className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-3xl bg-amber-100 text-amber-700 shadow-md active:scale-95 transition-transform min-w-[72px]"
          >
            <span className="text-5xl">📋</span>
            <span className="text-xs font-bold text-center">Log</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
