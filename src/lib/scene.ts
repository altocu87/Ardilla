/* ════════════════════════════════════════════════════
   TIPOS Y UTILIDADES DE ESCENA
   Compartidos entre SceneBg (page.tsx) y SceneForeground.
════════════════════════════════════════════════════ */
export type TimeSegment = "madrugada" | "amanecer" | "dia" | "atardecer" | "noche";
export type WeatherKind = "clear" | "rain" | "snow" | "leaves" | "fog";
export type SeasonKind  = "primavera" | "verano" | "otono" | "invierno";

/** Estación (hemisferio norte, aproximada por mes). */
export function getSeason(d: Date = new Date()): SeasonKind {
  const m = d.getMonth(); // 0-11
  if (m <= 1 || m === 11) return "invierno";
  if (m <= 4)             return "primavera";
  if (m <= 7)             return "verano";
  return "otono";
}
