// resources/js/Pages/Player/History.tsx
import React from 'react';
import { Head } from '@inertiajs/react';
import GamifiedLayout from '../../Layouts/GamifiedLayout';
import { PageHeader } from '../../Components/shared/PageHeader';
import { History, Clock, XCircle, Smile, Gamepad2 } from 'lucide-react';

interface HistoryEntry {
    id: string;
    game_id: number;
    game_name: string;
    num_errors: number | null;
    duration: number | null;
    played_at: string;
    primary_emotion: string;
}

interface Props {
    userHistory: HistoryEntry[];
}

function formatDuration(seconds: number | null): string {
    if (seconds === null) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function PlayerHistory({ userHistory = [] }: Props) {
    return (
        <GamifiedLayout>
            <Head title="Mi Historial" />

            <PageHeader
                title="Mi Historial"
                description="Consulta todas tus partidas jugadas."
            />

            {userHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center mt-12 bg-bg-card p-12 rounded-2xl outline -outline-offset-1 outline-border-line shadow-sm">
                    <div className="bg-brand-surface p-6 rounded-full mb-6">
                        <Gamepad2 className="w-16 h-16 text-brand-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-main tracking-tight mb-2">
                        Aún no has jugado ninguna partida
                    </h2>
                    <p className="text-text-body text-sm max-w-sm">
                        Cuando completes un juego, tus resultados aparecerán aquí.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {userHistory.map((entry) => (
                        <div
                            key={entry.id}
                            className="bg-bg-card rounded-xl outline -outline-offset-1 outline-border-line shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
                        >
                            {/* Icono */}
                            <div className="bg-brand-surface p-3 rounded-lg shrink-0 self-start sm:self-auto">
                                <History className="w-5 h-5 text-brand-primary" />
                            </div>

                            {/* Nombre del juego + fecha */}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-text-main text-sm leading-tight truncate">
                                    {entry.game_name}
                                </p>
                                <p className="text-xs text-text-muted mt-0.5">
                                    {formatDate(entry.played_at)}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-1.5 text-xs text-text-body">
                                    <Clock className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                                    <span>{formatDuration(entry.duration)}</span>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs text-text-body">
                                    <XCircle className="w-3.5 h-3.5 text-state-error shrink-0" />
                                    <span>{entry.num_errors ?? 0} errores</span>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs text-text-body">
                                    <Smile className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                                    <span className="capitalize">{entry.primary_emotion}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </GamifiedLayout>
    );
}