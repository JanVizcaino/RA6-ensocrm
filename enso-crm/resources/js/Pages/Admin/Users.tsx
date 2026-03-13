import React, { useState } from "react";
import { Head } from "@inertiajs/react";
import MainLayout from "../../Layouts/MainLayout";
import { UsersTable, UserData } from "../../Components/modules/UsersTable";
import { Button } from "../../Components/ui/Button";
import { Plus, Filter } from "lucide-react";
import { SearchBar } from "../../Components/shared/SearchBar";
import { TableToolbar } from "@/Components/shared/TableToolbar";
import { Pagination } from "@/Components/shared/Pagination";

interface Props {
    users: UserData[];
}

export default function Users({ users = [] }: Props) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <MainLayout>
            <Head title="Gestión de Usuarios" />

            {/* Cabecera de Página */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-main tracking-tight">
                        Directorio de Usuarios
                    </h1>
                    <p className="text-text-body mt-1 text-sm">
                        Gestiona los administradores, gestores y jugadores del
                        sistema.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <TableToolbar
                    search={
                        <SearchBar 
                            variant="compact" 
                            placeholder="Buscar por nombre o email..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    }
                    filters={
                        <>
                            <Button variant="ghost" icon={<Filter size={14} />} className="h-8 text-xs">
                                Rol
                            </Button>
                            <Button variant="ghost" icon={<Filter size={14} />} className="h-8 text-xs">
                                Estado
                            </Button>
                        </>
                    }
                    actions={
                        <Button variant="primary" icon={<Plus size={16} />}>
                            Añadir Usuario
                        </Button>
                    }
                />

                <div className="bg-bg-card rounded-xl outline outline-1 -outline-offset-1 outline-border-line shadow-sm overflow-hidden">
                    <UsersTable users={filteredUsers} />
                </div>
            </div>

        </MainLayout>
    );
}