'use client';

/**
 * @file Navbar.tsx
 * @description Barra de navegación empresarial adaptativa (Tema Blanco y Negro).
 *              Filtra estrictamente los enlaces según el rol del usuario autenticado
 *              (Arrendatario, Propietario, Administrador/Secretario) y ofrece control
 *              de sesión y alternancia de tema.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Building2,
  FileSignature,
  LayoutGrid,
  LogIn,
  LogOut,
  Moon,
  PlusCircle,
  Scale,
  Search,
  ShieldCheck,
  Sun,
  User,
} from 'lucide-react';
import { usePropTech } from '../../context/PropTechContext';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, theme, toggleTheme } = usePropTech();

  // Enlaces de navegación con control estricto de acceso por rol
  const navItems = [
    {
      href: '/',
      label: 'Buscador Sumapaz',
      icon: Search,
      allowedRoles: ['tenant', 'landlord', 'agent'],
    },
    {
      href: '/panel',
      label:
        currentUser.role === 'agent'
          ? 'Panel Administrador'
          : currentUser.role === 'landlord'
            ? 'Panel Propietario'
            : 'Mi Panel (Inquilino)',
      icon: LayoutGrid,
      allowedRoles: ['tenant', 'landlord', 'agent'],
    },
    {
      href: '/publicar',
      label: 'Publicar Inmueble',
      icon: PlusCircle,
      allowedRoles: ['landlord', 'agent'], // Propietario y Administrador
    },
    {
      href: '/contratos',
      label: 'Contratos SHA-256',
      icon: FileSignature,
      allowedRoles: ['agent'], // Exclusivo Administrador
    },
    {
      href: '/dashboard',
      label: 'KPIs & IPC',
      icon: BarChart3,
      allowedRoles: ['agent'], // Exclusivo Administrador
    },
    {
      href: '/legal',
      label: 'Habeas Data & PQRS',
      icon: Scale,
      allowedRoles: ['agent'], // Exclusivo Administrador
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    item.allowedRoles.includes(currentUser.role)
  );

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="border-b border-slate-200 bg-white/95 text-slate-800 shadow-sm backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Marca PropTech Colombia - Región del Sumapaz */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
                PropTech Sumapaz
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Fusagasugá
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Ley 820/2003 • Ley 1581/2012 • Ley 527/1999
            </p>
          </div>
        </Link>

        {/* Enlaces de Módulos Autorizados */}
        <div className="flex flex-wrap items-center gap-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Controles: Alternar Tema (Blanco / Negro) + Estado de Sesión y Logout */}
        <div className="flex items-center gap-2">
          {/* Botón de Cambio de Tema (Blanco y Negro) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={
              theme === 'light'
                ? 'Cambiar a Tema Negro (Modo Oscuro)'
                : 'Cambiar a Tema Blanco (Modo Claro)'
            }
            aria-label="Alternar tema blanco y negro"
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
              theme === 'dark'
                ? 'border-amber-400 bg-neutral-800 text-amber-300 shadow-sm hover:bg-neutral-700'
                : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-3.5 w-3.5 text-slate-700" />
                <span>Tema Negro</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <span>Tema Blanco</span>
              </>
            )}
          </button>

          {/* Insignia del Rol Activo */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                currentUser.role === 'agent'
                  ? 'bg-amber-500'
                  : currentUser.role === 'landlord'
                    ? 'bg-emerald-500'
                    : 'bg-indigo-500'
              }`}
            />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold uppercase text-slate-500">
                {currentUser.roleLabel}
              </span>
              <span className="max-w-[130px] truncate text-[11px] font-medium text-slate-800">
                {currentUser.fullName.split(' ')[0]}
              </span>
            </div>
          </div>

          {/* Botón Ir a Login o Cerrar Sesión */}
          {pathname !== '/login' ? (
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión actual"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
