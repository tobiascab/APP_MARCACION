import { useEffect, useRef, useCallback } from 'react';
import { preMarcacionService, marcacionService } from '../services/api';
import api from '../services/api';

/**
 * GeofenceTracker - Tracking GPS vinculado al turno laboral.
 * 
 * REGLAS DE NEGOCIO:
 * - El tracking EMPIEZA cuando el empleado marca ENTRADA
 * - El tracking TERMINA cuando marca SALIDA
 * - Si cierra la web/sesión, el Service Worker SIGUE trackeando
 * - Pre-marcación (geofence check-in) se intenta una vez al detectar ubicación
 * 
 * ESTRATEGIA:
 * 1. Al montar, verificar si el usuario tiene turno activo (ya marcó ENTRADA)
 * 2. Si tiene turno activo → iniciar tracking GPS
 * 3. watchPosition() + fallback setInterval para enviar cada 30s
 * 4. Service Worker con token guardado en localStorage sigue en background
 * 5. Wake Lock + Notification persistente para mantener vivo en Android
 * 6. Escuchar evento 'marcacion-realizada' para iniciar/detener dinámicamente
 */
const GeofenceTracker = () => {
    const watchIdRef = useRef(null);
    const hasCheckedIn = useRef(false);
    const checkingInRef = useRef(false);
    const wakeLockRef = useRef(null);
    const lastSentRef = useRef(0);
    const fallbackIntervalRef = useRef(null);
    const isTrackingRef = useRef(false);
    const turnoActivoRef = useRef(false);

    const SEND_INTERVAL = 30 * 1000;    // 30 segundos entre envíos
    const FALLBACK_INTERVAL = 35 * 1000; // Ligeramente mayor para no duplicar

    useEffect(() => {
        verificarTurnoYTrackear();

        // Escuchar cuando el usuario hace una marcación (ENTRADA o SALIDA)
        const handleMarcacion = (e) => {
            const tipo = e.detail?.tipo;
            if (tipo === 'ENTRADA') {
                turnoActivoRef.current = true;
                if (!isTrackingRef.current) iniciarTracking();
            } else if (tipo === 'SALIDA') {
                turnoActivoRef.current = false;
                detenerTracking();
                // Avisar al SW que pare
                if (navigator.serviceWorker?.controller) {
                    navigator.serviceWorker.controller.postMessage({ type: 'STOP_TRACKING' });
                }
            }
        };

        window.addEventListener('marcacion-realizada', handleMarcacion);

        return () => {
            window.removeEventListener('marcacion-realizada', handleMarcacion);
            // NO detenemos tracking aquí — el SW sigue
        };
    }, []);

    /**
     * Al cargar: verificar si hay turno activo.
     * Si el próximo tipo es SALIDA → ya marcó ENTRADA → tracking activo.
     */
    const verificarTurnoYTrackear = async () => {
        try {
            const estado = await marcacionService.getEstado();
            // Si proximoTipo es 'SALIDA', significa que ya marcó ENTRADA hoy
            if (estado.proximoTipo === 'SALIDA') {
                turnoActivoRef.current = true;
                iniciarTracking();
            } else {
                // No tiene turno activo, pero igual intentar pre-marcación
                turnoActivoRef.current = false;
                iniciarPreMarcacionSolamente();
            }
        } catch (e) {
            // Si falla (no autenticado, etc), intentar pre-marcación al menos
            iniciarPreMarcacionSolamente();
        }
    };

    // ==========================================
    // PRE-MARCACIÓN (geofence check-in, solo una vez)
    // ==========================================
    const intentarCheckIn = async (latitude, longitude, accuracy) => {
        if (hasCheckedIn.current || checkingInRef.current) return;

        checkingInRef.current = true;
        try {
            const result = await preMarcacionService.checkin(latitude, longitude, accuracy);
            if (result.status === 'registrado' || result.status === 'ya_registrado') {
                hasCheckedIn.current = true;
            }
        } catch (e) { /* silencioso */ }
        finally {
            checkingInRef.current = false;
        }
    };

    /**
     * Solo pre-marcación sin tracking continuo.
     * Para usuarios que aún no marcaron ENTRADA.
     */
    const iniciarPreMarcacionSolamente = () => {
        if (!navigator.geolocation) return;

        // Un solo getCurrentPosition para intentar pre-marcación
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                intentarCheckIn(latitude, longitude, accuracy);
            },
            () => { },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
        );

        // También registrar SW para que funcione en background
        registrarServiceWorker();
    };

    // ==========================================
    // TRACKING COMPLETO (solo cuando hay turno activo)
    // ==========================================
    const iniciarTracking = async () => {
        if (!navigator.geolocation || isTrackingRef.current) return;

        isTrackingRef.current = true;

        // 1. Registrar Service Worker con flag de tracking activo
        registrarServiceWorker();

        // 2. Solicitar Wake Lock
        solicitarWakeLock();

        // 3. Notificación persistente
        solicitarNotificacion();

        // 4. watchPosition para updates continuos
        watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude, accuracy, speed } = position.coords;
                const ahora = Date.now();

                // Pre-marcación (una vez)
                if (!hasCheckedIn.current) {
                    intentarCheckIn(latitude, longitude, accuracy);
                }

                // Tracking: enviar cada SEND_INTERVAL
                if (ahora - lastSentRef.current >= SEND_INTERVAL) {
                    lastSentRef.current = ahora;
                    enviarUbicacion(latitude, longitude, accuracy, speed);
                }
            },
            (error) => {
                console.log('[Tracker] watchPosition error:', error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 15000,
            }
        );

        // 5. Fallback paralelo
        iniciarFallbackParalelo();

        // 6. Listener para re-adquirir wake lock
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 7. Guardar estado en localStorage para que el SW sepa
        localStorage.setItem('tracking_activo', 'true');
        localStorage.setItem('tracking_inicio', new Date().toISOString());
    };

    // ==========================================
    // ENVIAR UBICACIÓN
    // ==========================================
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

            // Guardar en SW para sync offline
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
            // Silencioso
        }
    };

    // ==========================================
    // FALLBACK PARALELO
    // ==========================================
    const iniciarFallbackParalelo = () => {
        if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);

        fallbackIntervalRef.current = setInterval(() => {
            const ahora = Date.now();
            if (ahora - lastSentRef.current >= SEND_INTERVAL) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude, accuracy, speed } = position.coords;

                        if (!hasCheckedIn.current) {
                            intentarCheckIn(latitude, longitude, accuracy);
                        }

                        lastSentRef.current = Date.now();
                        await enviarUbicacion(latitude, longitude, accuracy, speed);
                    },
                    () => { },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 15000 }
                );
            }
        }, FALLBACK_INTERVAL);
    };

    // ==========================================
    // SERVICE WORKER
    // ==========================================
    const registrarServiceWorker = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

                const token = localStorage.getItem('token');
                const trackingActivo = turnoActivoRef.current;

                const enviarConfig = (sw) => {
                    if (sw && token) {
                        sw.postMessage({
                            type: 'START_TRACKING',
                            token: token,
                            apiBaseUrl: window.location.origin,
                            trackingActivo: trackingActivo,
                            intervalo: SEND_INTERVAL
                        });
                    }
                };

                if (reg.active) enviarConfig(reg.active);

                navigator.serviceWorker.ready.then(registration => {
                    enviarConfig(registration.active);

                    // Periodic Background Sync
                    if ('periodicSync' in registration) {
                        registration.periodicSync.register('background-tracking', {
                            minInterval: 5 * 60 * 1000
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
            } catch (e) { }
        }
    };

    const handleVisibilityChange = useCallback(async () => {
        if (document.visibilityState === 'visible' && turnoActivoRef.current) {
            await solicitarWakeLock();
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude, accuracy, speed } = position.coords;
                    lastSentRef.current = Date.now();
                    await enviarUbicacion(latitude, longitude, accuracy, speed);
                },
                () => { },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
            );
        }
    }, []);

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
            } catch (e) { }
        }
    };

    // ==========================================
    // DETENER TRACKING (solo cuando marca SALIDA)
    // ==========================================
    const detenerTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (fallbackIntervalRef.current) {
            clearInterval(fallbackIntervalRef.current);
            fallbackIntervalRef.current = null;
        }
        if (wakeLockRef.current) {
            wakeLockRef.current.release().catch(() => { });
            wakeLockRef.current = null;
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        isTrackingRef.current = false;
        localStorage.setItem('tracking_activo', 'false');
    };

    return null;
};

export default GeofenceTracker;
