import React, { useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import MainLayout from "../../Layouts/MainLayout";
import { GameCard, GameData } from "../../Components/shared/GameCard";
import { Button } from "../../Components/ui/Button";
import { Save, Package } from "lucide-react";
import { SearchBar } from "../../Components/shared/SearchBar";
import { TableToolbar } from "@/Components/shared/TableToolbar";
import { SlideOver } from "@/Components/ui/SlideOver";
import { TextInput } from "@/Components/ui/TextInput";
import { Pagination } from "@/Components/shared/Pagination"; // <-- 1. Importar Paginación
import { PageHeader } from "@/Components/shared/PageHeader";

interface Props {
    games: GameData[];
}

export default function Games({ games = [] }: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [editingGameId, setEditingGameId] = useState<number | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;

    const { data, setData, put, processing, errors, clearErrors } = useForm({
        name: "",
        description: "",
        path: "",
        is_published: false,
    });

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); 
    };

    const filteredGames = games.filter(game => 
        game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalItems = filteredGames.length;
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedGames = filteredGames.slice(startIndex, startIndex + pageSize);

    const openEditModal = (game: GameData) => {
        clearErrors();
        setData({
            name: game.name,
            description: game.description,
            path: game.path,
            is_published: game.is_published,
        });
        setEditingGameId(game.id);
        setIsSlideOverOpen(true);
    };

    const handlePlayDemo = (game: GameData) => {
        window.open(game.path, "_blank");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingGameId) {
            put(route("admin.games.update", { id: editingGameId }), {
                onSuccess: () => setIsSlideOverOpen(false),
            });
        }
    };

    return (
        <MainLayout>
            <Head title="Biblioteca de Juegos" />

            <PageHeader
                title="Catálogo de Juegos"
                description="Gestiona, edita y publica los juegos disponibles para los alumnos."
            />

            <div className="flex flex-col gap-6">
                <TableToolbar
                    search={
                        <SearchBar
                            variant="compact"
                            placeholder="Buscar juego por título..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    }
                />

                {totalItems > 0 ? (
                    <div className="flex flex-col bg-bg-card rounded-xl outline-1 -outline-offset-1 outline-border-line shadow-sm overflow-hidden">
                        
                        {/* Grid de Juegos con padding interno */}
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-bg-app">
                            {paginatedGames.map((game) => (
                                <GameCard 
                                    key={game.id} 
                                    game={game} 
                                    onEdit={openEditModal}
                                    onPlay={handlePlayDemo}
                                />
                            ))}
                        </div>

                        {/* Componente de Paginación anclado al final */}
                        <Pagination 
                            currentPage={currentPage}
                            totalItems={totalItems}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                ) : (
                    <div className="w-full py-16 flex flex-col items-center justify-center bg-bg-card rounded-xl outline-1 -outline-offset-1 outline-border-line border-dashed">
                        <Package size={48} className="text-text-muted mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-text-main">No hay juegos disponibles</h3>
                        <p className="text-text-body text-sm mt-1">Prueba a cambiar los términos de búsqueda.</p>
                    </div>
                )}
            </div>

            <SlideOver
                isOpen={isSlideOverOpen}
                onClose={() => setIsSlideOverOpen(false)}
                title="Editar Juego"
                description="Modifica los metadatos, la ruta de acceso o el estado de publicación de este juego."
                width="md"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setIsSlideOverOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            icon={<Save size={16} />}
                            onClick={handleSubmit}
                            disabled={processing}
                        >
                            Guardar Cambios
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 bg-bg-card p-5 rounded-lg outline-1 -outline-offset-1 outline-border-line shadow-sm">
                        <h3 className="text-sm font-bold text-text-main border-b border-border-line pb-2">
                            Información del Juego
                        </h3>

                        <TextInput
                            label="Título del Juego"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            error={errors.name}
                            required
                        />

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-main">
                                Descripción
                            </label>
                            <textarea
                                className="min-h-[100px] p-3 rounded-lg bg-bg-app border-none outline-1 -outline-offset-1 outline-border-line text-sm text-text-main focus:outline-brand-primary resize-none"
                                value={data.description}
                                onChange={(e) =>
                                    setData("description", e.target.value)
                                }
                            />
                            {errors.description && (
                                <span className="text-xs text-state-error mt-1">
                                    {errors.description}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 bg-bg-card p-5 rounded-lg outline-1 -outline-offset-1 outline-border-line shadow-sm">
                        <h3 className="text-sm font-bold text-text-main border-b border-border-line pb-2">
                            Configuración Técnica
                        </h3>

                        <TextInput
                            label="Ruta de acceso (Path / URL)"
                            value={data.path}
                            onChange={(e) => setData("path", e.target.value)}
                            error={errors.path}
                            required
                        />

                        <div className="flex items-center gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="is_published"
                                className="w-4 h-4 rounded border-border-line text-brand-primary focus:ring-brand-primary"
                                checked={data.is_published}
                                onChange={(e) =>
                                    setData("is_published", e.target.checked)
                                }
                            />
                            <label
                                htmlFor="is_published"
                                className="text-sm font-medium text-text-main cursor-pointer"
                            >
                                Publicar juego (Hacerlo visible para los
                                alumnos)
                            </label>
                        </div>
                    </div>
                </form>
            </SlideOver>
        </MainLayout>
    );
}
