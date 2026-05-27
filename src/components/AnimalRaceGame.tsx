"use client";
import { useState, useEffect, useRef } from "react";
import { getPlayerProfile, upsertPlayerProfile } from "@/lib/db";
import { recordRaceResult, record2PResult } from "@/lib/game-stats";

/* ── Configuración ───────────────────────────────────────────────────────── */
const ANIMALS = [
  {
    emoji: "🐌", name: "Caracol",
    bg: "bg-amber-100",   border: "border-amber-400",
    text: "text-amber-800", track: "bg-amber-300",
    win: "¡El más lento ganó la carrera! ¡Milagro! 🐌",
  },
  {
    emoji: "🐿️", name: "Ardilla",
    bg: "bg-orange-100",  border: "border-orange-400",
    text: "text-orange-800", track: "bg-orange-300",
    win: "¡Rápida como el rayo del bosque! 🐿️",
  },
  {
    emoji: "🐱", name: "Gato",
    bg: "bg-violet-100",  border: "border-violet-400",
    text: "text-violet-800", track: "bg-violet-300",
    win: "¡El gato llega con toda su elegancia! 🐱",
  },
  {
    emoji: "🐀", name: "Rata",
    bg: "bg-slate-100",   border: "border-slate-400",
    text: "text-slate-700", track: "bg-slate-300",
    win: "¡La rata tacaña se lleva el premio! 🐀",
  },
  {
    emoji: "🪳", name: "Cucaracha",
    bg: "bg-lime-100",    border: "border-lime-500",
    text: "text-lime-800", track: "bg-lime-300",
    win: "¡Indestructible. 300 millones de años ganando! 🪳",
  },
];

const BET_OPTIONS = [1, 2, 5, 10];
const PAYOUT_MULT = 4;    // ganancia neta = apuesta × 4  (total = ×5 si se incluye la apuesta)
const TICK_MS     = 90;   // ms por paso de animación
const COUNTDOWN   = 3;    // segundos de cuenta atrás

type Phase = "mode" | "betting" | "betting_p2" | "countdown" | "racing" | "result";
type GameMode = "1p" | "2p";

/* ── Pre-cómputo de toda la carrera ──────────────────────────────────────── */
function simulateRace(n: number): { ticks: number[][]; winner: number } {
  const pos  = Array(n).fill(0) as number[];
  const ticks: number[][] = [[...pos]];
  let winner = -1;

  while (winner === -1) {
    for (let i = 0; i < n; i++) {
      if (pos[i] < 100) {
        // velocidad aleatoria: base 2 + bonus random 0–4.5
        pos[i] = Math.min(100, pos[i] + 1.5 + Math.random() * 4.5);
      }
    }
    ticks.push([...pos]);
    // primer animal que cruza la meta
    if (winner === -1) {
      for (let i = 0; i < n; i++) {
        if (pos[i] >= 100) { winner = i; break; }
      }
    }
  }

  return { ticks, winner };
}

/* ── Pista de carrera de un animal ───────────────────────────────────────── */
function Track({
  animal,
  index,
  position,
  isChosenP1,
  isChosenP2,
  isWinner,
  phase,
}: {
  animal: typeof ANIMALS[0];
  index: number;
  position: number;
  isChosenP1: boolean;
  isChosenP2: boolean;
  isWinner: boolean;
  phase: Phase;
}) {
  // rango visual del emoji: de 5% a 85% (restamos 15% para el flag al final)
  const pct = 5 + (position / 100) * 80;

  const isChosen = isChosenP1 || isChosenP2;

  return (
    <div
      className={`rounded-2xl overflow-hidden border-2 transition-all ${
        isWinner && phase === "result"
          ? `${animal.border} shadow-lg scale-[1.02]`
          : isChosen
          ? `${animal.border} shadow-md`
          : "border-transparent"
      }`}
    >
      <div
        className={`flex items-center gap-2 px-3 py-2 ${
          isWinner && phase === "result" ? animal.bg : "bg-white/60"
        }`}
      >
        {/* Número de carril */}
        <span className="text-xs font-black text-slate-400 w-4 shrink-0 text-center">
          {index + 1}
        </span>

        {/* Nombre y apuesta visual */}
        <span className={`text-xs font-bold w-16 shrink-0 ${animal.text}`}>
          {animal.name}
          {isChosenP1 && !isChosenP2 && <span className="ml-1 text-[9px] opacity-70">(J1)</span>}
          {isChosenP2 && !isChosenP1 && <span className="ml-1 text-[9px] opacity-70">(J2)</span>}
          {isChosenP1 && isChosenP2 && <span className="ml-1 text-[9px] opacity-70">(J1+J2)</span>}
        </span>

        {/* Pista */}
        <div className="flex-1 relative h-9 bg-green-100 rounded-xl overflow-hidden">
          {/* Hierba de fondo */}
          <div className="absolute inset-0 flex items-end pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className="text-[6px] text-green-300 leading-none" style={{ marginLeft: i === 0 ? 0 : "4%" }}>
                🌿
              </span>
            ))}
          </div>

          {/* Línea de salida */}
          <div className="absolute left-[5%] top-0 bottom-0 w-px bg-green-400/40" />

          {/* Animal en movimiento */}
          <span
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-2xl leading-none z-10"
            style={{
              left: `${pct}%`,
              transition: phase === "racing" ? `left ${TICK_MS}ms linear` : "none",
              filter: isWinner && phase === "result" ? "drop-shadow(0 0 6px gold)" : undefined,
            }}
          >
            {animal.emoji}
          </span>

          {/* Meta */}
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-lg leading-none z-10">
            🏁
          </span>
        </div>

        {/* Premio (solo en resultado) */}
        {isWinner && phase === "result" && (
          <span className="text-base leading-none shrink-0">🥇</span>
        )}
      </div>
    </div>
  );
}

/* ══ COMPONENTE PRINCIPAL ════════════════════════════════════════════════════ */
export default function AnimalRaceGame({ onClose }: { onClose: () => void }) {
  const [bellotas,    setBellotas]    = useState(0);
  const [loading,     setLoading]     = useState(true);

  const [gameMode,    setGameMode]    = useState<GameMode>("1p");
  const [chosen,      setChosen]      = useState<number | null>(null);   // J1 (o único en 1P)
  const [chosenP2,    setChosenP2]    = useState<number | null>(null);   // J2
  const [bet,         setBet]         = useState(1);
  const [betP2,       setBetP2]       = useState(1);
  const [phase,       setPhase]       = useState<Phase>("mode");
  const [countdown,   setCountdown]   = useState(COUNTDOWN);
  const [positions,   setPositions]   = useState<number[]>(ANIMALS.map(() => 0));
  const [winner,      setWinner]      = useState<number | null>(null);
  const [won,         setWon]         = useState<boolean | null>(null);  // 1P result

  // Estadísticas de sesión
  const [races,       setRaces]       = useState(0);
  const [sessionGain, setSessionGain] = useState(0);

  // 2P session score
  const [p1Wins,      setP1Wins]      = useState(0);
  const [p2Wins,      setP2Wins]      = useState(0);
  const [draws2P,     setDraws2P]     = useState(0);

  // Datos pre-computados de la carrera
  const raceDataRef = useRef<{ ticks: number[][]; winner: number } | null>(null);
  const tickRef     = useRef(0);

  /* Cargar perfil */
  useEffect(() => {
    getPlayerProfile()
      .then(p => { setBellotas(p.bellotas ?? 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  /* Cuenta atrás → carrera */
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("racing");
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 900);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  /* Animación de la carrera tick a tick */
  useEffect(() => {
    if (phase !== "racing") return;
    const data = raceDataRef.current;
    if (!data) return;

    const interval = setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;

      if (tick >= data.ticks.length) {
        clearInterval(interval);
        const w = data.winner;
        setPositions(data.ticks[data.ticks.length - 1]);
        setWinner(w);
        setPhase("result");
        setRaces(r => r + 1);

        if (gameMode === "1p") {
          const playerWon = chosen === w;
          setWon(playerWon);

          const delta = playerWon ? bet * PAYOUT_MULT : -bet;
          setSessionGain(g => g + delta);
          const newBellotas = Math.max(0, bellotas + delta);
          setBellotas(newBellotas);
          upsertPlayerProfile({ bellotas: newBellotas }).catch(() => {});

          recordRaceResult({
            mode: "1p",
            winnerEmoji: ANIMALS[w].emoji,
            bellotasDelta: delta,
            pickedEmoji: chosen !== null ? ANIMALS[chosen].emoji : undefined,
            wonRace: playerWon,
          });
        } else {
          // 2P: J1 wins if chosen===w, J2 wins if chosenP2===w, else neither (draw / house)
          const p1Won = chosen === w;
          const p2Won = chosenP2 === w;

          let delta = 0;
          let winner2P: "p1" | "p2" | "draw" = "draw";

          if (p1Won) {
            // J1 gana: +bet×4, J2 pierde su apuesta
            delta = bet * PAYOUT_MULT - betP2;
            winner2P = "p1";
            setP1Wins(n => n + 1);
          } else if (p2Won) {
            // J2 gana: +betP2×4, J1 pierde su apuesta
            delta = betP2 * PAYOUT_MULT - bet;
            winner2P = "p2";
            setP2Wins(n => n + 1);
          } else {
            // Ninguno ganó — ambos pierden su apuesta (house wins)
            delta = -(bet + betP2);
            winner2P = "draw";
            setDraws2P(n => n + 1);
          }

          setSessionGain(g => g + delta);
          const newBellotas = Math.max(0, bellotas + delta);
          setBellotas(newBellotas);
          upsertPlayerProfile({ bellotas: newBellotas }).catch(() => {});

          recordRaceResult({
            mode: "2p",
            winnerEmoji: ANIMALS[w].emoji,
            bellotasDelta: delta,
            p1Emoji: chosen !== null ? ANIMALS[chosen].emoji : undefined,
            p2Emoji: chosenP2 !== null ? ANIMALS[chosenP2].emoji : undefined,
          });
          record2PResult("carrera", winner2P);
        }
      } else {
        setPositions(data.ticks[tick]);
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* Seleccionar modo */
  function selectMode(mode: GameMode) {
    setGameMode(mode);
    setChosen(null);
    setChosenP2(null);
    setBet(1);
    setBetP2(1);
    setPhase("betting");
  }

  /* Iniciar carrera desde apuesta J1 (1P) o confirmar J1 y pasar a J2 (2P) */
  function confirmBettingP1() {
    if (chosen === null || bellotas < bet) return;

    if (gameMode === "1p") {
      // Descontar apuesta inmediatamente
      const afterBet = bellotas - bet;
      setBellotas(afterBet);
      upsertPlayerProfile({ bellotas: afterBet }).catch(() => {});

      const data = simulateRace(ANIMALS.length);
      raceDataRef.current = data;
      tickRef.current = 0;
      setPositions(ANIMALS.map(() => 0));
      setWinner(null);
      setWon(null);
      setCountdown(COUNTDOWN);
      setPhase("countdown");
    } else {
      // 2P: pasar a apuesta de J2
      setPhase("betting_p2");
    }
  }

  /* Confirmar apuesta J2 y arrancar carrera (2P) */
  function confirmBettingP2() {
    if (chosenP2 === null || bellotas < bet + betP2) return;

    // Descontar ambas apuestas inmediatamente
    const afterBet = bellotas - bet - betP2;
    setBellotas(afterBet);
    upsertPlayerProfile({ bellotas: afterBet }).catch(() => {});

    const data = simulateRace(ANIMALS.length);
    raceDataRef.current = data;
    tickRef.current = 0;
    setPositions(ANIMALS.map(() => 0));
    setWinner(null);
    setWon(null);
    setCountdown(COUNTDOWN);
    setPhase("countdown");
  }

  /* Nueva carrera */
  function playAgain() {
    setChosen(null);
    setChosenP2(null);
    setPositions(ANIMALS.map(() => 0));
    setWinner(null);
    setWon(null);
    setPhase(gameMode === "1p" ? "betting" : "betting");
    if (bet > bellotas) setBet(BET_OPTIONS.filter(b => b <= bellotas)[0] ?? 1);
    if (betP2 > bellotas) setBetP2(BET_OPTIONS.filter(b => b <= bellotas)[0] ?? 1);
  }

  /* Volver al selector de modo */
  function backToMode() {
    setChosen(null);
    setChosenP2(null);
    setPositions(ANIMALS.map(() => 0));
    setWinner(null);
    setWon(null);
    setBet(1);
    setBetP2(1);
    setPhase("mode");
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white rounded-3xl p-8 text-center">
          <span className="text-5xl block mb-3" style={{ animation: "bounce 1s ease-in-out infinite" }}>🏁</span>
          <p className="text-slate-500 font-medium">Cargando carrera…</p>
        </div>
      </div>
    );
  }

  const noBellotas = bellotas < 1;

  /* ── Selector de modo ── */
  if (phase === "mode") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-emerald-900 via-green-800 to-teal-900 overflow-hidden">
        <div className="shrink-0 flex items-center justify-between px-5 pt-6 pb-3">
          <div>
            <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest">
              Juego de apuestas
            </p>
            <h1 className="text-white text-xl font-black leading-tight">
              🏁 Carrera del Bosque
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-black/30 rounded-2xl px-4 py-2 flex items-center gap-1.5">
              <span className="text-xl">🌰</span>
              <span className="text-white font-black text-lg">{bellotas}</span>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/30 text-white font-bold text-lg flex items-center justify-center active:scale-95"
            >✕</button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <p className="text-emerald-200 font-bold text-base uppercase tracking-wider">
            Selecciona el modo de juego
          </p>
          <div className="w-full flex flex-col gap-4">
            <button
              onClick={() => selectMode("1p")}
              className="w-full py-6 rounded-2xl bg-emerald-500 text-white font-black text-xl shadow-xl active:scale-95 transition flex flex-col items-center gap-1"
            >
              <span className="text-3xl">🏃</span>
              <span>1 Jugador</span>
              <span className="text-sm font-normal opacity-80">Apuesta y corre solo</span>
            </button>
            <button
              onClick={() => selectMode("2p")}
              className="w-full py-6 rounded-2xl bg-teal-500 text-white font-black text-xl shadow-xl active:scale-95 transition flex flex-col items-center gap-1"
            >
              <span className="text-3xl">👥</span>
              <span>2 Jugadores</span>
              <span className="text-sm font-normal opacity-80">Compite contra un amigo</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Render principal ── */
  const totalNeeded2P = bet + betP2;
  const canAfford2P   = bellotas >= totalNeeded2P;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-emerald-900 via-green-800 to-teal-900 overflow-hidden">

      {/* ── Cabecera ── */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-6 pb-3">
        <div>
          <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest">
            {gameMode === "2p" ? "2 Jugadores" : "Juego de apuestas"}
          </p>
          <h1 className="text-white text-xl font-black leading-tight">
            🏁 Carrera del Bosque
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-black/30 rounded-2xl px-4 py-2 flex items-center gap-1.5">
            <span className="text-xl">🌰</span>
            <span className="text-white font-black text-lg">{bellotas}</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/30 text-white font-bold text-lg flex items-center justify-center active:scale-95"
          >✕</button>
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">

        {/* Pistas de carrera */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-3 flex flex-col gap-2">
          {ANIMALS.map((a, i) => (
            <Track
              key={i}
              animal={a}
              index={i}
              position={positions[i]}
              isChosenP1={chosen === i}
              isChosenP2={chosenP2 === i}
              isWinner={winner === i}
              phase={phase}
            />
          ))}
        </div>

        {/* Pantalla de cuenta atrás */}
        {phase === "countdown" && (
          <div className="flex items-center justify-center py-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl px-10 py-6 text-center">
              <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-1">
                ¡La carrera empieza en!
              </p>
              <p className="text-white font-black text-7xl leading-none" style={{ animation: "bounce 0.4s ease-in-out" }}>
                {countdown > 0 ? countdown : "¡YA!"}
              </p>
            </div>
          </div>
        )}

        {/* Pantalla de carrera activa */}
        {phase === "racing" && (
          <div className="flex items-center justify-center py-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 text-center">
              {gameMode === "1p" ? (
                <p className="text-white font-black text-lg">
                  {chosen !== null ? `¡Vamos ${ANIMALS[chosen].name}! ${ANIMALS[chosen].emoji}` : "¡Corriendo!"}
                </p>
              ) : (
                <p className="text-white font-black text-lg">
                  {chosen !== null && chosenP2 !== null
                    ? `J1: ${ANIMALS[chosen].emoji}  vs  J2: ${ANIMALS[chosenP2].emoji}`
                    : "¡Corriendo!"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Pantalla de resultado */}
        {phase === "result" && winner !== null && (
          <div className="flex flex-col gap-3">

            {/* Ganador de la carrera */}
            <div className={`rounded-3xl p-4 text-center shadow-xl ${ANIMALS[winner].bg} border-2 ${ANIMALS[winner].border}`}>
              <p className="text-5xl mb-1">{ANIMALS[winner].emoji}</p>
              <p className={`font-black text-base ${ANIMALS[winner].text}`}>
                {ANIMALS[winner].win}
              </p>
            </div>

            {/* Resultado 1P */}
            {gameMode === "1p" && (
              <div className={`rounded-2xl px-5 py-4 text-center shadow-lg ${
                won ? "bg-emerald-500" : "bg-red-500"
              }`}>
                <p className="text-white font-black text-xl">
                  {won
                    ? `¡Ganaste! +${bet * PAYOUT_MULT} 🌰`
                    : `¡Qué pena! -${bet} 🌰`}
                </p>
                <p className="text-white/80 text-xs mt-1">
                  {won
                    ? `Apostaste por ${ANIMALS[chosen!].name} ${ANIMALS[chosen!].emoji} y acertaste`
                    : `Apostaste por ${ANIMALS[chosen!].name} ${ANIMALS[chosen!].emoji} — ganó ${ANIMALS[winner].name}`}
                </p>
              </div>
            )}

            {/* Resultado 2P */}
            {gameMode === "2p" && chosen !== null && chosenP2 !== null && (
              <div className="flex flex-col gap-2">
                {/* J1 result */}
                <div className={`rounded-2xl px-5 py-3 shadow-lg ${
                  chosen === winner ? "bg-emerald-500" : "bg-red-500"
                }`}>
                  <p className="text-white font-black text-base">
                    {chosen === winner
                      ? `J1 ${ANIMALS[chosen].emoji} ¡Gana! +${bet * PAYOUT_MULT} 🌰`
                      : `J1 ${ANIMALS[chosen].emoji} Pierde -${bet} 🌰`}
                  </p>
                </div>
                {/* J2 result */}
                <div className={`rounded-2xl px-5 py-3 shadow-lg ${
                  chosenP2 === winner ? "bg-emerald-500" : "bg-red-500"
                }`}>
                  <p className="text-white font-black text-base">
                    {chosenP2 === winner
                      ? `J2 ${ANIMALS[chosenP2].emoji} ¡Gana! +${betP2 * PAYOUT_MULT} 🌰`
                      : `J2 ${ANIMALS[chosenP2].emoji} Pierde -${betP2} 🌰`}
                  </p>
                </div>
                {/* Neither won */}
                {chosen !== winner && chosenP2 !== winner && (
                  <div className="rounded-2xl px-5 py-2 bg-slate-600 text-center">
                    <p className="text-white/80 text-sm">Ninguno apostó al ganador — la casa se lleva todo</p>
                  </div>
                )}
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col gap-2">
              {bellotas > 0 ? (
                <button
                  onClick={playAgain}
                  className="w-full py-4 rounded-2xl bg-emerald-400 text-emerald-900 font-black text-lg shadow-lg active:scale-95 transition"
                >
                  ¡Otra carrera! 🏁
                </button>
              ) : (
                <div className="bg-red-900/60 rounded-2xl px-5 py-4 text-center">
                  <p className="text-red-300 font-bold">¡Sin bellotas para apostar!</p>
                  <p className="text-red-400 text-xs mt-1">Completa registros para ganar más 🌰</p>
                </div>
              )}
              <button
                onClick={backToMode}
                className="w-full py-3 rounded-2xl bg-white/10 text-emerald-200 font-bold text-sm active:scale-95 transition"
              >
                Cambiar modo
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-white/10 text-emerald-200 font-bold text-sm active:scale-95 transition"
              >
                Salir del juego
              </button>
            </div>
          </div>
        )}

        {/* Zona de apuestas J1 (fase betting — tanto 1P como 2P primer paso) */}
        {phase === "betting" && (
          <div className="flex flex-col gap-3">

            {gameMode === "2p" && (
              <div className="bg-teal-700/60 rounded-2xl px-4 py-2 text-center">
                <p className="text-teal-200 font-bold text-sm">
                  👤 Jugador 1, elige tu animal + apuesta
                </p>
              </div>
            )}

            {/* Elige animal */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-3 text-center">
                ¿A quién le apuestas?
              </p>
              <div className="grid grid-cols-5 gap-2">
                {ANIMALS.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => setChosen(i)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                      chosen === i
                        ? `${a.bg} ${a.border} scale-105 shadow-lg`
                        : "bg-white/10 border-white/20 hover:bg-white/20"
                    }`}
                  >
                    <span className="text-3xl leading-none">{a.emoji}</span>
                    <span className={`text-[9px] font-bold leading-tight text-center ${
                      chosen === i ? a.text : "text-white/70"
                    }`}>
                      {a.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Apuesta J1 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-3 text-center">
                ¿Cuántas bellotas apuestas?
              </p>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {BET_OPTIONS.map(b => (
                  <button
                    key={b}
                    onClick={() => setBet(b)}
                    disabled={b > bellotas}
                    className={`py-3 rounded-xl font-black text-base transition-all active:scale-95 ${
                      bet === b
                        ? "bg-emerald-400 text-emerald-900 shadow-lg scale-105"
                        : b > bellotas
                        ? "bg-white/5 text-white/25 cursor-not-allowed"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <p className="text-emerald-300 text-xs text-center">
                Si ganas: <strong className="text-white">+{bet * PAYOUT_MULT} 🌰</strong>
                {" "}· Si pierdes: <strong className="text-white/60">-{bet} 🌰</strong>
              </p>
            </div>

            {/* Botón confirmar */}
            {noBellotas ? (
              <div className="bg-red-900/60 rounded-2xl px-5 py-4 text-center">
                <p className="text-red-300 font-bold">¡Sin bellotas para apostar!</p>
                <p className="text-red-400 text-xs mt-1">Completa registros para ganar más 🌰</p>
              </div>
            ) : (
              <button
                onClick={confirmBettingP1}
                disabled={chosen === null || bellotas < bet}
                className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all ${
                  chosen !== null && bellotas >= bet
                    ? "bg-emerald-400 text-emerald-900 shadow-emerald-900/40"
                    : "bg-white/10 text-white/30 cursor-not-allowed"
                }`}
              >
                {chosen === null
                  ? "Elige un animal primero"
                  : gameMode === "2p"
                  ? `Confirmar J1 →`
                  : `¡Apostar ${bet} 🌰 y correr! 🏁`}
              </button>
            )}

            {gameMode === "2p" && (
              <button
                onClick={backToMode}
                className="w-full py-3 rounded-2xl bg-white/10 text-emerald-200 font-bold text-sm active:scale-95 transition"
              >
                ← Cambiar modo
              </button>
            )}
          </div>
        )}

        {/* Zona de apuestas J2 (solo 2P) */}
        {phase === "betting_p2" && (
          <div className="flex flex-col gap-3">

            <div className="bg-teal-700/60 rounded-2xl px-4 py-2 text-center">
              <p className="text-teal-200 font-bold text-sm">
                👤 Jugador 2, elige tu animal + apuesta
              </p>
              {chosen !== null && (
                <p className="text-teal-300 text-xs mt-0.5">
                  J1 eligió {ANIMALS[chosen].emoji} {ANIMALS[chosen].name}
                </p>
              )}
            </div>

            {/* Elige animal J2 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-3 text-center">
                ¿A quién le apuestas? (no puedes elegir el mismo)
              </p>
              <div className="grid grid-cols-5 gap-2">
                {ANIMALS.map((a, i) => {
                  const isP1Animal = i === chosen;
                  return (
                    <button
                      key={i}
                      onClick={() => !isP1Animal && setChosenP2(i)}
                      disabled={isP1Animal}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                        isP1Animal
                          ? "bg-white/5 border-white/10 opacity-40 cursor-not-allowed"
                          : chosenP2 === i
                          ? `${a.bg} ${a.border} scale-105 shadow-lg`
                          : "bg-white/10 border-white/20 hover:bg-white/20"
                      }`}
                    >
                      <span className="text-3xl leading-none">{a.emoji}</span>
                      <span className={`text-[9px] font-bold leading-tight text-center ${
                        chosenP2 === i ? a.text : "text-white/70"
                      }`}>
                        {a.name}
                      </span>
                      {isP1Animal && (
                        <span className="text-[8px] text-white/40">J1</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Apuesta J2 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-3 text-center">
                ¿Cuántas bellotas apuesta J2?
              </p>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {BET_OPTIONS.map(b => {
                  const remaining = bellotas - bet; // J1 ya reservó su apuesta
                  return (
                    <button
                      key={b}
                      onClick={() => setBetP2(b)}
                      disabled={b > remaining}
                      className={`py-3 rounded-xl font-black text-base transition-all active:scale-95 ${
                        betP2 === b
                          ? "bg-teal-400 text-teal-900 shadow-lg scale-105"
                          : b > remaining
                          ? "bg-white/5 text-white/25 cursor-not-allowed"
                          : "bg-white/20 text-white hover:bg-white/30"
                      }`}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
              <p className="text-emerald-300 text-xs text-center">
                Si J2 gana: <strong className="text-white">+{betP2 * PAYOUT_MULT} 🌰</strong>
                {" "}· Si pierde: <strong className="text-white/60">-{betP2} 🌰</strong>
              </p>
              <p className="text-emerald-400/70 text-xs text-center mt-1">
                Total a descontar: {bet + betP2} 🌰 (disponibles: {bellotas})
              </p>
            </div>

            {/* Botón arrancar */}
            {!canAfford2P ? (
              <div className="bg-red-900/60 rounded-2xl px-5 py-4 text-center">
                <p className="text-red-300 font-bold">¡No hay suficientes bellotas!</p>
                <p className="text-red-400 text-xs mt-1">
                  Necesitas {totalNeeded2P} 🌰 (tienes {bellotas})
                </p>
              </div>
            ) : (
              <button
                onClick={confirmBettingP2}
                disabled={chosenP2 === null}
                className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all ${
                  chosenP2 !== null
                    ? "bg-teal-400 text-teal-900 shadow-teal-900/40"
                    : "bg-white/10 text-white/30 cursor-not-allowed"
                }`}
              >
                {chosenP2 === null
                  ? "J2: Elige un animal primero"
                  : `¡Apostar y correr! 🏁`}
              </button>
            )}

            <button
              onClick={() => setPhase("betting")}
              className="w-full py-3 rounded-2xl bg-white/10 text-emerald-200 font-bold text-sm active:scale-95 transition"
            >
              ← Volver (J1)
            </button>
          </div>
        )}
      </div>

      {/* ── Pie: estadísticas de sesión ── */}
      {races > 0 && (
        <div className="shrink-0 flex justify-center gap-8 px-5 py-3 border-t border-white/10">
          <div className="text-center">
            <p className="text-emerald-400 text-[10px] font-semibold uppercase">Carreras</p>
            <p className="text-white font-black text-lg leading-tight">{races}</p>
          </div>
          <div className="text-center">
            <p className="text-emerald-400 text-[10px] font-semibold uppercase">Esta sesión</p>
            <p className={`font-black text-lg leading-tight ${
              sessionGain >= 0 ? "text-emerald-300" : "text-red-300"
            }`}>
              {sessionGain >= 0 ? "+" : ""}{sessionGain} 🌰
            </p>
          </div>
          {gameMode === "2p" && (p1Wins + p2Wins + draws2P) > 0 && (
            <>
              <div className="text-center">
                <p className="text-emerald-400 text-[10px] font-semibold uppercase">J1 gana</p>
                <p className="text-white font-black text-lg leading-tight">{p1Wins}</p>
              </div>
              <div className="text-center">
                <p className="text-emerald-400 text-[10px] font-semibold uppercase">J2 gana</p>
                <p className="text-white font-black text-lg leading-tight">{p2Wins}</p>
              </div>
              <div className="text-center">
                <p className="text-emerald-400 text-[10px] font-semibold uppercase">Empates</p>
                <p className="text-white font-black text-lg leading-tight">{draws2P}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
