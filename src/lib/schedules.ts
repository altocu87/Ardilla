import { createBrowserClient } from "@supabase/ssr";

export type ConditionType = "no_any" | "no_diario" | "no_caca" | "no_emocional" | "no_practica";

export const CONDITION_LABELS: Record<ConditionType, string> = {
  no_any:       "cualquier registro",
  no_diario:    "registro de diario",
  no_caca:      "registro de caca",
  no_emocional: "registro emocional",
  no_practica:  "práctica",
};

export type NotifSchedule = {
  id: string;
  emoji: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  days: number[];
  active: boolean;
  last_sent_at: string | null;
  condition_type: ConditionType | null;
  condition_days: number;
};

const DAYS_LABELS = ["D", "L", "M", "X", "J", "V", "S"];
export { DAYS_LABELS };

function db() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function getSchedules(): Promise<NotifSchedule[]> {
  const { data } = await db()
    .from("notification_schedules")
    .select("*")
    .order("hour", { ascending: true });
  return (data ?? []) as NotifSchedule[];
}

export async function upsertSchedule(
  s: Omit<NotifSchedule, "id" | "last_sent_at"> & { id?: string }
): Promise<void> {
  await db().from("notification_schedules").upsert(s, { onConflict: "id" });
}

export async function deleteSchedule(id: string): Promise<void> {
  await db().from("notification_schedules").delete().eq("id", id);
}

export async function toggleSchedule(id: string, active: boolean): Promise<void> {
  await db().from("notification_schedules").update({ active }).eq("id", id);
}

export async function sendNow(schedule: NotifSchedule): Promise<void> {
  await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-notification`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        title: schedule.title,
        body:  schedule.body,
        emoji: schedule.emoji,
        url:   "/",
      }),
    }
  );
}
