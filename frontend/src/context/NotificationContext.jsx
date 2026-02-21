import React, { createContext, useContext, useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { authService } from '../services/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [stompClient, setStompClient] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const user = authService.getUsuarioActual();
        if (!user) return;

        // Determinar URL del WebSocket (considerando proxy de Vite)
        const socketUrl = `${window.location.protocol}//${window.location.host}/ws-notifications`;

        const client = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            debug: (str) => {
                // console.log(str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = (frame) => {
            setConnected(true);

            // Suscribirse a alertas globales (ADMIN y ADMIN_SUCURSAL)
            if (user.rol === 'ADMIN' || user.rol === 'ADMIN_SUCURSAL') {
                client.subscribe('/topic/admin-alerts', (message) => {
                    const alert = JSON.parse(message.body);
                    addNotification(alert);
                });
            }

            // Suscribirse a alertas personales
            client.subscribe(`/topic/user-${user.id}`, (message) => {
                const msg = JSON.parse(message.body);
                addNotification({ type: 'PERSONAL', message: msg });
            });
        };

        client.onStompError = (frame) => {
            console.error('STOMP error', frame.headers['message']);
        };

        client.activate();
        setStompClient(client);

        return () => {
            if (client) client.deactivate();
        };
    }, []);

    const addNotification = (notif) => {
        setNotifications(prev => [
            { ...notif, id: Date.now(), read: false },
            ...prev
        ].slice(0, 50)); // Mantener solo las últimas 50
    };

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const clearAll = () => setNotifications([]);

    return (
        <NotificationContext.Provider value={{ notifications, connected, markAsRead, clearAll }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
