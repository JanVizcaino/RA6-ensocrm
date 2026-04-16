import React, { useState, useRef } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import MainLayout from "../../Layouts/MainLayout";
import {
    UsersTable,
    UserData,
    UserHistory,
} from "../../Components/modules/UsersTable";
import { Button } from "../../Components/ui/Button";
import {
    Plus,
    Save,
    Camera,
    CheckCircle,
    Upload,
    Smile,
    Frown,
    Meh,
    Angry,
    Sparkles,
    Skull,
    Annoyed,
} from "lucide-react";
import { SearchBar } from "../../Components/shared/SearchBar";
import { TableToolbar } from "@/Components/shared/TableToolbar";
import { SlideOver } from "@/Components/ui/SlideOver";
import { TextInput } from "@/Components/ui/TextInput";
import { PageHeader } from "@/Components/shared/PageHeader";
import { Pagination } from "@/Components/shared/Pagination";

interface Props {
    users: UserData[];
}

interface UserFormData {
    name: string;
    email: string;
    role: string;
    password: string;
    history: UserHistory[];
}

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
}

const emotionConfig: Record<
    string,
    { icon: React.ReactNode; label: string; colorClass: string }
> = {
    happy: {
        icon: <Smile size={14} />,
        label: "Feliz",
        colorClass:
            "bg-state-success-subtle text-state-success outline-state-success/20",
    },
    sad: {
        icon: <Frown size={14} />,
        label: "Triste",
        colorClass:
            "bg-state-info-subtle text-state-info outline-state-info/20",
    },
    neutral: {
        icon: <Meh size={14} />,
        label: "Neutral",
        colorClass: "bg-bg-app text-text-muted outline-border-line", // Muted look
    },
    angry: {
        icon: <Angry size={14} />,
        label: "Enojado",
        colorClass:
            "bg-state-error-subtle text-state-error outline-state-error/20",
    },
    surprised: {
        icon: <Sparkles size={14} />,
        label: "Sorprendido",
        colorClass:
            "bg-state-info-subtle text-state-info outline-state-info/20", // Info/Info Subtle
    },
    fearful: {
        icon: <Skull size={14} />,
        label: "Asustado",
        colorClass:
            "bg-state-error-subtle text-state-error outline-state-error/20",
    },
    disgusted: {
        icon: <Annoyed size={14} />,
        label: "Disgustado",
        colorClass:
            "bg-state-error-subtle text-state-error outline-state-error/20",
    },
    fallback: {
        icon: <Meh size={14} />,
        label: "N/A",
        colorClass: "bg-bg-app text-text-muted outline-border-line",
    },
};

export default function Users({ users = [] }: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [facePhotoFile, setFacePhotoFile] = useState<File | null>(null);
    const [facePhotoPreview, setFacePhotoPreview] = useState<string | null>(
        null,
    );
    const [uploadingFace, setUploadingFace] = useState(false);
    const [currentUserHasFace, setCurrentUserHasFace] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pageSize = 10;

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<UserFormData>({
            name: "",
            email: "",
            role: "player",
            password: "",
            history: [],
        });

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const totalItems = filteredUsers.length;
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedUsers = filteredUsers.slice(
        startIndex,
        startIndex + pageSize,
    );

    const openCreateModal = () => {
        clearErrors();
        reset();
        setFacePhotoFile(null);
        setFacePhotoPreview(null);
        setCurrentUserHasFace(false);
        setEditingUserId(null);
        setIsSlideOverOpen(true);
    };

    const openEditModal = (user: UserData) => {
        clearErrors();
        setData({
            name: user.name,
            email: user.email,
            role: user.role || "player",
            password: "",
            history: (user.history || []).map((h) => ({
                id: h.id,
                game_id: h.game_id,
                num_errors: h.num_errors,
                game_name: h.game_name,
                duration: h.duration,
                played_at: h.played_at,
                primary_emotion: h.primary_emotion,
            })),
        });
        setFacePhotoFile(null);
        setFacePhotoPreview(null);
        setCurrentUserHasFace(user.has_face_photo ?? false);
        setEditingUserId(user.id);
        setIsSlideOverOpen(true);
    };

    const handleFacePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFacePhotoFile(file);
        setFacePhotoPreview(URL.createObjectURL(file));
    };

    const handleUploadFace = async () => {
        if (!facePhotoFile || !editingUserId) return;
        setUploadingFace(true);

        const formData = new FormData();
        formData.append("foto", facePhotoFile);

        try {
            const response = await fetch(`/admin/users/${editingUserId}/face`, {
                method: "POST",
                headers: { "X-XSRF-TOKEN": getCsrfToken() },
                body: formData,
            });

            if (response.ok) {
                setCurrentUserHasFace(true);
                setFacePhotoFile(null);
                setFacePhotoPreview(null);
            }
        } catch (err) {
            console.error("Error subiendo foto:", err);
        } finally {
            setUploadingFace(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUserId) {
            put(route("admin.users.update", { id: editingUserId }), {
                onSuccess: () => setIsSlideOverOpen(false),
            });
        } else {
            post(route("admin.users.store"), {
                onSuccess: () => {
                    setIsSlideOverOpen(false);
                    reset();
                },
            });
        }
    };

    return (
        <MainLayout>
            <Head title="Gestión de Usuarios" />

            <PageHeader
                title="Directorio de Usuarios"
                description="Gestiona los administradores, gestores y jugadores del sistema."
            />

            <div className="flex flex-col gap-4">
                <TableToolbar
                    search={
                        <SearchBar
                            variant="compact"
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    }
                    actions={
                        <Button
                            variant="primary"
                            icon={<Plus size={16} />}
                            onClick={openCreateModal}
                        >
                            Añadir Usuario
                        </Button>
                    }
                />

                <div className="bg-bg-card rounded-xl outline -outline-offset-1 outline-border-line shadow-sm overflow-hidden flex flex-col">
                    <UsersTable
                        users={paginatedUsers}
                        onEdit={openEditModal}
                        onDelete={(user) => setDeletingUserId(user.id)}
                        deletingUserId={deletingUserId}
                        onDeleteConfirm={(user) => {
                            router.delete(
                                route("admin.users.destroy", { id: user.id }),
                                {
                                    onFinish: () => setDeletingUserId(null),
                                },
                            );
                        }}
                        onDeleteCancel={() => setDeletingUserId(null)}
                    />

                    <Pagination
                        currentPage={currentPage}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            <SlideOver
                isOpen={isSlideOverOpen}
                onClose={() => setIsSlideOverOpen(false)}
                title={editingUserId ? "Editar Usuario" : "Nuevo Usuario"}
                description={
                    editingUserId
                        ? "Modifica los datos y permisos de este usuario."
                        : "Rellena los datos para añadir un nuevo usuario."
                }
                width="md"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setIsSlideOverOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            icon={<Save size={16} />}
                            onClick={handleSubmit}
                            disabled={processing}
                        >
                            {editingUserId
                                ? "Guardar Cambios"
                                : "Crear Usuario"}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 bg-bg-card p-5 rounded-lg outline-1 -outline-offset-1 outline-border-line shadow-sm">
                        <h3 className="text-sm font-bold text-text-main border-b border-border-line pb-2">
                            Información Básica
                        </h3>
                        <TextInput
                            label="Nombre Completo"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            error={errors.name}
                            required
                        />
                        <TextInput
                            label="Correo Electrónico"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                            error={errors.email}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-4 bg-bg-card p-5 rounded-lg outline-1 -outline-offset-1 outline-border-line shadow-sm">
                        <h3 className="text-sm font-bold text-text-main border-b border-border-line pb-2">
                            Configuración de Acceso
                        </h3>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-main">
                                Rol
                            </label>
                            <select
                                className="h-10 px-3 rounded-lg bg-bg-app border-none outline-1 -outline-offset-1 outline-border-line text-sm text-text-main focus:outline-brand-primary"
                                value={data.role}
                                onChange={(e) =>
                                    setData("role", e.target.value)
                                }
                            >
                                <option value="player">Player</option>
                                <option value="gestor">Gestor</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                        <TextInput
                            label={
                                editingUserId
                                    ? "Nueva contraseña (dejar vacío para no cambiar)"
                                    : "Contraseña"
                            }
                            type="password"
                            value={data.password}
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                            error={errors.password}
                            required={!editingUserId}
                            placeholder="Mínimo 8 caracteres"
                        />
                    </div>

                    {/* Foto facial — solo en edición */}
                    {editingUserId && (
                        <div className="flex flex-col gap-4 bg-bg-card p-5 rounded-lg outline-1 -outline-offset-1 outline-border-line shadow-sm">
                            <h3 className="text-sm font-bold text-text-main border-b border-border-line pb-2">
                                Foto facial
                            </h3>

                            <div className="flex items-center gap-2 text-sm">
                                {currentUserHasFace ? (
                                    <>
                                        <CheckCircle
                                            size={16}
                                            className="text-state-success"
                                        />
                                        <span className="text-state-success">
                                            Foto registrada
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Camera
                                            size={16}
                                            className="text-text-muted"
                                        />
                                        <span className="text-text-muted">
                                            Sin foto registrada
                                        </span>
                                    </>
                                )}
                            </div>

                            {facePhotoPreview && (
                                <img
                                    src={facePhotoPreview}
                                    alt="Preview"
                                    className="w-full aspect-video object-cover rounded-lg outline-1 -outline-offset-1 outline-border-line"
                                />
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFacePhotoChange}
                            />

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    icon={<Camera size={16} />}
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="flex-1"
                                >
                                    {currentUserHasFace
                                        ? "Cambiar foto"
                                        : "Seleccionar foto"}
                                </Button>
                                {facePhotoFile && (
                                    <Button
                                        type="button"
                                        variant="primary"
                                        icon={<Upload size={16} />}
                                        onClick={handleUploadFace}
                                        disabled={uploadingFace}
                                        className="flex-1"
                                    >
                                        {uploadingFace
                                            ? "Subiendo..."
                                            : "Guardar foto"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {editingUserId && (
                        <div className="flex flex-col gap-4 bg-bg-card p-5 rounded-lg outline-1 -outline-offset-1 outline-border-line shadow-sm">
                            <h3 className="text-sm font-bold text-text-main border-b border-border-line pb-2">
                                Historial de Partidas
                            </h3>

                            {data.history && data.history.length > 0 ? (
                                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                                    {data.history.map((record) => (
                                        <div
                                            key={record.id}
                                            className="flex flex-col p-3 rounded-lg bg-bg-app outline-1 -outline-offset-1 outline-border-line"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-bold text-text-main">
                                                    {record.game_name}
                                                </span>
                                                <span className="text-xs text-text-muted">
                                                    {new Date(
                                                        record.played_at,
                                                    ).toLocaleDateString(
                                                        undefined,
                                                        {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        },
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-text-body">
                                                <span className="flex items-center gap-1">
                                                    Errores:
                                                    <span
                                                        className={
                                                            record.num_errors >
                                                            0
                                                                ? "text-state-error font-bold"
                                                                : "text-state-success font-bold"
                                                        }
                                                    >
                                                        {record.num_errors}
                                                    </span>
                                                </span>
                                                <span>
                                                    Duración:{" "}
                                                    <span className="font-bold">
                                                        {record.duration}s
                                                    </span>
                                                </span>

                                                {record.primary_emotion && (
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="text-text-muted">
                                                            Emoción:
                                                        </span>
                                                        {(() => {
                                                            const config =
                                                                emotionConfig[
                                                                    record
                                                                        .primary_emotion
                                                                ] ||
                                                                emotionConfig.fallback;
                                                            return (
                                                                <span
                                                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold outline-1 -outline-offset-1 shadow-inner-sm ${config.colorClass}`}
                                                                >
                                                                    {
                                                                        config.icon
                                                                    }
                                                                    {
                                                                        config.label
                                                                    }
                                                                </span>
                                                            );
                                                        })()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <p className="text-sm text-text-muted">
                                        Este usuario aún no tiene un historial
                                        de partidas.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </form>
            </SlideOver>
        </MainLayout>
    );
}
