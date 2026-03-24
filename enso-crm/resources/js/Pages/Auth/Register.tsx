import React, { useState, useRef, useCallback } from "react";
import { useForm, Link } from "@inertiajs/react";
import { Logo } from "@/Components/ui/Logo";
import { Button } from "@/Components/ui/Button";
import { TextInput } from "@/Components/ui/TextInput";
import { Camera, CameraOff, RefreshCw, CheckCircle, X } from "lucide-react";

type CameraStatus =
    | "idle"
    | "requesting"
    | "active"
    | "unavailable"
    | "captured";

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export default function Register() {
    const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const { data, setData, processing, errors, post } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const startCamera = useCallback(async () => {
        setCameraStatus("requesting");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
            });
            streamRef.current = stream;
            setCameraStatus("active");
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 100);
        } catch {
            setCameraStatus("unavailable");
        }
    }, []);
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }, []);

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0);

        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                setCapturedBlob(blob);
                setCapturedImage(canvas.toDataURL("image/jpeg"));
                stopCamera();
                setCameraStatus("captured");
            },
            "image/jpeg",
            0.9,
        );
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        setCapturedBlob(null);
        startCamera();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("email", data.email);
        formData.append("password", data.password);
        formData.append("password_confirmation", data.password_confirmation);
        if (capturedBlob) {
            formData.append("foto_registro", capturedBlob, "foto.jpg");
        }

        try {
            const response = await fetch("/register", {
                method: "POST",
                headers: {
                    "X-XSRF-TOKEN": getCsrfToken(),
                    "X-Inertia": "true",
                    "X-Inertia-Version": "",
                    Accept: "text/html, application/xhtml+xml",
                },
                body: formData,
            });

            if (response.redirected) {
                window.location.href = response.url;
            } else {
                window.location.href = "/player/dashboard";
            }
        } catch (err) {
            console.error("Error en el registro:", err);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-bg-app overflow-hidden font-sans">
            <div
                className="absolute inset-0 z-0 opacity-50"
                style={{
                    backgroundImage:
                        "radial-gradient(#e5e7eb 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                }}
            />
            <div className="absolute inset-0 z-0 bg-linear-to-t from-bg-app via-transparent to-transparent" />

            <div className="relative z-10 w-full max-w-md px-4">
                <div className="bg-bg-card rounded-2xl shadow-xl outline -outline-offset-1 outline-border-line p-8 md:p-10 text-center">
                    <div className="flex justify-center mb-8">
                        <Logo className="text-brand-primary h-12 w-auto" />
                    </div>

                    <h1 className="text-2xl font-bold text-text-main mb-2 tracking-tight">
                        Crear cuenta
                    </h1>
                    <p className="text-text-body text-sm mb-8">
                        Regístrate para acceder a la plataforma.
                    </p>

                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4"
                    >
                        <TextInput
                            label="Nombre completo"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="Tu nombre"
                            required
                            error={errors.name}
                        />
                        <TextInput
                            label="Correo electrónico"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                            placeholder="nombre@ejemplo.com"
                            required
                            error={errors.email}
                        />
                        <TextInput
                            label="Contraseña"
                            type="password"
                            value={data.password}
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                            placeholder="Mínimo 8 caracteres"
                            required
                            error={errors.password}
                        />
                        <TextInput
                            label="Confirmar contraseña"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData("password_confirmation", e.target.value)
                            }
                            placeholder="Repite tu contraseña"
                            required
                            error={errors.password_confirmation}
                        />

                        {/* Sección foto facial — opcional */}
                        <div className="flex flex-col gap-2 text-left">
                            <label className="text-sm font-medium text-text-main">
                                Foto facial{" "}
                                <span className="text-text-muted font-normal">
                                    (opcional — para login biométrico)
                                </span>
                            </label>

                            {cameraStatus === "idle" && (
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl outline-1 -outline-offset-1 outline-border-line text-sm text-text-muted hover:text-brand-primary hover:outline-brand-primary transition-colors bg-bg-app"
                                >
                                    <Camera size={18} /> Activar cámara para
                                    foto
                                </button>
                            )}

                            {cameraStatus === "requesting" && (
                                <div className="w-full py-4 flex items-center justify-center text-sm text-text-muted bg-bg-app rounded-xl outline-1 -outline-offset-1 outline-border-line">
                                    Solicitando acceso a la cámara...
                                </div>
                            )}

                            {cameraStatus === "unavailable" && (
                                <div className="flex flex-col items-center gap-2 py-4 bg-bg-app rounded-xl outline-1 -outline-offset-1 outline-border-line">
                                    <CameraOff
                                        size={24}
                                        className="text-text-muted"
                                    />
                                    <p className="text-xs text-text-muted">
                                        Cámara no disponible
                                    </p>
                                    <button
                                        type="button"
                                        onClick={startCamera}
                                        className="text-xs text-brand-primary hover:underline flex items-center gap-1"
                                    >
                                        <RefreshCw size={12} /> Reintentar
                                    </button>
                                </div>
                            )}

                            {cameraStatus === "active" && (
                                <div className="flex flex-col gap-2">
                                    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        icon={<Camera size={16} />}
                                        onClick={capturePhoto}
                                        className="w-full"
                                    >
                                        Capturar foto
                                    </Button>
                                </div>
                            )}

                            {cameraStatus === "captured" && capturedImage && (
                                <div className="flex flex-col gap-2">
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden outline-1 -outline-offset-1 outline-state-success">
                                        <img
                                            src={capturedImage}
                                            alt="Foto capturada"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-2 right-2 bg-state-success rounded-full p-1">
                                            <CheckCircle
                                                size={16}
                                                className="text-white"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={retakePhoto}
                                        className="text-xs text-text-muted hover:text-brand-primary flex items-center justify-center gap-1 transition-colors"
                                    >
                                        <X size={12} /> Eliminar y repetir
                                    </button>
                                </div>
                            )}
                        </div>

                        <canvas ref={canvasRef} className="hidden" />

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full mt-2"
                            isLoading={processing}
                        >
                            Crear cuenta
                        </Button>
                    </form>

                    <p className="mt-6 text-sm text-text-body">
                        ¿Ya tienes cuenta?{" "}
                        <Link
                            href="/login"
                            className="text-brand-primary font-semibold hover:underline"
                        >
                            Inicia sesión
                        </Link>
                    </p>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-text-muted font-medium font-mono">
                        &copy; {new Date().getFullYear()} ENSO v1.0.0
                    </p>
                </div>
            </div>
        </div>
    );
}
