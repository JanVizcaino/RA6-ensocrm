import React from "react";
import { useForm, Link } from "@inertiajs/react";
import { Logo } from "@/Components/ui/Logo";
import { Button } from "@/Components/ui/Button";
import { TextInput } from "@/Components/ui/TextInput";

const MicrosoftIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" aria-hidden="true">
        <path d="M10 0H0V10H10V0Z" fill="#F25022" />
        <path d="M21 0H11V10H21V0Z" fill="#7FBA00" />
        <path d="M10 11H0V21H10V11Z" fill="#00A4EF" />
        <path d="M21 11H11V21H21V11Z" fill="#FFB900" />
    </svg>
);

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: "",
        password: "",
    });

    const handleCredentialsLogin = (e: React.FormEvent) => {
        e.preventDefault();
        post("/login");
    };

    const handleMicrosoftLogin = () => {
        window.location.href = "/auth/microsoft";
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-bg-app overflow-hidden font-sans">
            <div
                className="absolute inset-0 z-0 opacity-50"
                style={{
                    backgroundImage:
                        "radial-gradient(#e5e7eb 1px, transparent 1px)",
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
                        Bienvenido a ENSO
                    </h1>
                    <p className="text-text-body text-sm mb-8">
                        Por favor, identifícate para continuar.
                    </p>

                    <form
                        onSubmit={handleCredentialsLogin}
                        className="flex flex-col gap-4 mb-6"
                    >
                        <TextInput
                            label="Correo electrónico"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                            placeholder="nombre@ejemplo.com"
                            required
                            error={errors.email}
                        />

                        <TextInput
                            label="Contraseña"
                            type="password"
                            value={data.password}
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                            placeholder="••••••••"
                            required
                            error={errors.password}
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full mt-2"
                            isLoading={processing}
                        >
                            Iniciar sesión
                        </Button>
                    </form>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-border-line" />
                        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                            o continuar con
                        </span>
                        <div className="flex-1 h-px bg-border-line" />
                    </div>

                    <Button
                        type="button"
                        onClick={handleMicrosoftLogin}
                        variant="secondary"
                        className="w-full"
                        icon={<MicrosoftIcon />}
                        iconPosition="left"
                        disabled={processing}
                    >
                        Microsoft 365
                    </Button>

                    <p className="mt-8 text-[10px] text-text-muted leading-relaxed uppercase tracking-wider font-medium">
                        Acceso restringido únicamente a personal autorizado de
                        ENSO. Todas las actividades pueden ser monitoreadas.
                    </p>
                </div>

                <p className="mt-6 text-sm text-text-body">
                    ¿No tienes cuenta?{" "}
                    <Link
                        href="/register"
                        className="text-brand-primary font-semibold hover:underline"
                    >
                        Regístrate
                    </Link>
                </p>

                <div className="mt-8 text-center">
                    <p className="text-xs text-text-muted font-medium font-mono">
                        &copy; {new Date().getFullYear()} ENSO v1.0.0
                    </p>
                </div>
            </div>
        </div>
    );
}
