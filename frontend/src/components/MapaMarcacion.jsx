import { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import './MapaMarcacion.css';

function MapaMarcacion({ onMarcar }) {
    const [ubicacion, setUbicacion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        obtenerUbicacion();
    }, []);

    const obtenerUbicacion = () => {
        if (!navigator.geolocation) {
            setError('Geolocalización no soportada');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUbicacion({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLoading(false);
            },
            (err) => {
                setError('No se pudo obtener la ubicación');
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    if (loading) {
        return (
            <div className="mapa-loading">
                <Loader2 size={32} className="animate-spin" />
                <span>Obteniendo ubicación...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mapa-error">
                <MapPin size={32} />
                <span>{error}</span>
                <button className="btn btn-secondary" onClick={obtenerUbicacion}>
                    Reintentar
                </button>
            </div>
        );
    }

    // Mostrar mapa estático de Google o OpenStreetMap
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${ubicacion.lng - 0.01},${ubicacion.lat - 0.01},${ubicacion.lng + 0.01},${ubicacion.lat + 0.01}&layer=mapnik&marker=${ubicacion.lat},${ubicacion.lng}`;

    return (
        <div className="mapa-container">
            <iframe
                src={mapUrl}
                className="mapa-iframe"
                title="Tu ubicación"
            />
            <div className="mapa-overlay">
                <button
                    className="btn btn-primary btn-marcar-mapa"
                    onClick={() => onMarcar && onMarcar(ubicacion)}
                >
                    <MapPin size={20} />
                    Marcar Ubicación
                </button>
            </div>
        </div>
    );
}

export default MapaMarcacion;
