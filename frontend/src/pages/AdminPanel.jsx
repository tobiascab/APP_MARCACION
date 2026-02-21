import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { adminService, marcacionService, authService, sucursalService, gestionService, preMarcacionService, trackingService, justificacionService, auditoriaService } from '../services/api';
import 'leaflet/dist/leaflet.css'; // Fix: Import Leaflet CSS to prevent render issues

import html2pdf from 'html2pdf.js';
import {
    LayoutDashboard,
    Users,
    Clock,
    Calendar,
    FileText,
    Settings,
    LogOut,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    UserX,
    UserCheck,
    Eye,
    EyeOff,
    Download,
    RefreshCw,
    Loader2,
    X,
    AlertTriangle,
    MapPin,
    Navigation,
    Home,
    Map as MapIcon,
    Building2,
    DollarSign,
    ChevronRight,
    FileDown,
    TrendingUp,
    TrendingDown,
    BarChart3,
    CalendarCheck,
    CalendarDays,
    CheckCircle2,
    Timer,
    ShieldAlert,
    Trash2,
    Menu,
    ArrowDownToLine,
    Radar,
    FileText,
    ScrollText
} from 'lucide-react';

import { MapContainer, TileLayer, Marker, useMapEvents, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import NotificationCenter from '../components/NotificationCenter';

// ... (rest of imports)

// Fix: Ensure MapController handles data safely and has explicit height
function MapController({ resumen, sucursales = [] }) {
    const [selectedCluster, setSelectedCluster] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const groupLocations = () => {
        // Filter and ensure valid numeric coordinates
        const locations = resumen.filter(r => r.entrada?.latitud && !isNaN(parseFloat(r.entrada.latitud)));
        const clusters = [];
        const threshold = 0.0005;

        locations.forEach(loc => {
            const lat = parseFloat(loc.entrada.latitud);
            const lng = parseFloat(loc.entrada.longitud);

            // Simple clustering
            const existingCluster = clusters.find(c =>
                Math.abs(c.lat - lat) < threshold &&
                Math.abs(c.lng - lng) < threshold
            );

            if (existingCluster) {
                existingCluster.items.push(loc);
            } else {
                clusters.push({
                    lat,
                    lng,
                    items: [loc],
                    id: `cluster-${lat.toFixed(6)}-${lng.toFixed(6)}`
                });
            }
        });
        return clusters;
    };

    const clusters = groupLocations();
    // Default to a safe center (Asunción) if no data
    const defaultCenter = clusters.length > 0 ? [clusters[0].lat, clusters[0].lng] : (sucursales.length > 0 ? [sucursales[0].latitud, sucursales[0].longitud] : [-25.2867, -57.6470]);

    // Filter logic for the modal
    const filteredItems = selectedCluster ? selectedCluster.items.filter(item =>
        item.usuario.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <div className="map-wrapper" style={{ height: '100%', width: '100%', minHeight: '600px', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <MapContainer
                center={defaultCenter}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                className="leaflet-map"
                zoomControl={false}
            >
                <TileLayer
                    url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    attribution='&copy; Google Maps'
                />

                {/* RENDERIZAR SUCURSALES (OFICINAS) */}
                {sucursales.map(sucursal => {
                    if (!sucursal.latitud || !sucursal.longitud) return null;

                    const officeIconHtml = `
                        <div class="office-marker" style="display: flex; flex-direction: column; align-items: center;">
                            <div style="background: #0f172a; padding: 8px; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M16 14h.01"></path></svg>
                            </div>
                            <div style="background: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-top: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); white-space: nowrap;">
                                ${sucursal.nombre}
                            </div>
                        </div>
                     `;

                    const officeIcon = L.divIcon({
                        html: officeIconHtml,
                        className: 'custom-office-icon',
                        iconSize: [40, 60],
                        iconAnchor: [20, 50]
                    });

                    return (
                        <React.Fragment key={`sucursal-${sucursal.id}`}>
                            <Circle
                                center={[sucursal.latitud, sucursal.longitud]}
                                radius={sucursal.radioGeocerca || 50}
                                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1, dashArray: '4, 4' }}
                            />
                            <Marker position={[sucursal.latitud, sucursal.longitud]} icon={officeIcon}>
                                <Popup>
                                    <div className="popup-content">
                                        <b style={{ display: 'block', marginBottom: '4px' }}>{sucursal.nombre}</b>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>{sucursal.direccion}</span>
                                    </div>
                                </Popup>
                            </Marker>
                        </React.Fragment>
                    );
                })}

                {/* RENDERIZAR CLUSTERS DE USUARIOS */}
                {clusters.map((cluster) => {
                    const count = cluster.items.length;
                    const isSingle = count === 1;

                    // Helper to safely get user avatar or fallback
                    const getAvatar = (user) => user.fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombreCompleto)}&background=random`;

                    // Custom Pill HTML
                    const iconHtml = isSingle
                        ? `<div class="cluster-pill single" style="transform: scale(0.9);">
                             <div class="avatar-stack">
                               <img src="${getAvatar(cluster.items[0].usuario)}" class="pill-avatar" style="width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
                             </div>
                           </div>`
                        : `<div class="cluster-pill multi" style="display: flex; align-items: center; background: white; padding: 6px 12px; border-radius: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border: 1px solid white;">
                             <div class="avatar-stack" style="display: flex; margin-right: 8px;">
                                ${cluster.items.slice(0, 3).map(i => `<img src="${getAvatar(i.usuario)}" class="pill-avatar" style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; margin-left: -10px; object-fit: cover;" />`).join('')}
                             </div>
                             <div class="pill-info" style="display: flex; flex-direction: column;">
                                <span class="pill-count" style="font-weight: 800; color: #1e293b; font-size: 0.85rem;">${count}</span>
                                <span class="pill-label" style="font-size: 0.7rem; color: #64748b; white-space: nowrap;">${cluster.items[0].usuario.sucursal?.nombre || 'Sede'}</span>
                             </div>
                           </div>`;

                    const customIcon = L.divIcon({
                        html: iconHtml,
                        className: 'custom-leaflet-icon',
                        iconSize: [isSingle ? 50 : 160, 50],
                        iconAnchor: [isSingle ? 25 : 80, 25]
                    });

                    return (
                        <React.Fragment key={cluster.id}>
                            <Marker
                                position={[cluster.lat, cluster.lng]}
                                icon={customIcon}
                                eventHandlers={{
                                    click: () => {
                                        setSelectedCluster(cluster);
                                        setSearchTerm('');
                                    },
                                }}
                            />
                        </React.Fragment>
                    );
                })}
            </MapContainer>

            {selectedCluster && (
                <div className="premium-map-modal">
                    <div className="modal-content-glass">
                        <div className="modal-header-blue">
                            <h3>{selectedCluster.items.length} en {selectedCluster.items[0].usuario.sucursal?.nombre || 'Ubicación'}</h3>
                            <button className="close-btn-white" onClick={() => setSelectedCluster(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body-p">
                            <div className="search-row">
                                <Search size={16} className="text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar empleado..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="glass-input"
                                />
                            </div>

                            <div className="users-list-scroll">
                                {filteredItems.map((item, idx) => (
                                    <div key={idx} className="user-list-item-p">
                                        <div className="col-avatar">
                                            {item.usuario.fotoPerfil ? (
                                                <img src={item.usuario.fotoPerfil} alt="User" />
                                            ) : (
                                                <div className="avatar-placeholder-sm">{item.usuario.nombreCompleto.charAt(0)}</div>
                                            )}
                                        </div>
                                        <div className="col-info">
                                            <span className="user-name-list">{item.usuario.nombreCompleto}</span>
                                            <div className="time-badges">
                                                <span className="time-badge in">
                                                    Entrada: {new Date(item.entrada.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {item.salida && (
                                                    <span className="time-badge out">
                                                        Salida: {new Date(item.salida.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-action">
                                            <a href={`https://maps.google.com/?q=${item.entrada.latitud},${item.entrada.longitud}`} target="_blank" rel="noreferrer" className="btn-icon-sm">
                                                <MapPin size={16} />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ===========================================
// DESCUENTOS Y TARDANZAS
// ===========================================

import 'leaflet/dist/leaflet.css';
import './AdminPanel.css';

// Configuración de Icono Verde para el Mapa
const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Import Recharts
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts';


// ===========================================
// COMPONENTE PRINCIPAL
// ===========================================

function AdminPanel() {
    const navigate = useNavigate();
    const location = useLocation();
    const [usuario, setUsuario] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const user = authService.getUsuarioActual();
        setUsuario(user);
    }, []);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { path: '/admin/asistencia', icon: Clock, label: 'Asistencia' },
        { path: '/admin/descuentos', icon: TrendingDown, label: 'Descuentos' },
        { path: '/admin/colaboradores', icon: Users, label: 'Colaboradores' },
        { path: '/admin/turnos', icon: CalendarDays, label: 'Gestión Turnos' },
        { path: '/admin/permisos', icon: CalendarCheck, label: 'Permisos/Ausencias' },
        { path: '/admin/reportes', icon: BarChart3, label: 'Centro Reportes' },
        { path: '/admin/premarcaciones', icon: Radar, label: 'Pre-Marcaciones', adminOnly: true },
        { path: '/admin/rastreo', icon: Navigation, label: 'Rastreo GPS', adminOnly: true },
        { path: '/admin/justificaciones', icon: FileText, label: 'Justificaciones', adminOnly: true },
        { path: '/admin/auditoria', icon: ScrollText, label: 'Auditoría', adminOnly: true },
        { path: '/admin/configuracion', icon: Settings, label: 'Configuraciones', adminOnly: true },
    ];


    const filteredMenuItems = menuItems.filter(item => !item.adminOnly || usuario?.rol === 'ADMIN');

    return (
        <div className="admin-layout">
            {/* Mobile Header Overlay */}
            {mobileMenuOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Toggle Button */}
            <button
                className="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                <Menu size={24} />
            </button>

            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <img src="/logo.png" alt="Logo" className="sidebar-logo" />
                    {!sidebarCollapsed && (
                        <div className="sidebar-brand">
                            <h1>RelojReducto</h1>
                            <span>Panel Admin</span>
                        </div>
                    )}
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="nav-section-title">Principal</span>
                        {filteredMenuItems.slice(0, 2).map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.exact}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={20} />
                                {!sidebarCollapsed && <span>{item.label}</span>}
                            </NavLink>
                        ))}
                    </div>

                    <div className="nav-section">
                        <span className="nav-section-title">Gestión</span>
                        {filteredMenuItems.slice(2).map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={20} />
                                {!sidebarCollapsed && <span>{item.label}</span>}
                            </NavLink>
                        ))}
                    </div>
                </nav>

                <div className="sidebar-footer">
                    {!sidebarCollapsed && (
                        <div className="sidebar-user">
                            <div className="user-avatar-admin">
                                {usuario?.fotoPerfil ? (
                                    <img src={usuario.fotoPerfil} alt="Admin" className="avatar-img-admin" />
                                ) : (
                                    usuario?.nombreCompleto?.charAt(0) || 'A'
                                )}
                            </div>
                            <div className="user-info-admin">
                                <span className="user-name-admin">{usuario?.nombreCompleto}</span>
                                <span className="user-role-admin">
                                    {usuario?.rol === 'ADMIN' ? 'Administrador Principal' : `Admin: ${usuario?.sucursal?.nombre || 'Sede'}`}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="sidebar-actions">
                        <button className="sidebar-btn" onClick={() => navigate('/dashboard')}>
                            <Clock size={18} />
                            {!sidebarCollapsed && <span>Mi Marcación</span>}
                        </button>
                        <button className="sidebar-btn danger" onClick={handleLogout}>
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <div style={{ position: 'absolute', top: '2rem', right: '3rem', zIndex: 50 }}>
                    <NotificationCenter />
                </div>
                <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="asistencia" element={<AdminAsistencia />} />
                    <Route path="descuentos" element={<AdminDescuentos />} />
                    <Route path="colaboradores" element={<AdminColaboradores />} />
                    <Route path="turnos" element={<AdminTurnos />} />
                    <Route path="permisos" element={<AdminPermisos />} />
                    <Route path="configuracion/*" element={<AdminConfiguracion />} />
                    <Route path="reportes" element={<AdminReportes />} />
                    <Route path="premarcaciones" element={<AdminPreMarcaciones />} />
                    <Route path="rastreo" element={<AdminRastreo />} />
                    <Route path="justificaciones" element={<AdminJustificaciones />} />
                    <Route path="auditoria" element={<AdminAuditoria />} />

                </Routes>
            </main>
        </div>
    );
}

// ===========================================
// DASHBOARD
// ===========================================


function AdminDashboard() {
    const [stats, setStats] = useState({
        totalColaboradores: 0,
        colaboradoresActivos: 0,
        marcacionesHoy: 0,
        llegadasTardias: 0,
        totalDescuentos: 0,
        presentes: 0,
        ausentes: 0,
        totalSucursales: 0
    });
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);
    const [sucursalFiltro, setSucursalFiltro] = useState('');
    const currentUser = authService.getUsuarioActual();
    const navigate = useNavigate();

    useEffect(() => {
        cargarDatos();
    }, [fechaFiltro, sucursalFiltro]);


    // Datos Mock para Gráficos
    const weeklyData = [
        { name: 'Lun', asistencia: 12, tardanzas: 2 },
        { name: 'Mar', asistencia: 19, tardanzas: 4 },
        { name: 'Mie', asistencia: 15, tardanzas: 1 },
        { name: 'Jue', asistencia: 22, tardanzas: 3 },
        { name: 'Vie', asistencia: 20, tardanzas: 2 },
        { name: 'Sab', asistencia: 10, tardanzas: 0 },
        { name: 'Dom', asistencia: 5, tardanzas: 0 },
    ];

    const pieData = [
        { name: 'Presentes', value: stats.presentes || 15, color: '#10b981' },
        { name: 'Tardanzas', value: stats.llegadasTardias || 5, color: '#f59e0b' },
        { name: 'Ausentes', value: stats.ausentes || 8, color: '#ef4444' },
    ];

    const areaData = [
        { time: '06:00', usuarios: 2 },
        { time: '07:00', usuarios: 15 },
        { time: '07:30', usuarios: 48 },
        { time: '08:00', usuarios: 55 },
        { time: '09:00', usuarios: 58 },
        { time: '12:00', usuarios: 50 },
    ];

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [usersData, marcData, sucursalData] = await Promise.all([
                adminService.getUsuarios(),
                adminService.getMarcacionesByRango(fechaFiltro, fechaFiltro),
                sucursalService.getSucursales()
            ]);
            setSucursales(sucursalData);

            // Filtrar por sucursal si hay selección
            let empleadosActivos = usersData.filter(u => u.activo && u.rol === 'EMPLEADO');
            let marcacionesHoy = marcData;

            if (sucursalFiltro) {
                empleadosActivos = empleadosActivos.filter(u => u.sucursal?.id === parseInt(sucursalFiltro));
                marcacionesHoy = marcacionesHoy.filter(m => m.usuario?.sucursal?.id === parseInt(sucursalFiltro));
            } else if (currentUser?.rol === 'ADMIN_SUCURSAL') {
                empleadosActivos = empleadosActivos.filter(u => u.sucursal?.id === currentUser.sucursal?.id);
                marcacionesHoy = marcacionesHoy.filter(m => m.usuario?.sucursal?.id === currentUser.sucursal?.id);
            }

            // Calcular Stats
            // Restore previous logic for filtering tardiness and discounts which matched the backend response
            const llegadasTardias = marcacionesHoy.filter(m => m.esTardia);
            const totalDescuentos = llegadasTardias.reduce((acc, curr) => acc + (curr.descuentoCalculado || 0), 0);
            const usuariosConMarcacion = new Set(marcacionesHoy.map(m => m.usuarioId || m.usuario?.id));

            setStats({
                totalColaboradores: usersData.length,
                colaboradoresActivos: empleadosActivos.length,
                marcacionesHoy: marcacionesHoy.length,
                llegadasTardias: llegadasTardias.length,
                totalDescuentos,
                presentes: usuariosConMarcacion.size,
                ausentes: Math.max(0, empleadosActivos.length - usuariosConMarcacion.size),
                totalSucursales: sucursalData.length
            });
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <Loader2 size={40} className="animate-spin" />
                <span>Cargando dashboard...</span>
            </div>
        );
    }

    return (
        <div className="admin-content">
            {/* Header */}
            <header className="content-header">
                <div className="header-title">
                    <h1>Dashboard</h1>
                    <p>Resumen general del sistema y estadísticas de rendimiento</p>
                </div>
                <div className="header-actions">
                    <div className="filters-bar">
                        {currentUser?.rol === 'ADMIN' && (
                            <select
                                className="input"
                                value={sucursalFiltro}
                                onChange={(e) => setSucursalFiltro(e.target.value)}
                            >
                                <option value="">Todas las Sucursales</option>
                                {sucursales.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre}</option>
                                ))}
                            </select>
                        )}
                        <input
                            type="date"
                            value={fechaFiltro}
                            onChange={(e) => setFechaFiltro(e.target.value)}
                            className="input date-input"
                        />
                    </div>
                    <button className="btn-secondary" onClick={cargarDatos}>
                        <RefreshCw size={18} />
                        Actualizar
                    </button>
                </div>
            </header>


            {/* PREMIUM DASHBOARD GRID */}
            <div className="dashboard-grid-premium">
                {/* Top Stats Row */}
                <div className="premium-row stats-row">
                    <div className="p-stat-card blue">
                        <div className="p-stat-header">
                            <div className="p-icon-box"><Users size={20} /></div>
                            <span className="p-badge">+12%</span>
                        </div>
                        <div className="p-stat-value">{stats.colaboradoresActivos || 0}</div>
                        <div className="p-stat-label">Colaboradores Activos</div>
                        <div className="p-stat-chart">
                            <ResponsiveContainer width="100%" height={40}>
                                <AreaChart data={weeklyData}>
                                    <Area type="monotone" dataKey="asistencia" stroke="#3b82f6" fill="#eff6ff" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="p-stat-card purple">
                        <div className="p-stat-header">
                            <div className="p-icon-box"><UserCheck size={20} /></div>
                            <span className="p-badge success">En horario</span>
                        </div>
                        <div className="p-stat-value">{stats.presentes || 0}</div>
                        <div className="p-stat-label">Presentes Hoy</div>
                        <div className="p-stat-chart">
                            <ResponsiveContainer width="100%" height={40}>
                                <AreaChart data={weeklyData}>
                                    <Area type="monotone" dataKey="asistencia" stroke="#8b5cf6" fill="#f5f3ff" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="p-stat-card pink">
                        <div className="p-stat-header">
                            <div className="p-icon-box"><DollarSign size={20} /></div>
                            <span className="p-badge warning">Deducciones</span>
                        </div>
                        <div className="p-stat-value">₲{(stats.totalDescuentos || 0).toLocaleString('de-DE')}</div>
                        <div className="p-stat-label">Descuentos Hoy</div>
                        <div className="p-stat-chart">
                            <ResponsiveContainer width="100%" height={40}>
                                <AreaChart data={weeklyData}>
                                    <Area type="monotone" dataKey="tardanzas" stroke="#ec4899" fill="#fdf2f8" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="p-stat-card green">
                        <div className="p-stat-header">
                            <div className="p-icon-box"><Building2 size={20} /></div>
                            <span className="p-badge">Sedes</span>
                        </div>
                        <div className="p-stat-value">{stats.totalSucursales || 0}</div>
                        <div className="p-stat-label">Locales Activos</div>
                        <div className="p-stat-chart">
                            <ResponsiveContainer width="100%" height={40}>
                                <BarChart data={weeklyData}>
                                    <Bar dataKey="asistencia" fill="#10b981" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Middle Row - Charts */}
                <div className="premium-row charts-row">
                    <div className="p-chart-card large">
                        <div className="card-header-flex">
                            <h3>Tendencia de Llegadas</h3>
                            <select className="chart-select"><option>Hoy</option><option>Semana</option></select>
                        </div>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={areaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorUsuarios" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="usuarios" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsuarios)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="p-chart-card medium">
                        <div className="card-header-flex">
                            <h3>Estado de Asistencia</h3>
                            <div className="dots-menu"><MoreVertical size={16} /></div>
                        </div>
                        <div className="chart-container donut-wrapper">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="donut-center-text">
                                <span>{stats.colaboradoresActivos}</span>
                                <small>Total</small>
                            </div>
                        </div>
                        <div className="chart-legend">
                            {pieData.map((d, i) => (
                                <div key={i} className="legend-item">
                                    <span className="dot" style={{ background: d.color }}></span>
                                    <span>{d.name}</span>
                                    <span className="val">{Math.round((d.value / (stats.colaboradoresActivos || 1)) * 100)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="premium-row bottom-row">
                    <div className="p-chart-card full">
                        <div className="card-header-flex">
                            <h3>Accesos Directos</h3>
                        </div>
                        <div className="actions-grid">
                            <div className="action-card" onClick={() => navigate('/admin/asistencia')}>
                                <Clock size={32} className="text-emerald-500" />
                                <h3>Resumen de Asistencia</h3>
                                <p>Monitorea las entradas, salidas y puntualidad.</p>
                            </div>

                            <div className="action-card" onClick={() => navigate('/admin/colaboradores')}>
                                <Users size={32} className="text-blue-500" />
                                <h3>Gestión de Personal</h3>
                                <p>Administra usuarios, roles y turnos.</p>
                            </div>

                            <div className="action-card" onClick={() => navigate('/admin/reportes')}>
                                <FileText size={32} className="text-purple-500" />
                                <h3>Reportes</h3>
                                <p>Genera informes para nómina.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===========================================
// ASISTENCIA (MARCACIONES)
// ===========================================

function AdminAsistencia() {
    const [marcaciones, setMarcaciones] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('marcaciones');
    const [filtros, setFiltros] = useState({
        fecha: new Date().toISOString().split('T')[0],
        busqueda: '',
        status: '',
        sucursalId: ''
    });
    const [sucursales, setSucursales] = useState([]);
    const currentUser = authService.getUsuarioActual();

    useEffect(() => {
        cargarDatos();
    }, [filtros.fecha]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [marcData, usersData, sucursalData] = await Promise.all([
                adminService.getMarcacionesByRango(filtros.fecha, filtros.fecha),
                adminService.getUsuarios(),
                sucursalService.getSucursales()
            ]);
            setMarcaciones(marcData);
            setUsuarios(usersData.filter(u => u.rol === 'EMPLEADO'));
            setSucursales(sucursalData);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const getResumenPorUsuario = () => {
        const resumen = {};
        usuarios.forEach(u => {
            resumen[u.id] = {
                usuario: u,
                entrada: null,
                salida: null,
                esTardia: false,
                minutosTarde: 0,
                descuento: 0,
                status: 'ausente'
            };
        });

        marcaciones.forEach(m => {
            if (!resumen[m.usuarioId]) return;
            if (m.tipo === 'ENTRADA' && !resumen[m.usuarioId].entrada) {
                resumen[m.usuarioId].entrada = m;
                resumen[m.usuarioId].status = 'presente';
                if (m.esTardia) {
                    resumen[m.usuarioId].esTardia = true;
                    resumen[m.usuarioId].minutosTarde = m.minutosTarde;
                    resumen[m.usuarioId].descuento = m.descuentoCalculado || 0;
                    resumen[m.usuarioId].status = 'tardanza';
                }
            } else if (m.tipo === 'SALIDA') {
                resumen[m.usuarioId].salida = m;
            }
        });

        return Object.values(resumen).filter(r => {
            if (filtros.busqueda) {
                const busqueda = filtros.busqueda.toLowerCase();
                return r.usuario.nombreCompleto.toLowerCase().includes(busqueda) ||
                    r.usuario.username.includes(busqueda);
            }
            if (filtros.status && filtros.status !== r.status) {
                return false;
            }
            if (filtros.sucursalId && r.usuario.sucursalId !== parseInt(filtros.sucursalId)) {
                return false;
            }
            return true;
        });
    };

    const formatTime = (fechaHora) => {
        if (!fechaHora) return '--:--';
        return new Date(fechaHora).toLocaleTimeString('es-PY', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateTotal = (entrada, salida) => {
        if (!entrada || !salida) return '-';
        const diff = new Date(salida.fechaHora) - new Date(entrada.fechaHora);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const resumen = getResumenPorUsuario();

    return (
        <div className="admin-content">
            <header className="content-header">
                <div className="header-title">
                    <h1>Control de Asistencia</h1>
                    <p>Marcaciones del día</p>
                </div>
                <div className="header-actions">
                    <NotificationCenter />
                    <button className="btn btn-primary">
                        <Download size={18} />
                        Exportar
                    </button>
                </div>
            </header>

            <div className="p-tabs-container">
                <button
                    className={`p-tab ${activeTab === 'marcaciones' ? 'active' : ''}`}
                    onClick={() => setActiveTab('marcaciones')}
                >
                    <Clock size={16} />
                    Marcaciones
                </button>
                <button
                    className={`p-tab ${activeTab === 'mapa' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mapa')}
                >
                    <MapIcon size={16} />
                    Mapa en Vivo
                </button>
            </div>

            <div className="p-filters-container">
                <div className="p-filter-group">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar colaborador..."
                        value={filtros.busqueda}
                        onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                    />
                </div>

                <div className="p-filter-group">
                    <Calendar size={18} />
                    <input
                        type="date"
                        value={filtros.fecha}
                        onChange={(e) => setFiltros(prev => ({ ...prev, fecha: e.target.value }))}
                    />
                </div>

                {currentUser?.rol === 'ADMIN' && (
                    <div className="p-filter-group">
                        <Building2 size={18} />
                        <select
                            value={filtros.sucursalId}
                            onChange={(e) => setFiltros(prev => ({ ...prev, sucursalId: e.target.value }))}
                        >
                            <option value="">Todas las Sucursales</option>
                            {sucursales.map(s => (
                                <option key={s.id} value={s.id}>{s.nombre}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="p-filter-group">
                    <Filter size={18} />
                    <select
                        value={filtros.status}
                        onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="">Todos los Status</option>
                        <option value="presente">Presentes</option>
                        <option value="tardanza">Tardanzas</option>
                        <option value="ausente">Ausentes</option>
                    </select>
                </div>

                <button className="btn-icon-glass" onClick={cargarDatos} title="Actualizar">
                    <RefreshCw size={18} />
                </button>
            </div>

            {loading ? (
                <div className="admin-loading">
                    <Loader2 size={32} className="animate-spin" />
                    <span>Cargando asistencia...</span>
                </div>
            ) : activeTab === 'marcaciones' ? (
                resumen.length > 0 ? (
                    <div className="premium-table-container">
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}></th>
                                    <th>Colaborador</th>
                                    <th>Status</th>
                                    <th>Horario</th>
                                    <th>Tardanza</th>
                                    <th>Descuento</th>
                                    <th>Ubicación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resumen.map((r) => (
                                    <tr key={r.usuario.id}>
                                        <td>
                                            <div className="p-avatar">
                                                {r.usuario.fotoPerfil ? (
                                                    <img src={r.usuario.fotoPerfil} alt="" style={{ width: '100%', height: '100%', borderRadius: '12px' }} />
                                                ) : (
                                                    r.usuario.nombreCompleto.charAt(0)
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="p-user-info">
                                                <span className="p-user-name">{r.usuario.nombreCompleto}</span>
                                                <span className="p-user-sub">{r.usuario.username} • {r.usuario.sucursal?.nombre || 'Sin sucursal'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`p-status-badge ${r.status}`}>
                                                {r.status === 'presente' && <CheckCircle2 size={12} />}
                                                {r.status === 'tardanza' && <AlertTriangle size={12} />}
                                                {r.status === 'ausente' && <UserX size={12} />}
                                                {r.status === 'presente' && 'Presente'}
                                                {r.status === 'tardanza' && 'Tardanza'}
                                                {r.status === 'ausente' && 'Ausente'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="p-user-info">
                                                <span className={`p-time ${r.esTardia ? 'late' : ''}`}>
                                                    Entrada: {formatTime(r.entrada?.fechaHora)}
                                                </span>
                                                <span className="p-user-sub">
                                                    Salida: {formatTime(r.salida?.fechaHora)}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            {r.minutosTarde > 0 ? (
                                                <span className="p-time late">+{r.minutosTarde} min</span>
                                            ) : (
                                                <span className="p-user-sub">-</span>
                                            )}
                                        </td>
                                        <td>
                                            {r.descuento > 0 ? (
                                                <span className="p-time late">-₲{r.descuento.toLocaleString('de-DE')}</span>
                                            ) : (
                                                <span className="p-user-sub">-</span>
                                            )}
                                        </td>
                                        <td>
                                            {r.entrada?.latitud ? (
                                                <button className="p-action-btn" title="Ver en mapa" onClick={() => {
                                                    // Optional: handle map view logic if needed inline or link
                                                    window.open(`https://maps.google.com/?q=${r.entrada.latitud},${r.entrada.longitud}`, '_blank');
                                                }}>
                                                    <MapPin size={16} />
                                                </button>
                                            ) : (
                                                <span className="p-user-sub">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9', color: '#94a3b8', fontSize: '0.85rem' }}>
                            Mostrando {resumen.length} resultados
                        </div>
                    </div>
                ) : (
                    <div className="p-empty-state">
                        <div className="p-empty-icon"><Search size={32} /></div>
                        <h3>No se encontraron resultados</h3>
                        <p>Intenta ajustar los filtros de búsqueda.</p>
                    </div>
                )
            ) : (
                <div className="premium-map-container" style={{ display: 'flex', height: 'calc(100vh - 200px)', gap: '1rem', marginTop: '1rem' }}>
                    {/* Sidebar de Lista de Usuarios en Mapa */}
                    <div className="map-sidebar glass-panel" style={{ width: '320px', display: 'flex', flexDirection: 'column', borderRadius: '20px', overflow: 'hidden', background: 'white', border: '1px solid #e2e8f0' }}>
                        <div className="sidebar-header" style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem' }}>Ubicaciones</h3>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{resumen.filter(r => r.entrada?.latitud).length} en mapa / {resumen.length} total</span>
                        </div>
                        <div className="sidebar-search" style={{ padding: '0.75rem 1.25rem' }}>
                            <div className="search-input-sm" style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <Search size={16} color="#94a3b8" />
                                <input
                                    type="text"
                                    placeholder="Filtrar mapa..."
                                    style={{ border: 'none', background: 'transparent', outline: 'none', marginLeft: '0.5rem', width: '100%', fontSize: '0.9rem' }}
                                    value={filtros.busqueda}
                                    onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="sidebar-list" style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem' }}>
                            {resumen.map(item => {
                                const hasLocation = !!item.entrada?.latitud;
                                return (
                                    <div
                                        key={item.usuario.id}
                                        className={`map-user-item ${hasLocation ? 'clickable' : 'disabled'}`}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '12px', cursor: hasLocation ? 'pointer' : 'default', opacity: hasLocation ? 1 : 0.6 }}
                                        onClick={() => {
                                            if (hasLocation) {
                                                // Event dispatch to map controller could be handled via context or ref, 
                                                // but for now relying on MapController internal clusters is safer.
                                                // Ideally, we lift state up or use a shared ref.
                                                // For this scoped fix, visual feedback is key.
                                            }
                                        }}
                                    >
                                        <div className="avatar-sm" style={{ width: '36px', height: '36px', borderRadius: '10px', overflow: 'hidden', minWidth: '36px' }}>
                                            {item.usuario.fotoPerfil ? (
                                                <img src={item.usuario.fotoPerfil} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#64748b' }}>
                                                    {item.usuario.nombreCompleto.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="info" style={{ flex: 1, minWidth: 0 }}>
                                            <div className="name" style={{ fontWeight: '600', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155' }}>
                                                {item.usuario.nombreCompleto}
                                            </div>
                                            <div className="sub" style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {hasLocation ? <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}><MapPin size={10} /> {formatTime(item.entrada.fechaHora)}</span> : 'Sin ubicación'}
                                            </div>
                                        </div>
                                        {hasLocation && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* MAPA PRINCIPAL */}
                    <div style={{ flex: 1, borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0', height: '100%' }}>
                        <MapController resumen={resumen} sucursales={sucursales} />
                    </div>
                </div>
            )}
        </div>
    );
}

// ===========================================
// COMPONENTE DEL MAPA Y CLUSTERS
// ===========================================



// ===========================================
// DESCUENTOS Y TARDANZAS
// ===========================================

function AdminDescuentos() {
    const [stats, setStats] = useState({
        totalTardias: 0,
        montoTotal: 0,
        promedioMinutos: 0,
        topInfractores: []
    });
    const [marcaciones, setMarcaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sucursales, setSucursales] = useState([]);
    const [sucursalFiltro, setSucursalFiltro] = useState('');
    const [mesFiltro, setMesFiltro] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const currentUser = authService.getUsuarioActual();

    useEffect(() => {
        cargarDatos();
    }, [sucursalFiltro, mesFiltro]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [users, allMarcaciones, sucursalesData] = await Promise.all([
                adminService.getUsuarios(),
                adminService.getAllMarcaciones(),
                sucursalService.getSucursales()
            ]);
            setSucursales(sucursalesData);

            // Filtrar por mes y sucursal
            const tardias = allMarcaciones.filter(m => {
                const mesM = m.fechaHora.slice(0, 7);
                const mismoMes = mesM === mesFiltro;
                if (!mismoMes || !m.esTardia) return false;

                if (sucursalFiltro) {
                    const user = users.find(u => u.id === m.usuarioId);
                    return user && user.sucursalId === parseInt(sucursalFiltro);
                }
                return true;
            });

            // Calcular Top
            const userStats = users.reduce((acc, user) => {
                const userTardias = tardias.filter(t => t.usuarioId === user.id);
                if (userTardias.length > 0) {
                    acc.push({
                        id: user.id,
                        nombre: user.nombreCompleto,
                        sucursal: sucursalesData.find(s => s.id === user.sucursalId)?.nombre || 'S/N',
                        cantidad: userTardias.length,
                        monto: userTardias.reduce((sum, t) => sum + (t.descuentoCalculado || 0), 0),
                        minutosTotal: userTardias.reduce((sum, t) => sum + (t.minutosTarde || 0), 0)
                    });
                }
                return acc;
            }, []).sort((a, b) => b.monto - a.monto);

            setStats({
                totalTardias: tardias.length,
                montoTotal: tardias.reduce((sum, t) => sum + (t.descuentoCalculado || 0), 0),
                promedioMinutos: tardias.length ? Math.round(tardias.reduce((sum, t) => sum + (t.minutosTarde || 0), 0) / tardias.length) : 0,
                topInfractores: userStats.slice(0, 10)
            });
            setMarcaciones(tardias);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (type) => {
        alert(`Exportando a ${type}... (Esta funcionalidad requiere integración con librería de reportes)`);
    };

    if (loading) return (
        <div className="admin-loading">
            <Loader2 className="animate-spin" size={40} />
            <span>Analizando descuentos...</span>
        </div>
    );

    return (
        <div className="admin-content animate-fadeIn">
            <header className="content-header">
                <div className="header-title">
                    <h1>Módulo de Descuentos</h1>
                    <p>Gestión de llegadas tardías y sanciones económicas</p>
                </div>
                <div className="header-actions">
                    {currentUser?.rol === 'ADMIN' && (
                        <select
                            value={sucursalFiltro}
                            onChange={(e) => setSucursalFiltro(e.target.value)}
                            className="date-input"
                        >
                            <option value="">Todas las Sucursales</option>
                            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    )}
                    <input
                        type="month"
                        value={mesFiltro}
                        onChange={(e) => setMesFiltro(e.target.value)}
                        className="date-input"
                    />
                    <button onClick={() => handleExport('excel')} className="sidebar-btn" style={{ padding: '8px 16px' }}>
                        <FileDown size={18} /> Excel
                    </button>
                    <button onClick={() => handleExport('pdf')} className="sidebar-btn danger" style={{ padding: '8px 16px' }}>
                        <FileText size={18} /> PDF
                    </button>
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-icon"><TrendingUp size={32} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalTardias}</span>
                        <span className="stat-label">Tardanzas Total</span>
                    </div>
                </div>
                <div className="stat-card danger">
                    <div className="stat-icon" style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>₲</div>
                    <div className="stat-info">
                        <span className="stat-value">₲ {stats.montoTotal.toLocaleString('de-DE')}</span>
                        <span className="stat-label">Total Descuentos</span>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon"><Timer size={32} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.promedioMinutos} min</span>
                        <span className="stat-label">Promedio Retraso</span>
                    </div>
                </div>
            </div>

            <section className="table-container">
                <div className="modal-header" style={{ border: 'none' }}>
                    <h2>Ranking de Descuentos (Top 10)</h2>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Colaborador</th>
                            <th>Sucursal</th>
                            <th>Frecuencia</th>
                            <th>Minutos Acum.</th>
                            <th className="text-right">Monto Descuento</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.topInfractores.map(user => (
                            <tr key={user.id}>
                                <td className="font-bold">{user.nombre}</td>
                                <td>{user.sucursal}</td>
                                <td>
                                    <span className="tardia-badge">{user.cantidad} tardías</span>
                                </td>
                                <td>{user.minutosTotal} min</td>
                                <td className="text-right font-bold text-error">
                                    ₲ {user.monto.toLocaleString('de-DE')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
}

// ===========================================
// COLABORADORES
// ===========================================


function AdminColaboradores() {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedUsuario, setSelectedUsuario] = useState(null);
    const currentUser = authService.getUsuarioActual();

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const cargarUsuarios = async () => {
        setLoading(true);
        try {
            const data = await adminService.getUsuarios();
            setUsuarios(data);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (usuario) => {
        try {
            if (usuario.activo) {
                await adminService.deactivateUsuario(usuario.id);
            } else {
                await adminService.activateUsuario(usuario.id);
            }
            cargarUsuarios();
        } catch (error) {
            console.error('Error al cambiar estado:', error);
        }
    };

    const handleExport = async () => {
        try {
            const blob = await adminService.exportUsuarios();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'colaboradores_reloj.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error al exportar:', error);
        }
    };

    const filteredUsuarios = usuarios.filter(u =>
        u.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Cálculos para el resumen
    const total = usuarios.length;
    const activos = usuarios.filter(u => u.activo).length;
    const administradores = usuarios.filter(u => u.rol !== 'EMPLEADO').length;

    return (
        <div className="admin-content">
            <header className="content-header">
                <div className="header-title">
                    <h1>Colaboradores</h1>
                    <p>Gestión integral de talento humano y accesos</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={handleExport}>
                        <FileDown size={18} />
                        Exportar a Excel
                    </button>
                    {currentUser?.rol === 'ADMIN' && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={18} />
                            Nuevo Colaborador
                        </button>
                    )}
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-icon"><Users /></div>
                    <div className="stat-info">
                        <span className="stat-value">{total}</span>
                        <span className="stat-label">Total Gral.</span>
                    </div>
                    <div className="stat-badge primary">Registrados</div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon"><UserCheck /></div>
                    <div className="stat-info">
                        <span className="stat-value">{activos}</span>
                        <span className="stat-label">Activos hoy</span>
                    </div>
                    <div className="stat-badge success">En línea</div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon"><ShieldAlert /></div>
                    <div className="stat-info">
                        <span className="stat-value">{administradores}</span>
                        <span className="stat-label">Administrativos</span>
                    </div>
                </div>
            </div>

            <div className="filters-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid var(--admin-border)', marginBottom: '2rem' }}>
                <div className="search-input" style={{ flex: '1', maxWidth: '400px' }}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o cédula..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>
                    Mostrando {filteredUsuarios.length} de {total} colaboradores
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', background: 'white', borderRadius: '24px', border: '1px solid var(--admin-border)' }}>
                    <Loader2 size={40} className="animate-spin" style={{ color: 'var(--p-emerald-500)', marginBottom: '1rem' }} />
                    <span style={{ fontWeight: '600', color: 'var(--admin-text-secondary)' }}>Cargando nómina de colaboradores...</span>
                </div>
            ) : filteredUsuarios.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '24px', border: '1px solid var(--admin-border)' }}>
                    <Users size={60} style={{ color: '#e2e8f0', marginBottom: '1.5rem' }} />
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--p-emerald-900)', marginBottom: '0.5rem' }}>No se encontraron colaboradores</h3>
                    <p style={{ color: 'var(--admin-text-muted)' }}>Intenta ajustar tu búsqueda o crea uno nuevo.</p>
                </div>
            ) : (
                <div className="table-container animate-fadeIn">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Cédula</th>
                                <th>Rol</th>
                                <th>Sucursal</th>
                                <th>Salario</th>
                                <th className="hide-mobile">Email</th>
                                <th>Estado</th>
                                {currentUser?.rol === 'ADMIN' && <th>Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsuarios.map(u => (
                                <tr key={u.id} className={!u.activo ? 'inactive' : ''}>
                                    <td>
                                        <div className="user-avatar-small">
                                            {u.fotoPerfil ? (
                                                <img src={u.fotoPerfil} alt="Perfil" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                u.nombreCompleto.charAt(0)
                                            )}
                                        </div>
                                    </td>
                                    <td className="name-cell">
                                        <span className="user-name">{u.nombreCompleto}</span>
                                    </td>
                                    <td>{u.username}</td>
                                    <td>
                                        <span className={`role-badge ${u.rol.toLowerCase()}`}>
                                            {u.rol}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="sucursal-cell">
                                            <Building2 size={14} />
                                            <span>{u.sucursal?.nombre || 'Sin asignar'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {u.salarioMensual ? `₲${u.salarioMensual.toLocaleString('de-DE')}` : '-'}
                                    </td>
                                    <td>{u.email || '-'}</td>
                                    <td>
                                        <span className={`status-badge ${u.activo ? 'presente' : 'ausente'}`}>
                                            {u.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    {currentUser?.rol === 'ADMIN' && (
                                        <td>
                                            <div className="actions-cell">
                                                <button
                                                    className="action-btn"
                                                    title="Ver detalles"
                                                    onClick={() => {
                                                        setSelectedUsuario(u);
                                                        setShowPreviewModal(true);
                                                    }}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    className="action-btn"
                                                    title="Editar"
                                                    onClick={() => {
                                                        setSelectedUsuario(u);
                                                        setShowModal(true);
                                                    }}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className={`action-btn ${u.activo ? 'deactivate' : 'activate'}`}
                                                    title={u.activo ? 'Desactivar' : 'Activar'}
                                                    onClick={() => handleToggleStatus(u)}
                                                >
                                                    {u.activo ? <UserX size={16} /> : <UserCheck size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <UsuarioModal
                    usuario={selectedUsuario}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedUsuario(null);
                    }}
                    onSave={() => {
                        cargarUsuarios();
                        setShowModal(false);
                        setSelectedUsuario(null);
                    }}
                />
            )}

            {showPreviewModal && selectedUsuario && (
                <UsuarioPreviewModal
                    usuario={selectedUsuario}
                    onClose={() => {
                        setShowPreviewModal(false);
                        setSelectedUsuario(null);
                    }}
                />
            )}
        </div>
    );
}

// ===========================================
// MODAL PREVIEW USUARIO
// ===========================================

function UsuarioPreviewModal({ usuario, onClose }) {
    const [stats, setStats] = useState({
        totalMarcaciones: 0,
        tardanzas: 0,
        puntualidad: 100,
        totalDescuentos: 0,
        promedioMinutos: 0
    });
    const [marcaciones, setMarcaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatingPDF, setGeneratingPDF] = useState(false);
    const reportRef = useRef(null);
    const mesActual = new Date().toISOString().slice(0, 7);

    useEffect(() => {
        cargarDatosUsuario();
    }, [usuario]);

    const cargarDatosUsuario = async () => {
        try {
            setLoading(true);
            const allMarcaciones = await adminService.getAllMarcaciones();

            // Filtrar marcaciones del mes actual para este usuario
            const marcacionesUsuario = allMarcaciones.filter(m => {
                const mesM = m.fechaHora.slice(0, 7);
                return m.usuarioId === usuario.id && mesM === mesActual;
            });

            // Calcular estadísticas
            const tardias = marcacionesUsuario.filter(m => m.esTardia);
            const totalDescuentos = tardias.reduce((sum, m) => sum + (m.descuentoCalculado || 0), 0);
            const totalMinutos = tardias.reduce((sum, m) => sum + (m.minutosTarde || 0), 0);
            const puntualidad = marcacionesUsuario.length > 0
                ? Math.round(((marcacionesUsuario.length - tardias.length) / marcacionesUsuario.length) * 100)
                : 100;

            setStats({
                totalMarcaciones: marcacionesUsuario.length,
                tardanzas: tardias.length,
                puntualidad,
                totalDescuentos,
                promedioMinutos: tardias.length > 0 ? Math.round(totalMinutos / tardias.length) : 0
            });

            setMarcaciones(marcacionesUsuario.slice(0, 10)); // Últimas 10 marcaciones
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatFecha = (fechaHora) => {
        const fecha = new Date(fechaHora);
        return fecha.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatHora = (fechaHora) => {
        const fecha = new Date(fechaHora);
        return fecha.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });
    };

    const generarPDF = () => {
        setGeneratingPDF(true);
        const element = reportRef.current;
        const opt = {
            margin: 10,
            filename: `reporte_${usuario.nombreCompleto.replace(/\s+/g, '_')}_${mesActual}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            setGeneratingPDF(false);
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content side-modal animate-slideInRight" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                <div className="modal-header">
                    <h2>
                        <Eye size={24} />
                        Preview del Colaborador
                    </h2>
                    <button type="button" className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body nano-scroll" ref={reportRef}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem' }}>
                            <Loader2 size={40} className="animate-spin" style={{ color: 'var(--p-emerald-500)', marginBottom: '1rem' }} />
                            <span style={{ color: 'var(--admin-text-muted)' }}>Cargando información...</span>
                        </div>
                    ) : (
                        <>
                            {/* Información Personal */}
                            <section className="form-section" style={{ background: 'linear-gradient(135deg, var(--p-emerald-50) 0%, white 100%)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '20px', overflow: 'hidden', background: 'var(--p-emerald-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: 'var(--p-emerald-700)', border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                        {usuario.fotoPerfil ? (
                                            <img src={usuario.fotoPerfil} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            usuario.nombreCompleto.charAt(0)
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--p-emerald-900)', marginBottom: '0.25rem' }}>
                                            {usuario.nombreCompleto}
                                        </h3>
                                        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                            CI: {usuario.username}
                                        </p>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span className={`role-badge ${usuario.rol.toLowerCase()}`}>
                                                {usuario.rol}
                                            </span>
                                            <span className={`status-badge ${usuario.activo ? 'presente' : 'ausente'}`}>
                                                {usuario.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1.5rem', padding: '1rem', background: 'white', borderRadius: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase' }}>Email</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--p-emerald-900)' }}>{usuario.email || '-'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase' }}>Teléfono</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--p-emerald-900)' }}>{usuario.telefono || '-'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase' }}>Sucursal</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--p-emerald-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Building2 size={14} />
                                            {usuario.sucursal?.nombre || 'Sin asignar'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase' }}>Turno</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--p-emerald-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <CalendarDays size={14} />
                                            {usuario.turno?.nombre || 'Sin turno fijo'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase' }}>Salario</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--p-emerald-900)', fontWeight: '600' }}>
                                            {usuario.salarioMensual ? `₲${usuario.salarioMensual.toLocaleString('de-DE')}` : '-'}
                                        </div>
                                    </div>
                                </div>

                            </section>

                            {/* Estadísticas del Mes */}
                            <section className="form-section">
                                <h4 className="form-section-title">Estadísticas del Mes Actual</h4>
                                <div className="stats-grid" style={{ marginTop: '1rem' }}>
                                    <div className="stat-card primary" style={{ minHeight: 'auto' }}>
                                        <div className="stat-icon"><Clock size={24} /></div>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.totalMarcaciones}</span>
                                            <span className="stat-label">Marcaciones</span>
                                        </div>
                                    </div>
                                    <div className="stat-card danger" style={{ minHeight: 'auto' }}>
                                        <div className="stat-icon"><AlertTriangle size={24} /></div>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.tardanzas}</span>
                                            <span className="stat-label">Tardanzas</span>
                                        </div>
                                    </div>
                                    <div className="stat-card success" style={{ minHeight: 'auto' }}>
                                        <div className="stat-icon"><CheckCircle2 size={24} /></div>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.puntualidad}%</span>
                                            <span className="stat-label">Puntualidad</span>
                                        </div>
                                    </div>
                                    <div className="stat-card warning" style={{ minHeight: 'auto' }}>
                                        <div className="stat-icon" style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>₲</div>
                                        <div className="stat-info">
                                            <span className="stat-value" style={{ fontSize: '1.25rem' }}>₲{stats.totalDescuentos.toLocaleString('de-DE')}</span>
                                            <span className="stat-label">Descuentos</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Últimas Marcaciones */}
                            <section className="form-section">
                                <h4 className="form-section-title">Últimas Marcaciones ({mesActual})</h4>
                                {marcaciones.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-text-muted)' }}>
                                        <Clock size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                        <p>No hay marcaciones este mes</p>
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '1rem' }}>
                                        <table className="data-table" style={{ fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr>
                                                    <th>Fecha</th>
                                                    <th>Hora</th>
                                                    <th>Tipo</th>
                                                    <th>Estado</th>
                                                    <th className="text-right">Descuento</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {marcaciones.map((m, idx) => (
                                                    <tr key={idx}>
                                                        <td>{formatFecha(m.fechaHora)}</td>
                                                        <td style={{ fontWeight: '600' }}>{formatHora(m.fechaHora)}</td>
                                                        <td>
                                                            <span className={`status-badge ${m.tipo === 'ENTRADA' ? 'entrada' : 'salida'}`}>
                                                                {m.tipo}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {m.esTardia ? (
                                                                <span className="tardia-badge">
                                                                    {m.minutosTarde} min tarde
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: 'var(--p-emerald-600)', fontWeight: '600', fontSize: '0.8rem' }}>
                                                                    ✓ A tiempo
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="text-right" style={{ fontWeight: '600', color: m.descuentoCalculado > 0 ? 'var(--p-error)' : 'inherit' }}>
                                                            {m.descuentoCalculado > 0 ? `₲${m.descuentoCalculado.toLocaleString('de-DE')}` : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>

                <div className="modal-actions">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={generarPDF}
                        disabled={generatingPDF || loading}
                    >
                        {generatingPDF ? (
                            <><Loader2 size={18} className="animate-spin" /> Generando PDF...</>
                        ) : (
                            <><FileText size={18} /> Generar Reporte PDF</>
                        )}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===========================================
// MODAL USUARIO
// ===========================================

function UsuarioModal({ onClose, onSave, usuario = null }) {
    const [formData, setFormData] = useState({
        username: usuario?.username || '',
        password: '',
        nombreCompleto: usuario?.nombreCompleto || '',
        rol: usuario?.rol || 'EMPLEADO',
        email: usuario?.email || '',
        telefono: usuario?.telefono || '',
        salarioMensual: usuario?.salarioMensual || '',
        activo: usuario?.activo !== undefined ? usuario.activo : true,
        requiereGeolocalizacion: usuario?.requiereGeolocalizacion !== undefined ? usuario.requiereGeolocalizacion : true,
        biometricoHabilitado: usuario?.biometricoHabilitado !== undefined ? usuario.biometricoHabilitado : false,
        siempreEnUbicacion: usuario?.siempreEnUbicacion !== undefined ? usuario.siempreEnUbicacion : false,
        sucursalId: usuario?.sucursalId || '',
        turnoId: usuario?.turnoId || ''
    });
    const [sucursales, setSucursales] = useState([]);
    const [turnos, setTurnos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        cargarSucursales();
        cargarTurnos();
        if (usuario) {
            console.log('📝 Editando:', usuario.nombreCompleto);
        }
    }, []);

    const cargarTurnos = async () => {
        try {
            const data = await gestionService.getTurnos();
            setTurnos(data);
        } catch (err) {
            console.error('Error turnos:', err);
        }
    };

    const cargarSucursales = async () => {
        try {
            const data = await sucursalService.getSucursales();
            setSucursales(data);
        } catch (err) {
            console.error('Error sucursales:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.sucursalId) {
            setError('Debe seleccionar una sucursal');
            setLoading(false);
            return;
        }

        try {
            const payload = { ...formData };
            if (payload.salarioMensual) {
                payload.salarioMensual = parseFloat(payload.salarioMensual);
            }

            if (usuario) {
                if (!payload.password) delete payload.password;
                await adminService.updateUsuario(usuario.id, payload);
            } else {
                await adminService.createUsuario(payload);
            }
            onSave();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.mensaje || 'Error al guardar colaborador');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content side-modal animate-slideInRight" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="modal-header">
                        <h2>
                            {usuario ? <Edit size={24} /> : <Plus size={24} />}
                            {usuario ? 'Editar Colaborador' : 'Nuevo Colaborador'}
                        </h2>
                        <button type="button" className="modal-close" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="modal-body nano-scroll">
                        {error && (
                            <div className="form-error">
                                <AlertTriangle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <section className="form-section">
                            <h4 className="form-section-title">Información de Acceso</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Cédula de Identidad *</label>
                                    <div className="form-group-icon">
                                        <Users size={18} />
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ej: 1234567"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Contraseña {usuario ? '(Opcional)' : '*'}</label>
                                    <div className="form-group-icon password-group">
                                        <ShieldAlert size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required={!usuario}
                                            placeholder={usuario ? "••••••••" : "Mín. 6 caracteres"}
                                            style={{ paddingRight: '2.5rem' }}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex="-1"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="form-divider"></div>

                        <section className="form-section">
                            <h4 className="form-section-title">Datos Personales y Laborales</h4>
                            <div className="form-group">
                                <label>Nombre Completo *</label>
                                <div className="form-group-icon">
                                    <Users size={18} />
                                    <input
                                        type="text"
                                        name="nombreCompleto"
                                        value={formData.nombreCompleto}
                                        onChange={handleChange}
                                        required
                                        placeholder="Nombre y Apellidos"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email</label>
                                    <div className="form-group-icon">
                                        <FileText size={18} />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="correo@ejemplo.com"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Teléfono</label>
                                    <div className="form-group-icon">
                                        <Navigation size={18} />
                                        <input
                                            type="tel"
                                            name="telefono"
                                            value={formData.telefono}
                                            onChange={handleChange}
                                            placeholder="09XX XXX XXX"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Salario Mensual (₲)</label>
                                    <div className="form-group-icon">
                                        <div style={{ position: 'absolute', left: '1rem', fontWeight: 'bold', color: 'var(--admin-text-muted)', fontSize: '1.1rem' }}>₲</div>
                                        <input
                                            type="number"
                                            name="salarioMensual"
                                            value={formData.salarioMensual}
                                            onChange={handleChange}
                                            placeholder="0"
                                            style={{ paddingLeft: '2.5rem' }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Rol Principal *</label>
                                    <div className="form-group-icon">
                                        <ShieldAlert size={18} />
                                        <select name="rol" value={formData.rol} onChange={handleChange}>
                                            <option value="EMPLEADO">Empleado Estándar</option>
                                            <option value="ADMIN_SUCURSAL">Admin. de Sede</option>
                                            <option value="ADMIN">Super Administrador</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Sucursal Asignada *</label>
                                <div className="form-group-icon">
                                    <Building2 size={18} />
                                    <select name="sucursalId" value={formData.sucursalId} onChange={handleChange} required>
                                        <option value="">Seleccione lugar de trabajo...</option>
                                        {sucursales.map(s => (
                                            <option key={s.id} value={s.id}>{s.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Turno Laboral</label>
                                <div className="form-group-icon">
                                    <CalendarDays size={18} />
                                    <select name="turnoId" value={formData.turnoId} onChange={handleChange}>
                                        <option value="">Sin turno asignado (Libre)</option>
                                        {turnos.map(t => (
                                            <option key={t.id} value={t.id}>{t.nombre} ({t.horaEntrada} - {t.horaSalida})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </section>

                        <div className="form-divider"></div>

                        <section className="form-section">
                            <h4 className="form-section-title">Configuración de Seguridad</h4>

                            <div className="toggles-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.activo}
                                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                    />
                                    <div className="toggle-slider"></div>
                                    <div className="toggle-label">
                                        <span className="toggle-main-text">Colaborador Activo</span>
                                        <span className="toggle-sub-text">Permite al usuario acceder al sistema</span>
                                    </div>
                                </label>

                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.requiereGeolocalizacion}
                                        onChange={(e) => setFormData({ ...formData, requiereGeolocalizacion: e.target.checked })}
                                    />
                                    <div className="toggle-slider"></div>
                                    <div className="toggle-label">
                                        <span className="toggle-main-text">Exigir Geolocalización</span>
                                        <span className="toggle-sub-text">Obligatorio marcar dentro del radio de la sede</span>
                                    </div>
                                </label>

                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.biometricoHabilitado}
                                        onChange={(e) => setFormData({ ...formData, biometricoHabilitado: e.target.checked })}
                                    />
                                    <div className="toggle-slider"></div>
                                    <div className="toggle-label">
                                        <span className="toggle-main-text">Identidad Biométrica</span>
                                        <span className="toggle-sub-text">Habilita uso de huella o rostro (si está disp.)</span>
                                    </div>
                                </label>
                            </div>

                            <div className="dev-card info-card" style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.siempreEnUbicacion}
                                        onChange={(e) => setFormData({ ...formData, siempreEnUbicacion: e.target.checked })}
                                    />
                                    <div className="toggle-slider"></div>
                                    <div className="toggle-label">
                                        <span className="toggle-main-text" style={{ color: '#1e40af' }}>Modo Ubicación Forzada</span>
                                        <span className="toggle-sub-text">Omitir validación GPS (Solo para pruebas)</span>
                                    </div>
                                </label>
                            </div>
                        </section>

                        {usuario?.fotoPerfil && (
                            <div className="perfil-preview-admin" style={{ marginTop: '2rem' }}>
                                <img src={usuario.fotoPerfil} alt="Perfil" style={{ width: '100px', height: '100px', borderRadius: '24px', objectFit: 'cover' }} />
                            </div>
                        )}
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : (usuario ? <CheckCircle2 size={18} /> : <Plus size={18} />)}
                            {loading ? 'Guardando...' : (usuario ? 'Actualizar Cambios' : 'Crear Colaborador')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ===========================================
// REPORTES
// ===========================================

// Este es el componente completo de AdminReportes - copiar al AdminPanel.jsx línea 1805
function AdminReportes() {
    const [reportType, setReportType] = useState('asistencia');
    const [dateRange, setDateRange] = useState({
        inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        fin: new Date().toISOString().split('T')[0]
    });
    const [sucursalFiltro, setSucursalFiltro] = useState('');
    const [sucursales, setSucursales] = useState([]);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [reportGeneratedAt, setReportGeneratedAt] = useState(null);
    const currentUser = authService.getUsuarioActual();

    const reportTypeNames = {
        'asistencia': 'Reporte de Asistencia General',
        'descuentos': 'Reporte de Descuentos por Tardanza',
        'resumen': 'Resumen Ejecutivo por Sucursal'
    };

    useEffect(() => {
        cargarSucursales();
    }, []);

    const cargarSucursales = async () => {
        try {
            const data = await sucursalService.getSucursales();
            setSucursales(data);
        } catch (error) {
            console.error('Error al cargar sucursales:', error);
        }
    };

    const generarReporte = async () => {
        try {
            setGeneratingReport(true);
            const [usuarios, marcaciones] = await Promise.all([
                adminService.getUsuarios(),
                adminService.getAllMarcaciones()
            ]);

            const marcacionesFiltradas = marcaciones.filter(m => {
                const fecha = m.fechaHora.split('T')[0];
                return fecha >= dateRange.inicio && fecha <= dateRange.fin;
            });

            let data = {};
            if (reportType === 'asistencia') {
                data = generarReporteAsistencia(marcacionesFiltradas, usuarios, sucursalFiltro);
            } else if (reportType === 'descuentos') {
                data = generarReporteDescuentos(marcacionesFiltradas, usuarios, sucursalFiltro);
            } else if (reportType === 'resumen') {
                data = generarReporteResumen(marcacionesFiltradas, usuarios, sucursalFiltro);
            }

            setReportData(data);
            setReportGeneratedAt(new Date());
        } catch (error) {
            console.error('Error al generar reporte:', error);
        } finally {
            setGeneratingReport(false);
        }
    };

    const generarReporteAsistencia = (marcaciones, usuarios, sucursalId) => {
        let usuariosFiltrados = usuarios;
        if (sucursalId) {
            usuariosFiltrados = usuarios.filter(u => u.sucursalId === parseInt(sucursalId));
        }

        return usuariosFiltrados.map(usuario => {
            const marcacionesUsuario = marcaciones.filter(m => m.usuarioId === usuario.id);
            const diasTrabajados = new Set(marcacionesUsuario.filter(m => m.tipo === 'ENTRADA').map(m => m.fechaHora.split('T')[0])).size;
            const tardanzas = marcacionesUsuario.filter(m => m.esTardia).length;

            return {
                nombre: usuario.nombreCompleto,
                cedula: usuario.username,
                sucursal: usuario.sucursal?.nombre || 'S/N',
                diasTrabajados,
                tardanzas,
                puntualidad: diasTrabajados > 0 ? Math.round(((diasTrabajados - tardanzas) / diasTrabajados) * 100) : 100
            };
        });
    };

    const generarReporteDescuentos = (marcaciones, usuarios, sucursalId) => {
        let usuariosFiltrados = usuarios;
        if (sucursalId) {
            usuariosFiltrados = usuarios.filter(u => u.sucursalId === parseInt(sucursalId));
        }

        return usuariosFiltrados.map(usuario => {
            const marcacionesUsuario = marcaciones.filter(m => m.usuarioId === usuario.id && m.esTardia);
            const totalDescuentos = marcacionesUsuario.reduce((sum, m) => sum + (m.descuentoCalculado || 0), 0);
            const totalMinutosTarde = marcacionesUsuario.reduce((sum, m) => sum + (m.minutosTarde || 0), 0);

            return {
                nombre: usuario.nombreCompleto,
                cedula: usuario.username,
                sucursal: usuario.sucursal?.nombre || 'S/N',
                cantidadTardanzas: marcacionesUsuario.length,
                totalMinutos: totalMinutosTarde,
                totalDescuentos
            };
        }).filter(u => u.cantidadTardanzas > 0).sort((a, b) => b.totalDescuentos - a.totalDescuentos);
    };

    const generarReporteResumen = (marcaciones, usuarios, sucursalId) => {
        const sucursalesData = sucursalId
            ? sucursales.filter(s => s.id === parseInt(sucursalId))
            : sucursales;

        return sucursalesData.map(sucursal => {
            const usuariosSucursal = usuarios.filter(u => u.sucursalId === sucursal.id);
            const marcacionesSucursal = marcaciones.filter(m => {
                const usuario = usuarios.find(u => u.id === m.usuarioId);
                return usuario && usuario.sucursalId === sucursal.id;
            });

            const tardias = marcacionesSucursal.filter(m => m.esTardia);
            const totalDescuentos = tardias.reduce((sum, m) => sum + (m.descuentoCalculado || 0), 0);

            return {
                sucursal: sucursal.nombre,
                totalEmpleados: usuariosSucursal.length,
                totalMarcaciones: marcacionesSucursal.length,
                totalTardanzas: tardias.length,
                totalDescuentos
            };
        });
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const exportarPDF = () => {
        if (!reportData || reportData.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const reportElement = document.getElementById('report-content');
        const opt = {
            margin: [15, 10, 15, 10],
            filename: `COOP_REDUCTO_${reportType.toUpperCase()}_${dateRange.inicio}_${dateRange.fin}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(reportElement).save();
    };

    const getSucursalNombre = () => {
        if (!sucursalFiltro) return 'Todas las Sucursales';
        const suc = sucursales.find(s => s.id === parseInt(sucursalFiltro));
        return suc ? suc.nombre : 'Todas las Sucursales';
    };

    return (
        <div className="admin-content">
            <header className="content-header">
                <div className="header-title">
                    <h1>Centro de Reportes</h1>
                    <p>Generación de informes detallados para análisis y gestión</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={exportarPDF} disabled={!reportData || reportData.length === 0}>
                        <FileText size={18} /> Descargar PDF
                    </button>
                </div>
            </header>

            <div className="filters-bar" style={{ background: 'white', padding: '2rem', borderRadius: '24px', marginBottom: '3rem', border: '1px solid #f1f5f9', boxShadow: 'var(--admin-shadow-md)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--p-emerald-700)', marginBottom: '0.75rem' }}>Tipo de Reporte</label>
                        <div className="premium-input-group">
                            <FileText size={18} />
                            <select className="input" value={reportType} onChange={(e) => setReportType(e.target.value)} style={{ height: '48px', border: '1.5px solid #f1f5f9', background: '#f8fafc', fontWeight: '600' }}>
                                <option value="asistencia">Asistencia General</option>
                                <option value="descuentos">Descuentos por Tardanza</option>
                                <option value="resumen">Resumen por Sucursal</option>
                            </select>
                        </div>
                    </div>

                    {currentUser?.rol === 'ADMIN' && (
                        <div className="form-group">
                            <label style={{ display: 'block', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--p-emerald-700)', marginBottom: '0.75rem' }}>Sucursal</label>
                            <div className="premium-input-group">
                                <Building2 size={18} />
                                <select className="input" value={sucursalFiltro} onChange={(e) => setSucursalFiltro(e.target.value)} style={{ height: '48px', border: '1.5px solid #f1f5f9', background: '#f8fafc', fontWeight: '600' }}>
                                    <option value="">Todas las sedes</option>
                                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--p-emerald-700)', marginBottom: '0.75rem' }}>Fecha Inicio</label>
                        <div className="premium-input-group">
                            <Calendar size={18} />
                            <input type="date" className="input" value={dateRange.inicio} onChange={(e) => setDateRange({ ...dateRange, inicio: e.target.value })} style={{ height: '48px', border: '1.5px solid #f1f5f9', background: '#f8fafc', fontWeight: '600' }} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--p-emerald-700)', marginBottom: '0.75rem' }}>Fecha Fin</label>
                        <div className="premium-input-group">
                            <Calendar size={18} />
                            <input type="date" className="input" value={dateRange.fin} onChange={(e) => setDateRange({ ...dateRange, fin: e.target.value })} style={{ height: '48px', border: '1.5px solid #f1f5f9', background: '#f8fafc', fontWeight: '600' }} />
                        </div>
                    </div>
                </div>

                <button className="btn btn-primary" onClick={generarReporte} disabled={generatingReport} style={{ width: '100%', height: '54px', borderRadius: '16px', fontSize: '1rem' }}>
                    {generatingReport ? <><Loader2 size={20} className="animate-spin" /> Procesando datos...</> : <><TrendingUp size={20} /> Generar Informe Detallado</>}
                </button>
            </div>

            {/* Contenido del Reporte para PDF */}
            <div id="report-content" style={{ background: 'white', borderRadius: '16px', overflow: 'hidden' }}>
                {!reportData ? (
                    <div className="empty-state-large" style={{ padding: '4rem' }}>
                        <FileText size={64} />
                        <h3>Selecciona los filtros y genera un reporte</h3>
                        <p>Los datos aparecerán aquí listos para exportar</p>
                    </div>
                ) : reportData.length === 0 ? (
                    <div className="empty-state-large" style={{ padding: '4rem' }}>
                        <AlertTriangle size={64} style={{ color: '#f59e0b' }} />
                        <h3>No hay datos para el período seleccionado</h3>
                        <p>Intenta ajustar los filtros o el rango de fechas</p>
                    </div>
                ) : (
                    <>
                        {/* ENCABEZADO PROFESIONAL DEL REPORTE */}
                        <div style={{
                            background: 'linear-gradient(135deg, #166534 0%, #15803d 50%, #22c55e 100%)',
                            padding: '2rem',
                            color: 'white',
                            borderBottom: '4px solid #fbbf24'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <img
                                    src="/logo_cooperativa.png"
                                    alt="Logo Cooperativa Reducto"
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        border: '3px solid white',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                        background: 'white'
                                    }}
                                />
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '700', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                        COOPERATIVA REDUCTO LTDA.
                                    </h1>
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', opacity: 0.9 }}>
                                        de Microfinanza
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(255,255,255,0.15)',
                                padding: '1.25rem',
                                borderRadius: '12px',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
                                    📊 {reportTypeNames[reportType]}
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
                                    <div>
                                        <strong>Período:</strong><br />
                                        {formatDate(dateRange.inicio)} - {formatDate(dateRange.fin)}
                                    </div>
                                    <div>
                                        <strong>Sucursal:</strong><br />
                                        {getSucursalNombre()}
                                    </div>
                                    <div>
                                        <strong>Generado por:</strong><br />
                                        {currentUser?.nombreCompleto || 'Administrador'}
                                    </div>
                                    <div>
                                        <strong>Fecha y Hora:</strong><br />
                                        {reportGeneratedAt?.toLocaleString('es-PY', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CONTENIDO DE LA TABLA */}
                        <div style={{ padding: '1.5rem' }}>
                            {reportType === 'asistencia' && (
                                <table className="data-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Colaborador</th>
                                            <th>Cédula</th>
                                            <th>Sucursal</th>
                                            <th style={{ textAlign: 'center' }}>Días Trabajados</th>
                                            <th style={{ textAlign: 'center' }}>Tardanzas</th>
                                            <th style={{ textAlign: 'center' }}>Puntualidad</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((r, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: '600' }}>{r.nombre}</td>
                                                <td>{r.cedula}</td>
                                                <td>{r.sucursal}</td>
                                                <td style={{ textAlign: 'center' }}>{r.diasTrabajados}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {r.tardanzas > 0 ? (
                                                        <span style={{ background: '#fef2f2', color: '#dc2626', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: '600' }}>
                                                            {r.tardanzas}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span style={{
                                                        color: r.puntualidad >= 90 ? '#16a34a' : r.puntualidad >= 70 ? '#f59e0b' : '#dc2626',
                                                        fontWeight: '700',
                                                        fontSize: '1.1rem'
                                                    }}>
                                                        {r.puntualidad}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            {reportType === 'descuentos' && (
                                <table className="data-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Colaborador</th>
                                            <th>Cédula</th>
                                            <th>Sucursal</th>
                                            <th style={{ textAlign: 'center' }}>Tardanzas</th>
                                            <th style={{ textAlign: 'center' }}>Minutos Totales</th>
                                            <th style={{ textAlign: 'right' }}>Total Descuento</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((r, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: '600' }}>{r.nombre}</td>
                                                <td>{r.cedula}</td>
                                                <td>{r.sucursal}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span style={{ background: '#fef2f2', color: '#dc2626', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: '600' }}>
                                                        {r.cantidadTardanzas}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>{r.totalMinutos} min</td>
                                                <td style={{ textAlign: 'right', fontWeight: '700', color: '#dc2626', fontSize: '1.1rem' }}>
                                                    ₲ {r.totalDescuentos.toLocaleString('de-DE')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            {reportType === 'resumen' && (
                                <table className="data-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Sucursal</th>
                                            <th style={{ textAlign: 'center' }}>Total Empleados</th>
                                            <th style={{ textAlign: 'center' }}>Marcaciones</th>
                                            <th style={{ textAlign: 'center' }}>Tardanzas</th>
                                            <th style={{ textAlign: 'right' }}>Total Descuentos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((r, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: '600' }}>{r.sucursal}</td>
                                                <td style={{ textAlign: 'center' }}>{r.totalEmpleados}</td>
                                                <td style={{ textAlign: 'center' }}>{r.totalMarcaciones}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span style={{ background: '#fef2f2', color: '#dc2626', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: '600' }}>
                                                        {r.totalTardanzas}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: '700', color: '#dc2626', fontSize: '1.1rem' }}>
                                                    ₲ {r.totalDescuentos.toLocaleString('de-DE')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* PIE DEL REPORTE */}
                        <div style={{
                            background: '#f8fafc',
                            padding: '1rem 2rem',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.8rem',
                            color: '#64748b'
                        }}>
                            <div>
                                <strong>Sistema RelojReducto</strong> - Control de Asistencia
                            </div>
                            <div>
                                Documento generado automáticamente • {reportData.length} registro(s)
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ===========================================
// TURNOS
// ===========================================

function AdminTurnos() {
    const [turnos, setTurnos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedTurno, setSelectedTurno] = useState(null);
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        cargarTurnos();
    }, []);

    const cargarTurnos = async () => {
        try {
            setLoading(true);
            const data = await gestionService.getTurnos();
            setTurnos(data);
        } catch (err) {
            console.error('Error al cargar turnos:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (turnoData) => {
        try {
            if (selectedTurno) {
                await gestionService.updateTurno(selectedTurno.id, turnoData);
            } else {
                await gestionService.createTurno(turnoData);
            }
            setShowModal(false);
            cargarTurnos();
        } catch (err) {
            alert('Error al guardar turno: ' + (err.response?.data?.mensaje || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Desea desactivar este turno?')) return;
        try {
            await gestionService.deleteTurno(id);
            cargarTurnos();
        } catch (err) {
            alert('Error al desactivar turno: ' + (err.response?.data?.mensaje || err.message));
        }
    };

    const turnosFiltrados = turnos.filter(t =>
        t.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="admin-content">
            <header className="content-header">
                <div className="header-title">
                    <h1>Gestión de Turnos</h1>
                    <p>Configuración de horarios laborales y tolerancia</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setSelectedTurno(null); setShowModal(true); }}>
                    <Plus size={18} />
                    Crear Turno
                </button>
            </header>

            <div className="content-body">
                <div className="filters-bar">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar turno..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    {loading ? (
                        <div className="loading-state">
                            <Loader2 size={40} className="animate-spin" />
                            <p>Cargando turnos...</p>
                        </div>
                    ) : turnosFiltrados.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nombre del Turno</th>
                                    <th>Entrada</th>
                                    <th>Salida</th>
                                    <th>Tolerancia</th>
                                    <th>Días</th>
                                    <th>Estado</th>
                                    <th>Opciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {turnosFiltrados.map((turno) => (
                                    <tr key={turno.id}>
                                        <td><strong>{turno.nombre}</strong></td>
                                        <td><div className="time-badge"><Clock size={14} /> {turno.horaEntrada}</div></td>
                                        <td><div className="time-badge"><Clock size={14} /> {turno.horaSalida}</div></td>
                                        <td>{turno.toleranciaMinutos} min</td>
                                        <td>
                                            <div className="days-list">
                                                {turno.diasSemana?.split(',').map(d => (
                                                    <span key={d} className="day-pill">
                                                        {['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][parseInt(d)]}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${turno.activo ? 'success' : 'danger'}`}>
                                                {turno.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="action-btn" onClick={() => { setSelectedTurno(turno); setShowModal(true); }}>
                                                    <Edit size={16} />
                                                </button>
                                                <button className="action-btn danger" onClick={() => handleDelete(turno.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state-premium">
                            <div className="icon-wrapper icon-float">
                                <CalendarDays size={48} />
                            </div>
                            <h3>No se encontraron turnos</h3>
                            <p>Comienza creando un nuevo horario laboral para tus colaboradores.</p>
                            <button className="btn btn-primary" onClick={() => { setSelectedTurno(null); setShowModal(true); }}>
                                <Plus size={18} /> Crear Primer Turno
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <TurnoModal
                    turno={selectedTurno}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}

function TurnoModal({ turno, onClose, onSave }) {
    const [formData, setFormData] = useState({
        nombre: turno?.nombre || '',
        horaEntrada: turno?.horaEntrada || '08:00',
        horaSalida: turno?.horaSalida || '17:00',
        toleranciaMinutos: turno?.toleranciaMinutos || 10,
        diasSemana: turno?.diasSemana || '1,2,3,4,5',
        activo: turno?.activo ?? true
    });

    const dias = [
        { id: '1', label: 'Lun' },
        { id: '2', label: 'Mar' },
        { id: '3', label: 'Mié' },
        { id: '4', label: 'Jue' },
        { id: '5', label: 'Vie' },
        { id: '6', label: 'Sáb' },
        { id: '7', label: 'Dom' }
    ];

    const toggleDia = (id) => {
        let currentDias = formData.diasSemana.split(',').filter(d => d !== '');
        if (currentDias.includes(id)) {
            currentDias = currentDias.filter(d => d !== id);
        } else {
            currentDias.push(id);
        }
        setFormData({ ...formData, diasSemana: currentDias.sort().join(',') });
    };

    return (
        <div className="modal-overlay-premium" onClick={onClose}>
            <div className="premium-modal animate-slideUp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                <div className="modal-header" style={{ padding: '2rem 2.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--p-emerald-900)', margin: 0 }}>
                            {turno ? 'Editar Turno' : 'Crear Nuevo Turno'}
                        </h2>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>
                            Define los parámetros de horario y tolerancia
                        </p>
                    </div>
                    <button className="action-btn" onClick={onClose} style={{ background: '#f8fafc' }}><X size={20} /></button>
                </div>

                <div className="modal-body" style={{ padding: '2.5rem' }}>
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--p-emerald-700)', marginBottom: '0.75rem' }}>
                            Nombre del Turno
                        </label>
                        <div className="premium-input-group">
                            <CalendarDays size={20} />
                            <input
                                type="text"
                                className="input"
                                placeholder="Ej: Mañana (Oficina), Guardia Noche..."
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                style={{ height: '52px', fontSize: '1rem', borderRadius: '14px' }}
                            />
                        </div>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--p-emerald-700)', marginBottom: '0.75rem' }}>
                                Hora Entrada
                            </label>
                            <div className="premium-input-group">
                                <Clock size={20} />
                                <input
                                    type="time"
                                    className="input"
                                    value={formData.horaEntrada}
                                    onChange={(e) => setFormData({ ...formData, horaEntrada: e.target.value })}
                                    style={{ height: '52px', borderRadius: '14px' }}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--p-emerald-700)', marginBottom: '0.75rem' }}>
                                Hora Salida
                            </label>
                            <div className="premium-input-group">
                                <Clock size={20} />
                                <input
                                    type="time"
                                    className="input"
                                    value={formData.horaSalida}
                                    onChange={(e) => setFormData({ ...formData, horaSalida: e.target.value })}
                                    style={{ height: '52px', borderRadius: '14px' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--p-emerald-700)', marginBottom: '0.75rem' }}>
                            Tolerancia (Minutos)
                        </label>
                        <div className="premium-input-group">
                            <Timer size={20} />
                            <input
                                type="number"
                                className="input"
                                min="0"
                                max="59"
                                value={formData.toleranciaMinutos}
                                onChange={(e) => setFormData({ ...formData, toleranciaMinutos: parseInt(e.target.value) })}
                                style={{ height: '52px', borderRadius: '14px' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--p-emerald-700)', marginBottom: '1rem' }}>
                            Días Laborales
                        </label>
                        <div className="days-selector-v2">
                            {dias.map(dia => (
                                <div
                                    key={dia.id}
                                    className={`day-chip ${formData.diasSemana.split(',').includes(dia.id) ? 'active' : ''}`}
                                    onClick={() => toggleDia(dia.id)}
                                >
                                    {dia.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal-footer" style={{ padding: '2rem 2.5rem', background: '#f8fafc', display: 'flex', gap: '1rem', borderTop: '1px solid #f1f5f9' }}>
                    <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1, height: '52px', background: 'white', border: '2px solid #e2e8f0', color: '#64748b' }}>
                        Cancelar
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => onSave(formData)}
                        disabled={!formData.nombre}
                        style={{ flex: 1, height: '52px', borderRadius: '16px', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }}
                    >
                        <Plus size={20} />
                        {turno ? 'Actualizar Turno' : 'Guardar Turno'}
                    </button>
                </div>
            </div>
        </div>
    );
}


// ===========================================
// PERMISOS / AUSENCIAS
// ===========================================

function AdminPermisos() {
    const [permisos, setPermisos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedPermiso, setSelectedPermiso] = useState(null);
    const [comentario, setComentario] = useState('');

    useEffect(() => {
        cargarPermisos();
    }, [filtroEstado]);

    const cargarPermisos = async () => {
        try {
            setLoading(true);
            const data = await gestionService.getPermisos(filtroEstado);
            setPermisos(data);
        } catch (err) {
            console.error('Error al cargar permisos:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAprobar = async (id) => {
        if (!confirm('¿Aprobar esta solicitud de permiso?')) return;
        try {
            await gestionService.aprobarPermiso(id, comentario);
            setComentario('');
            setShowModal(false);
            cargarPermisos();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleRechazar = async (id) => {
        if (!confirm('¿Rechazar esta solicitud de permiso?')) return;
        try {
            await gestionService.rechazarPermiso(id, comentario);
            setComentario('');
            setShowModal(false);
            cargarPermisos();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    return (
        <div className="admin-content">
            <header className="content-header">
                <div className="header-title">
                    <h1>Gestión de Permisos</h1>
                    <p>Revision y aprobación de solicitudes de colaboradores</p>
                </div>
            </header>

            <div className="content-body">
                <div className="filters-bar" style={{ background: 'white', padding: '1rem', borderRadius: '18px', border: '1px solid #f1f5f9', marginBottom: '2.5rem' }}>
                    <div className="filter-group" style={{ flex: 1 }}>
                        <div className="premium-input-group">
                            <Filter size={18} />
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                style={{ height: '48px', border: '1.5px solid #f1f5f9', background: '#f8fafc', fontWeight: '600' }}
                            >
                                <option value="">Todos los registros</option>
                                <option value="PENDIENTE">⏳ Pendientes de Revisión</option>
                                <option value="APROBADO">✅ Solicitudes Aprobadas</option>
                                <option value="RECHAZADO">❌ Solicitudes Rechazadas</option>
                            </select>
                        </div>
                    </div>
                    <button className="btn btn-secondary" onClick={cargarPermisos} style={{ height: '48px', width: '48px', padding: 0, justifyContent: 'center' }}>
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="table-container">
                    {loading ? (
                        <div className="loading-state" style={{ padding: '6rem' }}>
                            <Loader2 size={48} className="animate-spin" style={{ color: 'var(--p-emerald-500)' }} />
                            <p style={{ marginTop: '1.5rem', fontWeight: '600', color: 'var(--admin-text-secondary)' }}>Actualizando registros...</p>
                        </div>
                    ) : permisos.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Colaborador</th>
                                    <th>Tipo de Permiso</th>
                                    <th>Periodo (Desde - Hasta)</th>
                                    <th>Estado Actual</th>
                                    <th style={{ textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {permisos.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar-small">{p.nombreUsuario?.charAt(0)}</div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <strong style={{ color: 'var(--p-emerald-900)' }}>{p.nombreUsuario}</strong>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>CI: {p.username}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '0.5rem 1rem',
                                                background: '#f1f5f9',
                                                borderRadius: '12px',
                                                fontSize: '0.8rem',
                                                fontWeight: '700',
                                                color: '#475569'
                                            }}>
                                                {p.tipo}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--admin-text-secondary)' }}>
                                                <Calendar size={14} />
                                                <span style={{ fontWeight: '600' }}>{new Date(p.fechaInicio).toLocaleDateString()}</span>
                                                <span style={{ opacity: 0.5 }}>→</span>
                                                <span style={{ fontWeight: '600' }}>{new Date(p.fechaFin).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${p.estado === 'APROBADO' ? 'presente' : p.estado === 'PENDIENTE' ? 'tardanza' : 'ausente'}`} style={{ minWidth: '100px', justifyContent: 'center' }}>
                                                {p.estado === 'PENDIENTE' ? '🟡 Pendiente' : p.estado === 'APROBADO' ? '🟢 Aprobado' : '🔴 Rechazado'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                className="action-btn"
                                                onClick={() => { setSelectedPermiso(p); setShowModal(true); setComentario(p.comentarioAprobacion || ''); }}
                                                style={{ margin: '0 auto', background: 'var(--p-emerald-50)', color: 'var(--p-emerald-600)' }}
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state-premium">
                            <div className="icon-wrapper icon-float">
                                <FileText size={48} />
                            </div>
                            <h3>Sin solicitudes pendientes</h3>
                            <p>No se encontraron registros que coincidan con el filtro seleccionado.</p>
                        </div>
                    )}
                </div>
            </div>

            {showModal && selectedPermiso && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2>Detalle de Solicitud de Permiso</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X /></button>
                        </div>
                        <div className="modal-body">
                            <div className="permiso-detail-grid">
                                <div className="detail-item">
                                    <label>Colaborador</label>
                                    <p>{selectedPermiso.nombreUsuario}</p>
                                </div>
                                <div className="detail-item">
                                    <label>Tipo de Permiso</label>
                                    <p>{selectedPermiso.tipo}</p>
                                </div>
                                <div className="detail-item">
                                    <label>Periodo</label>
                                    <p>Desde: {new Date(selectedPermiso.fechaInicio).toLocaleDateString()}</p>
                                    <p>Hasta: {new Date(selectedPermiso.fechaFin).toLocaleDateString()}</p>
                                </div>
                                <div className="detail-item">
                                    <label>Motivo / Justificación</label>
                                    <p className="reason-text">{selectedPermiso.motivo}</p>
                                </div>
                            </div>

                            {selectedPermiso.estado === 'PENDIENTE' ? (
                                <div className="approval-section">
                                    <label>Comentario de Respuesta</label>
                                    <textarea
                                        placeholder="Escriba un comentario para el colaborador (opcional)..."
                                        value={comentario}
                                        onChange={(e) => setComentario(e.target.value)}
                                        rows={3}
                                    />
                                    <div className="approval-actions">
                                        <button className="btn btn-danger" onClick={() => handleRechazar(selectedPermiso.id)}>
                                            <X size={18} /> Rechazar
                                        </button>
                                        <button className="btn btn-success" onClick={() => handleAprobar(selectedPermiso.id)}>
                                            <CheckCircle2 size={18} /> Aprobar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="resolution-detail">
                                    <label>Resolución</label>
                                    <div className={`status-box ${selectedPermiso.estado.toLowerCase()}`}>
                                        <p><strong>Estado:</strong> {selectedPermiso.estado}</p>
                                        <p><strong>Resuelto por:</strong> {selectedPermiso.nombreAprobador || 'Sistema'}</p>
                                        <p><strong>Fecha:</strong> {selectedPermiso.fechaResolucion ? new Date(selectedPermiso.fechaResolucion).toLocaleString() : 'N/A'}</p>
                                        {selectedPermiso.comentarioAprobacion && (
                                            <p><strong>Comentario:</strong> {selectedPermiso.comentarioAprobacion}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ===========================================
// CONFIGURACIÓN (TABS)
// ===========================================

function AdminConfiguracion() {
    const tabs = [
        { id: 'colaboradores', label: 'Configuraciones de Colaboradores', icon: Users },
        { id: 'pagos', label: 'Pagos', icon: DollarSign },
        { id: 'marcacion', label: 'Marcación', icon: MapPin },
        { id: 'localidades', label: 'Localidades', icon: Building2 },
        { id: 'feriados', label: 'Feriados', icon: Calendar },
        { id: 'vacaciones', label: 'Vacaciones', icon: FileText },
        { id: 'desarrollo', label: 'Herramientas de Desarrollo', icon: ShieldAlert }
    ];

    return (
        <div className="admin-content">
            <header className="config-header">
                <nav className="config-tabs">
                    {tabs.map(tab => (
                        <NavLink
                            key={tab.id}
                            to={`/admin/configuracion/${tab.id}`}
                            className={({ isActive }) => `config-tab-item ${isActive ? 'active' : ''}`}
                        >
                            <tab.icon size={16} />
                            <span>{tab.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </header>

            <div className="config-content">
                <Routes>
                    <Route index element={<Navigate to="localidades" replace />} />
                    <Route path="localidades" element={<AdminSucursales />} />
                    <Route path="feriados" element={<AdminFeriados />} />
                    <Route path="marcacion" element={<AdminConfigMarcacion />} />

                    <Route path="desarrollo" element={<AdminDesarrollo />} />
                    <Route path="*" element={<div className="empty-state-large"><h3>Módulo en desarrollo</h3><p>Esta sección estará disponible pronto</p></div>} />
                </Routes>
            </div>
        </div>
    );
}

function AdminConfigMarcacion() {
    return (
        <div className="marcacion-config">
            <div className="config-card-header">
                <h3>Configuración padrón de marcación</h3>
                <button className="btn btn-primary">+ Crear configuración</button>
            </div>
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th className="text-center">Geolocalización y FaceID</th>
                            <th className="text-center">Solo Geolocalización</th>
                            <th className="text-center">Historial</th>
                            <th>Opciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Configuración General</strong></td>
                            <td className="text-center"><span className="badge danger">No</span></td>
                            <td className="text-center"><span className="badge success">Sí</span></td>
                            <td className="text-center"><span className="badge success">Sí</span></td>
                            <td><button className="action-btn"><Edit size={16} /></button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AdminDesarrollo() {
    const [loading, setLoading] = useState(false);

    const handleResetMarcaciones = async () => {
        if (!window.confirm("⚠️ ¿ESTÁS SEGURO?\n\nEsta acción eliminará ABSOLUTAMENTE TODAS las marcaciones registradas en el sistema (entradas y salidas de todos los trabajadores).\n\nEsta acción no se puede deshacer.")) {
            return;
        }

        setLoading(true);
        try {
            await adminService.resetMarcaciones();
            alert("✅ Todas las marcaciones han sido eliminadas correctamente.");
        } catch (error) {
            console.error("Error al resetear marcaciones:", error);
            alert("❌ Error al eliminar marcaciones: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dev-tools">
            <div className="dev-card danger-card">
                <div className="dev-card-info">
                    <h3>Resetear Base de Datos de Marcación</h3>
                    <p>Elimina permanentemente todas las entradas y salidas registradas. Útil para limpiar datos de prueba antes de pasar a producción o reiniciar pruebas.</p>
                </div>
                <button
                    className="btn btn-danger"
                    onClick={handleResetMarcaciones}
                    disabled={loading}
                    style={{ minWidth: '200px' }}
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    {loading ? 'Borrando...' : 'Resetear Marcaciones'}
                </button>
            </div>

            <div className="dev-card warning-card">
                <div className="dev-card-info">
                    <h3>Resetear Mi Perfil (Onboarding)</h3>
                    <p>Borra tu foto de perfil y datos corporativos para volver a probar el flujo de captura de rostro y registro inicial.</p>
                </div>
                <button
                    className="btn btn-warning"
                    onClick={async () => {
                        if (!confirm("¿Resetear TU perfil para probar el onboarding de nuevo?")) return;
                        try {
                            const user = authService.getUsuarioActual();
                            await adminService.resetPerfil(user.id);
                            alert("Perfil reseteado. La página se recargará.");
                            window.location.reload();
                        } catch (e) {
                            alert("Error: " + e.message);
                        }
                    }}
                >
                    <RefreshCw size={18} />
                    Resetear Mi Onboarding
                </button>
            </div>

            <div className="dev-card danger-card">
                <div className="dev-card-info">
                    <h3>Resetear TODOS los Perfiles (Global)</h3>
                    <p>Borra la foto y datos corporativos de TODOS los usuarios registrados en la base de datos. Usar con extrema precaución.</p>
                </div>
                <button
                    className="btn btn-danger"
                    onClick={async () => {
                        if (!confirm("⚠️ ¿ESTÁS SEGURO?\n\nEsta acción borrará las fotos y datos de onboarding de TODOS los usuarios del sistema.\n\nEs irreversible.")) return;
                        try {
                            setLoading(true);
                            await adminService.resetAllProfiles();
                            alert("✅ Se han reseteado los perfiles de todos los usuarios.");
                        } catch (e) {
                            alert("Error: " + e.message);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                >
                    <UserX size={18} />
                    Resetear TODO (Global)
                </button>
            </div>

            <div className="dev-card info-card">
                <div className="dev-card-info">
                    <h3>Modo de Desarrollo Activo</h3>
                    <p>Estás visualizando herramientas avanzadas de administración de datos. Procede con precaución.</p>
                </div>
                <div className="badge warning">ENTORNO DE PRUEBAS</div>
            </div>
        </div>
    );
}

// ===========================================
// FERIADOS
// ===========================================

function AdminFeriados() {
    const [feriados, setFeriados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedFeriado, setSelectedFeriado] = useState(null);
    const [anio, setAnio] = useState(new Date().getFullYear());

    useEffect(() => {
        cargarFeriados();
    }, [anio]);

    const cargarFeriados = async () => {
        try {
            setLoading(true);
            const data = await gestionService.getFeriados(anio);
            setFeriados(data);
        } catch (err) {
            console.error('Error al cargar feriados:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (feriadoData) => {
        try {
            if (selectedFeriado) {
                await gestionService.updateFeriado(selectedFeriado.id, feriadoData);
            } else {
                await gestionService.createFeriado(feriadoData);
            }
            setShowModal(false);
            cargarFeriados();
        } catch (err) {
            alert('Error al guardar feriado: ' + (err.response?.data?.mensaje || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este feriado?')) return;
        try {
            await gestionService.deleteFeriado(id);
            cargarFeriados();
        } catch (err) {
            alert('Error al eliminar feriado');
        }
    };

    return (
        <div className="admin-content">
            <header className="content-header" style={{ padding: '0 0 1.5rem 0' }}>
                <div className="header-title">
                    <h3>Calendario de Feriados</h3>
                    <p>Días no laborables registrados para el cálculo de asistencia</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setSelectedFeriado(null); setShowModal(true); }}>
                    <Plus size={18} />
                    Agregar Feriado
                </button>
            </header>

            <div className="filters-bar" style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ fontWeight: '700', color: '#475569' }}>Año Fiscal:</label>
                    <div className="premium-input-group" style={{ width: '150px' }}>
                        <Calendar size={18} />
                        <select
                            value={anio}
                            onChange={(e) => setAnio(parseInt(e.target.value))}
                            style={{ width: '100%', height: '42px', paddingLeft: '2.5rem', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', fontWeight: '600', color: '#0f172a' }}
                        >
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-container">
                {loading ? (
                    <div className="loading-state">
                        <Loader2 size={40} className="animate-spin" />
                    </div>
                ) : feriados.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Descripción</th>
                                <th>Tipo de Feriado</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feriados.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).map((f) => (
                                <tr key={f.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ padding: '6px', background: '#ecfdf5', borderRadius: '8px', color: '#059669' }}>
                                                <Calendar size={16} />
                                            </div>
                                            <strong>{new Date(f.fecha).toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                                        </div>
                                    </td>
                                    <td>{f.descripcion}</td>
                                    <td>
                                        <span className={`badge ${f.esIrrenunciable ? 'danger' : 'info'}`} style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                                            {f.esIrrenunciable ? '⚡ IRRENUNCIABLE' : '🔷 NACIONAL'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                            <button className="action-btn" onClick={() => { setSelectedFeriado(f); setShowModal(true); }}>
                                                <Edit size={16} />
                                            </button>
                                            <button className="action-btn danger" onClick={() => handleDelete(f.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state-premium">
                        <div className="icon-wrapper icon-float">
                            <Calendar size={48} />
                        </div>
                        <h3>Sin Feriados Registrados</h3>
                        <p>No se encontraron días feriados para el año {anio}.</p>
                    </div>
                )}
            </div>

            {showModal && (
                <FeriadoModal
                    feriado={selectedFeriado}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}

function FeriadoModal({ feriado, onClose, onSave }) {
    const [formData, setFormData] = useState({
        descripcion: feriado?.descripcion || '',
        fecha: feriado?.fecha || new Date().toISOString().split('T')[0],
        esIrrenunciable: feriado?.esIrrenunciable || false
    });

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-slideUp" style={{ maxWidth: '450px', borderRadius: '24px', padding: '0', border: '1px solid #f1f5f9' }}>
                <div className="modal-header" style={{ borderBottom: '1px solid #f1f5f9', padding: '1.5rem', background: '#f8fafc', borderRadius: '24px 24px 0 0' }}>
                    <h2 style={{ fontSize: '1.25rem', color: '#0f172a' }}>{feriado ? 'Editar Feriado' : 'Nuevo Feriado'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body" style={{ padding: '2rem' }}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'block' }}>DESCRIPCIÓN</label>
                        <div className="premium-input-group">
                            <FileText size={18} />
                            <input
                                type="text"
                                style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem' }}
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                placeholder="Ej: Día de la Independencia"
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'block' }}>FECHA</label>
                        <div className="premium-input-group">
                            <Calendar size={18} />
                            <input
                                type="date"
                                style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem' }}
                                value={formData.fecha}
                                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                        <label className="toggle-switch" style={{ width: '100%', justifyContent: 'space-between' }}>
                            <div className="toggle-label">
                                <span className="toggle-main-text" style={{ fontSize: '0.9rem' }}>Feriado Irrenunciable</span>
                                <span className="toggle-sub-text">Cierre obligatorio de sucursal</span>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.esIrrenunciable}
                                    onChange={(e) => setFormData({ ...formData, esIrrenunciable: e.target.checked })}
                                />
                                <div className="toggle-slider"></div>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="modal-footer" style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" onClick={onClose} style={{ color: '#64748b', fontWeight: '600' }}>Cancelar</button>
                    <button
                        className="btn btn-primary"
                        onClick={() => onSave(formData)}
                        disabled={!formData.descripcion}
                        style={{ padding: '10px 24px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                    >
                        Guardar Feriado
                    </button>
                </div>
            </div>
        </div>
    );
}


// ===========================================
// GESTIÓN DE SUCURSALES
// ===========================================

function AdminSucursales() {
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedSucursal, setSelectedSucursal] = useState(null);
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        cargarSucursales();
    }, []);

    const cargarSucursales = async () => {
        try {
            setLoading(true);
            const [data, users] = await Promise.all([
                sucursalService.getSucursales(),
                adminService.getUsuarios()
            ]);

            // Adjuntar contador de empleados a cada sucursal
            const sucursalesConStats = data.map(s => ({
                ...s,
                workerCount: users.filter(u => u.sucursalId === s.id && u.rol === 'EMPLEADO').length
            }));

            setSucursales(sucursalesConStats);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        setShowModal(false);
        cargarSucursales();
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Está seguro de eliminar esta sucursal?')) return;
        try {
            await sucursalService.deleteSucursal(id);
            cargarSucursales();
        } catch (err) {
            alert('Error al eliminar sucursal: ' + (err.response?.data?.error || err.message));
        }
    };

    const sucursalesFiltradas = sucursales.filter(s =>
        s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.direccion?.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="config-pane">
            <div className="pane-header">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar localidad..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setSelectedSucursal(null);
                        setShowModal(true);
                    }}
                >
                    <Plus size={18} />
                    Crear localidad
                </button>
            </div>

            {loading ? (
                <div className="admin-loading">
                    <Loader2 size={32} className="animate-spin" />
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table config-table">
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Descripción</th>
                                <th>Radio de Cobertura</th>
                                <th>Latitud</th>
                                <th>Longitud</th>
                                <th>Opciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sucursalesFiltradas.map(s => (
                                <tr key={s.id}>
                                    <td><strong>{s.nombre}</strong></td>
                                    <td>{s.direccion || '-'}</td>
                                    <td>{s.radioGeocerca} m</td>
                                    <td className="coord-cell text-success">{s.latitud?.toFixed(10)}</td>
                                    <td className="coord-cell text-success">{s.longitud?.toFixed(10)}</td>
                                    <td>
                                        <div className="actions-cell">
                                            <button
                                                className="action-btn"
                                                onClick={() => {
                                                    setSelectedSucursal(s);
                                                    setShowModal(true);
                                                }}
                                            >
                                                <Edit size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <SucursalModal
                    sucursal={selectedSucursal}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}

function SucursalModal({ sucursal, onClose, onSave }) {
    const [formData, setFormData] = useState({
        nombre: sucursal?.nombre || '',
        direccion: sucursal?.direccion || '',
        latitud: sucursal?.latitud || -25.3333,
        longitud: sucursal?.longitud || -57.5333,
        radioGeocerca: sucursal?.radioGeocerca || 100
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (sucursal) {
                await sucursalService.updateSucursal(sucursal.id, formData);
            } else {
                await sucursalService.createSucursal(formData);
            }
            onSave();
        } catch (err) {
            alert('Error al guardar sucursal');
        } finally {
            setLoading(false);
        }
    };



    // Función de alta precisión para procesar input de Google Maps
    const handleGoogleMapsUrl = (e) => {
        let input = e.target.value;
        if (!input) return;

        let lat = null;
        let lng = null;

        console.log("Procesando entrada de mapa...");

        // 1. Si es un Iframe, extraer el contenido del src
        if (input.includes('<iframe')) {
            const srcMatch = input.match(/src="([^"]+)"/);
            if (srcMatch) input = srcMatch[1];
        }

        // 2. PRIORIDAD 1: Buscar patrón !3d (Lat) seguido de !4d (Long) 
        // Este patrón representa el PIN exacto en Google Maps (más preciso que !1d/!2d)
        const pinMatch = input.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);

        // 3. PRIORIDAD 2: Buscar patrón de URL de navegador @lat,long
        const browserMatch = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

        // 4. PRIORIDAD 3: Buscar patrón !2d (Long) !3d (Lat) de vista embebida
        const embedMatch = input.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/);

        if (pinMatch) {
            lat = parseFloat(pinMatch[1]);
            lng = parseFloat(pinMatch[2]);
            console.log("Ubicación exacta del PIN detectada:", lat, lng);
        } else if (browserMatch) {
            lat = parseFloat(browserMatch[1]);
            lng = parseFloat(browserMatch[2]);
            console.log("Ubicación de cámara de navegador detectada:", lat, lng);
        } else if (embedMatch) {
            lng = parseFloat(embedMatch[1]);
            lat = parseFloat(embedMatch[2]);
            console.log("Ubicación de centro de mapa detectada:", lat, lng);
        }

        // Aplicar coordenadas si se encontraron
        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
            setFormData(prev => ({
                ...prev,
                latitud: lat,
                longitud: lng
            }));
        } else {
            console.warn("No se pudo extraer una ubicación precisa del texto ingresado.");
        }
    };

    function LocationPicker() {
        useMapEvents({
            click(e) {
                setFormData(prev => ({
                    ...prev,
                    latitud: e.latlng.lat,
                    longitud: e.latlng.lng
                }));
            },
        });

        if (!formData.latitud) return null;

        return (
            <Marker
                position={[formData.latitud, formData.longitud]}
                icon={greenIcon}
                eventHandlers={{
                    add: (e) => e.target.openPopup()
                }}
            >
                <Popup>
                    <div className="map-popup-premium">
                        <div className="popup-branch-name">{formData.nombre || 'Nueva Sucursal'}</div>
                        <div className="popup-stats">
                            <span className="worker-count-badge">
                                <Users size={14} /> {sucursal?.workerCount || 0} trabajadores
                            </span>
                        </div>
                    </div>
                </Popup>
            </Marker>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content side-modal animate-slideInRight" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><ChevronRight size={20} /> {sucursal ? 'Editar' : 'Nueva'} localidad</h2>
                    <div className="modal-header-actions">
                        <button className="btn btn-secondary btn-sm">Duplicar</button>
                        <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading}>
                            {loading ? '...' : 'Actualizar'}
                        </button>
                    </div>
                </div>

                <div className="modal-body nano-scroll">
                    <section className="form-section">
                        <h4>Informaciones del Local</h4>
                        <div className="form-group">
                            <label>Nombre del Local</label>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Descripción</label>
                            <input
                                type="text"
                                value={formData.direccion}
                                onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="flex items-center gap-2">
                                <MapIcon size={14} /> Link de Google Maps
                            </label>
                            <input
                                type="text"
                                placeholder="Pega aquí el enlace (ej: google.com/maps/...)"
                                onChange={handleGoogleMapsUrl}
                                className="input-with-icon"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Latitud</label>
                                <input
                                    type="text"
                                    value={formData.latitud}
                                    onChange={e => setFormData({ ...formData, latitud: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Longitud</label>
                                <input
                                    type="text"
                                    value={formData.longitud}
                                    onChange={e => setFormData({ ...formData, longitud: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Radio de Marcación</label>
                            <input
                                type="number"
                                value={formData.radioGeocerca}
                                onChange={e => setFormData({ ...formData, radioGeocerca: parseInt(e.target.value) })}
                            />
                        </div>
                    </section>

                    <section className="map-section">
                        <p className="help-text">Clicka en el mapa para seleccionar la ubicación</p>
                        <div className="map-picker-container">
                            <MapContainer
                                center={[formData.latitud, formData.longitud]}
                                zoom={16}
                                style={{ height: '300px', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                                    attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                                />
                                <LocationPicker />
                                {formData.latitud && (
                                    <Circle
                                        center={[formData.latitud, formData.longitud]}
                                        pathOptions={{ fillColor: '#10b981', color: '#10b981', fillOpacity: 0.2 }}
                                        radius={formData.radioGeocerca || 100}
                                    />
                                )}
                            </MapContainer>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

// ===========================================
// PRE-MARCACIONES (GEOFENCE) - SOLO ADMIN
// ===========================================

function AdminPreMarcaciones() {
    const [preMarcaciones, setPreMarcaciones] = useState([]);
    const [marcaciones, setMarcaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fechaInicio, setFechaInicio] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });
    const [fechaFin, setFechaFin] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });
    const [filtro, setFiltro] = useState('');

    useEffect(() => {
        cargarDatos();
    }, [fechaInicio, fechaFin]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [preMarcs, marcs] = await Promise.all([
                preMarcacionService.getByRango(fechaInicio, fechaFin),
                adminService.getMarcacionesByRango(fechaInicio, fechaFin)
            ]);
            setPreMarcaciones(preMarcs);
            setMarcaciones(marcs);
        } catch (error) {
            console.error('Error cargando pre-marcaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    // Agrupar por usuario: pre-marcación vs marcación oficial
    const getComparacion = () => {
        const usuarios = {};

        // Agrupar pre-marcaciones por usuario+fecha
        preMarcaciones.forEach(pm => {
            const fecha = pm.fechaHoraDeteccion?.split('T')[0];
            const key = `${pm.usuarioId}-${fecha}`;
            if (!usuarios[key] || pm.fechaHoraDeteccion < usuarios[key].preMarcacion) {
                usuarios[key] = {
                    ...usuarios[key],
                    usuarioId: pm.usuarioId,
                    nombre: pm.nombreUsuario,
                    sucursal: pm.nombreSucursal,
                    fecha,
                    preMarcacion: pm.fechaHoraDeteccion,
                    distanciaMetros: pm.distanciaMetros,
                    precisionGps: pm.precisionGps,
                };
            }
        });

        // Asociar marcaciones oficiales
        marcaciones.forEach(m => {
            if (m.tipo !== 'ENTRADA') return;
            const fecha = m.fechaHora?.split('T')[0];
            const key = `${m.usuarioId}-${fecha}`;
            if (usuarios[key]) {
                if (!usuarios[key].marcacionOficial || m.fechaHora < usuarios[key].marcacionOficial) {
                    usuarios[key].marcacionOficial = m.fechaHora;
                    usuarios[key].esTardia = m.esTardia;
                    usuarios[key].minutosTarde = m.minutosTarde;
                }
            } else {
                // Tiene marcación pero no pre-marcación
                usuarios[key] = {
                    usuarioId: m.usuarioId,
                    nombre: m.nombreCompleto || m.nombreUsuario || 'Sin nombre',
                    fecha,
                    preMarcacion: null,
                    marcacionOficial: m.fechaHora,
                    esTardia: m.esTardia,
                    minutosTarde: m.minutosTarde,
                };
            }
        });

        let result = Object.values(usuarios).sort((a, b) => {
            if (a.fecha !== b.fecha) return b.fecha?.localeCompare(a.fecha);
            return (a.nombre || '').localeCompare(b.nombre || '');
        });

        if (filtro) {
            result = result.filter(r =>
                r.nombre?.toLowerCase().includes(filtro.toLowerCase())
            );
        }

        return result;
    };

    const formatTime = (isoString) => {
        if (!isoString) return '—';
        return new Date(isoString).toLocaleTimeString('es-PY', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getDiferencia = (pre, oficial) => {
        if (!pre || !oficial) return null;
        const diffMs = new Date(oficial) - new Date(pre);
        const diffMin = Math.round(diffMs / 60000);
        return diffMin;
    };

    const comparacion = getComparacion();
    const conDiscrepancia = comparacion.filter(c => {
        const diff = getDiferencia(c.preMarcacion, c.marcacionOficial);
        return diff !== null && diff > 10;
    });

    return (
        <div className="admin-content">
            <header className="content-header">
                <div className="header-title">
                    <h1><Radar size={28} style={{ marginRight: 10, color: '#10b981', verticalAlign: 'middle' }} /> Pre-Marcaciones por Geofence</h1>
                    <p>Detección automática de llegada — Comparación con marcación oficial</p>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="p-stat-card blue">
                    <div className="p-stat-header">
                        <div className="p-stat-icon blue"><Radar size={22} /></div>
                        <div className="p-stat-info">
                            <span className="p-stat-label">Pre-Marcaciones</span>
                            <span className="p-stat-value">{preMarcaciones.length}</span>
                        </div>
                    </div>
                </div>
                <div className="p-stat-card purple">
                    <div className="p-stat-header">
                        <div className="p-stat-icon purple"><Clock size={22} /></div>
                        <div className="p-stat-info">
                            <span className="p-stat-label">Marcaciones Oficiales</span>
                            <span className="p-stat-value">{marcaciones.filter(m => m.tipo === 'ENTRADA').length}</span>
                        </div>
                    </div>
                </div>
                <div className="p-stat-card pink">
                    <div className="p-stat-header">
                        <div className="p-stat-icon pink"><AlertTriangle size={22} /></div>
                        <div className="p-stat-info">
                            <span className="p-stat-label">Discrepancias (&gt;10min)</span>
                            <span className="p-stat-value">{conDiscrepancia.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="p-chart-card" style={{ marginBottom: '2rem' }}>
                <div className="p-chart-header">
                    <h3>Filtros</h3>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1rem' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }}>Desde</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }}>Hasta</label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }}>Buscar colaborador</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Nombre del colaborador..."
                                value={filtro}
                                onChange={(e) => setFiltro(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                            />
                        </div>
                    </div>
                    <div style={{ alignSelf: 'flex-end' }}>
                        <button onClick={cargarDatos} className="btn-premium" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem' }}>
                            <RefreshCw size={16} /> Actualizar
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabla de comparación */}
            <div className="p-chart-card">
                <div className="p-chart-header">
                    <h3>📊 Comparación: Llegada Real vs Marcación Oficial</h3>
                </div>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <Loader2 size={32} className="animate-spin" />
                    </div>
                ) : comparacion.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        <Radar size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                        <p>Sin pre-marcaciones para el rango seleccionado</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="premium-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Colaborador</th>
                                    <th>Fecha</th>
                                    <th>Sucursal</th>
                                    <th style={{ color: '#10b981' }}>📍 Llegada Real</th>
                                    <th style={{ color: '#3b82f6' }}>⏱️ Marcación Oficial</th>
                                    <th>Diferencia</th>
                                    <th>Distancia</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparacion.map((item, i) => {
                                    const diff = getDiferencia(item.preMarcacion, item.marcacionOficial);
                                    const esDiscrepante = diff !== null && diff > 10;
                                    const sinMarcacion = !item.marcacionOficial;

                                    return (
                                        <tr key={i} style={{
                                            background: esDiscrepante ? 'rgba(239, 68, 68, 0.04)' : sinMarcacion ? 'rgba(245, 158, 11, 0.04)' : 'transparent'
                                        }}>
                                            <td style={{ fontWeight: 600 }}>{item.nombre}</td>
                                            <td>{item.fecha}</td>
                                            <td>{item.sucursal || '—'}</td>
                                            <td>
                                                <span style={{
                                                    color: '#10b981',
                                                    fontWeight: 700,
                                                    fontSize: '0.95rem'
                                                }}>
                                                    {formatTime(item.preMarcacion)}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{
                                                    color: item.marcacionOficial ? '#3b82f6' : '#f59e0b',
                                                    fontWeight: 700,
                                                    fontSize: '0.95rem'
                                                }}>
                                                    {formatTime(item.marcacionOficial)}
                                                </span>
                                            </td>
                                            <td>
                                                {diff !== null ? (
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        borderRadius: 6,
                                                        fontSize: '0.8rem',
                                                        fontWeight: 700,
                                                        background: esDiscrepante ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                        color: esDiscrepante ? '#ef4444' : '#10b981'
                                                    }}>
                                                        {diff > 0 ? `+${diff}min` : `${diff}min`}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#94a3b8' }}>—</span>
                                                )}
                                            </td>
                                            <td>
                                                {item.distanciaMetros != null ? (
                                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                        {Math.round(item.distanciaMetros)}m
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td>
                                                {esDiscrepante ? (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        padding: '3px 10px',
                                                        borderRadius: 20,
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        fontWeight: 700,
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        <AlertTriangle size={14} /> Sospechoso
                                                    </span>
                                                ) : sinMarcacion ? (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        padding: '3px 10px',
                                                        borderRadius: 20,
                                                        background: 'rgba(245, 158, 11, 0.1)',
                                                        color: '#f59e0b',
                                                        fontWeight: 700,
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        <Clock size={14} /> Sin marcar
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        padding: '3px 10px',
                                                        borderRadius: 20,
                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                        color: '#10b981',
                                                        fontWeight: 700,
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        <CheckCircle2 size={14} /> OK
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}



export default AdminPanel;

// ===========================================
// RASTREO GPS EN TIEMPO REAL - SOLO ADMIN
// ===========================================

function AdminRastreo() {
    const [ubicaciones, setUbicaciones] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [ruta, setRuta] = useState([]);
    const [fechaRuta, setFechaRuta] = useState(() => new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const intervalRef = useRef(null);

    useEffect(() => {
        cargarDatos();
        cargarUsuarios();
    }, []);

    useEffect(() => {
        if (autoRefresh) {
            intervalRef.current = setInterval(cargarDatos, 30000); // cada 30 seg
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [autoRefresh]);

    const cargarDatos = async () => {
        try {
            const data = await trackingService.getTiempoReal();
            setUbicaciones(data);
        } catch (error) {
            console.error('Error cargando tracking:', error);
        } finally {
            setLoading(false);
        }
    };

    const cargarUsuarios = async () => {
        try {
            const data = await adminService.getUsuariosActivos();
            setUsuarios(data);
        } catch (e) { /* */ }
    };

    const cargarRuta = async (userId) => {
        try {
            const data = await trackingService.getRuta(userId, fechaRuta);
            setRuta(data);
        } catch (e) { console.error(e); }
    };

    const handleSelectUser = (userId) => {
        setSelectedUser(userId);
        if (userId) cargarRuta(userId);
        else setRuta([]);
    };

    useEffect(() => {
        if (selectedUser) cargarRuta(selectedUser);
    }, [fechaRuta]);

    const formatTime = (iso) => {
        if (!iso) return '';
        return new Date(iso).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });
    };

    const tiempoDesde = (iso) => {
        if (!iso) return '';
        const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
        if (mins < 1) return 'Ahora';
        if (mins < 60) return `Hace ${mins}min`;
        return `Hace ${Math.floor(mins / 60)}h ${mins % 60}min`;
    };

    // Centro del mapa: primera ubicación o Paraguay
    const centro = ubicaciones.length > 0
        ? [ubicaciones[0].latitud, ubicaciones[0].longitud]
        : [-25.2637, -57.5759];

    return (
        <div className="admin-content">
            <header className="content-header">
                <div className="header-title">
                    <h1><Navigation size={28} style={{ marginRight: 10, color: '#3b82f6', verticalAlign: 'middle' }} /> Rastreo GPS en Tiempo Real</h1>
                    <p>Ubicación de colaboradores para seguridad — Actualiza cada 30s</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#64748b', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            style={{ width: 16, height: 16 }}
                        />
                        Auto-refresh
                    </label>
                    <button onClick={cargarDatos} className="btn-premium" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem' }}>
                        <RefreshCw size={16} /> Actualizar
                    </button>
                </div>
            </header>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="p-stat-card blue">
                    <div className="p-stat-header">
                        <div className="p-stat-icon blue"><Navigation size={22} /></div>
                        <div className="p-stat-info">
                            <span className="p-stat-label">Activos Ahora</span>
                            <span className="p-stat-value">{ubicaciones.length}</span>
                        </div>
                    </div>
                </div>
                <div className="p-stat-card purple">
                    <div className="p-stat-header">
                        <div className="p-stat-icon purple"><Users size={22} /></div>
                        <div className="p-stat-info">
                            <span className="p-stat-label">Total Colaboradores</span>
                            <span className="p-stat-value">{usuarios.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }}>
                {/* Mapa */}
                <div className="p-chart-card" style={{ overflow: 'hidden' }}>
                    <div className="p-chart-header">
                        <h3>🗺️ Mapa en Tiempo Real</h3>
                    </div>
                    <div style={{ height: '500px' }}>
                        {!loading && (
                            <MapContainer
                                center={centro}
                                zoom={14}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    attribution='&copy; OpenStreetMap'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                {/* Marcadores de ubicación actual */}
                                {ubicaciones.map((ub, i) => (
                                    <Marker
                                        key={`ub-${i}`}
                                        position={[ub.latitud, ub.longitud]}
                                        icon={L.divIcon({
                                            className: 'custom-tracking-marker',
                                            html: `<div style="
                                                background: #3b82f6;
                                                color: white;
                                                border-radius: 50%;
                                                width: 36px;
                                                height: 36px;
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                                font-size: 12px;
                                                font-weight: 700;
                                                border: 3px solid white;
                                                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                                            ">${ub.nombreUsuario?.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>`,
                                            iconSize: [36, 36],
                                            iconAnchor: [18, 18]
                                        })}
                                    >
                                        <Popup>
                                            <div style={{ minWidth: 200 }}>
                                                <strong style={{ fontSize: '1rem' }}>{ub.nombreUsuario}</strong>
                                                <br />
                                                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                                    📍 {ub.latitud?.toFixed(5)}, {ub.longitud?.toFixed(5)}
                                                </span>
                                                <br />
                                                <span style={{ color: '#3b82f6', fontWeight: 600 }}>
                                                    ⏰ {formatTime(ub.fechaHora)} ({tiempoDesde(ub.fechaHora)})
                                                </span>
                                                {ub.bateria != null && (
                                                    <><br /><span>🔋 Batería: {ub.bateria}%</span></>
                                                )}
                                                {ub.precisionGps != null && (
                                                    <><br /><span>🎯 Precisión: {Math.round(ub.precisionGps)}m</span></>
                                                )}
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}

                                {/* Línea de ruta si hay seleccionado */}
                                {ruta.length > 1 && (() => {
                                    const positions = ruta.map(r => [r.latitud, r.longitud]);
                                    return (
                                        <>
                                            {positions.map((pos, idx) => (
                                                <Circle
                                                    key={`ruta-${idx}`}
                                                    center={pos}
                                                    radius={5}
                                                    pathOptions={{
                                                        color: idx === 0 ? '#10b981' : idx === positions.length - 1 ? '#ef4444' : '#3b82f6',
                                                        fillColor: idx === 0 ? '#10b981' : idx === positions.length - 1 ? '#ef4444' : '#3b82f6',
                                                        fillOpacity: 0.8
                                                    }}
                                                >
                                                    <Popup>
                                                        {idx === 0 ? '🟢 Inicio' : idx === positions.length - 1 ? '🔴 Último' : `Punto ${idx}`}
                                                        <br />{formatTime(ruta[idx].fechaHora)}
                                                    </Popup>
                                                </Circle>
                                            ))}
                                        </>
                                    );
                                })()}
                            </MapContainer>
                        )}
                    </div>
                </div>

                {/* Panel lateral */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Historial de ruta */}
                    <div className="p-chart-card">
                        <div className="p-chart-header">
                            <h3>🛤️ Historial de Ruta</h3>
                        </div>
                        <div style={{ padding: '1rem' }}>
                            <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }}>Colaborador</label>
                            <select
                                value={selectedUser || ''}
                                onChange={(e) => handleSelectUser(e.target.value ? Number(e.target.value) : null)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', marginBottom: '0.75rem' }}
                            >
                                <option value="">Seleccionar...</option>
                                {usuarios.map(u => (
                                    <option key={u.id} value={u.id}>{u.nombreCompleto}</option>
                                ))}
                            </select>

                            <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }}>Fecha</label>
                            <input
                                type="date"
                                value={fechaRuta}
                                onChange={(e) => setFechaRuta(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                            />

                            {ruta.length > 0 && (
                                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#475569' }}>
                                    <p><strong>{ruta.length}</strong> puntos registrados</p>
                                    <p>🟢 Inicio: <strong>{formatTime(ruta[0]?.fechaHora)}</strong></p>
                                    <p>🔴 Último: <strong>{formatTime(ruta[ruta.length - 1]?.fechaHora)}</strong></p>
                                </div>
                            )}

                            {selectedUser && ruta.length === 0 && (
                                <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
                                    Sin registros para esta fecha
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Lista de usuarios en línea */}
                    <div className="p-chart-card" style={{ flex: 1, overflow: 'hidden' }}>
                        <div className="p-chart-header">
                            <h3>🟢 En Línea ({ubicaciones.length})</h3>
                        </div>
                        <div style={{ maxHeight: 250, overflowY: 'auto', padding: '0.5rem' }}>
                            {ubicaciones.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0', fontSize: '0.85rem' }}>
                                    Ningún colaborador con tracking activo
                                </p>
                            ) : (
                                ubicaciones.map((ub, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handleSelectUser(ub.usuarioId)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.6rem 0.75rem',
                                            borderRadius: 10,
                                            cursor: 'pointer',
                                            background: selectedUser === ub.usuarioId ? 'rgba(59,130,246,0.08)' : 'transparent',
                                            borderBottom: '1px solid #f1f5f9',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%',
                                            background: '#3b82f6', color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
                                        }}>
                                            {ub.nombreUsuario?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {ub.nombreUsuario}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                {tiempoDesde(ub.fechaHora)}
                                                {ub.bateria != null && ` · 🔋${ub.bateria}%`}
                                            </div>
                                        </div>
                                        <div style={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            background: '#10b981', flexShrink: 0
                                        }} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===========================================
// JUSTIFICACIONES - SOLO ADMIN
// ===========================================

function AdminJustificaciones() {
    const [justificaciones, setJustificaciones] = useState([]);
    const [pendientes, setPendientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [vista, setVista] = useState('pendientes'); // pendientes | todas
    const [modalRevisar, setModalRevisar] = useState(null);
    const [comentario, setComentario] = useState('');

    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [todas, pend] = await Promise.all([
                justificacionService.getTodas(),
                justificacionService.getPendientes()
            ]);
            setJustificaciones(todas);
            setPendientes(pend);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleRevisar = async (id, decision) => {
        try {
            await justificacionService.revisar(id, decision, comentario);
            setModalRevisar(null);
            setComentario('');
            cargarDatos();
        } catch (e) { alert('Error: ' + e.message); }
    };

    const lista = vista === 'pendientes' ? pendientes : justificaciones;

    const getBadge = (estado) => {
        const estilos = {
            PENDIENTE: { bg: '#fef3c7', color: '#92400e', text: '⏳ Pendiente' },
            APROBADA: { bg: '#d1fae5', color: '#065f46', text: '✅ Aprobada' },
            RECHAZADA: { bg: '#fee2e2', color: '#991b1b', text: '❌ Rechazada' },
        };
        const s = estilos[estado] || estilos.PENDIENTE;
        return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: s.bg, color: s.color }}>{s.text}</span>;
    };

    const getTipoBadge = (tipo) => {
        const estilos = {
            TARDANZA: { bg: '#fef3c7', color: '#92400e', text: '🕐 Tardanza' },
            AUSENCIA: { bg: '#fee2e2', color: '#991b1b', text: '🚫 Ausencia' },
            SALIDA_TEMPRANA: { bg: '#dbeafe', color: '#1e40af', text: '🚪 Salida temprana' },
        };
        const s = estilos[tipo] || { bg: '#f1f5f9', color: '#334155', text: tipo };
        return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: s.bg, color: s.color }}>{s.text}</span>;
    };

    return (
        <div className="admin-content">
            <header className="content-header">
                <div className="header-title">
                    <h1><FileText size={28} style={{ marginRight: 10, color: '#8b5cf6', verticalAlign: 'middle' }} /> Justificaciones</h1>
                    <p>Gestión de justificaciones de tardanza y ausencia</p>
                </div>
            </header>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="p-stat-card orange" onClick={() => setVista('pendientes')} style={{ cursor: 'pointer', border: vista === 'pendientes' ? '2px solid #f59e0b' : '2px solid transparent' }}>
                    <div className="p-stat-header">
                        <div className="p-stat-icon orange"><FileText size={22} /></div>
                        <div className="p-stat-info">
                            <span className="p-stat-label">Pendientes</span>
                            <span className="p-stat-value">{pendientes.length}</span>
                        </div>
                    </div>
                </div>
                <div className="p-stat-card blue" onClick={() => setVista('todas')} style={{ cursor: 'pointer', border: vista === 'todas' ? '2px solid #3b82f6' : '2px solid transparent' }}>
                    <div className="p-stat-header">
                        <div className="p-stat-icon blue"><ScrollText size={22} /></div>
                        <div className="p-stat-info">
                            <span className="p-stat-label">Total</span>
                            <span className="p-stat-value">{justificaciones.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="p-chart-card">
                <div className="p-chart-header">
                    <h3>{vista === 'pendientes' ? '⏳ Pendientes de revisión' : '📋 Todas las justificaciones'}</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="premium-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Colaborador</th>
                                <th style={thStyle}>Fecha</th>
                                <th style={thStyle}>Tipo</th>
                                <th style={thStyle}>Motivo</th>
                                <th style={thStyle}>Estado</th>
                                <th style={thStyle}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Cargando...</td></tr>
                            ) : lista.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                    {vista === 'pendientes' ? '✅ No hay justificaciones pendientes' : 'Sin justificaciones registradas'}
                                </td></tr>
                            ) : lista.map((j, i) => (
                                <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={tdStyle}><strong>{j.nombreUsuario}</strong></td>
                                    <td style={tdStyle}>{j.fecha}</td>
                                    <td style={tdStyle}>{getTipoBadge(j.tipo)}</td>
                                    <td style={{ ...tdStyle, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.motivo}</td>
                                    <td style={tdStyle}>{getBadge(j.estado)}</td>
                                    <td style={tdStyle}>
                                        {j.estado === 'PENDIENTE' ? (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    onClick={() => { setModalRevisar(j); setComentario(''); }}
                                                    style={{ padding: '4px 12px', borderRadius: 8, border: 'none', background: '#10b981', color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                                                >Revisar</button>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                                {j.revisadoPor && `Por: ${j.revisadoPor}`}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de revisión */}
            {modalRevisar && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setModalRevisar(null)}>
                    <div style={{ background: 'white', borderRadius: 20, padding: '2rem', maxWidth: 480, width: '90%', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}
                        onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>📋 Revisar Justificación</h3>
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 12, marginBottom: '1rem', fontSize: '0.9rem' }}>
                            <p><strong>Colaborador:</strong> {modalRevisar.nombreUsuario}</p>
                            <p><strong>Fecha:</strong> {modalRevisar.fecha}</p>
                            <p><strong>Tipo:</strong> {modalRevisar.tipo}</p>
                            <p><strong>Motivo:</strong> {modalRevisar.motivo}</p>
                            {modalRevisar.evidenciaUrl && (
                                <p><strong>Evidencia:</strong> <a href={modalRevisar.evidenciaUrl} target="_blank" rel="noopener noreferrer">Ver adjunto</a></p>
                            )}
                        </div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Comentario (opcional)</label>
                        <textarea
                            value={comentario}
                            onChange={(e) => setComentario(e.target.value)}
                            placeholder="Agregar comentario..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.9rem', minHeight: 80, resize: 'vertical', marginBottom: '1rem' }}
                        />
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => handleRevisar(modalRevisar.id, 'APROBAR')}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: 12, border: 'none', background: '#10b981', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
                            >✅ Aprobar</button>
                            <button
                                onClick={() => handleRevisar(modalRevisar.id, 'RECHAZAR')}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: 12, border: 'none', background: '#ef4444', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
                            >❌ Rechazar</button>
                        </div>
                        <button
                            onClick={() => setModalRevisar(null)}
                            style={{ width: '100%', marginTop: '0.75rem', padding: '0.5rem', borderRadius: 10, border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer' }}
                        >Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const thStyle = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #e2e8f0' };
const tdStyle = { padding: '0.75rem 1rem', fontSize: '0.88rem', color: '#334155' };

// ===========================================
// AUDITORÍA - SOLO ADMIN
// ===========================================

function AdminAuditoria() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [fechaInicio, setFechaInicio] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0]);

    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [logsData, statsData] = await Promise.all([
                auditoriaService.getByRango(fechaInicio, fechaFin),
                auditoriaService.getStats()
            ]);
            setLogs(logsData);
            setStats(statsData);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const getAccionBadge = (tipo) => {
        const colores = {
            CREAR: { bg: '#d1fae5', color: '#065f46' },
            MODIFICAR: { bg: '#dbeafe', color: '#1e40af' },
            ELIMINAR: { bg: '#fee2e2', color: '#991b1b' },
            LOGIN: { bg: '#f3e8ff', color: '#6b21a8' },
            RESET: { bg: '#fef3c7', color: '#92400e' },
            APROBAR: { bg: '#d1fae5', color: '#065f46' },
            RECHAZAR: { bg: '#fee2e2', color: '#991b1b' },
        };
        const c = colores[tipo] || { bg: '#f1f5f9', color: '#475569' };
        return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: c.bg, color: c.color }}>{tipo}</span>;
    };

    const formatFecha = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
            ' ' + d.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="admin-content">
            <header className="content-header">
                <div className="header-title">
                    <h1><ScrollText size={28} style={{ marginRight: 10, color: '#8b5cf6', verticalAlign: 'middle' }} /> Auditoría del Sistema</h1>
                    <p>Registro de todas las acciones administrativas — Cumplimiento regulatorio</p>
                </div>
            </header>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                {Object.entries(stats).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="p-stat-card blue">
                        <div className="p-stat-header">
                            <div className="p-stat-info">
                                <span className="p-stat-label">{key}</span>
                                <span className="p-stat-value">{value}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="p-chart-card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Desde</label>
                        <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Hasta</label>
                        <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                    </div>
                    <button onClick={cargarDatos} className="btn-premium" style={{ padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Search size={16} /> Buscar
                    </button>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{logs.length} registros encontrados</span>
                </div>
            </div>

            {/* Tabla de auditoría */}
            <div className="p-chart-card">
                <div style={{ overflowX: 'auto', maxHeight: 600, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 2 }}>
                            <tr>
                                <th style={thStyle}>Fecha/Hora</th>
                                <th style={thStyle}>Usuario</th>
                                <th style={thStyle}>Acción</th>
                                <th style={thStyle}>Entidad</th>
                                <th style={thStyle}>Descripción</th>
                                <th style={thStyle}>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Cargando...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Sin registros en este rango</td></tr>
                            ) : logs.map((log, i) => (
                                <tr key={log.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ ...tdStyle, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatFecha(log.fechaHora)}</td>
                                    <td style={tdStyle}><strong>{log.usuario}</strong></td>
                                    <td style={tdStyle}>{getAccionBadge(log.tipoAccion)}</td>
                                    <td style={tdStyle}><span style={{ fontSize: '0.8rem', color: '#64748b' }}>{log.entidad} {log.entidadId > 0 ? `#${log.entidadId}` : ''}</span></td>
                                    <td style={{ ...tdStyle, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.descripcion}</td>
                                    <td style={{ ...tdStyle, fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'monospace' }}>{log.ipAddress}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
