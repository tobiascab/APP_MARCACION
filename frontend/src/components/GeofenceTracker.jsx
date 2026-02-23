import { useEffect, useRef } from 'react';
import { preMarcacionService } from '../services/api';
import api from '../services/api';

/**
 * GeofenceTracker - Tracking por geofence + seguridad con soporte background.
 * 
 * ACTUALIZADO: Envía ubicación cada 30 segundos para tracking en tiempo real.
 * 
 * Estrategia para funcionar con la app en segundo plano:
 * 1. watchPosition() - Sigue rastreando incluso con pantalla apagada (Android Chrome)
 * 2. Wake Lock API - Evita que el dispositivo suspenda la app
 * 3. Service Worker - Periodic Background Sync para cuando la app está cerrada
 * 4. Notification persistente - Mantiene el proceso vivo en Android
 * 5. Fallback con setInterval - Respaldo extra cada 30s
 */
const GeofenceTracker = () => {
    const watchIdRef = useRef(null);
    const hasCheckedIn = useRef(false);
    const wakeLockRef = useRef(null);
    const lastSentRef = useRef(0);
    const fallbackIntervalRef = useRef(null);
    const SEND_INTERVAL = 5 * 1000; // Enviar cada 5 segundos para tracking real-time

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

        // 2. Solicitar Wake Lock
        solicitarWakeLock();

        // 3. Solicitar permiso de notificación
        solicitarNotificacion();

        // 4. watchPosition para updates continuos
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

                // Tracking: enviar cada 5 segundos
                if (ahora - lastSentRef.current >= SEND_INTERVAL) {
                    lastSentRef.current = ahora;
                    enviarUbicacion(latitude, longitude, accuracy, speed);
                }
            },
            (error) => {
                usarFallbackIntervalo();
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 10000, // Cache de 10 seg para frescura
            }
        );

        // 5. SIEMPRE iniciar fallback por intervalo como respaldo
        iniciarFallbackParalelo();

        // 6. Listener para re-adquirir wake lock al volver a la app
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
    // FALLBACK PARALELO: cada 30s obtener ubicación
    // Funciona incluso si watchPosition no envía updates
    // ==========================================
    const iniciarFallbackParalelo = () => {
        if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);

        fallbackIntervalRef.current = setInterval(() => {
            const ahora = Date.now();
            // Solo enviar si watchPosition no envió recientemente
            if (ahora - lastSentRef.current >= SEND_INTERVAL - 5000) {
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

                        lastSentRef.current = Date.now();
                        await enviarUbicacion(latitude, longitude, accuracy, speed);
                    },
                    () => { /* silencioso */ },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                );
            }
        }, SEND_INTERVAL);
    };

    // ==========================================
    // SERVICE WORKER
    // ==========================================
    const registrarServiceWorker = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

                const token = localStorage.getItem('token');
                if (reg.active && token) {
                    reg.active.postMessage({
                        type: 'START_TRACKING',
                        token: token,
                        apiBaseUrl: window.location.origin
                    });
                }

                navigator.serviceWorker.ready.then(registration => {
                    if (registration.active && token) {
                        registration.active.postMessage({
                            type: 'START_TRACKING',
                            token: token,
                            apiBaseUrl: window.location.origin
                        });
                    }

                    // Periodic Background Sync (cada 5 min en background)
                    if ('periodicSync' in registration) {
                        registration.periodicSync.register('background-tracking', {
                            minInterval: 5 * 60 * 1000 // 5 minutos en background
                        }).catch(() => { });
                    }
                });
            } catch (e) { }
        }
    };

    // ==========================================
    // WAKE LOCK
    // ==========================================
    const solicitarWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
                wakeLockRef.current.addEventListener('release', () => { });
            } catch (e) { }
        }
    };

    const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible') {
            await solicitarWakeLock();
            // Re-enviar ubicación al volver a la app
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude, accuracy, speed } = position.coords;
                    lastSentRef.current = Date.now();
                    await enviarUbicacion(latitude, longitude, accuracy, speed);
                },
                () => { },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 5000 }
            );
        }
    };

    // ==========================================
    // NOTIFICACIÓN PERSISTENTE
    // ==========================================
    const solicitarNotificacion = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const reg = await navigator.serviceWorker?.ready;
                    if (reg) {
                        reg.showNotification('RelojReducto', {
                            body: 'Tracking de ubicación activo para tu seguridad',
                            icon: '/logo_cooperativa.png',
                            badge: '/logo_cooperativa.png',
                            silent: true,
                            tag: 'tracking-active',
                            requireInteraction: false,
                            ongoing: true
                        });
                    }
                }
            } catch (e) { /* silencioso */ }
        }
    };

    // ==========================================
    // FALLBACK SI WATCHPOSITION FALLA COMPLETAMENTE
    // ==========================================
    const usarFallbackIntervalo = () => {
        iniciarFallbackParalelo();
    };

    // ==========================================
    // LIMPIEZA
    // ==========================================
    const detenerTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }
        if (fallbackIntervalRef.current) {
            clearInterval(fallbackIntervalRef.current);
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
