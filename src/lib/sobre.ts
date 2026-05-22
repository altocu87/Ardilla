export type SobreRewardKind =
  | "bellotas_small"
  | "bellotas_medium"
  | "xp_bonus"
  | "bellotas_jackpot"
  | "frase";

export type SobreReward = {
  kind: SobreRewardKind;
  bellotas: number;
  xp: number;
  frase?: string;
  isJackpot?: boolean;
};

const FRASES_ESPECIALES = [
  "¡Eres más valiente de lo que crees! 🌟",
  "Cada pequeño paso cuenta. ¡Sigue adelante! 🐿️",
  "Tu constancia es tu superpoder 💪",
  "Hoy has hecho algo importante por ti misma 🌿",
  "¡Qué orgullosa estoy de ti! 🥰",
];

/**
 * Generate a random sobre reward using the probability table:
 * 35% → 2-5 bellotas
 * 30% → 5-12 bellotas
 * 20% → 10-30 XP bonus
 * 10% → 20-40 bellotas (jackpot)
 *  5% → special phrase (no currency)
 */
export function generarSobre(): SobreReward {
  const r = Math.random();

  if (r < 0.35) {
    // 35%: 2-5 bellotas
    const bellotas = Math.floor(Math.random() * 4) + 2; // 2..5
    return { kind: "bellotas_small", bellotas, xp: 0 };
  } else if (r < 0.65) {
    // 30%: 5-12 bellotas
    const bellotas = Math.floor(Math.random() * 8) + 5; // 5..12
    return { kind: "bellotas_medium", bellotas, xp: 0 };
  } else if (r < 0.85) {
    // 20%: 10-30 XP bonus
    const xp = Math.floor(Math.random() * 21) + 10; // 10..30
    return { kind: "xp_bonus", bellotas: 0, xp };
  } else if (r < 0.95) {
    // 10%: 20-40 bellotas (jackpot)
    const bellotas = Math.floor(Math.random() * 21) + 20; // 20..40
    return { kind: "bellotas_jackpot", bellotas, xp: 0, isJackpot: true };
  } else {
    // 5%: special phrase
    const frase = FRASES_ESPECIALES[Math.floor(Math.random() * FRASES_ESPECIALES.length)];
    return { kind: "frase", bellotas: 0, xp: 0, frase };
  }
}
