// resources/js/types/index.ts

import { Config, RouteName, RouteParams } from 'ziggy-js';

declare global {
    function route(): Config;
    function route<T extends RouteName>(
        name: T, 
        params?: RouteParams<T>, 
        absolute?: boolean, 
        config?: Config
    ): string;
}
export interface Role {
    id: number;
    name: 'Admin' | 'Gestor' | 'Jugador';
    created_at?: string;
    updated_at?: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role_id: number | null;
    role?: Role; // Relación con la tabla enso_roles
}

export interface PageProps extends Record<string, unknown> {
    auth: {
        user: User;
    };
    // Aquí puedes añadir más props globales de Inertia en el futuro (flash messages, etc)
}