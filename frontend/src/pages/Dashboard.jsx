import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, marcacionService } from '../services/api';
import {
    Home as HomeIcon,
    MapPin,
    Menu as MenuIcon,
    LogOut,
    Clock,
    ChevronRight,
    User,
    Bell,
    Search,
    Calendar,
    Shield,
    History,
    FileText
} from 'lucide-react';
import BotonMarcacion from '../components/BotonMarcacion';
import HistorialMarcaciones from '../components/HistorialMarcaciones';
import MapaMarcacion from '../components/MapaMarcacion';
import VistaHistorial from '../components/VistaHistorial';
import VistaMarcacionMapa from '../components/VistaMarcacionMapa';
import MiPerfil from '../components/MiPerfil';
import GeofenceTracker from '../components/GeofenceTracker';
import InstallPWABanner from '../components/InstallPWABanner';
import MisJustificaciones from '../components/MisJustificaciones';
import './Dashboard.css';

function Dashboard() {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);
    const [activeTab, setActiveTab] = useState('home');
    const [marcacionesHoy, setMarcacionesHoy] = useState([]);
    const [historialMarcaciones, setHistorialMarcaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showFullHistory, setShowFullHistory] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showJustificaciones, setShowJustificaciones] = useState(false);

    const touchStartRef = useRef(0);
    const isDraggingRef = useRef(false);
    const sliderRef = useRef(null);
    const minSwipeDistance = 50;
    const tabs = ['home', 'marcar', 'menu'];

    useEffect(() => {
        const user = authService.getUsuarioActual();
        setUsuario(user);
        cargarDatos();

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const getActiveIndex = () => tabs.indexOf(activeTab);

    const onTouchStart = (e) => {
        touchStartRef.current = e.targetTouches[0].clientX;
        isDraggingRef.current = true;
        if (sliderRef.current) {
            sliderRef.current.style.transition = 'none';
        }
    };

    const onTouchMove = (e) => {
        if (!isDraggingRef.current || !sliderRef.current) return;

        const currentX = e.targetTouches[0].clientX;
        const diffX = currentX - touchStartRef.current;
        const currentIndex = getActiveIndex();

        let effectiveDiff = diffX;
        if ((currentIndex === 0 && diffX > 0) || (currentIndex === tabs.length - 1 && diffX < 0)) {
            effectiveDiff = diffX * 0.3;
        }

        const percentageOffset = currentIndex * 33.333;
        sliderRef.current.style.transform = `translateX(calc(-${percentageOffset}% + ${effectiveDiff}px))`;
    };

    const onTouchEnd = (e) => {
        if (!isDraggingRef.current || !sliderRef.current) return;
        isDraggingRef.current = false;

        const endX = e.changedTouches[0].clientX;
        const diffX = endX - touchStartRef.current;
        const currentIndex = getActiveIndex();
        let nextIndex = currentIndex;

        if (Math.abs(diffX) > minSwipeDistance) {
            if (diffX < 0 && currentIndex < tabs.length - 1) {
                nextIndex = currentIndex + 1;
            } else if (diffX > 0 && currentIndex > 0) {
                nextIndex = currentIndex - 1;
            }
        }

        sliderRef.current.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        sliderRef.current.style.transform = `translateX(-${nextIndex * 33.333}%)`;

        setTimeout(() => {
            setActiveTab(tabs[nextIndex]);
            if (sliderRef.current) {
                sliderRef.current.style.transition = '';
                sliderRef.current.style.transform = '';
            }
        }, 300);
    };

    const onTouchCancel = () => {
        if (!isDraggingRef.current || !sliderRef.current) return;
        isDraggingRef.current = false;
        const currentIndex = getActiveIndex();
        sliderRef.current.style.transition = 'transform 0.3s ease-out';
        sliderRef.current.style.transform = `translateX(-${currentIndex * 33.333}%)`;
    };

    const cargarDatos = async () => {
        try {
            const [hoy, historial, userRefresh] = await Promise.all([
                marcacionService.getHoy(),
                marcacionService.getHistorial(),
                authService.refrescarUsuario()
            ]);
            setMarcacionesHoy(hoy);
            setHistorialMarcaciones(historial);
            if (userRefresh) setUsuario(userRefresh);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleMarcacionExitosa = () => {
        cargarDatos();
        setShowMap(false);
    };

    const handleConfirmarMarcacionMapa = async (lat, lng) => {
        try {
            await marcacionService.registrar(lat, lng, 'Dispositivo Móvil');
            // No cerramos el mapa aquí para permitir que se vea la animación de éxito
            // VistaMarcacionMapa llamará a onBack() después de 3 segundos
            cargarDatos();
        } catch (error) {
            // Pasamos el error para que VistaMarcacionMapa lo maneje internamente
            throw error;
        }
    };

    const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
    };

    // Agrupar marcaciones por fecha
    const agruparPorFecha = (marcaciones) => {
        const grupos = {};
        marcaciones.forEach(m => {
            const fecha = new Date(m.fechaHora).toLocaleDateString('es-PY');
            if (!grupos[fecha]) {
                grupos[fecha] = { entrada: null, salida: null };
            }
            if (m.tipo === 'ENTRADA' && !grupos[fecha].entrada) {
                grupos[fecha].entrada = m;
            } else if (m.tipo === 'SALIDA' && !grupos[fecha].salida) {
                grupos[fecha].salida = m;
            }
        });
        return Object.entries(grupos).slice(0, 7); // Últimos 7 días
    };

    const formatTime = (fechaHora) => {
        if (!fechaHora) return '--:--';
        return new Date(fechaHora).toLocaleTimeString('es-PY', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="app-container">
            {/* Tracker de geofence silencioso - invisible para el usuario */}
            <GeofenceTracker />
            {/* Banner de instalación PWA */}
            <InstallPWABanner />
            {/* Header */}
            <header className="app-header">
                <div className="header-user">
                    <div className="user-avatar-header">
                        {usuario?.fotoPerfil ? (
                            <img src={usuario.fotoPerfil} alt="Perfil" className="avatar-img-header" />
                        ) : (
                            <User size={20} />
                        )}
                    </div>
                    <span className="user-name-header">{usuario?.nombreCompleto}</span>
                </div>
                <div className="header-actions">
                    {usuario?.rol === 'ADMIN' && (
                        <button className="header-btn" onClick={() => navigate('/admin')}>
                            <Shield size={20} />
                        </button>
                    )}
                    <button className="header-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main
                className="app-main"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onTouchCancel={onTouchCancel}
            >
                <div
                    ref={sliderRef}
                    className="tabs-slider"
                    style={{
                        transform: `translateX(-${['home', 'marcar', 'menu'].indexOf(activeTab) * 33.333}%)`
                    }}
                >
                    {/* HOME TAB */}
                    <div className="tab-content">
                        {/* Jornada de Hoy */}
                        <div className="card jornada-card">
                            <div className="jornada-header">
                                <Clock size={20} />
                                <span>Mi jornada - {formatDate(currentTime)}</span>
                            </div>
                            <div className="jornada-content">
                                {marcacionesHoy.length === 0 ? (
                                    <p className="jornada-empty">Sin marcaciones en el día de hoy</p>
                                ) : (
                                    <div className="jornada-marcaciones">
                                        {marcacionesHoy.map((m, i) => (
                                            <div key={i} className={`jornada-item ${m.tipo.toLowerCase()}`}>
                                                <span className="jornada-tipo">{m.tipo}</span>
                                                <span className="jornada-hora">{formatTime(m.fechaHora)}</span>
                                                {m.esTardia && (
                                                    <span className="jornada-tardia">
                                                        -{m.minutosTarde} min
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ver Historial */}
                        <button className="card historial-link" onClick={() => setShowFullHistory(true)}>
                            <div className="historial-link-content">
                                <History size={20} />
                                <span>Ver historial</span>
                            </div>
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* MARCAR TAB */}
                    <div className="tab-content">
                        {/* Ubicación requerida */}
                        <div className="card ubicacion-card" onClick={() => setShowMap(true)} style={{ cursor: 'pointer' }}>
                            <MapPin size={20} className="ubicacion-icon" />
                            <span>Solamente con Ubicación</span>
                            <ChevronRight size={18} />
                        </div>

                        {/* Tabla de Historial */}
                        <div className="card historial-tabla-card">
                            <table className="historial-tabla">
                                <thead>
                                    <tr>
                                        <th>Historial</th>
                                        <th>Entr.</th>
                                        <th>Salida</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {agruparPorFecha(historialMarcaciones).map(([fecha, marcaciones], i) => (
                                        <tr key={i} className={i === 0 ? 'hoy' : ''}>
                                            <td className="fecha-col">{fecha.split('/').slice(0, 2).join('/')}/26</td>
                                            <td className={marcaciones.entrada?.esTardia ? 'tardia' : ''}>
                                                {formatTime(marcaciones.entrada?.fechaHora)}
                                            </td>
                                            <td>{formatTime(marcaciones.salida?.fechaHora)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Botón Ver historial completo */}
                        <button className="btn btn-primary btn-full" onClick={() => setShowFullHistory(true)}>
                            Ver historial completo
                        </button>

                        {/* Botón de Marcación */}
                        <div className="marcacion-wrapper">
                            {/* Reemplazamos el botón directo por uno que lleva al mapa */}
                            <button
                                className="boton-ir-mapa"
                                onClick={() => setShowMap(true)}
                            >
                                <MapPin size={24} />
                                <span>IR A MARCAR CON UBICACIÓN</span>
                            </button>
                        </div>
                    </div>

                    {/* MENU TAB */}
                    <div className="tab-content">
                        <div className="menu-list">
                            {usuario?.rol === 'ADMIN' && (
                                <button className="menu-item" onClick={() => navigate('/admin')}>
                                    <Shield size={20} />
                                    <span>Panel de Administración</span>
                                    <ChevronRight size={18} />
                                </button>
                            )}
                            <button className="menu-item" onClick={() => setShowProfile(true)}>
                                <User size={20} />
                                <span>Mi Perfil</span>
                                <ChevronRight size={18} />
                            </button>
                            <button className="menu-item" onClick={() => setShowFullHistory(true)}>
                                <History size={20} />
                                <span>Historial Completo</span>
                                <ChevronRight size={18} />
                            </button>
                            <button className="menu-item" onClick={() => setShowJustificaciones(true)}>
                                <FileText size={20} />
                                <span>Mis Justificaciones</span>
                                <ChevronRight size={18} />
                            </button>
                            <button className="menu-item danger" onClick={handleLogout}>
                                <LogOut size={20} />
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Navigation */}
            <nav className="bottom-nav">
                <button
                    className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
                    onClick={() => setActiveTab('home')}
                >
                    <HomeIcon size={24} />
                    <span>Home</span>
                </button>
                <button
                    className={`nav-tab ${activeTab === 'marcar' ? 'active' : ''}`}
                    onClick={() => setActiveTab('marcar')}
                >
                    <MapPin size={24} />
                    <span>Marcar</span>
                </button>
                <button
                    className={`nav-tab ${activeTab === 'menu' ? 'active' : ''}`}
                    onClick={() => setActiveTab('menu')}
                >
                    <MenuIcon size={24} />
                    <span>Menu</span>
                </button>
            </nav>

            {/* Vista Historial Full */}
            {showFullHistory && (
                <VistaHistorial
                    marcaciones={historialMarcaciones}
                    onBack={() => setShowFullHistory(false)}
                />
            )}

            {/* Vista Mapa Full */}
            {showMap && (
                <VistaMarcacionMapa
                    usuario={usuario}
                    onBack={() => setShowMap(false)}
                    onMarcar={handleConfirmarMarcacionMapa}
                />
            )}

            {/* Mi Perfil */}
            {showProfile && (
                <MiPerfil
                    usuario={usuario}
                    onClose={() => setShowProfile(false)}
                    onUpdate={cargarDatos}
                />
            )}

            {/* Mis Justificaciones */}
            {showJustificaciones && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: '#f8fafc', overflowY: 'auto'
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', padding: '1rem',
                        background: 'white', borderBottom: '1px solid #e2e8f0',
                        position: 'sticky', top: 0, zIndex: 2
                    }}>
                        <button onClick={() => setShowJustificaciones(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#3b82f6' }}>
                            <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, marginLeft: 8 }}>Mis Justificaciones</h2>
                    </div>
                    <MisJustificaciones />
                </div>
            )}
        </div>
    );
}

export default Dashboard;
