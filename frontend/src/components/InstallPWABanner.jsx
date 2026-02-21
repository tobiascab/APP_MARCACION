import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Smartphone, Shield, MapPin, Zap } from 'lucide-react';

/**
 * InstallPWABanner - Muestra un banner premium para instalar la app como PWA.
 * 
 * Captura el evento 'beforeinstallprompt' de Chrome y muestra un banner
 * atractivo que invita al usuario a instalar la app. Si el usuario ya instaló
 * la app o la descartó, no se muestra.
 */
const InstallPWABanner = () => {
    const [showBanner, setShowBanner] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const deferredPrompt = useRef(null);

    useEffect(() => {
        // Detectar si ya fue descartado
        const dismissed = localStorage.getItem('pwa-banner-dismissed');
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            // Volver a mostrar después de 7 días
            if (daysSince < 7) return;
        }

        // Detectar si ya está instalada como PWA
        if (window.matchMedia('(display-mode: standalone)').matches) return;
        if (window.navigator.standalone === true) return;

        // Detectar iOS (no tiene beforeinstallprompt, necesita instrucciones manuales)
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(isIOSDevice);

        if (isIOSDevice) {
            // En iOS mostrar después de 3 segundos
            const timer = setTimeout(() => setShowBanner(true), 3000);
            return () => clearTimeout(timer);
        }

        // Chrome/Android: capturar el evento de instalación
        const handler = (e) => {
            e.preventDefault();
            deferredPrompt.current = e;
            // Mostrar nuestro banner personalizado después de 3 segundos
            setTimeout(() => setShowBanner(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Detectar cuando se instale
        window.addEventListener('appinstalled', () => {
            setShowBanner(false);
            setShowModal(false);
            deferredPrompt.current = null;
        });

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (isIOS) {
            setShowModal(true);
            return;
        }

        if (deferredPrompt.current) {
            deferredPrompt.current.prompt();
            const { outcome } = await deferredPrompt.current.userChoice;
            if (outcome === 'accepted') {
                setShowBanner(false);
            }
            deferredPrompt.current = null;
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('pwa-banner-dismissed', new Date().toISOString());
    };

    if (!showBanner) return null;

    return (
        <>
            {/* Banner principal */}
            <div style={{
                position: 'fixed',
                bottom: 80,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 2rem)',
                maxWidth: 420,
                zIndex: 9999,
                animation: 'slideUpBanner 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    borderRadius: 20,
                    padding: '1.25rem',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,130,246,0.2)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Efecto de brillo */}
                    <div style={{
                        position: 'absolute',
                        top: -30,
                        right: -30,
                        width: 100,
                        height: 100,
                        background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
                        borderRadius: '50%',
                    }} />

                    {/* Botón cerrar */}
                    <button
                        onClick={handleDismiss}
                        style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: 28,
                            height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#94a3b8',
                        }}
                    >
                        <X size={14} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Ícono */}
                        <div style={{
                            width: 52,
                            height: 52,
                            borderRadius: 14,
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                        }}>
                            <Smartphone size={26} color="white" />
                        </div>

                        {/* Texto */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{
                                margin: 0,
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: 'white',
                                lineHeight: 1.3,
                            }}>
                                Instalar RelojReducto
                            </h4>
                            <p style={{
                                margin: '4px 0 0',
                                fontSize: '0.78rem',
                                color: '#94a3b8',
                                lineHeight: 1.4,
                            }}>
                                Acceso rápido y tracking de seguridad en segundo plano
                            </p>
                        </div>
                    </div>

                    {/* Features mini */}
                    <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        margin: '0.9rem 0',
                        flexWrap: 'wrap',
                    }}>
                        {[
                            { icon: <Zap size={12} />, text: 'Acceso rápido' },
                            { icon: <MapPin size={12} />, text: 'GPS en background' },
                            { icon: <Shield size={12} />, text: 'Tu seguridad' },
                        ].map((feat, i) => (
                            <span key={i} style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: '0.7rem',
                                color: '#60a5fa',
                                background: 'rgba(59,130,246,0.1)',
                                padding: '3px 8px',
                                borderRadius: 20,
                                fontWeight: 600,
                            }}>
                                {feat.icon} {feat.text}
                            </span>
                        ))}
                    </div>

                    {/* Botón instalar */}
                    <button
                        onClick={handleInstall}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: 12,
                            border: 'none',
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: 'white',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <Download size={18} />
                        {isIOS ? 'Cómo instalar' : 'Instalar App'}
                    </button>
                </div>
            </div>

            {/* Modal instrucciones iOS */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 10000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(8px)',
                    padding: '1rem',
                }} onClick={() => setShowModal(false)}>
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                            borderRadius: 24,
                            padding: '2rem 1.5rem',
                            maxWidth: 380,
                            width: '100%',
                            color: 'white',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            animation: 'slideUpBanner 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.2rem', textAlign: 'center' }}>
                            📱 Instalar en iPhone
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { step: '1', text: 'Toca el botón de Compartir', icon: '⬆️', desc: '(el cuadrado con flecha en Safari)' },
                                { step: '2', text: 'Busca "Agregar a pantalla de inicio"', icon: '➕', desc: '' },
                                { step: '3', text: 'Toca "Agregar"', icon: '✅', desc: '¡Listo! La app aparecerá en tu pantalla' },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                }}>
                                    <div style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        background: 'rgba(59,130,246,0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1rem',
                                        fontWeight: 800,
                                        color: '#60a5fa',
                                        flexShrink: 0,
                                    }}>
                                        {item.step}
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>
                                            {item.icon} {item.text}
                                        </p>
                                        {item.desc && (
                                            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                                                {item.desc}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowModal(false)}
                            style={{
                                marginTop: '1.5rem',
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#94a3b8',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            {/* Animación CSS */}
            <style>{`
                @keyframes slideUpBanner {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `}</style>
        </>
    );
};

export default InstallPWABanner;
