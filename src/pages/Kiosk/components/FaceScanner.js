import React, { useRef, useEffect, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { Spinner } from 'reactstrap';

/**
 * FaceScanner - Componente de scanner facial contínuo para o Kiosk.
 * 
 * A câmera fica sempre ativa e escaneia rostos automaticamente.
 * Quando um rosto é detectado, extrai o descriptor e chama onFaceDetected.
 * 
 * Props:
 * - onFaceDetected(descriptor): chamado quando um rosto é detectado com sucesso
 * - enabled: se false, pausa o scanning (ex: quando já identificou alguém)
 * - scanInterval: intervalo entre scans em ms (default: 2000)
 */
const FaceScanner = ({ onFaceDetected, enabled = true, scanInterval = 2000 }) => {
    const webcamRef = useRef(null);
    const scanTimerRef = useRef(null);
    const isProcessingRef = useRef(false);
    const faceServiceRef = useRef(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [scanStatus, setScanStatus] = useState('loading'); // 'loading' | 'scanning' | 'detected' | 'paused'

    // Carrega os modelos de face-api.js uma vez
    useEffect(() => {
        let cancelled = false;

        const loadModels = async () => {
            try {
                const { FaceRecognitionService } = await import('../../../services/FaceRecognition/FaceRecognitionService');
                await FaceRecognitionService.loadModels();
                faceServiceRef.current = FaceRecognitionService;
                if (!cancelled) {
                    setModelsLoaded(true);
                    console.log('[FaceScanner] Modelos carregados com sucesso.');
                }
            } catch (err) {
                console.error('[FaceScanner] Erro ao carregar modelos:', err);
            }
        };

        loadModels();
        return () => { cancelled = true; };
    }, []);

    // Função de scan contínuo
    const performScan = useCallback(async () => {
        if (isProcessingRef.current || !faceServiceRef.current || !webcamRef.current) return;
        if (!enabled) return;

        const video = webcamRef.current?.video;
        if (!video || video.readyState < 2) return; // Video não pronto

        isProcessingRef.current = true;

        try {
            // Extrai descriptor diretamente do elemento de vídeo
            const descriptor = await faceServiceRef.current.getDescriptorFromImage(video);

            if (descriptor) {
                setScanStatus('detected');
                onFaceDetected(descriptor);
            } else {
                setScanStatus('scanning');
            }
        } catch (err) {
            // Silencioso — pode falhar por frame ruim, iluminação, etc.
            setScanStatus('scanning');
        } finally {
            isProcessingRef.current = false;
        }
    }, [enabled, onFaceDetected]);

    // Loop de scanning
    useEffect(() => {
        if (!modelsLoaded || !cameraReady || !enabled) {
            setScanStatus(enabled ? 'loading' : 'paused');
            return;
        }

        setScanStatus('scanning');

        // Scan imediato + intervalo
        performScan();
        scanTimerRef.current = setInterval(performScan, scanInterval);

        return () => {
            if (scanTimerRef.current) {
                clearInterval(scanTimerRef.current);
                scanTimerRef.current = null;
            }
        };
    }, [modelsLoaded, cameraReady, enabled, scanInterval, performScan]);

    const videoConstraints = {
        width: 640,
        height: 480,
        facingMode: 'user'
    };

    const statusConfig = {
        loading: { icon: 'mdi-loading mdi-spin', text: 'Carregando reconhecimento...', color: 'text-warning' },
        scanning: { icon: 'mdi-face-recognition', text: 'Posicione seu rosto na câmera', color: 'text-primary' },
        detected: { icon: 'mdi-check-circle', text: 'Rosto detectado! Buscando...', color: 'text-success' },
        paused: { icon: 'mdi-pause-circle', text: 'Scanner pausado', color: 'text-muted' }
    };

    const status = statusConfig[scanStatus] || statusConfig.scanning;

    return (
        <div className="face-scanner-container text-center">
            {/* Webcam com overlay visual */}
            <div className="position-relative d-inline-block rounded-4 overflow-hidden shadow"
                style={{ maxWidth: '320px', width: '100%' }}>
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/webp"
                    videoConstraints={videoConstraints}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    onUserMedia={() => setCameraReady(true)}
                    mirrored={true}
                />

                {/* Overlay com contorno de rosto */}
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ pointerEvents: 'none' }}>
                    {/* Contorno oval para guiar o posicionamento do rosto */}
                    <div style={{
                        width: '55%',
                        height: '70%',
                        border: `3px solid ${scanStatus === 'detected' ? '#34c38f' : scanStatus === 'scanning' ? 'rgba(85, 110, 230, 0.6)' : 'rgba(255,255,255,0.3)'}`,
                        borderRadius: '50%',
                        transition: 'border-color 0.3s ease',
                        boxShadow: scanStatus === 'detected' ? '0 0 20px rgba(52, 195, 143, 0.4)' : 'none'
                    }} />
                </div>

                {/* Overlay de loading quando câmera não está pronta */}
                {!cameraReady && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark bg-opacity-75">
                        <Spinner color="light" />
                        <small className="text-white mt-2">Iniciando câmera...</small>
                    </div>
                )}

                {/* Indicador de scan pulsante */}
                {scanStatus === 'scanning' && cameraReady && (
                    <div className="position-absolute top-0 end-0 m-2">
                        <span className="badge bg-primary rounded-pill" style={{ animation: 'pulse 2s infinite' }}>
                            <i className="mdi mdi-circle-small me-1" />SCAN
                        </span>
                    </div>
                )}
            </div>

            {/* Status text */}
            <div className={`mt-3 d-flex align-items-center justify-content-center gap-2 ${status.color}`}>
                <i className={`mdi ${status.icon} font-size-20`} />
                <span className="font-size-14 fw-medium">{status.text}</span>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};

export default FaceScanner;
