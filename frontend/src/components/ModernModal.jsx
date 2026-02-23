
import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import './ModernModal.css';

/**
 * ModernModal - A premium replacement for window.alert and window.confirm
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {string} type - 'warning', 'info', 'success', 'error'
 * @param {string} title - Main title
 * @param {string} message - Detail message
 * @param {string} confirmText - Text for the primary action
 * @param {string} cancelText - Text for the secondary action (optional)
 * @param {function} onConfirm - Callback for primary action
 * @param {function} onCancel - Callback for secondary action/close
 */
const ModernModal = ({
    isOpen,
    type = 'warning',
    title,
    message,
    confirmText = 'Continuar',
    cancelText,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'warning': return <AlertTriangle size={40} />;
            case 'error': return <XCircle size={40} />;
            case 'success': return <CheckCircle size={40} />;
            default: return <Info size={40} />;
        }
    };

    return (
        <div className="modern-modal-overlay">
            <div className="modern-modal-container">
                <div className={`modern-modal-icon ${type}`}>
                    {getIcon()}
                </div>
                <h3 className="modern-modal-title">{title}</h3>
                <p className="modern-modal-body">{message}</p>
                <div className="modern-modal-actions">
                    {cancelText && (
                        <button className="modern-modal-btn cancel" onClick={onCancel}>
                            {cancelText}
                        </button>
                    )}
                    <button
                        className={`modern-modal-btn confirm ${type === 'warning' || type === 'error' ? 'danger' : ''}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModernModal;
