import React, { useState, useEffect } from 'react';
import { FileText, Plus, Clock, X, CheckCircle, XCircle, Send } from 'lucide-react';
import { useModal } from '../context/ModernModalContext';
import { justificacionService } from '../services/api';

/**
 * MisJustificaciones - Vista del empleado para crear y ver sus justificaciones.
 * Se integra como pestaña en el Dashboard del empleado.
 */
const MisJustificaciones = () => {
    const { alert } = useModal();
    const [justificaciones, setJustificaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [tipo, setTipo] = useState('TARDANZA');
    const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
    const [motivo, setMotivo] = useState('');
    const [enviando, setEnviando] = useState(false);

    useEffect(() => { cargarJustificaciones(); }, []);

    const cargarJustificaciones = async () => {
        try {
            const data = await justificacionService.getMis();
            setJustificaciones(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleEnviar = async () => {
        if (!motivo.trim()) {
            alert('Campo Requerido', 'Debes ingresar un motivo detallado para tu justificación.', 'warning');
            return;
        }
        setEnviando(true);
        try {
            await justificacionService.crear(tipo, fecha, motivo);
            setShowForm(false);
            setMotivo('');
            cargarJustificaciones();
            alert('Enviado', 'Tu justificación ha sido enviada para revisión.', 'success');
        } catch (e) {
            alert('Error al Enviar', (e.response?.data?.error || e.message), 'error');
        }
        finally { setEnviando(false); }
    };

    const getBadge = (estado) => {
        const map = {
            PENDIENTE: { bg: '#fef3c7', color: '#92400e', icon: <Clock size={12} />, text: 'Pendiente' },
            APROBADA: { bg: '#d1fae5', color: '#065f46', icon: <CheckCircle size={12} />, text: 'Aprobada' },
            RECHAZADA: { bg: '#fee2e2', color: '#991b1b', icon: <XCircle size={12} />, text: 'Rechazada' },
        };
        const s = map[estado] || map.PENDIENTE;
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem',
                fontWeight: 600, background: s.bg, color: s.color
            }}>
                {s.icon} {s.text}
            </span>
        );
    };

    const getTipoLabel = (t) => {
        const map = { TARDANZA: '🕐 Tardanza', AUSENCIA: '🚫 Ausencia', SALIDA_TEMPRANA: '🚪 Salida temprana' };
        return map[t] || t;
    };

    return (
        <div style={{ padding: '1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>
                    <FileText size={22} style={{ marginRight: 8, verticalAlign: 'middle', color: '#8b5cf6' }} />
                    Mis Justificaciones
                </h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '0.5rem 1rem', borderRadius: 12, border: 'none',
                        background: showForm ? '#ef4444' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                        color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                        boxShadow: '0 2px 10px rgba(139,92,246,0.2)'
                    }}
                >
                    {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nueva</>}
                </button>
            </div>

            {/* Formulario */}
            {showForm && (
                <div style={{
                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                    borderRadius: 16, padding: '1.25rem', marginBottom: '1rem',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Tipo</label>
                        <select
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.9rem', background: 'white' }}
                        >
                            <option value="TARDANZA">🕐 Tardanza</option>
                            <option value="AUSENCIA">🚫 Ausencia</option>
                            <option value="SALIDA_TEMPRANA">🚪 Salida Temprana</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Fecha</label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                        />
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Motivo</label>
                        <textarea
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Describe el motivo de tu justificación..."
                            style={{ width: '100%', padding: '0.6rem', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.9rem', minHeight: 80, resize: 'vertical' }}
                        />
                    </div>
                    <button
                        onClick={handleEnviar}
                        disabled={enviando}
                        style={{
                            width: '100%', padding: '0.75rem', borderRadius: 12, border: 'none',
                            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                            color: 'white', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                            opacity: enviando ? 0.7 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                        }}
                    >
                        <Send size={16} /> {enviando ? 'Enviando...' : 'Enviar Justificación'}
                    </button>
                </div>
            )}

            {/* Lista */}
            {loading ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0' }}>Cargando...</p>
            ) : justificaciones.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                    <FileText size={48} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                    <p style={{ fontSize: '0.9rem' }}>No tienes justificaciones registradas</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {justificaciones.map((j) => (
                        <div key={j.id} style={{
                            background: 'white', borderRadius: 14, padding: '1rem',
                            border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>{getTipoLabel(j.tipo)}</span>
                                {getBadge(j.estado)}
                            </div>
                            <p style={{ margin: '4px 0', fontSize: '0.8rem', color: '#64748b' }}>📅 {j.fecha}</p>
                            <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#475569' }}>{j.motivo}</p>
                            {j.comentarioAdmin && (
                                <div style={{
                                    marginTop: 8, padding: '0.5rem 0.75rem', borderRadius: 8,
                                    background: j.estado === 'APROBADA' ? '#f0fdf4' : '#fef2f2',
                                    fontSize: '0.8rem', color: '#475569'
                                }}>
                                    💬 <strong>Admin:</strong> {j.comentarioAdmin}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MisJustificaciones;
