import { useState, useEffect } from 'react';
import { marcacionService, authService } from '../services/api';
import {
    LogIn,
    LogOut,
    MapPin,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Clock,
    AlertTriangle,
    Fingerprint
} from 'lucide-react';
import ValidacionBiometrica from './ValidacionBiometrica';
import { playSuccessSound, initAudioContext } from '../utils/soundUtils';
import './BotonMarcacion.css';

function BotonMarcacion({ onMarcacionExitosa, compact = false }) {
    const [estado, setEstado] = useState({
        proximaMarcacion: 'ENTRADA',
        puedeMarcar: true,
        esTarde: false,
        minutosTarde: 0,
        minutosParaSalida: 0,
        horaEntrada: '07:10',
        horaSalida: '17:00'
    });
    const [loading, setLoading] = useState(false);
    const [loadingEstado, setLoadingEstado] = useState(true);
    const [mensaje, setMensaje] = useState(null);
    const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
    const [mostrarBiometrico, setMostrarBiometrico] = useState(false);
    const [usuario, setUsuario] = useState(null);

    useEffect(() => {
        setUsuario(authService.getUsuarioActual());
        cargarEstado();
        // Actualizar estado cada minuto
        const interval = setInterval(cargarEstado, 60000);
        return () => clearInterval(interval);
    }, []);

    const cargarEstado = async () => {
        try {
            const data = await marcacionService.getEstado();
            setEstado(data);
        } catch (error) {
            console.error('Error al cargar estado:', error);
        } finally {
            setLoadingEstado(false);
        }
    };

    const obtenerUbicacion = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Tu navegador no soporta geolocalización'));
                return;
            }

            setObteniendoUbicacion(true);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = {
                        latitud: position.coords.latitude,
                        longitud: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        isMocked: position.mocked || false, // Algunos dispositivos/navegadores lo reportan
                    };
                    setObteniendoUbicacion(false);
                    resolve(coords);
                },
                (error) => {
                    setObteniendoUbicacion(false);
                    let mensaje = 'Error al obtener ubicación';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            mensaje = 'Debes permitir el acceso a la ubicación';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            mensaje = 'Ubicación no disponible';
                            break;
                        case error.TIMEOUT:
                            mensaje = 'Tiempo de espera agotado';
                            break;
                    }
                    reject(new Error(mensaje));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        });
    };

    const handleMarcacion = async () => {
        // HACK iOS: Desbloquear el contexto de audio inmediatamente al hacer click
        console.log('👆 Interacción usuario detectada - Iniciando audio...');
        initAudioContext();

        // Verificar si puede marcar
        if (!estado.puedeMarcar) {
            setMensaje({
                tipo: 'error',
                texto: `No puedes marcar SALIDA antes de las ${estado.horaSalida}`
            });
            setTimeout(() => setMensaje(null), 5000);
            return;
        }

        // NOTA: Se deshabilita temporalmente la validación biométrica a pedido del usuario
        // para unificar el flujo solamente con ubicación.
        /*
        if (usuario?.biometricoHabilitado && !mostrarBiometrico) {
            setMostrarBiometrico(true);
            return;
        }
        */

        realizarRegistro();
    };

    const realizarRegistro = async () => {
        setLoading(true);
        setMensaje(null);
        setMostrarBiometrico(false);

        try {
            let coords;
            const siempreEnUbicacion = usuario?.siempreEnUbicacion === true;
            const sucursal = usuario?.sucursal;
            const hasBranchCoords = sucursal?.latitud && sucursal?.longitud;

            if (siempreEnUbicacion && hasBranchCoords) {
                console.log('🧪 Modo prueba: Simulando ubicación de la sucursal');
                // Simular estar en la sucursal con un pequeño offset aleatorio (~10m)
                coords = {
                    latitud: sucursal.latitud + (Math.random() - 0.5) * 0.0001,
                    longitud: sucursal.longitud + (Math.random() - 0.5) * 0.0001
                };
            } else {
                coords = await obtenerUbicacion();
            }

            const dispositivo = `${navigator.platform} - Web`;

            const response = await marcacionService.registrar(
                coords.latitud,
                coords.longitud,
                dispositivo,
                coords.accuracy,
                coords.isMocked
            );

            let textoMensaje = `¡${response.marcacion.tipo} registrada!`;
            if (response.marcacion.esTardia) {
                textoMensaje += ` (${response.marcacion.minutosTarde} min tarde)`;
            }

            setMensaje({
                tipo: 'success',
                texto: textoMensaje
            });

            // Feedback háptico (vibración)
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]); // Doble pulso táctil
            }

            // Feedback sonoro (Especial para iPhone/iOS)
            playSuccessSound();

            await cargarEstado();

            if (onMarcacionExitosa) {
                onMarcacionExitosa();
            }

            setTimeout(() => setMensaje(null), 5000);

        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.message || error.message || 'Error al registrar'
            });
        } finally {
            setLoading(false);
        }
    };

    const isEntrada = estado.proximaMarcacion === 'ENTRADA';
    const bloqueado = !estado.puedeMarcar;

    if (loadingEstado) {
        return (
            <div className="boton-marcacion-wrapper">
                <div className="boton-marcacion-loading">
                    <Loader2 size={32} className="animate-spin" />
                </div>
            </div>
        );
    }

    if (compact) {
        return (
            <div className="boton-marcacion-compact-wrapper">
                {/* Mensaje de bloqueo */}
                {bloqueado && (
                    <div className="bloqueo-mensaje animate-fadeIn">
                        <Clock size={16} />
                        <span>Disponible a las {estado.horaSalida}</span>
                    </div>
                )}

                {/* Advertencia de tardanza */}
                {isEntrada && estado.esTarde && (
                    <div className="tardanza-mensaje animate-fadeIn">
                        <AlertTriangle size={16} />
                        <span>Llevas {estado.minutosTarde} minutos de retraso</span>
                    </div>
                )}

                {/* Botón Compacto */}
                <button
                    className={`boton-marcacion-compact ${isEntrada ? 'entrada' : 'salida'} ${bloqueado ? 'bloqueado' : ''}`}
                    onClick={handleMarcacion}
                    disabled={loading || obteniendoUbicacion || bloqueado}
                >
                    {loading || obteniendoUbicacion ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <>
                            <MapPin size={20} />
                            <span>Marcar {isEntrada ? 'Entrada' : 'Salida'}</span>
                        </>
                    )}
                </button>

                {/* Mensaje de resultado */}
                {mensaje && (
                    <div className={`marcacion-mensaje-compact ${mensaje.tipo} animate-slideUp`}>
                        {mensaje.tipo === 'success' ? (
                            <CheckCircle2 size={18} />
                        ) : (
                            <AlertCircle size={18} />
                        )}
                        <span>{mensaje.texto}</span>
                    </div>
                )}
            </div>
        );
    }

    // Versión grande (original)
    return (
        <div className="boton-marcacion-wrapper">
            {/* Advertencias */}
            {bloqueado && (
                <div className="bloqueo-card animate-fadeIn">
                    <Clock size={24} />
                    <div>
                        <h4>No disponible aún</h4>
                        <p>Podrás marcar salida a las {estado.horaSalida}</p>
                    </div>
                </div>
            )}

            {isEntrada && estado.esTarde && !loading && (
                <div className="tardanza-card animate-fadeIn">
                    <AlertTriangle size={24} />
                    <div>
                        <h4>Llegada tardía</h4>
                        <p>Llevas {estado.minutosTarde} minutos de retraso</p>
                    </div>
                </div>
            )}

            {/* Botón Principal */}
            <button
                className={`boton-marcacion ${isEntrada ? 'entrada' : 'salida'} ${loading ? 'loading' : ''} ${bloqueado ? 'bloqueado' : ''}`}
                onClick={handleMarcacion}
                disabled={loading || obteniendoUbicacion || bloqueado}
            >
                <div className="boton-glow"></div>
                <div className="boton-content">
                    {loading || obteniendoUbicacion ? (
                        <>
                            <Loader2 size={48} className="animate-spin" />
                            <span className="boton-texto">
                                {obteniendoUbicacion ? 'Ubicando...' : 'Registrando...'}
                            </span>
                        </>
                    ) : (
                        <>
                            {isEntrada ? (
                                <LogIn size={48} strokeWidth={2.5} />
                            ) : (
                                <LogOut size={48} strokeWidth={2.5} />
                            )}
                            <span className="boton-texto">
                                MARCAR {isEntrada ? 'ENTRADA' : 'SALIDA'}
                            </span>
                            <span className="boton-hint">
                                <MapPin size={14} />
                                Toca para registrar
                            </span>
                        </>
                    )}
                </div>
            </button>

            {/* Mensaje de resultado */}
            {mensaje && (
                <div className={`marcacion-mensaje ${mensaje.tipo} animate-slideUp`}>
                    {mensaje.tipo === 'success' ? (
                        <CheckCircle2 size={20} />
                    ) : (
                        <AlertCircle size={20} />
                    )}
                    <div className="mensaje-content">
                        <span>{mensaje.texto}</span>
                    </div>
                </div>
            )}
            {/* Modal Biométrico */}
            {mostrarBiometrico && (
                <ValidacionBiometrica
                    onSuccess={realizarRegistro}
                    onCancel={() => setMostrarBiometrico(false)}
                    username={usuario?.nombreCompleto}
                />
            )}
        </div>
    );
}

export default BotonMarcacion;
