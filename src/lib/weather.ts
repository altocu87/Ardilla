import type { WeatherKind } from "./scene";
import { getSeason } from "./scene";

/* ════════════════════════════════════════════════════
   CLIMA DEL DÍA
   Se decide una vez al día (persistido) y se pondera por estación.
   Llamar solo en cliente (usa localStorage + Math.random).
════════════════════════════════════════════════════ */
const LS_KEY = "tama_weather_v1";

function rollWeather(): WeatherKind {
  const season = getSeason();
  const r = Math.random();
  switch (season) {
    case "invierno": return r < 0.4  ? "snow"   : r < 0.6 ? "fog"  : "clear";
    case "otono":    return r < 0.3  ? "leaves" : r < 0.5 ? "rain" : r < 0.62 ? "fog" : "clear";
    case "primavera":return r < 0.32 ? "rain"   : "clear";
    default:         return r < 0.14 ? "rain"   : "clear"; // verano, casi siempre despejado
  }
}

export function getTodayWeather(): WeatherKind {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const o = JSON.parse(raw) as { date: string; weather: WeatherKind };
      if (o.date === today) return o.weather;
    }
  } catch { /* noop */ }
  const weather = rollWeather();
  try { localStorage.setItem(LS_KEY, JSON.stringify({ date: today, weather })); } catch { /* noop */ }
  return weather;
}
