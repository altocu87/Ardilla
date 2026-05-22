"use client";
import { useState } from "react";
import { type SobreReward } from "@/lib/sobre";
import { upsertPlayerProfile, getPlayerProfile } from "@/lib/db";

type SobreModalProps = {
  reward: SobreReward;
  onClose: () => void;
};

export default function SobreModal({ reward, onClose }: SobreModalProps) {
  const [opened, setOpened] = useState(false);
  const [applying, setApplying] = useState(false);

  async function handleOpen() {
    if (opened) return;
    setOpened(true);
    // Apply the reward
    setApplying(true);
    try {
      if (reward.bellotas > 0 || reward.xp > 0) {
        const profile = await getPlayerProfile();
        await upsertPlayerProfile({
          xp: profile.xp + reward.xp,
          bellotas: profile.bellotas + reward.bellotas,
        });
      }
    } catch (e) {
      console.error("SobreModal apply reward error:", e);
    }
    setApplying(false);
  }

  function rewardLabel(): string {
    switch (reward.kind) {
      case "bellotas_small":
      case "bellotas_medium":
        return `+${reward.bellotas} 🌰`;
      case "bellotas_jackpot":
        return `¡JACKPOT! +${reward.bellotas} 🌰`;
      case "xp_bonus":
        return `+${reward.xp} XP`;
      case "frase":
        return reward.frase ?? "¡Eres increíble!";
      default:
        return "";
    }
  }

  function rewardColor(): string {
    switch (reward.kind) {
      case "bellotas_jackpot":
        return "text-amber-600";
      case "xp_bonus":
        return "text-teal-600";
      case "frase":
        return "text-violet-600";
      default:
        return "text-amber-500";
    }
  }

  return (
    <>
      <style>{`
        @keyframes sobre-float {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50%       { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes sobre-open {
          0%   { transform: scale(1) rotate(0deg); }
          30%  { transform: scale(1.15) rotate(-5deg); }
          60%  { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1.1) rotate(0deg); }
        }
        @keyframes reward-pop {
          0%   { transform: scale(0.5) translateY(20px); opacity: 0; }
          70%  { transform: scale(1.1) translateY(-5px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes sparkle-spin {
          0%   { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(180deg) scale(1.3); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .sobre-float { animation: sobre-float 2s ease-in-out infinite; }
        .sobre-open  { animation: sobre-open 0.5s ease-out forwards; }
        .reward-pop  { animation: reward-pop 0.6s cubic-bezier(.175,.885,.32,1.275) forwards; }
        .sparkle-spin { animation: sparkle-spin 1.5s linear infinite; }
      `}</style>

      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6">
        {/* Blurred backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal content */}
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-xs w-full">

          {/* Title */}
          <div className="text-center">
            <p className="text-white/90 text-sm font-semibold uppercase tracking-wider mb-1">
              Sobre misterioso ✨
            </p>
            {!opened && (
              <p className="text-white/70 text-xs">
                Toca el sobre para abrirlo
              </p>
            )}
          </div>

          {/* Envelope */}
          <button
            onClick={handleOpen}
            disabled={opened}
            className="relative flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <span
              className={`text-[120px] leading-none select-none ${
                !opened ? "sobre-float" : "sobre-open"
              }`}
              style={{
                filter: reward.isJackpot && opened
                  ? "drop-shadow(0 0 20px rgba(251,191,36,0.9))"
                  : opened
                  ? "drop-shadow(0 0 12px rgba(255,255,255,0.5))"
                  : "drop-shadow(0 4px 16px rgba(0,0,0,0.4))",
              }}
            >
              {opened ? "📬" : "📩"}
            </span>

            {/* Jackpot sparkles */}
            {reward.isJackpot && opened && (
              <>
                <span className="absolute -top-4 -left-4 text-3xl sparkle-spin">✨</span>
                <span className="absolute -top-2 -right-6 text-2xl sparkle-spin" style={{ animationDelay: "0.3s" }}>⭐</span>
                <span className="absolute -bottom-2 -left-6 text-2xl sparkle-spin" style={{ animationDelay: "0.6s" }}>✨</span>
                <span className="absolute -bottom-4 -right-4 text-3xl sparkle-spin" style={{ animationDelay: "0.9s" }}>🌟</span>
              </>
            )}
          </button>

          {/* Reward revealed */}
          {opened && !applying && (
            <div className="reward-pop flex flex-col items-center gap-3 w-full">
              <div
                className={`bg-white rounded-3xl px-6 py-5 shadow-2xl w-full text-center ${
                  reward.isJackpot ? "border-2 border-amber-400" : "border border-white/20"
                }`}
              >
                {reward.kind === "frase" ? (
                  <>
                    <p className="text-3xl mb-3">💌</p>
                    <p className="text-slate-800 font-semibold text-sm leading-relaxed italic">
                      &ldquo;{reward.frase}&rdquo;
                    </p>
                    <p className="text-slate-400 text-xs mt-2">Un mensaje especial para ti</p>
                  </>
                ) : (
                  <>
                    {reward.isJackpot && (
                      <p className="text-amber-500 font-extrabold text-sm uppercase tracking-wider mb-2">
                        ¡¡JACKPOT!! 🎉
                      </p>
                    )}
                    <p className={`text-3xl font-extrabold ${rewardColor()} mb-1`}>
                      {rewardLabel()}
                    </p>
                    {reward.kind === "xp_bonus" ? (
                      <p className="text-slate-500 text-xs">XP extra ganado</p>
                    ) : (
                      <p className="text-slate-500 text-xs">bellotas extra ganadas</p>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-violet-600 text-white font-bold text-base shadow-lg shadow-violet-400/40 active:scale-95 transition-all"
              >
                ¡Genial! {reward.isJackpot ? "🎉" : "✨"}
              </button>
            </div>
          )}

          {/* Tap hint when not opened */}
          {!opened && (
            <div className="flex gap-2 items-center bg-white/10 rounded-2xl px-4 py-2.5">
              <span className="text-xl">👆</span>
              <p className="text-white text-sm font-medium">Toca para descubrir tu recompensa</p>
            </div>
          )}

          {/* Loading */}
          {applying && (
            <p className="text-white/70 text-sm animate-pulse">Aplicando recompensa...</p>
          )}
        </div>
      </div>

    </>
  );
}
