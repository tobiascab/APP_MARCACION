import { useState } from 'react';
import { justificacionService } from '../services/api';
import {
    AlertTriangle,
    X,
    Send,
    Loader2,
    Clock
} from 'lucide-react';
import './JustificarTardanzaModal.css';

function JustificarTardanzaModal({ isOpen, onClose, tardanzasMes, marcacionId }) {
    const [motivo, setMotivo] = useState('');
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    // Si no está abierto, no renderizamos
    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!motivo.trim()) return;

        setLoading(true);
        setMensaje(null);

        try {
            // Creamos la justificacion para HOY
            const fecha = new Date().toISOString().split('T')[0];
            await justificacionService.crear('TARDANZA', fecha, motivo, null);
            setMensaje({ tipo: 'success', texto: 'Justificación enviada correctamente.' });
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.message || 'Error al enviar la justificación'
            });
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay justify-modal">
            <div className="modal-content animate-slideUp justificar-modal-content">
                <button className="modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="justificar-header text-center">
                    <div className="warning-icon-wrapper pulse-animation">
                        <Clock size={48} className="text-warning" />
                    </div>
                    <h2>¡Llegaste tarde!</h2>
                    <p className="subtitle">
                        Has registrado {tardanzasMes} llegada{tardanzasMes > 1 ? 's' : ''} tardía{tardanzasMes > 1 ? 's' : ''} este mes.
                    </p>

                    {/* Indicador visual tipo 1/3 */}
                    <div className="tardanzas-tracker">
                        <div className={`tracker-dot ${tardanzasMes >= 1 ? 'active' : ''}`}></div>
                        <div className={`tracker-dot ${tardanzasMes >= 2 ? 'active' : ''}`}></div>
                        <div className={`tracker-dot ${tardanzasMes >= 3 ? 'active danger' : ''}`}></div>
                    </div>
                    <span className="tracker-text">
                        {tardanzasMes}/3 tolerancias permitidas
                    </span>
                </div>

                <form onSubmit={handleSubmit} className="justificar-form">
                    <p className="form-hint">
                        ¿Quieres dejar una justificación sobre el motivo de tu retraso ahora mismo?
                    </p>

                    <div className="form-group">
                        <textarea
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Ej. Tráfico pesado en Mcal López, accidente en avenida..."
                            rows={3}
                            required
                        />
                    </div>

                    {mensaje && (
                        <div className={`alert ${mensaje.tipo}`}>
                            {mensaje.texto}
                        </div>
                    )}

                    <div className="justificar-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Omitir
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !motivo.trim()}
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            Enviar Justificación
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default JustificarTardanzaModal;
