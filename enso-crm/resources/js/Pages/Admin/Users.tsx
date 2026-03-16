import React, { useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import MainLayout from "../../Layouts/MainLayout";
import { UsersTable, UserData } from "../../Components/modules/UsersTable";
import { Button } from "../../Components/ui/Button";
import { Plus, Filter, Save } from "lucide-react";
import { SearchBar } from "../../Components/shared/SearchBar";
import { TableToolbar } from "@/Components/shared/TableToolbar";
import { SlideOver } from "@/Components/ui/SlideOver";
import { TextInput } from "@/Components/ui/TextInput";
import { PageHeader } from "@/Components/shared/PageHeader";
import { Pagination } from "@/Components/shared/Pagination"; 

interface Props {
    users: UserData[];
}

export default function Users({ users = [] }: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: "",
            email: "",
            role: "Jugador",
        });

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); 
    };

    const totalItems = filteredUsers.length;
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedUsers = filteredUsers.slice(
        startIndex,
        startIndex + pageSize,
    );

    const openCreateModal = () => {
        clearErrors();
        reset();
        setEditingUserId(null);
        setIsSlideOverOpen(true);
    };

    const openEditModal = (user: UserData) => {
        clearErrors();
        setData({
            name: user.name,
            email: user.email,
            role: user.role || "Jugador",
        });
        setEditingUserId(user.id);
        setIsSlideOverOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingUserId) {
            put(route("admin.users.update", { id: editingUserId }), {
                onSuccess: () => {
                    setIsSlideOverOpen(false);
                },
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
                            onChange={handleSearch}
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
                    <UsersTable users={paginatedUsers} onEdit={openEditModal} />
                    
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
                        : "Rellena los datos para invitar a un nuevo usuario al sistema ENSO."
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
                <form
                    id="userForm"
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-6"
                >
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
                                Asignar Rol
                            </label>
                            <select
                                className="h-10 px-3 rounded-lg bg-bg-app border-none outline-1 -outline-offset-1 outline-border-line text-sm text-text-main focus:outline-brand-primary"
                                value={data.role}
                                onChange={(e) =>
                                    setData("role", e.target.value)
                                }
                            >
                                <option value="Jugador">Jugador</option>
                                <option value="Gestor">Gestor</option>
                                <option value="Admin">Administrador</option>
                            </select>
                        </div>
                    </div>
                </form>
            </SlideOver>
        </MainLayout>
    );
}