import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Check, X, User, Loader2, SkipForward, AlertTriangle, ShieldCheck } from 'lucide-react';
import './CapturaFoto.css';

// Intentar importar FaceDetection, pero no fallar si no está disponible
let FaceDetection = null;
try {
    const mediapipe = await import('@mediapipe/face_detection');
    FaceDetection = mediapipe.FaceDetection;
} catch (e) {
    console.warn('MediaPipe face detection no disponible, captura sin detección facial.');
}

function CapturaFoto({ onPhotoCapture, onCancel, onSkip, username }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [step, setStep] = useState('intro'); // 'intro', 'capturing', 'preview', 'info', 'success'
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [additionalData, setAdditionalData] = useState({
        emailInstitucional: '',
        telefonoCorporativo: '',
        numeroSocio: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errorType, setErrorType] = useState('');
    const [facingMode, setFacingMode] = useState('user');

    const [faceDetected, setFaceDetected] = useState(false);
    const [faceScore, setFaceScore] = useState(0);
    const [canCapture, setCanCapture] = useState(false); // Fallback: permite capturar sin detección
    const [cameraReady, setCameraReady] = useState(false);
    const detectorRef = useRef(null);
    const requestRef = useRef(null);
    const fallbackTimerRef = useRef(null);

    const startCamera = async () => {
        setLoading(true);
        setError('');
        setStep('capturing');
        setCanCapture(false);
        setCameraReady(false);

        if (!window.isSecureContext) {
            setError('Se requiere una conexión segura (HTTPS) para usar la cámara.');
            setErrorType('insecure');
            setLoading(false);
            return;
        }

        try {
            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setCameraReady(true);
                    initFaceDetection();
                    // Fallback: habilitar captura después de 3 segundos sin importar detección
                    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
                    fallbackTimerRef.current = setTimeout(() => {
                        setCanCapture(true);
                    }, 3000);
                };
            }
        } catch (err) {
            console.error('Error:', err);
            setError('No pudimos acceder a la cámara. Verifica los permisos.');
            setErrorType('permission');
        } finally {
            setLoading(false);
        }
    };

    const initFaceDetection = async () => {
        if (!FaceDetection) {
            // Sin detección facial disponible - habilitar captura inmediatamente
            setCanCapture(true);
            return;
        }

        try {
            const faceDetection = new FaceDetection({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
                }
            });

            faceDetection.setOptions({
                model: 'short',
                minDetectionConfidence: 0.6
            });

            faceDetection.onResults((results) => {
                if (results.detections && results.detections.length > 0) {
                    const score = results.detections[0].categories[0].score;
                    setFaceScore(score);
                    setFaceDetected(score > 0.65);
                    if (score > 0.65) setCanCapture(true);
                } else {
                    setFaceDetected(false);
                    setFaceScore(0);
                }
            });

            detectorRef.current = faceDetection;
            runDetection();
        } catch (err) {
            console.error('Error inicializando face detection:', err);
            // Si falla, habilitar captura de todos modos
            setCanCapture(true);
        }
    };

    const runDetection = async () => {
        if (videoRef.current && videoRef.current.readyState === 4 && detectorRef.current) {
            try {
                await detectorRef.current.send({ image: videoRef.current });
            } catch (err) {
                // Silenciar errores de detección
            }
        }
        requestRef.current = requestAnimationFrame(runDetection);
    };

    const stopCamera = () => {
        if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    useEffect(() => {
        return () => stopCamera();
    }, []);

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const size = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = size;
        canvas.height = size;

        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;

        if (facingMode === 'user') {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }

        context.drawImage(video, startX, startY, size, size, 0, 0, size, size);
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
        setStep('preview');
        stopCamera();
    };

    const handleConfirm = () => {
        setStep('info');
    };

    const handleFinalize = () => {
        setStep('success');
        setTimeout(() => {
            if (onPhotoCapture) {
                onPhotoCapture({
                    fotoPerfil: capturedImage,
                    ...additionalData
                });
            }
        }, 1500);
    };

    const handleDataChange = (e) => {
        const { name, value } = e.target;
        setAdditionalData(prev => ({ ...prev, [name]: value }));
    };

    const handleBack = () => {
        stopCamera();
        setStep('intro');
    };

    // El botón es clickeable si la detección facial lo dice O si el fallback timer ya pasó
    const captureEnabled = faceDetected || canCapture;

    return (
        <div className="faceid-container">
            {/* Background pattern */}
            <div className="faceid-bg-glow"></div>

            <div className="faceid-header-actions">
                <button className="faceid-cancel-btn" onClick={onCancel || handleBack}>
                    {step === 'intro' ? 'Cancelar' : <X size={24} />}
                </button>
            </div>

            <main className="faceid-main">
                {step === 'intro' && (
                    <div className="faceid-content animate-fadeIn">
                        <div className="faceid-icon-wrapper">
                            <div className="faceid-scan-circle">
                                <User size={48} />
                                <div className="scan-line"></div>
                            </div>
                        </div>
                        <h1 className="faceid-title">Configurar Foto de Perfil</h1>
                        <p className="faceid-subtitle">
                            Primero, posiciónate frente a la cámara. Tu foto ayudará a identificarte en el sistema de marcación.
                        </p>
                        <div className="faceid-footer">
                            <button className="faceid-primary-btn" onClick={startCamera}>
                                Empezar
                            </button>
                        </div>
                    </div>
                )}

                {(step === 'capturing' || step === 'preview') && (
                    <div className="faceid-camera-view animate-fadeIn">
                        <div className={`faceid-camera-frame ${step === 'preview' ? 'captured' : ''}`}>
                            {step === 'capturing' && (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={facingMode === 'user' ? 'mirror' : ''}
                                />
                            )}
                            {step === 'preview' && <img src={capturedImage} alt="Preview" />}

                            {/* Animated ring */}
                            <div className={`faceid-ring ${faceDetected ? 'verified' : (canCapture ? 'ready' : '')}`}>
                                <div className="ring-segment"></div>
                                <div className="ring-segment"></div>
                                <div className="ring-segment"></div>
                                <div className="ring-segment"></div>
                            </div>

                            {faceDetected && (
                                <div className="faceid-verified-badge animate-bounceIn">
                                    <ShieldCheck size={24} />
                                    <span>Rostro Detectado</span>
                                </div>
                            )}

                            {loading && (
                                <div className="faceid-camera-overlay">
                                    <Loader2 size={40} className="animate-spin" />
                                </div>
                            )}

                            {error && (
                                <div className="faceid-camera-overlay error">
                                    <AlertTriangle size={40} />
                                    <p>{error}</p>
                                    <button onClick={startCamera} className="faceid-mini-btn">Reintentar</button>
                                </div>
                            )}
                        </div>

                        <div className="faceid-capturing-info">
                            <h2 className="faceid-instruction">
                                {step === 'capturing'
                                    ? (faceDetected ? '¡Listo! Captura ahora' : (canCapture ? '¡Listo! Presiona el botón' : 'Encuadra tu rostro'))
                                    : '¿Te gusta esta foto?'}
                            </h2>
                            <p className="faceid-sub-instruction">
                                {step === 'capturing'
                                    ? (faceDetected ? 'Detección biométrica exitosa' : (canCapture ? 'Puedes capturar tu foto ahora' : 'Asegúrate de tener buena iluminación'))
                                    : 'Esta será tu imagen oficial de asistencia'}
                            </p>
                        </div>

                        <div className="faceid-actions-bar">
                            {step === 'capturing' && !loading && !error && (
                                <>
                                    <button className="faceid-action-btn" onClick={() => { stopCamera(); setFacingMode(f => f === 'user' ? 'environment' : 'user'); setTimeout(() => startCamera(), 300); }} title="Cambiar cámara">
                                        <RefreshCw size={24} />
                                    </button>
                                    <button
                                        className={`faceid-trigger-btn ${captureEnabled ? 'active' : 'disabled'}`}
                                        onClick={captureEnabled ? capturePhoto : undefined}
                                        disabled={!captureEnabled}
                                    >
                                        <div className="trigger-inner"></div>
                                    </button>
                                    <div style={{ width: 56 }}></div> {/* Espacio equilibrado */}
                                </>
                            )}
                            {step === 'preview' && (
                                <div className="faceid-preview-actions">
                                    <button className="faceid-action-btn secondary" onClick={() => { setCapturedImage(null); startCamera(); }}>
                                        <RefreshCw size={24} />
                                        <span>Repetir</span>
                                    </button>
                                    <button className="faceid-primary-btn confirm-btn" onClick={handleConfirm}>
                                        <Check size={24} />
                                        Usar esta foto
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 'info' && (
                    <div className="faceid-info-view animate-fadeIn">
                        <div className="faceid-icon-header">
                            <div className="avatar-preview">
                                <img src={capturedImage} alt="Perfil" />
                            </div>
                        </div>
                        <h1 className="faceid-title">Datos Corporativos</h1>
                        <p className="faceid-subtitle">Completa tu información institucional para finalizar el registro.</p>

                        <div className="faceid-form">
                            <div className="info-group">
                                <label>Correo Institucional</label>
                                <input
                                    type="email"
                                    name="emailInstitucional"
                                    value={additionalData.emailInstitucional}
                                    onChange={handleDataChange}
                                    placeholder="juan.perez@coopreducto.coop.py"
                                    className="info-input"
                                />
                            </div>
                            <div className="info-group">
                                <label>Teléfono Corporativo</label>
                                <input
                                    type="tel"
                                    name="telefonoCorporativo"
                                    value={additionalData.telefonoCorporativo}
                                    onChange={handleDataChange}
                                    placeholder="09XX XXX XXX"
                                    className="info-input"
                                />
                            </div>
                            <div className="info-group">
                                <label>Número de Socio</label>
                                <input
                                    type="text"
                                    name="numeroSocio"
                                    value={additionalData.numeroSocio}
                                    onChange={handleDataChange}
                                    placeholder="Nro de Socio"
                                    className="info-input"
                                />
                            </div>
                        </div>

                        <button className="faceid-primary-btn" onClick={handleFinalize}>
                            Guardar y Finalizar
                        </button>
                    </div>
                )}

                {step === 'success' && (
                    <div className="faceid-success-view animate-fadeIn">
                        <div className="faceid-success-icon">
                            <div className="success-circle-bg"></div>
                            <Check size={48} />
                        </div>
                        <h1 className="faceid-title">¡Perfil Completo!</h1>
                        <p className="faceid-subtitle">Tu información ha sido actualizada correctamente.</p>
                        <button className="faceid-primary-btn" onClick={() => onPhotoCapture({
                            fotoPerfil: capturedImage,
                            ...additionalData
                        })}>
                            Ingresar al Sistema
                        </button>
                    </div>
                )}
            </main>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}

export default CapturaFoto;
