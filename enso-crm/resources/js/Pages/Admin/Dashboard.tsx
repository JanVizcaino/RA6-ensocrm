import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';

export default function Dashboard() {
    return (
        <MainLayout>
            <Head title="Panel de Control" />
            
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-main tracking-tight">Panel Principal</h1>
                <p className="text-text-body mt-1">Resumen de actividad y métricas del sistema.</p>
            </div>

            {/* Tarjeta de prueba Soft UI */}
            <div className="bg-bg-card p-6 rounded-xl outline -outline-offset-1 outline-border-line shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-state-success"></div>
                    <p className="text-text-main font-medium">El sistema está operando correctamente.</p>
                </div>
            </div>
        </MainLayout>
    );
}