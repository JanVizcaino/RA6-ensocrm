import React from 'react';
import { Head } from '@inertiajs/react';
import GamifiedLayout from '../../Layouts/GamifiedLayout';
import { Gamepad2 } from 'lucide-react';

export default function PlayerDashboard() {
    return (
        <GamifiedLayout>
            <Head title="Zona de Juego" />
            
            <div className="flex flex-col items-center justify-center text-center mt-12 bg-bg-card p-12 rounded-2xl outline -outline-offset-1 outline-border-line shadow-sm">
                <div className="bg-brand-surface p-6 rounded-full mb-6">
                    <Gamepad2 className="w-16 h-16 text-brand-primary" />
                </div>
                <h1 className="text-3xl font-bold text-text-main tracking-tight mb-4">
                    ¡Bienvenido a la Zona de Juego!
                </h1>
                <p className="text-text-body text-lg max-w-md">
                    Próximamente aquí verás los juegos interactivos que tus profesores han preparado para ti.
                </p>
            </div>
        </GamifiedLayout>
    );
}