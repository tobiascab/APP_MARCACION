import successSoundPath from './applepay.mp3';

let audioCtx = null;
let successBuffer = null;
let fallbackAudioElement = null;

// Inicializar el elemento de audio HTML5 como respaldo secundario
try {
    fallbackAudioElement = new Audio(successSoundPath);
    fallbackAudioElement.volume = 1.0;
} catch (e) {
    console.warn('Error creando Audio element backup:', e);
}

// Cargar y decodificar el audio para Web Audio API (Prioridad 1)
const loadSound = async () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        if (!audioCtx) audioCtx = new AudioContext();

        const response = await fetch(successSoundPath);
        const arrayBuffer = await response.arrayBuffer();

        // Decodificación con manejo de promesas antiguo y nuevo
        audioCtx.decodeAudioData(arrayBuffer,
            (buffer) => {
                successBuffer = buffer;
                console.log('✅ Buffer de audio listo');
            },
            (err) => console.warn('Error decodificando audio:', err)
        );
    } catch (e) {
        console.error('❌ Error cargando sonido WebAudio:', e);
    }
};

// Intentar cargar al importar
loadSound();

// Variable para mantener el "Keep-Alive" de audio
let silentSource = null;

// GLOBAL UNLOCK mejorado: Escuchar cualquier toque
const globalUnlock = () => {
    initAudioContext();
};

if (typeof window !== 'undefined') {
    // Capturar en fase de captura para ser los primeros
    window.addEventListener('touchstart', globalUnlock, { capture: true, once: false });
    window.addEventListener('click', globalUnlock, { capture: true, once: false });
}

/**
 * Inicializa/Desbloquea el contexto de audio. 
 * Mantiene el contexto VIVO reproduciendo silencio en loop.
 * CRÍTICO para que el audio funcione después de un await (petición de red).
 */
export const initAudioContext = () => {
    try {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
            else return;
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // Si ya tenemos una fuente de silencio corriendo, no hacer nada nueva
        if (silentSource) return;

        // Crear buffer de silencio de 1 segundo
        const buffer = audioCtx.createBuffer(1, 22050, 22050);
        silentSource = audioCtx.createBufferSource();
        silentSource.buffer = buffer;
        silentSource.loop = true; // Bucle infinito de silencio
        silentSource.connect(audioCtx.destination);
        silentSource.start(0);
        console.log('🔇 Audio Heartbeat iniciado (Silencio en loop)');

    } catch (e) {
        console.warn('Error audio init:', e);
    }
};

/**
 * Reproduce el sonido de éxito ("Apple Chime").
 * Estrategia en cascada: Buffer -> HTML5 Audio -> Sintetizador
 */
export const playSuccessSound = async () => {
    try {
        // 1. Intentar Web Audio API (Buffer) - Mejor performance en iOS
        if (audioCtx && successBuffer) {
            if (audioCtx.state === 'suspended') await audioCtx.resume();

            const source = audioCtx.createBufferSource();
            source.buffer = successBuffer;
            source.playbackRate.value = 0.85; // 15% más lento y con tono más grave/profundo
            source.connect(audioCtx.destination);
            source.start(0);
            console.log('🔊 Reproduciendo Buffer WebAudio (0.85x)');
            return;
        }

        // 2. Fallback: HTML5 Audio Element
        if (fallbackAudioElement) {
            console.log('⚠️ Usando fallback HTML5 Audio');
            fallbackAudioElement.currentTime = 0;
            fallbackAudioElement.playbackRate = 0.85; // Ajustar velocidad también aquí
            const promise = fallbackAudioElement.play();
            if (promise) {
                promise.catch(e => {
                    console.warn('Fallback HTML5 falló:', e);
                    playSynthesizedSuccess(); // 3. Último recurso
                });
            }
            return;
        }

        // 3. Fallback Total: Sintetizador
        console.warn('⚠️ Usando fallback Sintetizador');
        playSynthesizedSuccess();

    } catch (e) {
        console.error('Error fatal reproduciendo sonido:', e);
        playSynthesizedSuccess();
    }
};

/**
 * Sintetizador de emergencia (Tono "Ding")
 */
const playSynthesizedSuccess = () => {
    if (!audioCtx) return;
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // Do
        osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.1); // Do octava arriba

        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
        console.error(e);
    }
};
