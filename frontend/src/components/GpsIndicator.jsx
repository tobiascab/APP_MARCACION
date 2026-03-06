import { useState, useEffect } from 'react';

/**
 * GpsIndicator - Indicador visual de GPS activo
 * Muestra un pequeño punto verde pulsante cuando el tracking está funcionando.
 * Se coloca en el header del dashboard para que el usuario sepa que su ubicación
 * está siendo rastreada.
 */
const GpsIndicator = ({ style = {} }) => {
    const [gpsActive, setGpsActive] = useState(false);
    const [accuracy, setAccuracy] = useState(null);

    useEffect(() => {
        // Verificar si el GPS está disponible y activo
        if (!navigator.geolocation) {
            setGpsActive(false);
            return;
        }

        // Hacer un test rápido de GPS
        const testId = navigator.geolocation.watchPosition(
            (position) => {
                setGpsActive(true);
                setAccuracy(Math.round(position.coords.accuracy));
            },
            () => {
                setGpsActive(false);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
        );

        return () => navigator.geolocation.clearWatch(testId);
    }, []);

    if (!gpsActive) return null;

    const precisionColor = accuracy <= 30 ? '#10b981' : accuracy <= 100 ? '#f59e0b' : '#ef4444';
    const precisionLabel = accuracy <= 30 ? 'Alta' : accuracy <= 100 ? 'Media' : 'Baja';

    return (
        <div
            title={`GPS activo · Precisión: ${accuracy}m (${precisionLabel})`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 8px',
                borderRadius: 20,
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                cursor: 'default',
                ...style
            }}
        >
            <span
                style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: precisionColor,
                    boxShadow: `0 0 0 2px rgba(16, 185, 129, 0.15)`,
                    animation: 'gps-pulse 2s infinite',
                    flexShrink: 0
                }}
            />
            <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: precisionColor,
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
            }}>
                GPS
            </span>
            <style>{`
                @keyframes gps-pulse {
                    0%, 100% { box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15); }
                    50% { box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.05); }
                }
            `}</style>
        </div>
    );
};

export default GpsIndicator;
