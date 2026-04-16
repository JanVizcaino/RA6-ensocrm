import React, { useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import CardSortingGame3D from '../../Components/games/CardSortingGame3D';

interface Game {
    id: number;
    name: string;
    path: string;
    description: string;
    is_published: boolean;
}

interface Props {
    game: Game;
}

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

// Carga face-api.js desde CDN de forma lazy
async function loadFaceApi(): Promise<any> {
    if ((window as any).faceapi) return (window as any).faceapi;

    await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('No se pudo cargar face-api.js'));
        document.head.appendChild(script);
    });

    return (window as any).faceapi;
}

export default function Play({ game }: Props) {
    const userGameIdRef = useRef<number | null>(null);
    const videoRef      = useRef<HTMLVideoElement | null>(null);
    const streamRef     = useRef<MediaStream | null>(null);
    const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
    const detectionActiveRef = useRef(false);

    // ── 1. Al montar: crear registro de partida en BD ──────────────────────
    useEffect(() => {
        const startGame = async () => {
            try {
                const res = await fetch(`/api/games/${game.id}/start`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept':       'application/json',
                        'X-XSRF-TOKEN': getCsrfToken(),
                    },
                });
                const data = await res.json();
                if (data.success) {
                    userGameIdRef.current = data.user_game_id;
                }
            } catch (e) {
                console.error('Error iniciando partida:', e);
            }
        };

        startGame();
    }, [game.id]);

    // ── 2. Detección de emociones con face-api.js ──────────────────────────
    useEffect(() => {
        let cancelled = false;

        const initEmotions = async () => {
            try {
                const faceapi = await loadFaceApi();

                // Cargar modelos mínimos necesarios para expresiones
                const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                ]);

                if (cancelled) return;

                // Activar webcam en segundo plano (sin mostrarla al usuario)
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

                streamRef.current = stream;
                detectionActiveRef.current = true;

                const video = document.createElement('video');
                video.srcObject = stream;
                video.autoplay = true;
                video.muted = true;
                video.playsInline = true;
                videoRef.current = video;

                // Esperar a que el vídeo esté listo
                await new Promise<void>(resolve => {
                    video.onloadedmetadata = () => resolve();
                });

                // Detectar cada 3 segundos
                intervalRef.current = setInterval(async () => {
                    if (!detectionActiveRef.current || !userGameIdRef.current) return;

                    try {
                        const result = await faceapi
                            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                            .withFaceExpressions();

                        if (!result) return;

                        // Encontrar la emoción dominante
                        const expressions = result.expressions as Record<string, number>;
                        const dominant = Object.entries(expressions).reduce(
                            (a, b) => (b[1] > a[1] ? b : a)
                        );

                        const [emotion, confidence] = dominant;

                        // Mapeo de nombres de face-api.js al formato del enunciado
                        const emotionMap: Record<string, string> = {
                            neutral:   'neutral',
                            happy:     'happy',
                            sad:       'sad',
                            angry:     'angry',
                            surprised: 'surprised',
                            fearful:   'fearful',
                            disgusted: 'disgusted',
                        };

                        const mappedEmotion = emotionMap[emotion] ?? 'neutral';

                        await fetch('/api/emotions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept':       'application/json',
                                'X-XSRF-TOKEN': getCsrfToken(),
                            },
                            body: JSON.stringify({
                                user_game_id: userGameIdRef.current,
                                emotion:      mappedEmotion,
                                confidence:   parseFloat(confidence.toFixed(4)),
                                recorded_at:  new Date().toISOString(),
                            }),
                        });
                    } catch {
                        // Silenciamos errores de frame — la detección sigue
                    }
                }, 3000);

            } catch (e) {
                // Cámara no disponible o modelos no cargados — el juego sigue igual
                console.warn('Detección de emociones no disponible:', e);
            }
        };

        initEmotions();

        return () => {
            cancelled = true;
            stopDetection();
        };
    }, []);

    // ── 3. Escuchar GAME_OVER ──────────────────────────────────────────────
    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.data?.type !== 'GAME_OVER') return;

            // Parar detección de emociones
            stopDetection();

            const { errors, duration } = event.data.payload ?? {};

            if (!userGameIdRef.current) {
                router.visit(route('player.dashboard'));
                return;
            }

            try {
                const response = await fetch(`/api/games/${game.id}/finish`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept':       'application/json',
                        'X-XSRF-TOKEN': getCsrfToken(),
                    },
                    body: JSON.stringify({
                        user_game_id: userGameIdRef.current,
                        errors:       errors   ?? null,
                        duration:     duration ?? null,
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    sessionStorage.setItem('gameResult', JSON.stringify(data.result));
                }
            } catch (error) {
                console.error('Error guardando partida:', error);
            } finally {
                router.visit(route('player.dashboard'));
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [game.id]);

    function stopDetection() {
        detectionActiveRef.current = false;
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    }

    return (
        <>
            <Head title={game.name} />
            <div className="fixed inset-0 z-50 bg-slate-900">
                <CardSortingGame3D />
            </div>
        </>
    );
}