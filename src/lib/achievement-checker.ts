/**
 * achievement-checker.ts
 * Carga todos los datos, comprueba qué logros se cumplen y desbloquea + premia.
 * Se llama desde /logros y puede llamarse tras acciones importantes.
 */
import { getPregLog, getCacaLog, getEmocionalLog, getPlayerProfile, upsertPlayerProfile, type CacaEntry, type EmocionalEntry } from "./db";
import { getEvolutionData } from "./tama-evolution";
import {
  getOwnedClothing, getOwnedToys, getEquippedClothing, CLOTHING_CATALOG, TOY_CATALOG,
  addOwnedClothing,
} from "./squirrel-shop";
import { getOwned, setOwned, getEquippedTitulo, getEquippedAvatar, getShopAvatares } from "./shop";
import { tryUnlock, getAchievementState, ALL_ACHIEVEMENTS, type Achievement } from "./tama-achievements";
import { getLevelInfo } from "./profile";

// ── Utilidades ────────────────────────────────────────────────────────────────

/** Calcula la racha actual de días consecutivos en un conjunto de fechas ISO. */
function currentStreak(dateSet: Set<string>): number {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 400; i++) {
    const key = d.toISOString().slice(0, 10);
    if (dateSet.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      // Toleramos el día de hoy si aún no hay registro (no rompemos racha por eso)
      if (i === 0) { d.setDate(d.getDate() - 1); continue; }
      break;
    }
  }
  return streak;
}

/** Calcula racha actual de caca (misma lógica). */
function currentCacaStreak(cacaDates: Set<string>): number {
  return currentStreak(cacaDates);
}

/** Días transcurridos desde la fecha ISO más antigua. */
function daysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  const now  = Date.now();
  return Math.floor((now - then) / 86_400_000);
}

/** Semanas distintas (año-semana) en las que hay al menos 1 registro. */
function distinctWeeks(dates: string[]): number {
  const isoWeek = (d: Date): string => {
    const tmp = new Date(d); tmp.setHours(0, 0, 0, 0);
    tmp.setDate(tmp.getDate() + 4 - (tmp.getDay() || 7));
    const y = tmp.getFullYear();
    const w = Math.ceil(((tmp.getTime() - new Date(y, 0, 1).getTime()) / 86_400_000 + 1) / 7);
    return `${y}-W${String(w).padStart(2, "0")}`;
  };
  return new Set(dates.map(d => isoWeek(new Date(d)))).size;
}

// ── Entrega de premios ────────────────────────────────────────────────────────
function deliverSyncRewards(ach: Achievement): void {
  if (ach.rewardClothingId) addOwnedClothing(ach.rewardClothingId);
  if (ach.rewardTituloId) {
    const owned = getOwned();
    if (!owned.includes(ach.rewardTituloId)) setOwned([...owned, ach.rewardTituloId]);
  }
}

// ── Checker principal ─────────────────────────────────────────────────────────
export async function checkAllAchievements(): Promise<Achievement[]> {
  const newlyUnlocked: Achievement[] = [];

  function unlock(id: string): void {
    const ach = tryUnlock(id);
    if (ach) newlyUnlocked.push(ach);
  }

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const [profile, pregLog, cacaLog, emocionalLog] = await Promise.all([
    getPlayerProfile(),
    getPregLog().catch(() => ({})),
    getCacaLog().catch(() => ({})),
    getEmocionalLog().catch(() => ({})),
  ]);

  const evolution    = getEvolutionData();
  const ownedCloth   = getOwnedClothing();
  const ownedToys    = getOwnedToys();
  const equipped     = getEquippedClothing();
  const equippedTit  = getEquippedTitulo();
  const equippedAv   = getEquippedAvatar();
  const avatars      = getShopAvatares();
  const shopOwned    = getOwned();
  const level        = getLevelInfo(profile.xp).level;

  // ── Derivados ───────────────────────────────────────────────────────────────
  const pregDates      = Object.keys(pregLog).sort();
  const pregDateSet    = new Set(pregDates);
  const pregCount      = pregDates.length;

  const cacaEntries: CacaEntry[] = Object.values(cacaLog).flat();
  const cacaDates      = new Set(Object.keys(cacaLog));
  const cacaCount      = cacaEntries.length;

  const emocEntries: EmocionalEntry[] = Object.values(emocionalLog).flat();
  const emocDates      = new Set(Object.keys(emocionalLog));
  const emocCount      = emocEntries.length;

  // Unión de todos los días con cualquier tipo de registro
  const allDates = new Set([...pregDates, ...Array.from(cacaDates), ...Array.from(emocDates)]);

  const streak         = currentStreak(pregDateSet);
  const cacaStreakLen  = currentCacaStreak(cacaDates);

  // Primer registro global (más antiguo)
  const firstDate      = [
    ...pregDates,
    ...Object.keys(cacaLog),
    ...Object.keys(emocionalLog),
  ].sort()[0];

  // ── ARDILLA ─────────────────────────────────────────────────────────────────
  if (evolution.totalTaps >= 1)    unlock("first_tap");
  if (evolution.totalTaps >= 50)   unlock("tap_50");
  if (evolution.totalTaps >= 200)  unlock("tap_200");
  if (evolution.totalTaps >= 500)  unlock("tap_500");
  if (evolution.totalTaps >= 1000) unlock("tap_1000");
  if (evolution.daysCaredFor >= 7)  unlock("week_care");
  if (evolution.daysCaredFor >= 15) unlock("days_15");
  if (evolution.daysCaredFor >= 30) unlock("month_care");
  if (evolution.goodNightsStreak >= 3) unlock("good_night_3");
  if (evolution.goodNightsStreak >= 7) unlock("good_night_7");
  if (["joven","adulta","anciana"].includes(evolution.phase)) unlock("grew_up");
  if (["adulta","anciana"].includes(evolution.phase))          unlock("adult");
  if (evolution.phase === "anciana")                           unlock("wise");

  // ── REGISTROS ───────────────────────────────────────────────────────────────
  if (pregCount >= 1)   unlock("first_diario");
  if (pregCount >= 5)   unlock("diario_5");
  if (pregCount >= 10)  unlock("diario_10");
  if (pregCount >= 25)  unlock("diario_25");
  if (pregCount >= 50)  unlock("diario_50");
  if (pregCount >= 100) unlock("diario_100");
  if (pregCount >= 200) unlock("diario_200");
  if (pregCount >= 365) unlock("diario_365");

  // Hora del registro
  const pregSavedAts = pregDates.map(d => new Date((pregLog as Record<string, { savedAt: string }>)[d].savedAt));
  if (pregSavedAts.some(d => d.getHours() < 9))  unlock("morning_reg");
  if (pregSavedAts.some(d => d.getHours() >= 22)) unlock("night_reg");
  if (pregSavedAts.some(d => d.getHours() < 6))  { unlock("early_bird"); unlock("secret_madrugada"); }

  // Fin de semana (sábado=6 domingo=0)
  {
    const weekends = new Set<string>();
    for (const d of pregDates) {
      const dt = new Date(d);
      if (dt.getDay() === 6) weekends.add(`${dt.getFullYear()}-${dt.getMonth()}-sat`);
      if (dt.getDay() === 0) weekends.add(`${dt.getFullYear()}-${dt.getMonth()}-sun`);
    }
    for (const d of pregDates) {
      const dt = new Date(d);
      if (dt.getDay() === 6) {
        const sunKey = `${dt.getFullYear()}-${dt.getMonth()}-sun`;
        if (weekends.has(sunKey)) { unlock("diario_weekend"); break; }
      }
    }
  }

  // 5 lunes
  {
    const lunes = pregDates.filter(d => new Date(d).getDay() === 1);
    if (lunes.length >= 5) unlock("diario_lunes");
  }

  // Todos los tipos el mismo día
  for (const d of Array.from(pregDateSet)) {
    if (cacaDates.has(d) && emocDates.has(d)) {
      unlock("all_types_day");
      unlock("multi_type");
      break;
    }
  }

  // 20+ registros en el mismo mes
  {
    const byMonth: Record<string, number> = {};
    for (const d of pregDates) {
      const key = d.slice(0, 7);
      byMonth[key] = (byMonth[key] ?? 0) + 1;
    }
    if (Object.values(byMonth).some(n => n >= 20)) unlock("wellbeing_30");
  }

  // ── CACA ────────────────────────────────────────────────────────────────────
  if (cacaCount >= 1)   unlock("first_caca");
  if (cacaCount >= 5)   unlock("caca_5");
  if (cacaCount >= 20)  unlock("caca_20");
  if (cacaCount >= 50)  unlock("caca_50");
  if (cacaCount >= 100) unlock("caca_100");
  if (cacaStreakLen >= 7) unlock("caca_streak_7");

  // Bristol (1-7)
  {
    const bristolTypes = new Set(cacaEntries.map(e => e.bristol));
    if ([1,2,3,4,5,6,7].every(n => bristolTypes.has(n))) unlock("caca_bristol_all");
    if (bristolTypes.has(4)) unlock("caca_perfecta");
  }

  // Sensaciones
  {
    const positives = ["bien","buena","mejor","excelente","alivio","aliviada","satisfecha"];
    if (cacaEntries.some(e => positives.some(p => e.sensacion?.toLowerCase().includes(p))))
      unlock("caca_buena");

    const sensSet = new Set(cacaEntries.map(e => e.sensacion?.toLowerCase().trim()).filter(Boolean));
    if (sensSet.size >= 3) unlock("caca_variety");
  }

  // Caca antes de las 7am
  if (cacaEntries.some(e => new Date(e.savedAt).getHours() < 7)) unlock("caca_madrugada");

  // ── EMOCIONAL ────────────────────────────────────────────────────────────────
  if (emocCount >= 1)   unlock("first_emocional");
  if (emocCount >= 5)   unlock("emocional_5");
  if (emocCount >= 20)  unlock("emocional_20");
  if (emocCount >= 50)  unlock("emocional_50");
  if (emocCount >= 100) unlock("emocional_100");

  // Alegría 5 veces
  {
    const alegriaCount = emocEntries.filter(e =>
      ["alegr","feliz","contenta","felicidad","joy"].some(k => e.estado?.toLowerCase().includes(k))
    ).length;
    if (alegriaCount >= 5) unlock("emocional_alegria");
  }

  // Intensidad alta (>=8) x5
  if (emocEntries.filter(e => e.intensidad >= 8).length >= 5) unlock("emocional_resiliente");

  // Intensidades extremas
  if (emocEntries.some(e => e.intensidad >= 10)) unlock("emocional_intensa");
  if (emocEntries.some(e => e.intensidad <= 1))  unlock("emocional_tranquila");

  // 20 en el mismo mes
  {
    const byMonth: Record<string, number> = {};
    for (const d of Array.from(emocDates)) {
      const key = d.slice(0, 7);
      byMonth[key] = (byMonth[key] ?? 0) + 1;
    }
    if (Object.values(byMonth).some(n => n >= 20)) unlock("emocional_month");
  }

  // 5 necesidades distintas
  {
    const neces = new Set(emocEntries.flatMap(e => e.necesidad ?? []));
    if (neces.size >= 5) unlock("emocional_necesidades");
  }

  // 5 lugares distintos
  {
    const lugares = new Set(emocEntries.flatMap(e => e.donde ?? []));
    if (lugares.size >= 5) unlock("emocional_lugares");
  }

  // ── RACHAS ──────────────────────────────────────────────────────────────────
  if (streak >= 3)   unlock("streak_3");
  if (streak >= 7)   unlock("streak_7");
  if (streak >= 14)  unlock("streak_14");
  if (streak >= 21)  unlock("streak_21");
  if (streak >= 30)  unlock("streak_30");
  if (streak >= 60)  unlock("streak_60");
  if (streak >= 100) unlock("streak_100");

  // streakAwards: ya ganados (3,7,14,21,30)
  if ((profile.streakAwards ?? []).length >= 1) unlock("streak_bonus");

  // Semana perfecta: 7 días seguidos con cualquier tipo
  {
    const anyStreak = currentStreak(new Set(Array.from(allDates)));
    if (anyStreak >= 7)  unlock("perfecta_7");
    if (anyStreak >= 30) unlock("mes_completo");
  }

  // Consistente: registros en 4 semanas distintas del mismo mes
  {
    const weeks = distinctWeeks(pregDates);
    if (weeks >= 4) unlock("consistente");
  }

  // ── TIENDA ──────────────────────────────────────────────────────────────────
  if (shopOwned.length >= 1) unlock("first_buy");
  if (ownedCloth.length >= 1) unlock("bought_clothing");

  // Prenda equipada
  if (Object.keys(equipped).length >= 1) unlock("squirrel_dressed");

  // Look completo (4 slots)
  if (["head","neck","body","eyes"].every(s => s in equipped)) unlock("fashion_complete");

  // Corona equipada
  if (equipped.head === "cloth_corona") unlock("squirrel_crown");

  // Toda la ropa
  if (CLOTHING_CATALOG.every(c => ownedCloth.includes(c.id))) unlock("all_clothing");

  // Todos los juguetes
  if (TOY_CATALOG.every(t => ownedToys.includes(t.id))) unlock("all_toys_owned");

  // Título
  {
    // Los IDs de títulos de DEFAULT_TITULOS empiezan por "dt"
    const boughtTitulos = shopOwned.filter(id => id.startsWith("dt"));
    if (boughtTitulos.length >= 1) unlock("titulo_bought");
    if (equippedTit) unlock("titulo_equipped");
  }

  // Avatar
  if (equippedAv || avatars.length > 0) unlock("avatar_uploaded");

  // Bellotas
  if (profile.bellotas >= 500)  unlock("bellota_rich");
  if (profile.bellotas >= 1000) unlock("bellota_mega");

  // 5 artículos en tienda
  if (shopOwned.length >= 5) unlock("tienda_5");

  // ── NIVEL ───────────────────────────────────────────────────────────────────
  if (level >= 2)  unlock("level_2");
  if (level >= 5)  unlock("level_5");
  if (level >= 10) unlock("level_10");
  if (level >= 20) unlock("level_20");
  if (level >= 30) unlock("level_30");
  if (level >= 50) unlock("level_50");
  if (profile.xp >= 500)  unlock("xp_500");
  if (profile.xp >= 2000) unlock("xp_2000");
  if (profile.xp >= 5000) unlock("xp_5000");

  // ── ESPECIAL ────────────────────────────────────────────────────────────────

  // Notificaciones push
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) unlock("first_notif");
    } catch { /* noop */ }
  }

  // Tiempo usando la app
  if (firstDate) {
    const days = daysSince(firstDate);
    if (days >= 7)   unlock("app_week");
    if (days >= 30)  unlock("app_month");
    if (days >= 365) unlock("app_year");
  }

  // Todos los tipos al menos una vez
  if (pregCount >= 1 && cacaCount >= 1 && emocCount >= 1) unlock("all_types_unlocked");

  // ── Meta-logros (segunda pasada tras desbloquear los anteriores) ─────────────
  const updatedState = getAchievementState();
  const total = updatedState.unlocked.length;
  if (total >= 10)  tryUnlock("logros_10")  && newlyUnlocked.push(ALL_ACHIEVEMENTS.find(a => a.id === "logros_10")!);
  if (total >= 25)  tryUnlock("logros_25")  && newlyUnlocked.push(ALL_ACHIEVEMENTS.find(a => a.id === "logros_25")!);
  if (total >= 50)  tryUnlock("logros_50")  && newlyUnlocked.push(ALL_ACHIEVEMENTS.find(a => a.id === "logros_50")!);
  if (total >= 75)  tryUnlock("logros_75")  && newlyUnlocked.push(ALL_ACHIEVEMENTS.find(a => a.id === "logros_75")!);
  if (total >= 100) tryUnlock("logros_100") && newlyUnlocked.push(ALL_ACHIEVEMENTS.find(a => a.id === "logros_100")!);

  // ── Entregar premios ─────────────────────────────────────────────────────────
  if (newlyUnlocked.length > 0) {
    const totalBellotas = newlyUnlocked.reduce((sum, a) => sum + a.rewardBellotas, 0);
    for (const ach of newlyUnlocked) deliverSyncRewards(ach);
    if (totalBellotas > 0) {
      const fresh = await getPlayerProfile();
      await upsertPlayerProfile({ bellotas: fresh.bellotas + totalBellotas });
    }
  }

  return newlyUnlocked;
}

