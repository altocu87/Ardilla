"use client";
import { useState, useEffect } from "react";
import { getPlayerProfile, upsertPlayerProfile } from "@/lib/db";
import { recordResult1P } from "@/lib/game-stats";
import { unlockAudio, playCardFlip, playWin, playLose, playDraw } from "@/lib/sounds";

/* ── Configuración del juego ─────────────────────────────────────────────── */
const MIN_CARD = 1;
const MAX_CARD = 12;
const BET_OPTIONS = [1, 2, 5, 10];

type GamePhase = "betting" | "revealing" | "result";

function randomCard(): number {
  return Math.floor(Math.random() * (MAX_CARD - MIN_CARD + 1)) + MIN_CARD;
}

/* ── Representación visual de la carta ──────────────────────────────────── */
function BellotaCard({
  value,
  hidden,
  revealed,
}: {
  value: number;
  hidden?: boolean;
  revealed?: boolean;
}) {
  const rows = [];
  const total = Math.min(value, 12);
  // Distribuir las bellotas en filas de max 4
  let remaining = total;
  while (remaining > 0) {
    const count = Math.min(remaining, 4);
    rows.push(count);
    remaining -= count;
  }

  return (
    <div
      className={`relative w-32 h-48 rounded-2xl border-4 flex flex-col items-center justify-between
        py-3 px-2 shadow-2xl select-none transition-all duration-500
        ${hidden
          ? "bg-gradient-to-br from-amber-800 to-amber-950 border-amber-600"
          : "bg-gradient-to-b from-amber-50 to-amber-100 border-amber-400"}
        ${revealed ? "scale-110" : ""}`}
    >
      {hidden ? (
        /* Reverso */
        <div className="flex-1 flex items-center justify-center">
          <span className="text-5xl opacity-60">🌰</span>
        </div>
      ) : (
        <>
          {/* Número superior izquierda */}
          <div className="w-full flex flex-col items-start">
            <span className="text-2xl font-black text-amber-800 leading-none">{value}</span>
            <span className="text-lg leading-none">🌰</span>
          </div>

          {/* Bellotas centrales */}
          <div className="flex-1 flex flex-col items-center justify-center gap-1">
            {rows.map((count, i) => (
              <div key={i} className="flex gap-1">
                {Array.from({ length: count }).map((_, j) => (
                  <span key={j} className="text-xl leading-none">🌰</span>
                ))}
              </div>
            ))}
          </div>

          {/* Número inferior derecha (invertido) */}
          <div className="w-full flex flex-col items-end rotate-180">
            <span className="text-2xl font-black text-amber-800 leading-none">{value}</span>
            <span className="text-lg leading-none">🌰</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ══ COMPONENTE PRINCIPAL ════════════════════════════════════════════════════ */
interface Props {
  onClose: () => void;
}

export default function MayorMenorGame({ onClose }: Props) {
  const [bellotas, setBellotas] = useState<number>(0);
  const [loading, setLoading]   = useState(true);

  const [currentCard, setCurrentCard] = useState<number>(() => randomCard());
  const [nextCard,    setNextCard]     = useState<number | null>(null);

  const [bet,       setBet]       = useState<number>(1);
  const [phase,     setPhase]     = useState<GamePhase>("betting");
  const [guess,     setGuess]     = useState<"mayor" | "menor" | null>(null);
  const [win,       setWin]       = useState<boolean | null>(null); // null = empate
  const [roundsDone, setRoundsDone] = useState(0);
  const [totalGained, setTotalGained] = useState(0);

  /* Cargar bellotas del perfil */
  useEffect(() => {
    getPlayerProfile()
      .then(p => {
        setBellotas(p.bellotas ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function updateBellotas(delta: number) {
    const newVal = Math.max(0, bellotas + delta);
    setBellotas(newVal);
    setTotalGained(prev => prev + delta);
    try {
      await upsertPlayerProfile({ bellotas: newVal });
    } catch { /* noop */ }
  }

  function handleGuess(g: "mayor" | "menor") {
    unlockAudio();
    if (phase !== "betting") return;
    if (bellotas < bet) return;

    const next = randomCard();
    setNextCard(next);
    setGuess(g);
    playCardFlip();
    setPhase("revealing");

    setTimeout(() => {
      let result: boolean | null;
      if (next > currentCard) result = g === "mayor";
      else if (next < currentCard) result = g === "menor";
      else result = null; // empate

      setWin(result);
      setPhase("result");
      setRoundsDone(r => r + 1);

      if (result === true)       { playWin(); updateBellotas(+bet); recordResult1P("mayor_menor", "win", +bet); }
      else if (result === false) { playLose(); updateBellotas(-bet); recordResult1P("mayor_menor", "lose", -bet); }
      else                       { playDraw(); recordResult1P("mayor_menor", "draw", 0); }
      // empate: no pierde ni gana
    }, 900);
  }

  function nextRound() {
    setCurrentCard(nextCard ?? randomCard());
    setNextCard(null);
    setGuess(null);
    setWin(null);
    setPhase("betting");
    // Ajustar apuesta si no tiene suficientes bellotas
    if (bet > bellotas) setBet(BET_OPTIONS.filter(b => b <= bellotas)[0] ?? 1);
  }

  function resetGame() {
    setCurrentCard(randomCard());
    setNextCard(null);
    setGuess(null);
    setWin(null);
    setPhase("betting");
    setRoundsDone(0);
    setTotalGained(0);
    if (bet > bellotas) setBet(BET_OPTIONS.filter(b => b <= bellotas)[0] ?? 1);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white rounded-3xl p-8 text-center">
          <span className="text-4xl animate-bounce block mb-3">🌰</span>
          <p className="text-slate-500">Cargando…</p>
        </div>
      </div>
    );
  }

  const isResult  = phase === "result";
  const isRevealing = phase === "revealing";
  const noBellotas = bellotas < 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-amber-900 via-amber-800 to-amber-950 overflow-hidden">

      {/* Cabecera */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-6 pb-3">
        <div>
          <p className="text-amber-200 text-[10px] font-bold uppercase tracking-widest">Juego de cartas</p>
          <h1 className="text-white text-xl font-black">Mayor o Menor</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-amber-700/60 rounded-2xl px-4 py-2 flex items-center gap-1.5">
            <span className="text-xl">🌰</span>
            <span className="text-white font-black text-lg">{bellotas}</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-amber-700/60 text-white font-bold text-lg flex items-center justify-center active:scale-95 transition"
          >✕</button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6">

        {/* Cartas */}
        <div className="flex items-center gap-6">
          {/* Carta actual */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-amber-300 text-xs font-semibold uppercase tracking-wider">Carta actual</p>
            <BellotaCard value={currentCard} />
          </div>

          {/* Separador / resultado */}
          <div className="flex flex-col items-center gap-2 w-14">
            {isResult && win !== null && (
              <span className="text-4xl animate-bounce">{win ? "✅" : "❌"}</span>
            )}
            {isResult && win === null && (
              <span className="text-4xl animate-bounce">🤝</span>
            )}
            {!isResult && (
              <span className="text-3xl text-amber-400 font-black">
                {isRevealing ? "⟳" : "?"}
              </span>
            )}
            {isResult && guess && (
              <span className="text-amber-300 text-xs font-semibold">
                {guess === "mayor" ? "↑ Mayor" : "↓ Menor"}
              </span>
            )}
          </div>

          {/* Carta siguiente */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-amber-300 text-xs font-semibold uppercase tracking-wider">
              {isResult ? "Era…" : "¿Será?"}
            </p>
            {nextCard !== null
              ? <BellotaCard value={nextCard} revealed={isResult} />
              : <BellotaCard value={0} hidden />
            }
          </div>
        </div>

        {/* Resultado */}
        {isResult && (
          <div className={`rounded-2xl px-6 py-3 text-center shadow-xl ${
            win === true  ? "bg-emerald-500"
            : win === false ? "bg-red-500"
            : "bg-amber-500"
          }`}>
            <p className="text-white font-black text-lg">
              {win === true  ? `¡Correcto! +${bet} 🌰`
              : win === false ? `-${bet} 🌰 ¡Mala suerte!`
              : "¡Empate! No pierdes nada 🤝"}
            </p>
          </div>
        )}

        {/* Zona de apuesta y botones */}
        {!isResult && !isRevealing && (
          <div className="w-full max-w-xs flex flex-col gap-4">
            {/* Apuesta */}
            <div className="bg-amber-800/60 rounded-2xl p-4">
              <p className="text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 text-center">
                ¿Cuántas bellotas apuestas?
              </p>
              <div className="grid grid-cols-4 gap-2">
                {BET_OPTIONS.map(b => (
                  <button
                    key={b}
                    onClick={() => setBet(b)}
                    disabled={b > bellotas}
                    className={`py-3 rounded-xl font-black text-base transition-all active:scale-95 ${
                      bet === b
                        ? "bg-amber-400 text-amber-900 shadow-lg scale-105"
                        : b > bellotas
                        ? "bg-amber-900/40 text-amber-700 cursor-not-allowed"
                        : "bg-amber-700 text-amber-100 hover:bg-amber-600"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <p className="text-amber-400 text-xs text-center mt-2">
                Apuesta actual: <strong>{bet} 🌰</strong>
              </p>
            </div>

            {/* Botones Mayor / Menor */}
            {noBellotas ? (
              <div className="bg-red-900/60 rounded-2xl px-5 py-4 text-center">
                <p className="text-red-300 font-bold text-sm">¡Sin bellotas para apostar!</p>
                <p className="text-red-400 text-xs mt-1">Completa registros para ganar más 🌰</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleGuess("mayor")}
                  className="py-5 rounded-2xl bg-emerald-500 text-white font-black text-xl shadow-lg shadow-emerald-900/50 active:scale-95 transition flex flex-col items-center gap-1"
                >
                  <span className="text-3xl">↑</span>
                  <span>Mayor</span>
                  <span className="text-xs font-normal opacity-80">Carta más alta</span>
                </button>
                <button
                  onClick={() => handleGuess("menor")}
                  className="py-5 rounded-2xl bg-rose-500 text-white font-black text-xl shadow-lg shadow-rose-900/50 active:scale-95 transition flex flex-col items-center gap-1"
                >
                  <span className="text-3xl">↓</span>
                  <span>Menor</span>
                  <span className="text-xs font-normal opacity-80">Carta más baja</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Botón Siguiente ronda */}
        {isResult && (
          <div className="w-full max-w-xs flex flex-col gap-3">
            {bellotas > 0 ? (
              <button
                onClick={nextRound}
                className="w-full py-4 rounded-2xl bg-amber-400 text-amber-900 font-black text-lg shadow-lg active:scale-95 transition"
              >
                Siguiente carta →
              </button>
            ) : (
              <div className="bg-red-900/60 rounded-2xl px-5 py-4 text-center">
                <p className="text-red-300 font-bold">¡Se acabaron las bellotas!</p>
                <button onClick={resetGame} className="mt-2 text-amber-300 text-sm underline">
                  Empezar de nuevo
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-amber-800/60 text-amber-300 font-bold text-sm active:scale-95 transition"
            >
              Salir del juego
            </button>
          </div>
        )}
      </div>

      {/* Pie: estadísticas de sesión */}
      {roundsDone > 0 && (
        <div className="shrink-0 flex justify-center gap-6 px-5 py-4 border-t border-amber-700/40">
          <div className="text-center">
            <p className="text-amber-300 text-xs">Rondas</p>
            <p className="text-white font-black">{roundsDone}</p>
          </div>
          <div className="text-center">
            <p className="text-amber-300 text-xs">Esta sesión</p>
            <p className={`font-black ${totalGained >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {totalGained >= 0 ? "+" : ""}{totalGained} 🌰
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
