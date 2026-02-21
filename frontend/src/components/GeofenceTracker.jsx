import { useEffect, useRef } from 'react';
import { preMarcacionService } from '../services/api';
import api from '../services/api';

/**
 * GeofenceTracker - Tracking por geofence + seguridad con soporte background.
 * 
 * Estrategia para funcionar con la app en segundo plano:
 * 1. watchPosition() - Sigue rastreando incluso con pantalla apagada (Android Chrome)
 * 2. Wake Lock API - Evita que el dispositivo suspenda la app
 * 3. Service Worker - Periodic Background Sync para cuando la app está cerrada
 * 4. Notification persistente - Mantiene el proceso vivo en Android
 * 
 * El empleado NO ve nada (excepto la notificación de tracking si la acepta).
 */
const GeofenceTracker = () => {
    const watchIdRef = useRef(null);
    const hasCheckedIn = useRef(false);
    const wakeLockRef = useRef(null);
    const lastSentRef = useRef(0);
    const SEND_INTERVAL = 2 * 60 * 1000; // Enviar cada 2 minutos mínimo

    useEffect(() => {
        iniciarTracking();

        return () => {
            detenerTracking();
        };
    }, []);

    const iniciarTracking = async () => {
        if (!navigator.geolocation) return;

        // 1. Registrar Service Worker
        registrarServiceWorker();

        // 2. Solicitar Wake Lock (mantener pantalla/CPU activo)
        solicitarWakeLock();

        // 3. Solicitar permiso de notificación para tracking persistente
        solicitarNotificacion();

        // 4. Usar watchPosition en vez de getCurrentPosition
        //    watchPosition sigue enviando updates incluso en background
        watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude, accuracy, speed } = position.coords;
                const ahora = Date.now();

                // Pre-marcación por geofence (solo una vez)
                if (!hasCheckedIn.current) {
                    try {
                        const result = await preMarcacionService.checkin(latitude, longitude, accuracy);
                        if (result.status === 'registrado' || result.status === 'ya_registrado') {
                            hasCheckedIn.current = true;
                        }
                    } catch (e) { /* silencioso */ }
                }

                // Tracking: enviar cada 2 minutos máximo
                if (ahora - lastSentRef.current >= SEND_INTERVAL) {
                    lastSentRef.current = ahora;
                    await enviarUbicacion(latitude, longitude, accuracy, speed);
                }
            },
            (error) => {
                // Si falla watchPosition, usar fallback con intervalo
                console.log('[Tracker] watchPosition error, usando fallback');
                usarFallbackIntervalo();
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 60000, // Cache de 1 min para ahorrar batería
                // distanceFilter no es estándar pero Chrome Android lo respeta
            }
        );

        // 5. Listener para re-adquirir wake lock al volver a la app
        document.addEventListener('visibilitychange', handleVisibilityChange);
    };

    const enviarUbicacion = async (latitude, longitude, accuracy, speed) => {
        try {
            let bateria = null;
            if (navigator.getBattery) {
                try {
                    const battery = await navigator.getBattery();
                    bateria = Math.round(battery.level * 100);
                } catch (e) { /* no disponible */ }
            }

            await api.post('/tracking/ubicacion', {
                latitud: latitude,
                longitud: longitude,
                accuracy: accuracy,
                velocidad: speed || 0,
                bateria: bateria
            });

            // También guardar en Service Worker para sync offline
            if (navigator.serviceWorker?.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'LOCATION_UPDATE',
                    location: {
                        latitud: latitude,
                        longitud: longitude,
                        accuracy: accuracy,
                        velocidad: speed || 0,
                        bateria: bateria
                    }
                });
            }
        } catch (e) {
            // Silencioso — guardar para sync posterior vía SW
        }
    };

    // ==========================================
    // SERVICE WORKER
    // ==========================================
    const registrarServiceWorker = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
                console.log('[Tracker] Service Worker registrado');

                // Enviar token al SW para que pueda hacer requests en background
                const token = localStorage.getItem('token');
                if (reg.active && token) {
                    reg.active.postMessage({
                        type: 'START_TRACKING',
                        token: token,
                        apiBaseUrl: window.location.origin
                    });
                }

                // También enviar cuando el SW se active
                navigator.serviceWorker.ready.then(registration => {
                    if (registration.active && token) {
                        registration.active.postMessage({
                            type: 'START_TRACKING',
                            token: token,
                            apiBaseUrl: window.location.origin
                        });
                    }

                    // Registrar Periodic Background Sync si disponible
                    if ('periodicSync' in registration) {
                        registration.periodicSync.register('background-tracking', {
                            minInterval: 15 * 60 * 1000 // ~15 minutos
                        }).catch(() => {
                            console.log('[Tracker] Periodic Sync no disponible');
                        });
                    }
                });
            } catch (e) {
                console.log('[Tracker] No se pudo registrar SW:', e.message);
            }
        }
    };

    // ==========================================
    // WAKE LOCK (mantener dispositivo activo)
    // ==========================================
    const solicitarWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
                console.log('[Tracker] Wake Lock adquirido');

                wakeLockRef.current.addEventListener('release', () => {
                    console.log('[Tracker] Wake Lock liberado');
                });
            } catch (e) {
                console.log('[Tracker] Wake Lock no disponible:', e.message);
            }
        }
    };

    // Re-adquirir wake lock cuando la app vuelva a primer plano
    const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible') {
            await solicitarWakeLock();
        }
    };

    // ==========================================
    // NOTIFICACIÓN PERSISTENTE (mantiene SW vivo)
    // ==========================================
    const solicitarNotificacion = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    // Mostrar notificación silenciosa persistente
                    const reg = await navigator.serviceWorker?.ready;
                    if (reg) {
                        reg.showNotification('RelojReducto', {
                            body: 'Tracking de ubicación activo para tu seguridad',
                            icon: '/logo.png',
                            badge: '/logo.png',
                            silent: true,
                            tag: 'tracking-active',
                            requireInteraction: false,
                            ongoing: true // Android: notificación persistente
                        });
                    }
                }
            } catch (e) { /* silencioso */ }
        }
    };

    // ==========================================
    // FALLBACK: Intervalo si watchPosition falla
    // ==========================================
    const usarFallbackIntervalo = () => {
        const fallbackInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude, accuracy, speed } = position.coords;

                    if (!hasCheckedIn.current) {
                        try {
                            const result = await preMarcacionService.checkin(latitude, longitude, accuracy);
                            if (result.status === 'registrado' || result.status === 'ya_registrado') {
                                hasCheckedIn.current = true;
                            }
                        } catch (e) { /* */ }
                    }

                    await enviarUbicacion(latitude, longitude, accuracy, speed);
                },
                () => { /* silencioso */ },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        }, SEND_INTERVAL);

        // Limpiar al desmontar
        return () => clearInterval(fallbackInterval);
    };

    // ==========================================
    // LIMPIEZA
    // ==========================================
    const detenerTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }
        if (wakeLockRef.current) {
            wakeLockRef.current.release().catch(() => { });
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

    // No renderiza nada — invisible
    return null;
};

export default GeofenceTracker;
