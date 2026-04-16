import React from "react";
import { Pencil, Trash2, Camera, CheckCircle } from "lucide-react";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "../ui/Table";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

export interface UserData {
    id: number;
    name: string;
    email: string;
    role: string;
    has_face_photo?: boolean;
    lastAccess?: string;
    status?: "active" | "inactive";
    history?: UserHistory[];
}

export interface UserHistory {
    id: number;
    game_id: number;
    game_name: string;
    num_errors: number;
    duration: number;
    played_at: Date;
    primary_emotion: string;
}

interface UsersTableProps {
    users: UserData[];
    onEdit?: (user: UserData) => void;
    onDelete?: (user: UserData) => void;
    deletingUserId?: number | null;
    onDeleteConfirm?: (user: UserData) => void;
    onDeleteCancel?: () => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
    users = [],
    onEdit,
    onDelete,
    deletingUserId,
    onDeleteConfirm,
    onDeleteCancel,
}) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead sortable className="w-24">
                        ID
                    </TableHead>
                    <TableHead sortable className="w-48">
                        Usuario
                    </TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead sortable>Último Acceso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Facial</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="text-text-muted text-xs font-mono">
                            #{user.id}
                        </TableCell>

                        <TableCell>
                            <div className="flex flex-col justify-start items-start gap-0.5">
                                <span className="font-bold text-text-main text-sm">
                                    {user.name}
                                </span>
                            </div>
                        </TableCell>

                        <TableCell>
                            <Badge
                                label={user.role || "Sin Rol"}
                                variant={
                                    user.role === "admin"
                                        ? "red"
                                        : user.role === "gestor"
                                          ? "yellow"
                                          : "blue"
                                }
                            />
                        </TableCell>

                        <TableCell className="text-text-body text-sm">
                            {user.email}
                        </TableCell>

                        <TableCell className="text-text-body text-sm">
                            {user.lastAccess || "Nunca"}
                        </TableCell>

                        <TableCell>
                            <Badge
                                label={
                                    user.status === "active"
                                        ? "Activo"
                                        : "Inactivo"
                                }
                                variant={
                                    user.status === "active" ? "green" : "gray"
                                }
                                withDot
                            />
                        </TableCell>

                        <TableCell>
                            {user.has_face_photo ? (
                                <CheckCircle
                                    size={16}
                                    className="text-state-success"
                                />
                            ) : (
                                <Camera
                                    size={16}
                                    className="text-text-muted opacity-40"
                                />
                            )}
                        </TableCell>

                        <TableCell>
                            <div className="flex items-center justify-end gap-2">
                                {deletingUserId === user.id ? (
                                    <>
                                        <button
                                            onClick={() =>
                                                onDeleteConfirm?.(user)
                                            }
                                            className="text-xs text-state-error font-semibold hover:underline"
                                        >
                                            Confirmar
                                        </button>
                                        <span className="text-text-muted text-xs">
                                            ·
                                        </span>
                                        <button
                                            onClick={onDeleteCancel}
                                            className="text-xs text-text-muted hover:underline"
                                        >
                                            Cancelar
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="icon-only"
                                            icon={<Pencil size={16} />}
                                            aria-label="Editar Usuario"
                                            onClick={() => onEdit?.(user)}
                                        />
                                        <Button
                                            variant="icon-only"
                                            icon={<Trash2 size={16} />}
                                            aria-label="Eliminar Usuario"
                                            onClick={() => onDelete?.(user)}
                                        />
                                    </>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};
