/**
 * Service Worker para RelojReducto
 * Permite tracking de ubicación en background cuando la app está instalada como PWA.
 * 
 * Funcionalidades:
 * - Registra Periodic Background Sync para enviar ubicación cada ~5 min (cuando disponible)
 * - Mantiene la app activa más tiempo en segundo plano
 * - Cachea recursos esenciales para funcionamiento offline
 * - MODO OFFLINE: Guarda marcaciones en IndexedDB cuando no hay conexión
 * - SYNC automático: Envía marcaciones pendientes cuando se recupera la conexión
 */

const CACHE_NAME = 'relojreducto-v4';
const TRACKING_INTERVAL = 30 * 1000; // 30 segundos para tiempo real

// Recursos a cachear para acceso offline (NO incluir / ni index.html para evitar servir versiones viejas)
const STATIC_ASSETS = [
    '/logo.png',
    '/manifest.json'
];

// =============================================
// INSTALACIÓN
// =============================================
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker v5 - Tracking 30s...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// =============================================
// ACTIVACIÓN
// =============================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker v5 activado');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );

    // Registrar periodic background sync si está disponible
    if (self.registration.periodicSync) {
        self.registration.periodicSync.register('background-tracking', {
            minInterval: 5 * 60 * 1000 // Cada 5 minutos en background
        }).then(() => {
            console.log('[SW] Periodic Background Sync registrado');
        }).catch(err => {
            console.log('[SW] Periodic Sync no disponible:', err.message);
        });
    }
});

// =============================================
// PERIODIC BACKGROUND SYNC (Chrome Android PWA)
// =============================================
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'background-tracking') {
        console.log('[SW] Ejecutando Background Sync - Tracking');
        event.waitUntil(enviarUbicacionDesdeWorker());
    }
    if (event.tag === 'sync-marcaciones-offline') {
        console.log('[SW] Ejecutando Sync - Marcaciones Offline');
        event.waitUntil(syncMarcacionesOffline());
    }
});

// =============================================
// BACKGROUND SYNC (cuando vuelve la conexión)
// =============================================
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-marcaciones') {
        console.log('[SW] Sync: Enviando marcaciones offline...');
        event.waitUntil(syncMarcacionesOffline());
    }
    if (event.tag === 'sync-ubicaciones') {
        event.waitUntil(enviarUbicacionDesdeWorker());
    }
});

// =============================================
// MESSAGES DESDE EL FRONTEND
// =============================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'START_TRACKING') {
        console.log('[SW] Recibido comando de tracking');
        self.authToken = event.data.token;
        self.apiBaseUrl = event.data.apiBaseUrl;
    }

    if (event.data && event.data.type === 'LOCATION_UPDATE') {
        saveLocationForSync(event.data.location);
    }

    // NUEVO: Guardar marcación cuando está offline
    if (event.data && event.data.type === 'SAVE_MARCACION_OFFLINE') {
        console.log('[SW] Guardando marcación offline');
        saveMarcacionOffline(event.data.marcacion).then(() => {
            // Notificar al usuario
            self.registration.showNotification('RelojReducto', {
                body: '📡 Marcación guardada localmente. Se enviará al recuperar conexión.',
                icon: '/logo.png',
                badge: '/logo.png',
                tag: 'offline-marcacion',
                silent: false
            }).catch(() => { });

            // Registrar background sync para cuando haya conexión
            if (self.registration.sync) {
                self.registration.sync.register('sync-marcaciones').catch(() => { });
            }
        });
    }

    // Obtener estado de marcaciones pendientes
    if (event.data && event.data.type === 'GET_PENDING_COUNT') {
        getPendingMarcaciones().then(pending => {
            event.source.postMessage({
                type: 'PENDING_COUNT',
                count: pending.length
            });
        });
    }
});

// =============================================
// ENVIAR UBICACIÓN EN BACKGROUND
// =============================================
async function enviarUbicacionDesdeWorker() {
    try {
        const pendientes = await getPendingLocations();

        if (pendientes.length > 0 && self.authToken) {
            for (const loc of pendientes) {
                try {
                    const response = await fetch(`${self.apiBaseUrl || ''}/api/tracking/ubicacion`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${self.authToken}`
                        },
                        body: JSON.stringify(loc)
                    });

                    if (response.ok) {
                        await removeLocation(loc.id);
                    }
                } catch (e) {
                    console.log('[SW] Error enviando ubicación pendiente:', e.message);
                }
            }
        }
    } catch (e) {
        console.log('[SW] Error en background sync:', e.message);
    }
}

// =============================================
// SYNC MARCACIONES OFFLINE
// =============================================
async function syncMarcacionesOffline() {
    try {
        const pendientes = await getPendingMarcaciones();
        if (pendientes.length === 0 || !self.authToken) return;

        console.log(`[SW] Sincronizando ${pendientes.length} marcaciones offline...`);

        for (const marc of pendientes) {
            try {
                const response = await fetch(`${self.apiBaseUrl || ''}/api/marcaciones`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${self.authToken}`
                    },
                    body: JSON.stringify(marc.data)
                });

                if (response.ok) {
                    await removeMarcacion(marc.id);
                    console.log('[SW] Marcación offline sincronizada:', marc.id);
                } else {
                    console.log('[SW] Error sync marcación:', response.status);
                }
            } catch (e) {
                console.log('[SW] Sin conexión aún, reintentando después...');
                break;
            }
        }

        // Verificar cuántas quedan
        const restantes = await getPendingMarcaciones();
        if (restantes.length === 0) {
            self.registration.showNotification('RelojReducto', {
                body: '✅ Todas las marcaciones offline fueron sincronizadas.',
                icon: '/logo.png',
                badge: '/logo.png',
                tag: 'sync-complete'
            }).catch(() => { });
        }

        // Notificar a los clientes
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({ type: 'SYNC_COMPLETE', remaining: restantes.length });
        });

    } catch (e) {
        console.log('[SW] Error sync marcaciones offline:', e.message);
    }
}

// =============================================
// INDEXEDDB PARA UBICACIONES PENDIENTES
// =============================================
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('tracking-db', 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('locations')) {
                db.createObjectStore('locations', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('marcaciones_offline')) {
                db.createObjectStore('marcaciones_offline', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// --- Ubicaciones ---
async function saveLocationForSync(location) {
    try {
        const db = await openDB();
        const tx = db.transaction('locations', 'readwrite');
        tx.objectStore('locations').add({
            ...location,
            timestamp: Date.now()
        });
    } catch (e) { }
}

async function getPendingLocations() {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction('locations', 'readonly');
            const request = tx.objectStore('locations').getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]);
        });
    } catch (e) {
        return [];
    }
}

async function removeLocation(id) {
    try {
        const db = await openDB();
        const tx = db.transaction('locations', 'readwrite');
        tx.objectStore('locations').delete(id);
    } catch (e) { }
}

// --- Marcaciones Offline ---
async function saveMarcacionOffline(marcacion) {
    try {
        const db = await openDB();
        const tx = db.transaction('marcaciones_offline', 'readwrite');
        tx.objectStore('marcaciones_offline').add({
            data: marcacion,
            timestamp: Date.now()
        });
    } catch (e) {
        console.log('[SW] Error guardando marcación offline:', e);
    }
}

async function getPendingMarcaciones() {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction('marcaciones_offline', 'readonly');
            const request = tx.objectStore('marcaciones_offline').getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]);
        });
    } catch (e) {
        return [];
    }
}

async function removeMarcacion(id) {
    try {
        const db = await openDB();
        const tx = db.transaction('marcaciones_offline', 'readwrite');
        tx.objectStore('marcaciones_offline').delete(id);
    } catch (e) { }
}

// =============================================
// FETCH INTERCEPTOR (cache + network)
// =============================================
self.addEventListener('fetch', (event) => {
    // No cachear requests de API
    if (event.request.url.includes('/api/')) {
        return;
    }

    // Para navegación (HTML), usar network-first para siempre obtener la última versión
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('/index.html') || caches.match('/'))
        );
        return;
    }

    // Para assets estáticos (JS, CSS, imágenes), cache-first
    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request);
        })
    );
});
