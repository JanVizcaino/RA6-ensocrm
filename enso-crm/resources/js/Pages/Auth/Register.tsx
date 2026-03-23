import React from 'react';
import { useForm, Link } from '@inertiajs/react';
import { Logo } from '@/Components/ui/Logo';
import { Button } from '@/Components/ui/Button';
import { TextInput } from '@/Components/ui/TextInput';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-bg-app overflow-hidden font-sans">

            <div
                className="absolute inset-0 z-0 opacity-50"
                style={{
                    backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                }}
            />
            <div className="absolute inset-0 z-0 bg-linear-to-t from-bg-app via-transparent to-transparent" />

            <div className="relative z-10 w-full max-w-md px-4">
                <div className="bg-bg-card rounded-2xl shadow-xl outline -outline-offset-1 outline-border-line p-8 md:p-10 text-center">

                    <div className="flex justify-center mb-8">
                        <Logo className="text-brand-primary h-12 w-auto" />
                    </div>

                    <h1 className="text-2xl font-bold text-text-main mb-2 tracking-tight">
                        Crear cuenta
                    </h1>
                    <p className="text-text-body text-sm mb-8">
                        Regístrate para acceder a la plataforma.
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
                        <TextInput
                            label="Nombre completo"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Tu nombre"
                            required
                            error={errors.name}
                        />

                        <TextInput
                            label="Correo electrónico"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="nombre@ejemplo.com"
                            required
                            error={errors.email}
                        />

                        <TextInput
                            label="Contraseña"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            required
                            error={errors.password}
                        />

                        <TextInput
                            label="Confirmar contraseña"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="Repite tu contraseña"
                            required
                            error={errors.password_confirmation}
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full mt-2"
                            isLoading={processing}
                        >
                            Crear cuenta
                        </Button>
                    </form>

                    <p className="text-sm text-text-body">
                        ¿Ya tienes cuenta?{' '}
                        <Link
                            href="/login"
                            className="text-brand-primary font-semibold hover:underline"
                        >
                            Inicia sesión
                        </Link>
                    </p>

                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-text-muted font-medium font-mono">
                        &copy; {new Date().getFullYear()} ENSO v1.0.0
                    </p>
                </div>
            </div>

        </div>
    );
}