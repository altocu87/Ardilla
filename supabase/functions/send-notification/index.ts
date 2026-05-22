import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PushSub = { endpoint: string; keys: { p256dh: string; auth: string } };
type ConditionType = "no_any" | "no_diario" | "no_caca" | "no_emocional" | "no_practica";

const CONDITION_TABLE: Record<ConditionType, string[]> = {
  no_any:       ["activity_logs", "caca_logs", "emocional_logs", "practice_logs"],
  no_diario:    ["activity_logs"],
  no_caca:      ["caca_logs"],
  no_emocional: ["emocional_logs"],
  no_practica:  ["practice_logs"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const vapidPublic  = Deno.env.get("VAPID_PUBLIC_KEY")!;
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY")!;
  const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey  = Deno.env.get("SERVICE_ROLE_KEY")!;

  webpush.setVapidDetails("mailto:altocuvlc@gmail.com", vapidPublic, vapidPrivate);
  const supabase = createClient(supabaseUrl, supabaseKey);

  const body = await req.json().catch(() => ({}));

  // ── Modo programado ───────────────────────────────────────────────────────
  if (body.mode === "scheduled") {
    const now = new Date();
    const currentHour = (now.getUTCHours() + 1) % 24; // GMT+1 España
    const currentDay  = now.getUTCDay();

    const { data: schedules } = await supabase
      .from("notification_schedules")
      .select("*")
      .eq("active", true)
      .eq("hour", currentHour)
      .contains("days", [currentDay]);

    if (!schedules?.length) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalSent = 0;
    for (const sched of schedules) {
      const conditionMet = await checkCondition(
        supabase,
        sched.condition_type as ConditionType | null,
        sched.condition_days ?? 1,
      );

      if (!conditionMet) continue;

      const result = await sendToAll(supabase, {
        title: sched.title, body: sched.body, emoji: sched.emoji, url: "/",
      }, vapidPublic, vapidPrivate);

      totalSent += result.sent;
      await supabase
        .from("notification_schedules")
        .update({ last_sent_at: now.toISOString() })
        .eq("id", sched.id);
    }

    return new Response(JSON.stringify({ scheduled: true, sent: totalSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Modo inmediato ────────────────────────────────────────────────────────
  const {
    title = "Ardilla",
    body:  msgBody = "¡Tienes un nuevo aviso!",
    emoji = "🐿️",
    url   = "/",
  } = body;

  const result = await sendToAll(supabase, { title, body: msgBody, emoji, url }, vapidPublic, vapidPrivate);

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

// ── Comprueba si la condición se cumple (true = enviar) ──────────────────────
async function checkCondition(
  supabase: ReturnType<typeof createClient>,
  conditionType: ConditionType | null,
  conditionDays: number,
): Promise<boolean> {
  if (!conditionType) return true;

  const tables = CONDITION_TABLE[conditionType];
  if (!tables) return true;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - conditionDays);
  const cutoffStr = cutoff.toISOString();

  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .gte("created_at", cutoffStr);

    if (count && count > 0) return false; // Hay actividad reciente → no enviar
  }

  return true; // Sin actividad → enviar
}

// ── Envía a todas las suscripciones ─────────────────────────────────────────
async function sendToAll(
  supabase: ReturnType<typeof createClient>,
  payload: { title: string; body: string; emoji: string; url: string },
  vapidPublic: string,
  vapidPrivate: string,
) {
  webpush.setVapidDetails("mailto:altocuvlc@gmail.com", vapidPublic, vapidPrivate);

  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  const json = JSON.stringify(payload);

  const results = await Promise.allSettled(
    (subs ?? []).map(async (sub: PushSub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, json);
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
        throw err;
      }
    })
  );

  return {
    sent:   results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
    total:  subs?.length ?? 0,
  };
}
