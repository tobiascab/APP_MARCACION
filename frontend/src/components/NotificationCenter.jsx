import React, { useState } from 'react';
import { Bell, X, CheckSquare, AlertCircle, Clock, MapPin, FileText, Users, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import './NotificationCenter.css';

const NotificationCenter = () => {
    const { notifications, markAsRead, clearAll } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const [expandedReport, setExpandedReport] = useState(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type) => {
        switch (type) {
            case 'MARKING': return <Clock className="notif-icon marking" />;
            case 'SECURITY_WARNING': return <AlertCircle className="notif-icon security" />;
            case 'PERSONAL': return <CheckSquare className="notif-icon personal" />;
            case 'DAILY_REPORT': return <FileText className="notif-icon daily-report" />;
            default: return <Bell className="notif-icon default" />;
        }
    };

    const renderDailyReport = (n) => {
        const data = n.data;
        if (!data) return null;
        const isExpanded = expandedReport === n.id;

        return (
            <div
                key={n.id}
                className={`notif-item daily-report-item ${n.read ? 'read' : 'unread'}`}
                onClick={() => {
                    markAsRead(n.id);
                    setExpandedReport(isExpanded ? null : n.id);
                }}
                style={{ cursor: 'pointer' }}
            >
                <div className="daily-report-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />
                        <div>
                            <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                                📊 Reporte de Asistencia
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: 8 }}>
                                {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                        </div>
                    </div>
                    {!n.read && <div className="unread-dot"></div>}
                </div>

                {/* Resumen compacto */}
                <div className="report-summary">
                    <span className="report-badge green">✅ {data.totalPuntuales || 0}</span>
                    <span className="report-badge yellow">⚠️ {data.totalTardanzas || 0}</span>
                    <span className="report-badge red">❌ {data.totalAusentes || 0}</span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: 'auto' }}>
                        {data.totalEmpleados || 0} empleados
                    </span>
                </div>

                {/* Detalle expandible */}
                {isExpanded && (
                    <div className="report-detail" onClick={e => e.stopPropagation()}>
                        {data.tardanzas && data.tardanzas.length > 0 && (
                            <div className="report-section">
                                <div className="section-title" style={{ color: '#d97706' }}>
                                    <AlertTriangle size={14} /> Llegadas Tardías ({data.tardanzas.length})
                                </div>
                                {data.tardanzas.map((t, i) => (
                                    <div key={i} className="report-row">
                                        <span className="row-name">{t.nombre}</span>
                                        <span className="row-detail">
                                            {t.horaEntrada} ({t.minutosRetraso} min tarde)
                                        </span>
                                        <span className="row-sucursal">{t.sucursal}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {data.ausentes && data.ausentes.length > 0 && (
                            <div className="report-section">
                                <div className="section-title" style={{ color: '#dc2626' }}>
                                    <X size={14} /> Ausentes ({data.ausentes.length})
                                </div>
                                {data.ausentes.map((a, i) => (
                                    <div key={i} className="report-row">
                                        <span className="row-name">{a.nombre}</span>
                                        <span className="row-detail">CI: {a.ci}</span>
                                        <span className="row-sucursal">{a.sucursal}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {data.puntuales && data.puntuales.length > 0 && (
                            <div className="report-section">
                                <div className="section-title" style={{ color: '#10b981' }}>
                                    <CheckSquare size={14} /> Puntuales ({data.puntuales.length})
                                </div>
                                {data.puntuales.slice(0, 10).map((p, i) => (
                                    <div key={i} className="report-row">
                                        <span className="row-name">{p.nombre}</span>
                                        <span className="row-detail">{p.horaEntrada}</span>
                                        <span className="row-sucursal">{p.sucursal}</span>
                                    </div>
                                ))}
                                {data.puntuales.length > 10 && (
                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', padding: '4px 0' }}>
                                        ... y {data.puntuales.length - 10} más
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderNotification = (n) => {
        if (n.type === 'DAILY_REPORT') {
            return renderDailyReport(n);
        }

        return (
            <div
                key={n.id}
                className={`notif-item ${n.read ? 'read' : 'unread'} ${n.type}`}
                onClick={() => markAsRead(n.id)}
            >
                <div className="notif-icon-wrapper">
                    {getIcon(n.type)}
                </div>
                <div className="notif-content">
                    <p className="notif-msg">{n.message}</p>
                    <span className="notif-time">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                {!n.read && <div className="unread-dot"></div>}
            </div>
        );
    };

    return (
        <div className="notification-center">
            <button
                className={`notif-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell size={20} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notif-dropdown">
                    <div className="notif-header">
                        <h3>Notificaciones</h3>
                        <div className="header-actions">
                            <button onClick={clearAll}>Limpiar todo</button>
                            <button onClick={() => setIsOpen(false)}><X size={16} /></button>
                        </div>
                    </div>

                    <div className="notif-list">
                        {notifications.length === 0 ? (
                            <div className="notif-empty">No hay notificaciones</div>
                        ) : (
                            notifications.map(n => renderNotification(n))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
