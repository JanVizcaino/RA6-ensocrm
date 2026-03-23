import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import GamifiedLayout from '../../Layouts/GamifiedLayout';
import { GameCardPlayer } from '../../Components/shared/GameCardPlayer';
import { PageHeader } from '../../Components/shared/PageHeader';
import { Gamepad2, X, CheckCircle, XCircle } from 'lucide-react';

interface Game {
    id: number;
    name: string;
    description: string;
    path: string;
    is_published: boolean;
}

interface GameResult {
    errors: number;
    duration: number | null;
}

interface Props {
    games: Game[];
}

export default function PlayerIndex({ games = [] }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [gameResult, setGameResult] = useState<GameResult | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('gameResult');
        if (stored) {
            setGameResult(JSON.parse(stored));
            setShowModal(true);
            sessionStorage.removeItem('gameResult');
        }
    }, []);

    return (
        <GamifiedLayout>
            <Head title="Zona de Juego" />

            <PageHeader
                title="Zona de Juego"
                description="Selecciona un juego para comenzar."
            />

            {games.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center mt-12 bg-bg-card p-12 rounded-2xl outline -outline-offset-1 outline-border-line shadow-sm">
                    <div className="bg-brand-surface p-6 rounded-full mb-6">
                        <Gamepad2 className="w-16 h-16 text-brand-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-text-main tracking-tight mb-4">
                        No hay juegos disponibles
                    </h1>
                    <p className="text-text-body text-lg max-w-md">
                        Tu profesor aún no ha publicado ningún juego.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {games.map((game) => (
                        <GameCardPlayer
                            key={game.id}
                            game={game}
                            onPlay={(g) => router.visit(route('player.games.play', { id: g.id }))}
                        />
                    ))}
                </div>
            )}

            {/* Modal de resultados */}
            {showModal && gameResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-bg-card rounded-2xl shadow-2xl outline-1 -outline-offset-1 outline-border-line p-8 w-full max-w-sm mx-4 relative">

                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-xl font-bold text-text-main mb-1">¡Partida completada!</h2>
                        <p className="text-text-muted text-sm mb-6">Estos son tus resultados.</p>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-bg-app rounded-xl p-4 text-center outline-1 -outline-offset-1 outline-border-line">
                                <CheckCircle className="w-6 h-6 text-state-success mx-auto mb-1" />
                                <div className="text-2xl font-bold text-text-main">
                                    {20 - gameResult.errors}
                                </div>
                                <div className="text-xs text-text-muted uppercase tracking-widest mt-1">Aciertos</div>
                            </div>
                            <div className="bg-bg-app rounded-xl p-4 text-center outline-1 -outline-offset-1 outline-border-line">
                                <XCircle className="w-6 h-6 text-state-error mx-auto mb-1" />
                                <div className="text-2xl font-bold text-text-main">
                                    {gameResult.errors}
                                </div>
                                <div className="text-xs text-text-muted uppercase tracking-widest mt-1">Errores</div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowModal(false)}
                            className="w-full py-2.5 px-4 bg-brand-primary hover:opacity-90 text-white font-semibold rounded-xl transition-opacity text-sm"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </GamifiedLayout>
    );
}