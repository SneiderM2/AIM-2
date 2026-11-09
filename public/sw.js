/**
 * @file sw.js
 * @description Service Worker de alto rendimiento para SGI — Sistema de Gestión Inmobiliaria (PWA).
 *              Estrategias de caché inteligentes:
 *              - Navegación HTML: Network-First con fallback a caché y página offline.
 *              - Recursos estáticos (imágenes, fuentes, scripts, CSS): Cache-First con revalidación.
 *              - Rutas API/Webhooks: Network-Only.
 */

const CACHE_VERSION = 'sgi-proptech-v1.0.1';
const STATIC_CACHE_NAME = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `dynamic-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.ico',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/favicon-32x32.png',
];

// Evento: Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Fallo precache de algunos activos:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Evento: Activación y Purga de versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Evento: Intercepción de Solicitudes (Fetch)
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Ignorar solicitudes que no sean GET o que sean esquemas no soportados (ej. chrome-extension:)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 2. Rutas de API y Webhooks: Network-Only
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 3. Navegación HTML (Páginas): Network-First con Fallback a Offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const offlineFallback = await caches.match('/offline');
          if (offlineFallback) {
            return offlineFallback;
          }
          return new Response(
            `<!DOCTYPE html>
            <html lang="es">
              <head><meta charset="utf-8"/><title>SGI Offline</title></head>
              <body style="font-family:system-ui;text-align:center;padding:40px;background:#1B365D;color:#fff;">
                <h2>SGI • Modo Sin Conexión</h2>
                <p>No tienes acceso a internet en este momento.</p>
                <button onclick="window.location.reload()" style="background:#11CAA0;color:#1B365D;border:none;padding:10px 20px;border-radius:8px;font-weight:bold;cursor:pointer;">Reintentar</button>
              </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 4. Recursos Estáticos (Imágenes, Fuentes, CSS, JS): Cache-First
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidación en segundo plano (stale-while-revalidate)
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(STATIC_CACHE_NAME).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(STATIC_CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);
      })
    );
    return;
  }

  // 5. Otras peticiones: Network con fallback a caché
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Manejo de mensajes desde la app (ej. forzar actualización)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
