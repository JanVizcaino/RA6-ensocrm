import React from "react";
import { Link, usePage } from "@inertiajs/react";
import {
  Menu, Bell, ChevronRight, Home, Search,
  CircleHelp, UserCircle, Rocket, Trophy, Heart, LogOut,
} from "lucide-react";
import { PageProps, Role } from "../../types";
import { Logo } from "../ui/Logo";

interface HeaderProps {
  onToggleSidebar: () => void;
  userRole?: Role;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, userRole }) => {
  const { props } = usePage<PageProps>();
  const { user } = props.auth;
  const roleName = userRole?.name;

  if (roleName === "Admin") {
    return (
      <header className="h-18 shrink-0 bg-bg-card/90 backdrop-blur-md border-b border-border-line flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm font-sans transition-all">
        
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-bg-app text-text-main transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:flex items-center text-sm text-text-muted font-medium">
            <Home size={14} className="mr-2" />
            <span>Dashboard</span>
            <ChevronRight size={14} className="mx-1 opacity-50" />
            <span className="text-text-main">Overview</span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden lg:flex items-center bg-bg-app rounded-full px-3 py-1.5 gap-2 border border-transparent focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-brand-primary transition-all">
            <Search className="w-4 h-4 text-text-muted ml-1" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none focus:ring-0 text-sm text-text-main w-48 placeholder:text-text-muted outline-none"
            />
            <div className="px-1.5 py-0.5 rounded outline -outline-offset-1 outline-border-line bg-bg-card text-[10px] text-text-muted font-mono tracking-tighter">
              Ctrl K
            </div>
          </div>

          <div className="flex items-center gap-3 text-text-muted">
            <button className="p-1.5 rounded-full hover:bg-bg-app hover:text-brand-primary transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-1.5 rounded-full hover:bg-bg-app hover:text-brand-primary transition-colors">
              <CircleHelp className="w-5 h-5" />
            </button>
          </div>

          <div className="w-px h-6 bg-border-line mx-1" />

          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-text-main leading-tight group-hover:text-brand-primary transition-colors">
                {user.name}
              </p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                {roleName}
              </p>
            </div>
            <div className="h-9 w-9 bg-brand-surface rounded-full flex items-center justify-center text-brand-primary font-bold outline-1 -outline-offset-1 outline-border-line shadow-sm group-hover:scale-105 transition-transform">
              <UserCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="h-20 bg-bg-card border-b border-border-line flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm font-sans">
      <div className="flex items-center gap-10">
        <Logo className="h-10 text-brand-primary" />
        <nav className="flex items-center gap-8">
          <Link href="/alumn/dashboard" className="flex items-center gap-2 text-text-body hover:text-brand-primary transition-colors font-medium">
            <Rocket className="w-4 h-4" /> Inicio
          </Link>
          <Link href="/alumn/progress" className="flex items-center gap-2 text-text-body hover:text-brand-primary transition-colors font-medium">
            <Trophy className="w-4 h-4" /> Progreso
          </Link>
          <Link href="/alumn/space" className="flex items-center gap-2 text-text-body hover:text-brand-primary transition-colors font-medium">
            <Heart className="w-4 h-4" /> Mi espacio
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-text-muted hover:text-brand-primary transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-border-line" />
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-brand-surface rounded-full flex items-center justify-center text-brand-primary">
            <UserCircle className="w-5 h-5" />
          </div>
          <p className="text-text-main text-sm">
            Hola, <span className="font-bold">{user.name}</span>
          </p>
        </div>
        <Link href={route('logout')} method="post" as="button" className="flex items-center text-sm text-text-muted hover:text-state-error transition-colors">
          <LogOut size={18} className="mr-2" />
          Salir
        </Link>
      </div>
    </header>
  );
};