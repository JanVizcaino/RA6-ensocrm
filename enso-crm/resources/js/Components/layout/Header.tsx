import React, { useState, useRef, useCallback, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { Menu, Bell, Rocket, LogOut, Camera, Upload, CheckCircle, X, User } from "lucide-react";
import { PageProps } from "../../types";
import { Logo } from "../ui/Logo";
import { Avatar } from "../ui/Avatar";

interface HeaderProps {
    onToggleSidebar: () => void;
}

type CameraStatus = 'idle' | 'requesting' | 'active' | 'unavailable' | 'captured';

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
    const { url, props } = usePage<PageProps>();
    const { user } = props.auth;

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [faceModalOpen, setFaceModalOpen] = useState(false);
    const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const startCamera = useCallback(async () => {
        setCameraStatus('requesting');
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

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    }, []);

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            if (!blob) return;
            setCapturedBlob(blob);
            setCapturedImage(canvas.toDataURL('image/jpeg'));
            stopCamera();
            setCameraStatus('captured');
        }, 'image/jpeg', 0.9);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCapturedBlob(file);
        setCapturedImage(URL.createObjectURL(file));
        setCameraStatus('captured');
    };

    const handleUpload = async () => {
        if (!capturedBlob) return;
        setUploading(true);

        const formData = new FormData();
        formData.append('foto', capturedBlob, 'foto.jpg');

        try {
            const response = await fetch('/api/facial/enroll', {
                method: 'POST',
                headers: { 'X-XSRF-TOKEN': getCsrfToken() },
                body: formData,
            });

            if (response.ok) {
                setUploadSuccess(true);
                setTimeout(() => closeFaceModal(), 1500);
            }
        } catch (err) {
            console.error('Error subiendo foto:', err);
        } finally {
            setUploading(false);
        }
    };

    const openFaceModal = () => {
        setDropdownOpen(false);
        setCameraStatus('idle');
        setCapturedImage(null);
        setCapturedBlob(null);
        setUploadSuccess(false);
        setFaceModalOpen(true);
    };

    const closeFaceModal = () => {
        stopCamera();
        setFaceModalOpen(false);
        setCameraStatus('idle');
        setCapturedImage(null);
        setCapturedBlob(null);
    };

    const getPageTitle = (currentUrl: string) => {
        if (currentUrl.includes('/dashboard')) return 'Dashboard';
        if (currentUrl.includes('/users'))     return 'Directorio de Usuarios';
        if (currentUrl.includes('/games'))     return 'Catálogo de Juegos';
        return 'Panel de Control';
    };

    if (user?.role === 'admin' || user?.role === 'gestor') {
        return (
            <>
                <header className="h-18 shrink-0 bg-bg-card/90 backdrop-blur-md border-b border-border-line flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm font-sans transition-all">
                    <div className="flex items-center gap-4 flex-1">
                        <button onClick={onToggleSidebar} className="md:hidden p-2 rounded-lg hover:bg-bg-app text-text-main transition-colors">
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="hidden md:flex items-center text-sm text-text-main">
                            <span>{getPageTitle(url)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-3 cursor-pointer group"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-text-main leading-tight group-hover:text-brand-primary transition-colors">
                                        {user?.name}
                                    </p>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                                        {user?.role}
                                    </p>
                                </div>
                                <Avatar name={user?.name} size="sm" className="outline-1 -outline-offset-1 outline-border-line shadow-sm group-hover:scale-105 transition-transform bg-brand-surface text-brand-primary" />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 top-12 w-56 bg-bg-card rounded-xl outline-1 -outline-offset-1 outline-border-line shadow-lg z-50 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-border-line">
                                        <p className="text-sm font-bold text-text-main truncate">{user?.name}</p>
                                        <p className="text-xs text-text-muted truncate">{user?.email}</p>
                                    </div>
                                    <div className="py-1">
                                        <button
                                            onClick={openFaceModal}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-body hover:bg-bg-app hover:text-text-main transition-colors text-left"
                                        >
                                            <Camera size={16} className="text-text-muted" />
                                            Gestionar foto facial
                                        </button>
                                        <div className="h-px bg-border-line mx-3 my-1" />
                                        <Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-body hover:bg-bg-app hover:text-state-error transition-colors text-left"
                                        >
                                            <LogOut size={16} className="text-text-muted" />
                                            Cerrar sesión
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {faceModalOpen && <FaceModal
                    cameraStatus={cameraStatus}
                    capturedImage={capturedImage}
                    uploading={uploading}
                    uploadSuccess={uploadSuccess}
                    videoRef={videoRef}
                    canvasRef={canvasRef}
                    fileInputRef={fileInputRef}
                    onStartCamera={startCamera}
                    onCapture={capturePhoto}
                    onFileChange={handleFileChange}
                    onRetake={() => { setCapturedImage(null); setCapturedBlob(null); startCamera(); }}
                    onUpload={handleUpload}
                    onClose={closeFaceModal}
                />}
            </>
        );
    }

    return (
        <>
            <header className="h-20 bg-bg-card border-b border-border-line flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm font-sans">
                <div className="flex items-center gap-10">
                    <Logo className="h-10 text-brand-primary" />
                    <nav className="flex items-center gap-8">
                        <Link href="/player/dashboard" className="flex items-center gap-2 text-text-body hover:text-brand-primary transition-colors font-medium">
                            <Rocket className="w-4 h-4" /> Inicio
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    <button className="text-text-muted hover:text-brand-primary transition-colors">
                        <Bell className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-border-line" />
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-3 group"
                        >
                            <Avatar name={user?.name} size="sm" className="bg-brand-surface text-brand-primary group-hover:scale-105 transition-transform" />
                            <p className="text-text-main text-sm">
                                Hola, <span className="font-bold">{user?.name}</span>
                            </p>
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 top-12 w-56 bg-bg-card rounded-xl outline-1 -outline-offset-1 outline-border-line shadow-lg z-50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-border-line">
                                    <p className="text-sm font-bold text-text-main truncate">{user?.name}</p>
                                    <p className="text-xs text-text-muted truncate">{user?.email}</p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={openFaceModal}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-body hover:bg-bg-app hover:text-text-main transition-colors text-left"
                                    >
                                        <Camera size={16} className="text-text-muted" />
                                        Gestionar foto facial
                                    </button>
                                    <div className="h-px bg-border-line mx-3 my-1" />
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-body hover:bg-bg-app hover:text-state-error transition-colors text-left"
                                    >
                                        <LogOut size={16} className="text-text-muted" />
                                        Cerrar sesión
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {faceModalOpen && <FaceModal
                cameraStatus={cameraStatus}
                capturedImage={capturedImage}
                uploading={uploading}
                uploadSuccess={uploadSuccess}
                videoRef={videoRef}
                canvasRef={canvasRef}
                fileInputRef={fileInputRef}
                onStartCamera={startCamera}
                onCapture={capturePhoto}
                onFileChange={handleFileChange}
                onRetake={() => { setCapturedImage(null); setCapturedBlob(null); startCamera(); }}
                onUpload={handleUpload}
                onClose={closeFaceModal}
            />}
        </>
    );
};

interface FaceModalProps {
    cameraStatus: CameraStatus;
    capturedImage: string | null;
    uploading: boolean;
    uploadSuccess: boolean;
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    fileInputRef: React.RefObject<HTMLInputElement>;
    onStartCamera: () => void;
    onCapture: () => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRetake: () => void;
    onUpload: () => void;
    onClose: () => void;
}

const FaceModal: React.FC<FaceModalProps> = ({
    cameraStatus, capturedImage, uploading, uploadSuccess,
    videoRef, canvasRef, fileInputRef,
    onStartCamera, onCapture, onFileChange, onRetake, onUpload, onClose
}) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-bg-card rounded-2xl shadow-2xl outline-1 -outline-offset-1 outline-border-line p-6 w-full max-w-sm mx-4 relative">

            <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors">
                <X size={20} />
            </button>

            <h2 className="text-lg font-bold text-text-main mb-1">Foto facial</h2>
            <p className="text-text-muted text-sm mb-4">Esta foto se usará para identificarte en el login.</p>

            {uploadSuccess ? (
                <div className="flex flex-col items-center gap-3 py-6">
                    <CheckCircle size={48} className="text-state-success" />
                    <p className="text-sm font-medium text-state-success">¡Foto guardada correctamente!</p>
                </div>
            ) : (
                <>
                    <div className="w-full aspect-video bg-bg-app rounded-xl overflow-hidden mb-4 outline-1 -outline-offset-1 outline-border-line">
                        {cameraStatus === 'idle' && (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-text-muted">
                                <Camera size={32} className="opacity-40" />
                                <p className="text-xs">Selecciona una opción</p>
                            </div>
                        )}
                        {(cameraStatus === 'requesting') && (
                            <div className="w-full h-full flex items-center justify-center text-sm text-text-muted">
                                Iniciando cámara...
                            </div>
                        )}
                        {cameraStatus === 'active' && (
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        )}
                        {cameraStatus === 'unavailable' && (
                            <div className="w-full h-full flex items-center justify-center text-sm text-text-muted">
                                Cámara no disponible
                            </div>
                        )}
                        {cameraStatus === 'captured' && capturedImage && (
                            <img src={capturedImage} alt="Captura" className="w-full h-full object-cover" />
                        )}
                    </div>

                    <canvas ref={canvasRef} className="hidden" />
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

                    <div className="flex flex-col gap-2">
                        {cameraStatus === 'idle' && (
                            <>
                                <button
                                    onClick={onStartCamera}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                                >
                                    <Camera size={16} /> Usar cámara
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-bg-app text-text-body text-sm font-medium rounded-xl hover:bg-border-line/50 transition-colors outline-1 -outline-offset-1 outline-border-line"
                                >
                                    <Upload size={16} /> Subir archivo
                                </button>
                            </>
                        )}
                        {cameraStatus === 'active' && (
                            <button
                                onClick={onCapture}
                                className="w-full py-2.5 px-4 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                            >
                                Capturar foto
                            </button>
                        )}
                        {cameraStatus === 'captured' && (
                            <>
                                <button
                                    onClick={onUpload}
                                    disabled={uploading}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    <Upload size={16} />
                                    {uploading ? 'Guardando...' : 'Guardar como foto facial'}
                                </button>
                                <button
                                    onClick={onRetake}
                                    className="w-full py-2.5 px-4 bg-bg-app text-text-body text-sm font-medium rounded-xl hover:bg-border-line/50 transition-colors outline-1 -outline-offset-1 outline-border-line"
                                >
                                    Repetir
                                </button>
                            </>
                        )}
                        {cameraStatus === 'unavailable' && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-bg-app text-text-body text-sm font-medium rounded-xl hover:bg-border-line/50 transition-colors outline-1 -outline-offset-1 outline-border-line"
                            >
                                <Upload size={16} /> Subir archivo en su lugar
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    </div>
);