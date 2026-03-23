import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Users, Book,
    LogOut, X, ChevronRight, Home, Folder, Gamepad2
} from 'lucide-react';
import { Logo } from '../ui/Logo';

interface NavSubItem {
    name: string;
    path: string;
}

interface NavItem {
    name: string;
    path?: string;
    icon?: React.ElementType;
    subItems?: NavSubItem[];
}

interface SidebarProps {
    isOpen: boolean;
    isCollapsed: boolean;
    onClose: () => void;
    onToggleCollapse: () => void;
    userRole?: 'admin' | 'player' | 'gestor';
}

const getNavItems = (role?: 'admin' | 'gestor' | 'player'): NavItem[] => {
    switch (role) {
        case 'admin':
            return [
                { name: 'Dashboard', path: '/admin/dashboard', icon: Home     },
                { name: 'Juegos',    path: '/admin/games',     icon: Gamepad2 },
                { name: 'Usuarios',  path: '/admin/users',     icon: Users    },
            ];
        case 'gestor':
            return [
                { name: 'Dashboard', path: '/admin/dashboard', icon: Home     },
                { name: 'Juegos',    path: '/admin/games',     icon: Gamepad2 },
            ];
        case 'player':
            return [
                { name: 'Mis Juegos', path: '/player/dashboard', icon: Gamepad2 },
            ];
        default:
            return [];
    }
};
export const Sidebar: React.FC<SidebarProps> = ({
    isOpen, isCollapsed, onClose, onToggleCollapse, userRole
}) => {
    const { url } = usePage();
    const navItems = getNavItems(userRole);
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    const handleExpandMenu = (itemName: string) => {
        if (isCollapsed) onToggleCollapse();
        setExpandedItem(expandedItem === itemName ? null : itemName);
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-text-main/40 backdrop-blur-sm z-30 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={onClose}
            />

            <aside
                className={`
                    bg-brand-primary text-white flex flex-col h-screen shrink-0 shadow-2xl z-40
                    transition-all duration-300 ease-in-out
                    fixed md:relative top-0 left-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    ${isCollapsed ? 'md:w-20' : 'md:w-64 w-64'}
                `}
            >
                <div className="h-18 flex items-center justify-center border-b border-white/10 px-4 relative shrink-0">
                    <Logo className={`h-10 text-white ${isCollapsed ? 'transition-all duration-300 w-8 overflow-hidden' : 'w-auto'}`} />

                    <button
                        onClick={onToggleCollapse}
                        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-brand-surface text-brand-primary rounded-full items-center justify-center shadow-md hover:scale-110 transition-transform"
                    >
                        <ChevronRight size={14} className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
                    </button>

                    <button onClick={onClose} className="md:hidden absolute right-4 text-white/50 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2 overflow-x-hidden">
                    {navItems.map((item) => {
                        const hasValidSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
                        const Icon = item.icon || Folder;
                        const isExpanded = expandedItem === item.name;
                        const isChildActive = hasValidSubItems ? item.subItems!.some(sub => url.startsWith(sub.path)) : false;
                        const isActive = item.path ? url === item.path : false;

                        if (hasValidSubItems) {
                            return (
                                <div key={item.name} className={`rounded-xl transition-all ${isExpanded || isChildActive ? 'bg-white/10' : ''}`}>
                                    <button
                                        onClick={() => handleExpandMenu(item.name)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={20} className={`shrink-0 ${isExpanded || isChildActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                                            <span className={`transition-opacity duration-300 whitespace-nowrap ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 font-medium'} ${isExpanded || isChildActive ? 'text-white' : 'text-white/90'}`}>
                                                {item.name}
                                            </span>
                                        </div>
                                        {!isCollapsed && <ChevronRight size={14} className={`transition-transform text-white/50 ${isExpanded ? 'rotate-90' : ''}`} />}
                                    </button>

                                    {isExpanded && !isCollapsed && (
                                        <div className="mt-1 mb-2 ml-9 flex flex-col gap-1.5 border-l border-white/10 pl-3">
                                            {item.subItems!.map((sub) => (
                                                <Link
                                                    key={sub.path}
                                                    href={sub.path}
                                                    className={`text-xs py-1.5 transition-colors ${url === sub.path ? 'font-bold text-white' : 'font-normal text-white/60 hover:text-white'}`}
                                                >
                                                    {sub.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.path || '#'}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${isActive ? 'bg-white/20 font-bold' : 'text-white/90 hover:bg-white/10'}`}
                                title={isCollapsed ? item.name : undefined}
                            >
                                <Icon size={20} className={`shrink-0 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                                <span className={`transition-opacity duration-300 whitespace-nowrap ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 font-medium'}`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 bg-black/10 shrink-0">
                    <Link
                        href="/logout" method="post" as="button"
                        className="flex items-center justify-center md:justify-start w-full p-2 text-sm text-white/70 hover:text-white transition-colors group"
                        title={isCollapsed ? 'Cerrar Sesión' : undefined}
                    >
                        <LogOut size={20} className={`shrink-0 ${!isCollapsed && 'mr-3'} group-hover:scale-110 transition-transform`} />
                        {!isCollapsed && <span>Cerrar Sesión</span>}
                    </Link>
                </div>
            </aside>
        </>
    );
};