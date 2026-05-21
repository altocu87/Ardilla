"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCacaLog, saveCacaEntry } from "@/lib/db";
import { awardXp } from "@/lib/profile";

/* ──────────────── datos ──────────────── */

const CANTIDAD = [
  { icon: "🔬", label: "Muy poca",         desc: "Testimonio histórico" },
  { icon: "🌱", label: "Poca",             desc: "Modesta pero presente" },
  { icon: "💩", label: "Normal",           desc: "Un día normal" },
  { icon: "💪", label: "Mucha",            desc: "Productiva" },
  { icon: "🐄", label: "Caca de vaca",     desc: "Épica" },
  { icon: "🏆", label: "Evento histórico", desc: "Para enmarcar" },
];

const BRISTOL = [
  { n: 1, icon: "🪨", name: "Canicas del infierno", desc: "Bolitas secas y duras" },
  { n: 2, icon: "🪵", name: "Tronco rocoso",         desc: "Compacta y dura" },
  { n: 3, icon: "🌭", name: "Salchicha agrietada",   desc: "Bastante normal" },
  { n: 4, icon: "✨", name: "La perfecta",           desc: "Ideal · Enhorabuena" },
  { n: 5, icon: "🫧", name: "Blandiblú",             desc: "Blanda con bordes suaves" },
  { n: 6, icon: "🌊", name: "Puré marrón",           desc: "Muy blanda, sin forma" },
  { n: 7, icon: "☠️", name: "Apocalipsis",           desc: "Completamente líquida" },
];

const SENSACION = [
  { icon: "😎", label: "Fácil",          color: "bg-emerald-100 border-emerald-400 text-emerald-800" },
  { icon: "😐", label: "Normal",         color: "bg-slate-100 border-slate-400 text-slate-700" },
  { icon: "😰", label: "Difícil",        color: "bg-orange-100 border-orange-400 text-orange-800" },
  { icon: "😵", label: "He visto a Dios", color: "bg-red-100 border-red-400 text-red-800" },
];

const BG_FLOATS = [
  { e: "🐱",  s: "text-4xl", dur: "2.0s", delay: "0s",   l: "5%",  t: "10%" },
  { e: "🐈",  s: "text-5xl", dur: "2.3s", delay: "0.4s", l: "78%", t: "8%"  },
  { e: "💩",  s: "text-4xl", dur: "1.8s", delay: "0.2s", l: "85%", t: "45%" },
  { e: "🐈‍⬛", s: "text-5xl", dur: "2.5s", delay: "0.7s", l: "3%",  t: "65%" },
  { e: "💩",  s: "text-3xl", dur: "2.1s", delay: "1.0s", l: "70%", t: "72%" },
];

/* ──────────────── componentes ──────────────── */

function FloatBg({ speed = false }: { speed?: boolean }) {
  return (
    <>
      {BG_FLOATS.map((a, i) => (
        <span key={i} className={`${a.s} select-none absolute pointer-events-none opacity-20`}
          style={{ left: a.l, top: a.t, display: "inline-block",
            animation: speed ? `bounce 0.7s ease-in-out infinite` : `bounce ${a.dur} ease-in-out infinite`,
            animationDelay: speed ? `${i * 0.12}s` : a.delay,
          }}>
          {a.e}
        </span>
      ))}
    </>
  );
}

function ExitBtn() {
  return (
    <Link href="/registro"
      className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold shadow-sm active:scale-95 transition">
      SALIR
    </Link>
  );
}

/* ──────────────── página ──────────────── */

export default function RegistroCaca() {
  const router = useRouter();
  const [todayCount, setTodayCount] = useState(0);
  const [cantidad, setCantidad] = useState<string>("");
  const [bristol, setBristol] = useState<number | null>(null);
  const [sensacion, setSensacion] = useState<string>("");
  const [done, setDone] = useState(false);
  const [xpGained, setXpGained] = useState<{ xp: number; bellotas: number } | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const log = await getCacaLog();
        const today = new Date().toISOString().slice(0, 10);
        setTodayCount((log[today] ?? []).length);
      } catch (e) { console.error(e); }
    }
    check();
  }, []);

  const canSave = !!cantidad && bristol !== null && !!sensacion;

  async function save() {
    const now = new Date();
    const bristolData = BRISTOL.find((b) => b.n === bristol)!;
    setDone(true);
    try {
      await saveCacaEntry({
        cantidad,
        bristol: bristol!,
        bristolName: bristolData.name,
        bristolIcon: bristolData.icon,
        sensacion,
        savedAt: now.toISOString(),
      });
    } catch (e) { console.error("saveCacaEntry error:", e); }
    try {
      setXpGained(await awardXp("caca"));
    } catch (e) { console.error("awardXp error:", e); }
  }

  /* ── celebración ── */
  if (done) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-amber-100 via-orange-50 to-yellow-50 flex flex-col overflow-hidden">
        <FloatBg speed />
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center gap-5 max-w-xs mx-auto">
          <div className="text-8xl" style={{ animation: "bounce 0.65s ease-in-out infinite" }}>🐱</div>
          <h2 className="text-2xl font-bold text-amber-700">¡Registrado!</h2>
          {xpGained && (
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-2 shadow-md border border-white">
              <span className="text-lg font-bold text-amber-600">+{xpGained.xp} XP</span>
              <span className="text-slate-300">·</span>
              <span className="text-lg font-bold text-amber-500">+{xpGained.bellotas} 🌰</span>
            </div>
          )}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg border border-white w-full">
            <p className="text-slate-600 text-sm font-medium italic">
              &quot;¡Registrado en los anales de la historia! 💩&quot;
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-lg border border-white w-full text-left flex flex-col gap-2">
            <Row label="Cantidad" value={`${CANTIDAD.find(c => c.label === cantidad)?.icon} ${cantidad}`} />
            <Row label="Bristol"  value={`${BRISTOL.find(b => b.n === bristol)?.icon} ${BRISTOL.find(b => b.n === bristol)?.name}`} />
            <Row label="Sensación" value={`${SENSACION.find(s => s.label === sensacion)?.icon} ${sensacion}`} />
          </div>
          <button onClick={() => router.push("/registro")}
            className="w-full py-4 rounded-2xl bg-amber-500 text-white font-bold shadow-lg shadow-amber-200 active:scale-95 transition">
            Volver al registro
          </button>
        </div>
      </div>
    );
  }

  /* ── formulario ── */
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-amber-100 via-orange-50 to-yellow-50 flex flex-col overflow-hidden">
      <FloatBg />

      {/* Header */}
      <div className="shrink-0 bg-white/60 backdrop-blur-sm border-b border-white/50 px-5 pt-5 pb-3 flex items-center justify-between z-10">
        <div>
          <p className="text-xs text-amber-600 font-semibold uppercase tracking-widest">Registro de caca 💩</p>
          {todayCount > 0 && (
            <p className="text-[10px] text-amber-500 mt-0.5">Hoy ya tienes {todayCount} registro{todayCount > 1 ? "s" : ""}</p>
          )}
        </div>
        <ExitBtn />
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4">
        <div className="max-w-lg mx-auto flex flex-col gap-5">

          {/* ── Cantidad ── */}
          <Section title="¿Cuánto ha sido?">
            <div className="grid grid-cols-2 gap-2">
              {CANTIDAD.map((c) => (
                <button key={c.label} onClick={() => setCantidad(c.label)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                    cantidad === c.label
                      ? "bg-amber-100 border-amber-400 shadow-md"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <span className="text-3xl shrink-0">{c.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold leading-tight ${cantidad === c.label ? "text-amber-800" : "text-slate-700"}`}>{c.label}</p>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{c.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Section>

          {/* ── Bristol ── */}
          <Section title="Escala Bristol">
            <div className="flex flex-col gap-2">
              {BRISTOL.map((b) => (
                <button key={b.n} onClick={() => setBristol(b.n)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                    bristol === b.n
                      ? "bg-orange-100 border-orange-400 shadow-md"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <span className="text-3xl shrink-0">{b.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xs font-bold rounded-full px-1.5 py-0.5 ${bristol === b.n ? "bg-orange-200 text-orange-700" : "bg-slate-100 text-slate-500"}`}>
                        {b.n}
                      </span>
                      <p className={`text-sm font-semibold leading-tight ${bristol === b.n ? "text-orange-800" : "text-slate-700"}`}>{b.name}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{b.desc}</p>
                  </div>
                  {bristol === b.n && <span className="text-orange-500 text-lg">✓</span>}
                </button>
              ))}
            </div>
          </Section>

          {/* ── Sensación ── */}
          <Section title="¿Cómo ha ido?">
            <div className="grid grid-cols-2 gap-2">
              {SENSACION.map((s) => (
                <button key={s.label} onClick={() => setSensacion(s.label)}
                  className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border transition-all active:scale-[0.98] ${
                    sensacion === s.label ? `${s.color} shadow-md` : "bg-white border-slate-200"
                  }`}
                >
                  <span className="text-4xl">{s.icon}</span>
                  <span className={`text-xs font-semibold ${sensacion === s.label ? "" : "text-slate-600"}`}>{s.label}</span>
                </button>
              ))}
            </div>
          </Section>

        </div>
      </div>

      {/* Botón guardar */}
      <div className="shrink-0 px-5 pb-10 pt-3">
        <div className="max-w-lg mx-auto">
          <button onClick={save} disabled={!canSave}
            className={`w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg active:scale-95 transition-all ${
              canSave ? "bg-amber-500 shadow-amber-200" : "bg-slate-300 shadow-none"
            }`}
          >
            Guardar registro 💩
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 shadow-lg shadow-amber-100/40">
      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-400 font-semibold">{label}</span>
      <span className="text-xs text-slate-700 font-medium">{value}</span>
    </div>
  );
}
