import { Clock, MapPin, LogIn, LogOut, User, Loader2 } from 'lucide-react';
import './HistorialMarcaciones.css';

function HistorialMarcaciones({ marcaciones = [], loading = false, mostrarUsuario = true }) {
    const formatTime = (fechaHora) => {
        const fecha = new Date(fechaHora);
        return fecha.toLocaleTimeString('es-PY', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (fechaHora) => {
        const fecha = new Date(fechaHora);
        return fecha.toLocaleDateString('es-PY', {
            day: '2-digit',
            month: 'short',
        });
    };

    if (loading) {
        return (
            <div className="historial-loading">
                <Loader2 size={32} className="animate-spin" />
                <span>Cargando marcaciones...</span>
            </div>
        );
    }

    if (marcaciones.length === 0) {
        return (
            <div className="historial-empty">
                <Clock size={48} strokeWidth={1.5} />
                <h3>Sin marcaciones</h3>
                <p>No hay marcaciones registradas aún</p>
            </div>
        );
    }

    return (
        <div className="historial-container">
            <ul className="historial-lista">
                {marcaciones.map((marcacion, index) => (
                    <li
                        key={marcacion.id}
                        className={`historial-item ${marcacion.tipo.toLowerCase()} animate-fadeIn`}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Icono */}
                        <div className={`item-icon ${marcacion.tipo.toLowerCase()}`}>
                            {marcacion.tipo === 'ENTRADA' ? (
                                <LogIn size={20} />
                            ) : (
                                <LogOut size={20} />
                            )}
                        </div>

                        {/* Info */}
                        <div className="item-info">
                            <div className="item-main">
                                <span className="item-tipo">{marcacion.tipo}</span>
                                {mostrarUsuario && marcacion.usuarioNombre && (
                                    <span className="item-usuario">
                                        <User size={12} />
                                        {marcacion.usuarioNombre}
                                    </span>
                                )}
                            </div>

                            {marcacion.latitud && marcacion.longitud && (
                                <div className="item-ubicacion">
                                    <MapPin size={12} />
                                    <span>
                                        {marcacion.latitud.toFixed(4)}, {marcacion.longitud.toFixed(4)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Tiempo */}
                        <div className="item-tiempo">
                            <span className="item-hora">{formatTime(marcacion.fechaHora)}</span>
                            <span className="item-fecha">{formatDate(marcacion.fechaHora)}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default HistorialMarcaciones;
