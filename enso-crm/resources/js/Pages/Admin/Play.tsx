import React, { useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import CardSortingGame3D from '../../Components/games/CardSortingGame3D';
import { Button } from '../../Components/ui/Button';
import { ArrowLeft } from 'lucide-react';

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

export default function AdminPlay({ game }: Props) {
    return (
        <MainLayout>
            <Head title={`Demo: ${game.name}`} />

            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="secondary"
                    icon={<ArrowLeft size={16} />}
                    onClick={() => router.visit(route('admin.games.index'))}
                >
                    Volver al catálogo
                </Button>
                <div>
                    <h1 className="text-xl font-bold text-text-main">{game.name}</h1>
                    <p className="text-sm text-text-muted">Modo demo — los resultados no se guardan</p>
                </div>
            </div>

            <div className="w-full h-[calc(100vh-220px)] rounded-xl overflow-hidden outline-1 -outline-offset-1 outline-border-line shadow-sm">
                <CardSortingGame3D />
            </div>
        </MainLayout>
    );
}