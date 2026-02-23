import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, X, Loader2, Navigation, AlertTriangle, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { playSuccessSound, initAudioContext } from '../utils/soundUtils';
import 'leaflet/dist/leaflet.css';
import './VistaMarcacionMapa.css';

// Fix for default marker icon in leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom SVG icons for premium look
const createCustomIcon = (color, isUser = false) => {
    const svg = isUser
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="40" height="40">
            <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
            <circle cx="12" cy="12" r="4" fill="white"/>
           </svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="48" height="48">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}" stroke="white" stroke-width="1.5"/>
            <circle cx="12" cy="9" r="3" fill="white"/>
           </svg>`;

    return L.divIcon({
        html: svg,
        className: 'custom-marker-icon',
        iconSize: isUser ? [40, 40] : [48, 48],
        iconAnchor: isUser ? [20, 20] : [24, 48],
    });
};

const userIcon = createCustomIcon('#059669', true);  // Green for user
const branchIcon = createCustomIcon('#10b981', false); // Lighter green for branch

function MapResizer({ userLocation, branchCoords }) {
    const map = useMap();

    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
            if (userLocation && branchCoords) {
                const bounds = L.latLngBounds([
                    [userLocation.lat, userLocation.lng],
                    [branchCoords.lat, branchCoords.lng]
                ]);
                map.fitBounds(bounds, { padding: [80, 80], maxZoom: 17 });
            }
        }, 300);
    }, [map, userLocation, branchCoords]);

    return null;
}

function VistaMarcacionMapa({ onBack, onMarcar, usuario }) {
    const [userLocation, setUserLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [distancia, setDistancia] = useState(null);
    const [isMarking, setIsMarking] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [marcacionError, setMarcacionError] = useState(null);

    const sucursal = usuario?.sucursal;
    const hasBranchCoords = sucursal?.latitud && sucursal?.longitud;
    const radioPermitido = sucursal?.radioGeocerca || 200;

    // Modo prueba: si siempreEnUbicacion está activado, usar coordenadas de la sucursal
    const siempreEnUbicacion = usuario?.siempreEnUbicacion === true;

    useEffect(() => {
        console.log('👤 Usuario:', usuario?.nombreCompleto);
        console.log('🧪 siempreEnUbicacion:', siempreEnUbicacion, '(valor raw:', usuario?.siempreEnUbicacion, ')');
        console.log('📍 Sucursal:', sucursal?.nombre, 'coords:', sucursal?.latitud, sucursal?.longitud);
        obtenerUbicacion();
    }, []);

    const obtenerUbicacion = () => {
        setLoading(true);
        setError(null);

        // Si está en modo prueba y tiene sucursal con coordenadas, usar esas
        if (siempreEnUbicacion && hasBranchCoords) {
            console.log('🧪 Modo prueba: Usando ubicación de la sucursal');
            // Añadir un pequeño offset aleatorio para simular estar dentro del rango
            const offsetLat = (Math.random() - 0.5) * 0.0001; // ~10 metros
            const offsetLng = (Math.random() - 0.5) * 0.0001;
            const simLat = sucursal.latitud + offsetLat;
            const simLng = sucursal.longitud + offsetLng;

            setUserLocation({ lat: simLat, lng: simLng });
            setDistancia(calcularDistancia(simLat, simLng, sucursal.latitud, sucursal.longitud));
            setLoading(false);
            return;
        }

        if (!navigator.geolocation) {
            setError('Tu navegador no soporta geolocalización');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const uLat = position.coords.latitude;
                const uLng = position.coords.longitude;
                setUserLocation({ lat: uLat, lng: uLng });

                if (hasBranchCoords) {
                    const dist = calcularDistancia(uLat, uLng, sucursal.latitud, sucursal.longitud);
                    setDistancia(dist);
                }
                setLoading(false);
            },
            (err) => {
                console.warn('[Geo] Alta precisión falló, reintentando con baja precisión...', err.message);
                // Fallback: intentar sin alta precisión (WiFi/IP - funciona mejor en PCs)
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const uLat = position.coords.latitude;
                        const uLng = position.coords.longitude;
                        setUserLocation({ lat: uLat, lng: uLng });

                        if (hasBranchCoords) {
                            const dist = calcularDistancia(uLat, uLng, sucursal.latitud, sucursal.longitud);
                            setDistancia(dist);
                        }
                        setLoading(false);
                    },
                    (err2) => {
                        console.error('[Geo] Sin ubicación:', err2);
                        setError('No se pudo obtener tu ubicación. Verifica los permisos del navegador.');
                        setLoading(false);
                    },
                    { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
                );
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const calcularDistancia = (lat1, lon1, lat2, lon2) => {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const estaDentroDeRango = distancia !== null && distancia <= radioPermitido;

    const handleMarcar = async () => {
        if (!userLocation || isMarking) return;
        if (hasBranchCoords && !estaDentroDeRango) {
            return;
        }

        // HACK iOS: Desbloquear el contexto de audio inmediatamente al hacer click
        initAudioContext();

        setIsMarking(true);
        setMarcacionError(null);
        try {
            await onMarcar(userLocation.lat, userLocation.lng);

            // Éxito: Vibración muy larga y a la par de la animación
            // 600ms (círculo) + 100ms (pausa) + 800ms (check)
            if (navigator.vibrate) navigator.vibrate([600, 100, 800]);

            // Feedback sonoro (Especial para iPhone/iOS)
            playSuccessSound();

            // Mostrar animación de éxito
            setShowSuccess(true);
            // Auto-cerrar después de 3 segundos
            setTimeout(() => {
                setShowSuccess(false);
                onBack();
            }, 3000);
        } catch (err) {
            setIsMarking(false);
            console.error('Error al marcar:', err);

            // Error: Vibración de alerta (un pulso largo)
            if (navigator.vibrate) navigator.vibrate(300);

            // Capturar el mensaje específico del backend (Spring Boot devuelve 'message')
            let mensaje = err.response?.data?.message || err.response?.data?.mensaje;

            // Si no hay mensaje del backend, usar mensaje por defecto pero amigable
            if (!mensaje || mensaje === 'No message available') {
                if (err.response?.status === 400) {
                    mensaje = "No se pudo procesar la marcación. Verifica tu conexión o intenta nuevamente.";
                } else {
                    mensaje = "Ocurrió un error inesperado. Por favor intenta más tarde.";
                }
            }

            setMarcacionError(mensaje);
        }
    };

    const branchCoords = hasBranchCoords ? { lat: sucursal.latitud, lng: sucursal.longitud } : null;

    return (
        <div className="mapa-premium-container">
            {/* Header Premium */}
            <header className="mapa-premium-header">
                <button className="mapa-close-btn" onClick={onBack}>
                    <X size={20} />
                </button>
                <div className="mapa-header-info">
                    <h1>Nueva Marcación</h1>
                    <p>{sucursal?.nombre || 'Registrar Asistencia'}</p>
                </div>
                <button className="mapa-refresh-btn" onClick={obtenerUbicacion} disabled={loading}>
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            {/* Content */}
            <div className="mapa-premium-content">
                {loading ? (
                    <div className="mapa-premium-loading">
                        <div className="loading-pulse">
                            <MapPin size={48} />
                        </div>
                        <h3>Obteniendo ubicación...</h3>
                        <p>Asegúrate de tener el GPS activado</p>
                    </div>
                ) : error ? (
                    <div className="mapa-premium-error">
                        <AlertTriangle size={56} />
                        <h3>Error de ubicación</h3>
                        <p>{error}</p>
                        <button className="btn-retry" onClick={obtenerUbicacion}>
                            <RefreshCw size={18} />
                            Reintentar
                        </button>
                    </div>
                ) : (
                    <div className="mapa-wrapper">
                        <div className="mapa-premium-map">
                            <MapContainer
                                center={branchCoords || [userLocation.lat, userLocation.lng]}
                                zoom={17}
                                style={{ height: '100%', width: '100%' }}
                                zoomControl={false}
                                attributionControl={false}
                            >
                                {/* Google Maps Tiles - Same as Admin Panel */}
                                <TileLayer
                                    url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                                    attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                                />
                                <MapResizer userLocation={userLocation} branchCoords={branchCoords} />

                                {/* Geocerca Circle */}
                                {hasBranchCoords && (
                                    <>
                                        <Circle
                                            center={[sucursal.latitud, sucursal.longitud]}
                                            radius={radioPermitido}
                                            pathOptions={{
                                                color: estaDentroDeRango ? '#10b981' : '#ef4444',
                                                fillColor: estaDentroDeRango ? '#10b981' : '#ef4444',
                                                fillOpacity: 0.12,
                                                weight: 3,
                                                dashArray: estaDentroDeRango ? '' : '8, 8'
                                            }}
                                        />
                                        <Marker
                                            position={[sucursal.latitud, sucursal.longitud]}
                                            icon={branchIcon}
                                        />
                                    </>
                                )}

                                {/* User Location */}
                                <Marker
                                    position={[userLocation.lat, userLocation.lng]}
                                    icon={userIcon}
                                />
                            </MapContainer>
                        </div>

                        {/* Bottom Card Overlay */}
                        <div className="mapa-premium-card">
                            <div className="mapa-card-status">
                                <div className={`status-indicator ${estaDentroDeRango ? 'in-range' : 'out-range'}`}>
                                    {estaDentroDeRango ? (
                                        <CheckCircle2 size={20} />
                                    ) : (
                                        <AlertTriangle size={20} />
                                    )}
                                    <span>{estaDentroDeRango ? 'Dentro del área permitida' : 'Fuera del área permitida'}</span>
                                </div>
                            </div>

                            <div className="mapa-card-info">
                                <div className="info-item">
                                    <Navigation size={16} />
                                    <div>
                                        <label>Distancia a sede</label>
                                        <strong>{distancia !== null ? `${Math.round(distancia)} metros` : 'N/A'}</strong>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <MapPin size={16} />
                                    <div>
                                        <label>Radio permitido</label>
                                        <strong>{radioPermitido} metros</strong>
                                    </div>
                                </div>
                            </div>

                            <button
                                className={`btn-marcar-premium ${estaDentroDeRango ? '' : 'disabled'}`}
                                onClick={handleMarcar}
                                onTouchStart={() => initAudioContext()} // Desbloqueo ultra-rapido
                                disabled={!estaDentroDeRango || isMarking}
                            >
                                {isMarking ? (
                                    <>
                                        <Loader2 size={22} className="animate-spin" />
                                        Registrando...
                                    </>
                                ) : (
                                    <>
                                        <MapPin size={22} />
                                        Registrar Marcación
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Info Modal Premium */}
            {marcacionError && (
                <div className="error-info-overlay animate-fadeIn" onClick={() => setMarcacionError(null)}>
                    <div className="error-info-modal premium-error-modal animate-slideUp" onClick={(e) => e.stopPropagation()}>
                        <div className="error-icon-wrapper pulse-animation">
                            <Clock size={48} className="text-amber-500" />
                        </div>
                        <h2 className="premium-error-title">Aviso Importante</h2>
                        <p className="premium-error-msg">{marcacionError}</p>

                        <div className="premium-error-actions">
                            <button className="btn-error-ok premium-btn" onClick={() => {
                                setMarcacionError(null);
                                onBack();
                            }}>
                                Entendido, gracias
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Animation Modal */}
            {showSuccess && (
                <div className="success-overlay">
                    <div className="success-modal">
                        <div className="success-checkmark">
                            <svg viewBox="0 0 52 52" className="success-svg">
                                <circle cx="26" cy="26" r="25" fill="none" className="success-circle" />
                                <path fill="none" d="M14 27l7 7 16-16" className="success-check" />
                            </svg>
                        </div>
                        <h2>¡Marcación Registrada!</h2>
                        <p>Tu asistencia ha sido registrada exitosamente</p>
                        <div className="success-time">
                            {new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VistaMarcacionMapa;
