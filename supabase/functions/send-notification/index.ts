import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PushSub = { endpoint: string; keys: { p256dh: string; auth: string } };

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

  // ── Modo programado: comprueba qué schedules tocan ahora ─────────────────
  if (body.mode === "scheduled") {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentDay  = now.getUTCDay(); // 0=domingo … 6=sábado

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
      const result = await sendToAll(supabase, {
        title: sched.title,
        body:  sched.body,
        emoji: sched.emoji,
        url:   "/",
      }, vapidPublic, vapidPrivate);

      totalSent += result.sent;

      // Actualizar last_sent_at
      await supabase
        .from("notification_schedules")
        .update({ last_sent_at: now.toISOString() })
        .eq("id", sched.id);
    }

    return new Response(JSON.stringify({ scheduled: true, sent: totalSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Modo inmediato: envía el payload tal cual ────────────────────────────
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

// ── Helper: envía a todas las suscripciones ──────────────────────────────────
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
