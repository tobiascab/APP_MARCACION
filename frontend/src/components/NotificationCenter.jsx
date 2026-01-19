import React, { useState } from 'react';
import { Bell, X, CheckSquare, AlertCircle, Clock, MapPin } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import './NotificationCenter.css';

const NotificationCenter = () => {
    const { notifications, markAsRead, clearAll } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type) => {
        switch (type) {
            case 'MARKING': return <Clock className="notif-icon marking" />;
            case 'SECURITY_WARNING': return <AlertCircle className="notif-icon security" />;
            case 'PERSONAL': return <CheckSquare className="notif-icon personal" />;
            default: return <Bell className="notif-icon default" />;
        }
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
                            notifications.map(n => (
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
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
