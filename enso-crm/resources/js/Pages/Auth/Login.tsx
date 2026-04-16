import React, { useState, useRef, useEffect, useCallback } from "react";
import { useForm, Link, router } from "@inertiajs/react";
import { Logo } from "@/Components/ui/Logo";
import { Button } from "@/Components/ui/Button";
import { TextInput } from "@/Components/ui/TextInput";
import { Camera, CameraOff, RefreshCw, LogIn, AlertCircle, CheckCircle } from "lucide-react";

type LoginStep = 'facial' | 'password';
type CameraStatus = 'requesting' | 'active' | 'unavailable' | 'capturing' | 'verifying';

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export default function Login() {
    const [step, setStep] = useState<LoginStep>('facial');
    const [cameraStatus, setCameraStatus] = useState<CameraStatus>('requesting');
    const [facialMessage, setFacialMessage] = useState<string | null>(null);
    const [facialSuccess, setFacialSuccess] = useState(false);
    const [emailForFacial, setEmailForFacial] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    const startCamera = useCallback(async () => {
    setCameraStatus('requesting');
    setFacialMessage(null);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        setCameraStatus('active');
        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        }, 100);
    } catch {
        setCameraStatus('unavailable');
    }
}, []);

    // Parar cámara
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [startCamera, stopCamera]);

    // Cambiar a login con contraseña
    const switchToPassword = () => {
        stopCamera();
        setStep('password');
    };

    // Capturar foto y verificar
    const handleFacialVerify = async () => {
        if (!emailForFacial.trim()) {
            setFacialMessage('Introduce tu email primero.');
            return;
        }

        if (!videoRef.current || !canvasRef.current) return;

        setCameraStatus('capturing');

        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);

        canvas.toBlob(async (blob) => {
            if (!blob) {
                setFacialMessage('Error al capturar la imagen.');
                setCameraStatus('active');
                return;
            }

            setCameraStatus('verifying');

            const formData = new FormData();
            formData.append('email', emailForFacial);
            formData.append('foto_webcam', blob, 'webcam.jpg');

            try {
                const response = await fetch('/api/facial/verify', {
                    method: 'POST',
                    credentials: "include",
                    headers: { 'X-XSRF-TOKEN': getCsrfToken() },
                    body: formData,
                });

                const result = await response.json();

                if (result.verified) {
                    setFacialSuccess(true);
                    setFacialMessage('¡Verificación correcta! Redirigiendo...');
                    stopCamera();
                    setTimeout(() => {
                        window.location.href = result.redirect;
                    }, 1000);
                } else if (result.no_photo) {
                    setFacialMessage('No tienes foto registrada. Usa tu contraseña.');
                    setCameraStatus('active');
                } else {
                    setFacialMessage(result.message || 'Verificación fallida. Inténtalo de nuevo o usa tu contraseña.');
                    setCameraStatus('active');
                }

                if (!response.ok){
                    console.error("Error del servidor:", await response.text());
                }
            } catch {
                setFacialMessage('Error de conexión. Usa tu contraseña.');
                setCameraStatus('active');
            }
        }, 'image/jpeg', 0.9);
    };

    const handlePasswordLogin = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    // Vista de login con contraseña
    if (step === 'password') {
        return (
            <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-bg-app overflow-hidden font-sans">
                <div className="absolute inset-0 z-0 opacity-50" style={{ backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
                <div className="absolute inset-0 z-0 bg-linear-to-t from-bg-app via-transparent to-transparent" />

                <div className="relative z-10 w-full max-w-md px-4">
                    <div className="bg-bg-card rounded-2xl shadow-xl outline -outline-offset-1 outline-border-line p-8 md:p-10 text-center">
                        <div className="flex justify-center mb-8">
                            <Logo className="text-brand-primary h-12 w-auto" />
                        </div>

                        <h1 className="text-2xl font-bold text-text-main mb-2 tracking-tight">Iniciar sesión</h1>
                        <p className="text-text-body text-sm mb-8">Introduce tus credenciales para continuar.</p>

                        <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4 mb-6">
                            <TextInput
                                label="Correo electrónico"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="nombre@ejemplo.com"
                                required
                                error={errors.email}
                            />
                            <TextInput
                                label="Contraseña"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                required
                                error={errors.password}
                            />
                            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={processing}>
                                Iniciar sesión
                            </Button>
                        </form>

                        <button
                            onClick={() => { setStep('facial'); startCamera(); }}
                            className="text-sm text-brand-primary hover:underline flex items-center justify-center gap-2 mx-auto mb-4"
                        >
                            <Camera size={16} /> Intentar con reconocimiento facial
                        </button>

                        <p className="mt-4 text-[10px] text-text-muted leading-relaxed uppercase tracking-wider font-medium">
                            Acceso restringido únicamente a personal autorizado de ENSO.
                        </p>
                    </div>

                    <p className="mt-6 text-sm text-text-body text-center">
                        ¿No tienes cuenta?{' '}
                        <Link href="/register" className="text-brand-primary font-semibold hover:underline">
                            Regístrate
                        </Link>
                    </p>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-text-muted font-medium font-mono">
                            &copy; {new Date().getFullYear()} ENSO v1.0.0
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Vista de verificación facial
    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-bg-app overflow-hidden font-sans">
            <div className="absolute inset-0 z-0 opacity-50" style={{ backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
            <div className="absolute inset-0 z-0 bg-linear-to-t from-bg-app via-transparent to-transparent" />

            <div className="relative z-10 w-full max-w-md px-4">
                <div className="bg-bg-card rounded-2xl shadow-xl outline -outline-offset-1 outline-border-line p-8 md:p-10 text-center">
                    <div className="flex justify-center mb-6">
                        <Logo className="text-brand-primary h-12 w-auto" />
                    </div>

                    <h1 className="text-2xl font-bold text-text-main mb-1 tracking-tight">Verificación facial</h1>
                    <p className="text-text-body text-sm mb-6">Colócate frente a la cámara para identificarte.</p>

                    {/* Visor de cámara */}
                    <div className="relative w-full aspect-video bg-bg-app rounded-xl overflow-hidden mb-4 outline-1 -outline-offset-1 outline-border-line">
                        {cameraStatus === 'unavailable' ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <CameraOff size={40} className="text-text-muted opacity-50" />
                                <p className="text-sm text-text-muted">Cámara no disponible</p>
                            </div>
                        ) : (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                        )}

                        {(cameraStatus === 'capturing' || cameraStatus === 'verifying') && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="text-white text-sm font-medium">
                                    {cameraStatus === 'capturing' ? 'Capturando...' : 'Verificando...'}
                                </div>
                            </div>
                        )}

                        {facialSuccess && (
                            <div className="absolute inset-0 bg-state-success/20 flex items-center justify-center">
                                <CheckCircle size={48} className="text-state-success" />
                            </div>
                        )}
                    </div>

                    {/* Canvas oculto para captura */}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Email para facial */}
                    <div className="mb-4 text-left">
                        <TextInput
                            label="Tu correo electrónico"
                            type="email"
                            value={emailForFacial}
                            onChange={(e) => setEmailForFacial(e.target.value)}
                            placeholder="nombre@ejemplo.com"
                        />
                    </div>

                    {/* Mensaje de feedback */}
                    {facialMessage && (
                        <div className={`flex items-start gap-2 text-sm p-3 rounded-lg mb-4 text-left ${
                            facialSuccess
                                ? 'bg-state-success/10 text-state-success'
                                : 'bg-state-error/10 text-state-error'
                        }`}>
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{facialMessage}</span>
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex flex-col gap-3">
                        {cameraStatus === 'unavailable' ? (
                            <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={startCamera} className="w-full">
                                Reintentar cámara
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                icon={<Camera size={16} />}
                                onClick={handleFacialVerify}
                                disabled={cameraStatus !== 'active' || facialSuccess}
                                className="w-full"
                            >
                                Verificar mi identidad
                            </Button>
                        )}

                        <Button
                            variant="secondary"
                            icon={<LogIn size={16} />}
                            onClick={switchToPassword}
                            className="w-full"
                        >
                            Usar contraseña
                        </Button>
                    </div>

                    <p className="mt-6 text-[10px] text-text-muted leading-relaxed uppercase tracking-wider font-medium">
                        Acceso restringido únicamente a personal autorizado de ENSO.
                    </p>
                </div>

                <p className="mt-6 text-sm text-text-body text-center">
                    ¿No tienes cuenta?{' '}
                    <Link href="/register" className="text-brand-primary font-semibold hover:underline">
                        Regístrate
                    </Link>
                </p>

                <div className="mt-8 text-center">
                    <p className="text-xs text-text-muted font-medium font-mono">
                        &copy; {new Date().getFullYear()} ENSO v1.0.0
                    </p>
                </div>
            </div>
        </div>
    );
}