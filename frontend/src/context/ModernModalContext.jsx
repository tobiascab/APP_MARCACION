
import React, { createContext, useContext, useState, useCallback } from 'react';
import ModernModal from '../components/ModernModal';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        confirmText: 'Continuar',
        cancelText: null,
        onConfirm: () => { },
        onCancel: () => { }
    });

    const showModal = useCallback(({
        type = 'info',
        title,
        message,
        confirmText = 'Continuar',
        cancelText = null,
        onConfirm = null,
        onCancel = null
    }) => {
        return new Promise((resolve) => {
            setModalConfig({
                isOpen: true,
                type,
                title,
                message,
                confirmText,
                cancelText,
                onConfirm: () => {
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                    if (onConfirm) onConfirm();
                    resolve(true);
                },
                onCancel: () => {
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                    if (onCancel) onCancel();
                    resolve(false);
                }
            });
        });
    }, []);

    // Helpers específicos
    const confirm = useCallback((title, message, options = {}) => {
        return showModal({
            type: 'warning',
            title,
            message,
            confirmText: options.confirmText || 'Confirmar',
            cancelText: options.cancelText || 'Cancelar',
            ...options
        });
    }, [showModal]);

    const alert = useCallback((title, message, type = 'info') => {
        return showModal({
            type,
            title,
            message,
            confirmText: 'Entendido',
            cancelText: null
        });
    }, [showModal]);

    return (
        <ModalContext.Provider value={{ showModal, confirm, alert }}>
            {children}
            <ModernModal
                {...modalConfig}
                onConfirm={modalConfig.onConfirm}
                onCancel={modalConfig.onCancel}
            />
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal debe usarse dentro de un ModalProvider');
    }
    return context;
};
