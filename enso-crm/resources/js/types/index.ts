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

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role: 'admin' | 'gestor' | 'player';
}

export interface PageProps extends Record<string, unknown> {
    auth: {
        user: User;
    };
    flash: {
        gameResult?: {
            errors: number;
            duration: number | null;
        };
        success?: string;
    };
}