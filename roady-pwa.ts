// ============================================
// ROADY CONSTRUCTION - PWA MOBILE COMPLET
// ============================================
// Features: Service Worker, Offline Mode, Push, Install
// Structure: frontend/src/pwa/

// ============================================
// public/manifest.json
// ============================================
/*
{
  "name": "ROADY Construction",
  "short_name": "ROADY",
  "description": "Système de gestion de construction intelligent",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#f59e0b",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "shortcuts": [
    {
      "name": "Nouveau Projet",
      "short_name": "Projet",
      "description": "Créer un nouveau projet",
      "url": "/projects/new",
      "icons": [{ "src": "/icons/shortcut-project.png", "sizes": "96x96" }]
    },
    {
      "name": "Scanner QR",
      "short_name": "Scanner",
      "description": "Scanner un code QR",
      "url": "/scanner",
      "icons": [{ "src": "/icons/shortcut-scanner.png", "sizes": "96x96" }]
    },
    {
      "name": "Assistant IA",
      "short_name": "IA",
      "description": "Parler à l'assistant",
      "url": "/assistant",
      "icons": [{ "src": "/icons/shortcut-ai.png", "sizes": "96x96" }]
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "categories": ["business", "productivity"],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "files",
          "accept": ["image/*", "application/pdf"]
        }
      ]
    }
  }
}
*/

// ============================================
// public/sw.js - Service Worker Principal
// ============================================
const CACHE_NAME = 'roady-v1.0.0';
const STATIC_CACHE = 'roady-static-v1';
const DYNAMIC_CACHE = 'roady-dynamic-v1';
const API_CACHE = 'roady-api-v1';

// Assets à mettre en cache immédiatement
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/assets/logo.svg',
];

// Stratégies de cache par route
const CACHE_STRATEGIES = {
  // Network First - données fraîches prioritaires
  networkFirst: [
    '/api/v1/projects',
    '/api/v1/tasks',
    '/api/v1/users/me',
  ],
  // Cache First - performance prioritaire
  cacheFirst: [
    '/api/v1/agents',
    '/api/v1/templates',
    '/api/v1/calculators',
  ],
  // Stale While Revalidate - meilleur des deux
  staleWhileRevalidate: [
    '/api/v1/dashboard',
    '/api/v1/notifications',
  ],
};

// === Installation ===
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// === Activation ===
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE)
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// === Fetch Handler ===
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages - Network First with offline fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOffline(request));
    return;
  }

  // Default - Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// === Cache Strategies ===
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache');
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/offline.html');
  }
}

async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Determine strategy based on endpoint
  if (CACHE_STRATEGIES.networkFirst.some(p => url.pathname.startsWith(p))) {
    return networkFirst(request, API_CACHE);
  }
  if (CACHE_STRATEGIES.cacheFirst.some(p => url.pathname.startsWith(p))) {
    return cacheFirst(request, API_CACHE);
  }
  return staleWhileRevalidate(request, API_CACHE);
}

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|eot|ico)$/i.test(pathname);
}

// === Background Sync ===
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
  
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncOfflineData() {
  const db = await openIndexedDB();
  const pendingRequests = await db.getAll('pending-requests');
  
  for (const req of pendingRequests) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body
      });
      
      if (response.ok) {
        await db.delete('pending-requests', req.id);
        console.log('[SW] Synced:', req.url);
      }
    } catch (error) {
      console.error('[SW] Sync failed:', error);
    }
  }
}

async function syncTasks() {
  const db = await openIndexedDB();
  const offlineTasks = await db.getAll('offline-tasks');
  
  for (const task of offlineTasks) {
    try {
      await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      await db.delete('offline-tasks', task.id);
    } catch (error) {
      console.error('[SW] Task sync failed:', error);
    }
  }
}

// === Push Notifications ===
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = { title: 'ROADY', body: 'Nouvelle notification' };
  
  if (event.data) {
    data = event.data.json();
  }
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [
      { action: 'open', title: 'Ouvrir' },
      { action: 'dismiss', title: 'Ignorer' }
    ],
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: data.priority === 'high'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(urlToOpen);
      })
  );
});

// ============================================
// src/pwa/usePWA.ts - Hook PWA React
// ============================================
import { useState, useEffect, useCallback } from 'react';

interface PWAStatus {
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  canInstall: boolean;
  pushPermission: NotificationPermission;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isOnline: navigator.onLine,
    isUpdateAvailable: false,
    canInstall: false,
    pushPermission: 'default',
  });
  
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check if already installed
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    
    setStatus(s => ({ ...s, isInstalled: isStandalone }));
    
    // Check notification permission
    if ('Notification' in window) {
      setStatus(s => ({ ...s, pushPermission: Notification.permission }));
    }
  }, []);

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('SW registered:', reg);
          setRegistration(reg);
          
          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setStatus(s => ({ ...s, isUpdateAvailable: true }));
              }
            });
          });
        })
        .catch((err) => console.error('SW registration failed:', err));
    }
  }, []);

  // Listen for install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setStatus(s => ({ ...s, canInstall: true }));
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setStatus(s => ({ ...s, isOnline: true }));
    const handleOffline = () => setStatus(s => ({ ...s, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Install app
  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    setDeferredPrompt(null);
    setStatus(s => ({ ...s, canInstall: false }));
    
    return outcome === 'accepted';
  }, [deferredPrompt]);

  // Update app
  const update = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  // Request push permission
  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    
    const permission = await Notification.requestPermission();
    setStatus(s => ({ ...s, pushPermission: permission }));
    
    if (permission === 'granted' && registration) {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
      });
      
      // Send subscription to backend
      await fetch('/api/v1/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      
      return true;
    }
    
    return false;
  }, [registration]);

  return {
    ...status,
    install,
    update,
    requestPushPermission,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

// ============================================
// src/pwa/useOfflineStorage.ts - IndexedDB Hook
// ============================================
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface RoadyDB extends DBSchema {
  'offline-tasks': { key: string; value: any };
  'cached-projects': { key: string; value: any };
  'pending-requests': { key: string; value: any };
  'user-preferences': { key: string; value: any };
}

let dbPromise: Promise<IDBPDatabase<RoadyDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<RoadyDB>('roady-offline', 1, {
      upgrade(db) {
        db.createObjectStore('offline-tasks', { keyPath: 'id' });
        db.createObjectStore('cached-projects', { keyPath: 'id' });
        db.createObjectStore('pending-requests', { keyPath: 'id', autoIncrement: true });
        db.createObjectStore('user-preferences', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

export function useOfflineStorage<T>(storeName: keyof RoadyDB) {
  const save = async (key: string, data: T) => {
    const db = await getDB();
    await db.put(storeName, { ...data, id: key } as any);
  };

  const get = async (key: string): Promise<T | undefined> => {
    const db = await getDB();
    return db.get(storeName, key) as Promise<T | undefined>;
  };

  const getAll = async (): Promise<T[]> => {
    const db = await getDB();
    return db.getAll(storeName) as Promise<T[]>;
  };

  const remove = async (key: string) => {
    const db = await getDB();
    await db.delete(storeName, key);
  };

  const clear = async () => {
    const db = await getDB();
    await db.clear(storeName);
  };

  return { save, get, getAll, remove, clear };
}

// ============================================
// src/components/PWAInstallPrompt.tsx
// ============================================
import React from 'react';
import { usePWA } from '../pwa/usePWA';
import { Download, X, RefreshCw, Wifi, WifiOff } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const { canInstall, install, isUpdateAvailable, update, isOnline } = usePWA();
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 z-50">
          <WifiOff className="w-4 h-4" />
          <span>Mode hors ligne - Certaines fonctionnalités sont limitées</span>
        </div>
      )}

      {/* Install Prompt */}
      {canInstall && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gray-900 rounded-lg shadow-xl p-4 z-50 border border-amber-500/30">
          <button 
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">Installer ROADY</h3>
              <p className="text-sm text-gray-400 mt-1">
                Installez l'application pour un accès rapide et le mode hors ligne
              </p>
              <button
                onClick={install}
                className="mt-3 px-4 py-2 bg-amber-500 text-black rounded-lg font-medium hover:bg-amber-400 transition"
              >
                Installer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Available */}
      {isUpdateAvailable && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-blue-900 rounded-lg shadow-xl p-4 z-50 border border-blue-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">Mise à jour disponible</h3>
              <p className="text-sm text-gray-300 mt-1">
                Une nouvelle version de ROADY est disponible
              </p>
              <button
                onClick={update}
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition"
              >
                Mettre à jour
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================
// public/offline.html - Page Offline
// ============================================
/*
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ROADY - Hors ligne</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .icon {
      width: 120px;
      height: 120px;
      margin: 0 auto 2rem;
      background: rgba(245, 158, 11, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon svg {
      width: 60px;
      height: 60px;
      color: #f59e0b;
    }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { color: #9ca3af; margin-bottom: 2rem; max-width: 400px; }
    .btn {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: #f59e0b;
      color: black;
      text-decoration: none;
      border-radius: 0.5rem;
      font-weight: 600;
      transition: background 0.2s;
    }
    .btn:hover { background: #d97706; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/>
      </svg>
    </div>
    <h1>Vous êtes hors ligne</h1>
    <p>Vérifiez votre connexion Internet et réessayez. Certaines fonctionnalités restent disponibles en mode hors ligne.</p>
    <a href="/" class="btn" onclick="window.location.reload(); return false;">Réessayer</a>
  </div>
</body>
</html>
*/
