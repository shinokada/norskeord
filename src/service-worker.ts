/**
 * Service Worker — Push Notifications (Phase E-1)
 *
 * Handles:
 *  - `push` event: shows a notification using the payload body
 *  - `notificationclick` event: focuses the app or opens a new window
 *
 * SvelteKit automatically registers this file as the service worker when
 * it exists at src/service-worker.ts. The VitePWA plugin handles its own
 * workbox service worker separately; this file adds push support on top.
 *
 * Note: `self` is typed as ServiceWorkerGlobalScope below. TypeScript
 * requires the `webworker` lib for this — SvelteKit adds it automatically
 * via the `kit.serviceWorker` tsconfig override.
 */

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

// ── Push event ────────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  let body = 'Norskeord reminder 🇳🇴';

  if (event.data) {
    try {
      const payload = event.data.json() as { body?: string };
      if (payload.body) body = payload.body;
    } catch {
      body = event.data.text() || body;
    }
  }

  const options: NotificationOptions = {
    body,
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    tag: 'norskeord-daily-reminder', // Collapses duplicate notifications
    renotify: false,
    data: { url: '/' }
  };

  event.waitUntil(self.registration.showNotification('Norskeord', options));
});

// ── Notification click event ───────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl: string = (event.notification.data as { url?: string })?.url ?? '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an already-open window if one exists
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl);
    })
  );
});
