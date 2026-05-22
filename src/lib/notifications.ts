import { createBrowserClient } from "@supabase/ssr";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) buffer[i] = rawData.charCodeAt(i);
  return buffer;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return reg;
  } catch {
    return null;
  }
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  return Notification.permission;
}

export async function subscribeToPush(): Promise<{ ok: boolean; error?: string }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, error: "Este navegador no soporta notificaciones push" };
  }

  if (!VAPID_PUBLIC_KEY) {
    return { ok: false, error: "Configuración incompleta: falta VAPID_PUBLIC_KEY en el servidor" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Permiso de notificaciones denegado" };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as string,
    });

    const sub = subscription.toJSON();
    const supabase = getSupabase();

    await supabase.from("push_subscriptions").upsert(
      {
        endpoint: sub.endpoint,
        keys: sub.keys,
      },
      { onConflict: "endpoint" }
    );

    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  const supabase = getSupabase();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

export async function sendTestNotification(): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-notification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          title: "¡Hola Ardilla!",
          body: "Las notificaciones funcionan correctamente 🎉",
          emoji: "🐿️",
          url: "/",
        }),
      }
    );
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
