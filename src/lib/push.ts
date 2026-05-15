/**
 * Push notification client helpers (Phase E-2)
 *
 * Provides two functions used by SubscriptionSection.svelte:
 *   subscribeToPush()    — requests permission, creates a Web Push
 *                          subscription, and POSTs it to the API.
 *   unsubscribeFromPush() — unsubscribes locally and DELETEs it from the API.
 *
 * The VAPID public key is injected at build time from vite.config.ts via the
 * `__VAPID_PUBLIC_KEY__` define. Keep it out of `.env` client-side leakage
 * concerns: VAPID public keys are intentionally public.
 */

// Injected by vite.config.ts › define
declare const __VAPID_PUBLIC_KEY__: string;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert a URL-safe base64 VAPID key to a Uint8Array for pushManager. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Request notification permission, create a PushSubscription, and send it to
 * the server. Returns the subscription on success or null if the user denied
 * permission or the browser does not support push.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[push] Push notifications not supported in this browser.');
    return null;
  }

  // Request notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('[push] Notification permission denied.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(__VAPID_PUBLIC_KEY__).buffer as ArrayBuffer
    });

    // Send to server
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON())
    });

    if (!res.ok) {
      console.error('[push] Failed to save subscription to server:', await res.text());
      // Don't throw — subscription was created locally, server sync can retry
    }

    return subscription;
  } catch (err) {
    console.error('[push] Failed to subscribe:', err);
    return null;
  }
}

/**
 * Unsubscribe from push notifications and remove the subscription from the
 * server. Safe to call even if no subscription exists.
 */
export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
    }

    // Always call DELETE to clean up server-side, even if getSubscription()
    // returned null (subscription may have been cleared client-side already).
    await fetch('/api/push/subscribe', { method: 'DELETE' });
  } catch (err) {
    console.error('[push] Failed to unsubscribe:', err);
  }
}
