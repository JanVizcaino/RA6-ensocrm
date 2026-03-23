import React, { useEffect } from 'react';
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

export default function Play({ game }: Props) {
    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.data?.type !== 'GAME_OVER') return;

            const { errors, duration } = event.data.payload ?? {};

            try {
                const response = await fetch(`/api/games/${game.id}/finish`, {
                    method:  'POST',
                    headers: {
                        'Content-Type':  'application/json',
                        'Accept':        'application/json',
                        'X-XSRF-TOKEN':  getCsrfToken(),
                    },
                    body: JSON.stringify({
                        errors:   errors   ?? null,
                        duration: duration ?? null,
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    // Guardamos el resultado en sessionStorage para mostrarlo en el dashboard
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

    return (
        <>
            <Head title={game.name} />
            <div className="fixed inset-0 z-50 bg-slate-900">
                <CardSortingGame3D />
            </div>
        </>
    );
}