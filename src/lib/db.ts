import { createClient } from "./supabase";

// ─── Preg (activity_logs) ────────────────────────────────────────────────────

export type PregEntry = {
  id: string;
  situation: string;
  signal: string[];
  alarm: string[];
  habitual: string[];
  newResponse: string[];
  after: string[];
  mood?: string;
  savedAt: string;
};

export type PregLog = Record<string, PregEntry>;

function rowToPreg(row: Record<string, unknown>): [string, PregEntry] {
  const savedAt = row.logged_at as string;
  const date = new Date(savedAt).toISOString().slice(0, 10);
  return [date, {
    id: row.id as string,
    situation: (row.notes as string) || "",
    signal: (row.signals as string[]) || [],
    alarm: (row.alarms as string[]) || [],
    habitual: (row.impulses as string[]) || [],
    newResponse: (row.regulation as string[]) || [],
    after: (row.after_effect as string[]) || [],
    mood: (row.mood as string) || undefined,
    savedAt,
  }];
}

export async function getPregLog(): Promise<PregLog> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id, notes, signals, alarms, impulses, regulation, after_effect, mood, logged_at")
    .order("logged_at", { ascending: false });
  if (error) throw error;
  const log: PregLog = {};
  for (const row of data ?? []) {
    const [date, entry] = rowToPreg(row as Record<string, unknown>);
    if (!log[date]) log[date] = entry;
  }
  return log;
}

export async function savePregEntry(entry: Omit<PregEntry, "id">): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .insert({
      user_id: null,
      notes: entry.situation,
      signals: entry.signal,
      alarms: entry.alarm,
      impulses: entry.habitual,
      regulation: entry.newResponse,
      after_effect: entry.after,
      mood: entry.mood || null,
      logged_at: entry.savedAt,
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updatePregEntry(id: string, patch: Partial<Omit<PregEntry, "id" | "savedAt">>): Promise<void> {
  const supabase = createClient();
  const update: Record<string, unknown> = {};
  if ("situation"   in patch) update.notes        = patch.situation;
  if ("signal"      in patch) update.signals      = patch.signal;
  if ("alarm"       in patch) update.alarms       = patch.alarm;
  if ("habitual"    in patch) update.impulses     = patch.habitual;
  if ("newResponse" in patch) update.regulation   = patch.newResponse;
  if ("after"       in patch) update.after_effect = patch.after;
  if ("mood"        in patch) update.mood         = patch.mood || null;
  const { error } = await supabase.from("activity_logs").update(update).eq("id", id);
  if (error) throw error;
}

export async function deletePregEntry(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("activity_logs").delete().eq("id", id);
  if (error) throw error;
}

// ─── Caca (caca_logs) ────────────────────────────────────────────────────────

export type CacaEntry = {
  id: string;
  cantidad: string;
  bristol: number;
  bristolName: string;
  bristolIcon: string;
  sensacion: string;
  savedAt: string;
};

export type CacaLog = Record<string, CacaEntry[]>;

function rowToCaca(row: Record<string, unknown>): [string, CacaEntry] {
  const savedAt = row.logged_at as string;
  const date = new Date(savedAt).toISOString().slice(0, 10);
  return [date, {
    id: row.id as string,
    cantidad: (row.cantidad as string) || "",
    bristol: (row.bristol_n as number) || 0,
    bristolName: (row.bristol_name as string) || "",
    bristolIcon: (row.bristol_icon as string) || "",
    sensacion: (row.sensacion as string) || "",
    savedAt,
  }];
}

export async function getCacaLog(): Promise<CacaLog> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("caca_logs")
    .select("*")
    .order("logged_at", { ascending: true });
  if (error) throw error;
  const log: CacaLog = {};
  for (const row of data ?? []) {
    const [date, entry] = rowToCaca(row as Record<string, unknown>);
    if (!log[date]) log[date] = [];
    log[date].push(entry);
  }
  return log;
}

export async function saveCacaEntry(entry: Omit<CacaEntry, "id">): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("caca_logs")
    .insert({
      user_id: null,
      cantidad: entry.cantidad,
      bristol_n: entry.bristol,
      bristol_name: entry.bristolName,
      bristol_icon: entry.bristolIcon,
      sensacion: entry.sensacion,
      logged_at: entry.savedAt,
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateCacaEntry(id: string, patch: Partial<Omit<CacaEntry, "id" | "savedAt">>): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("caca_logs").update({
    cantidad:     patch.cantidad,
    bristol_n:    patch.bristol,
    bristol_name: patch.bristolName,
    bristol_icon: patch.bristolIcon,
    sensacion:    patch.sensacion,
  }).eq("id", id);
  if (error) throw error;
}

export async function deleteCacaEntry(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("caca_logs").delete().eq("id", id);
  if (error) throw error;
}

// ─── Emocional (emocional_logs) ──────────────────────────────────────────────

export type EmocionalEntry = {
  id: string;
  estado: string;
  estadoEmoji: string;
  donde: string[];
  intensidad: number;
  necesidad: string[];
  mood?: string;
  savedAt: string;
};

export type EmocionalLog = Record<string, EmocionalEntry>;

function rowToEmocional(row: Record<string, unknown>): [string, EmocionalEntry] {
  const savedAt = row.logged_at as string;
  const date = new Date(savedAt).toISOString().slice(0, 10);
  return [date, {
    id: row.id as string,
    estado: (row.estado as string) || "",
    estadoEmoji: (row.estado_emoji as string) || "",
    donde: (row.donde as string[]) || [],
    intensidad: (row.intensidad as number) ?? 0,
    necesidad: (row.necesidad as string[]) || [],
    mood: (row.mood as string) || undefined,
    savedAt,
  }];
}

export async function getEmocionalLog(): Promise<EmocionalLog> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("emocional_logs")
    .select("id, estado, estado_emoji, donde, intensidad, necesidad, mood, logged_at")
    .order("logged_at", { ascending: false });
  if (error) throw error;
  const log: EmocionalLog = {};
  for (const row of data ?? []) {
    const [date, entry] = rowToEmocional(row as Record<string, unknown>);
    if (!log[date]) log[date] = entry;
  }
  return log;
}

export async function saveEmocionalEntry(entry: Omit<EmocionalEntry, "id">): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("emocional_logs")
    .insert({
      user_id: null,
      estado: entry.estado,
      estado_emoji: entry.estadoEmoji,
      donde: entry.donde,
      intensidad: entry.intensidad,
      necesidad: entry.necesidad,
      mood: entry.mood || null,
      logged_at: entry.savedAt,
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateEmocionalEntry(id: string, patch: Partial<Omit<EmocionalEntry, "id" | "savedAt">>): Promise<void> {
  const supabase = createClient();
  const update: Record<string, unknown> = {};
  if ("estado"      in patch) update.estado       = patch.estado;
  if ("estadoEmoji" in patch) update.estado_emoji = patch.estadoEmoji;
  if ("donde"       in patch) update.donde        = patch.donde;
  if ("intensidad"  in patch) update.intensidad   = patch.intensidad;
  if ("necesidad"   in patch) update.necesidad    = patch.necesidad;
  if ("mood"        in patch) update.mood         = patch.mood || null;
  const { error } = await supabase.from("emocional_logs").update(update).eq("id", id);
  if (error) throw error;
}

export async function deleteEmocionalEntry(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("emocional_logs").delete().eq("id", id);
  if (error) throw error;
}

// ─── PlayerProfile (player_profile) ─────────────────────────────────────────

export type PlayerProfile = {
  xp: number;
  bellotas: number;
  dailyAwards: Record<string, boolean>;
  streakAwards: number[];
};

export async function getPlayerProfile(): Promise<PlayerProfile> {
  const supabase = createClient();
  const { data } = await supabase
    .from("player_profile")
    .select("xp, bellotas, daily_awards, streak_awards")
    .eq("user_key", "vicky")
    .maybeSingle();
  if (!data) return { xp: 0, bellotas: 0, dailyAwards: {}, streakAwards: [] };
  return {
    xp:           (data.xp as number)                              ?? 0,
    bellotas:     (data.bellotas as number)                        ?? 0,
    dailyAwards:  (data.daily_awards  as Record<string, boolean>)  ?? {},
    streakAwards: (data.streak_awards as number[])                 ?? [],
  };
}

export async function upsertPlayerProfile(patch: Partial<PlayerProfile>): Promise<void> {
  const supabase = createClient();
  const row: Record<string, unknown> = { user_key: "vicky" };
  if ("xp"           in patch) row.xp            = patch.xp;
  if ("bellotas"     in patch) row.bellotas       = patch.bellotas;
  if ("dailyAwards"  in patch) row.daily_awards   = patch.dailyAwards;
  if ("streakAwards" in patch) row.streak_awards  = patch.streakAwards;
  const { error } = await supabase
    .from("player_profile")
    .upsert(row, { onConflict: "user_key" });
  if (error) throw error;
}
