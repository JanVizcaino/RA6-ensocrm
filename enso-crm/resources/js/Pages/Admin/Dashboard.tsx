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

        </MainLayout>
    );
}