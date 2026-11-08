'use client';

/**
 * @file Navbar.tsx
 * @description Barra de navegación corporativa del Sistema de Gestión Inmobiliaria (SGI).
 *              Aplica la identidad de marca oficial (Isotipo Llave+Estructura+Escudo,
 *              Azul Marino #005088/#1B365D y Verde Esmeralda #00805A/#11CAA0) y filtra
 *              los enlaces estrictamente según el rol activo.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  CreditCard,
  FileSignature,
  LayoutGrid,
  LogIn,
  LogOut,
  Moon,
  PlusCircle,
  Scale,
  Search,
  Sun,
} from 'lucide-react';
import { usePropTech } from '../../context/PropTechContext';
import { SgiLogo } from './SgiLogo';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, theme, toggleTheme, activeSaasPlan, isFreeTrialActive } =
    usePropTech();

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
      href: '/planes',
      label: 'Planes SaaS',
      icon: CreditCard,
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
        {/* Identidad Corporativa: SGI - Sistema de Gestión Inmobiliaria */}
        <Link href="/" className="flex items-center gap-3">
          <SgiLogo size="sm" variant={theme === 'dark' ? 'negative' : 'color'} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight text-[#1B365D] dark:text-white sm:text-base">
                SGI • Sistema de Gestión Inmobiliaria
              </span>
              <span className="rounded-full bg-[#00805A]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#00805A] dark:bg-[#11CAA0]/20 dark:text-[#11CAA0]">
                Fusagasugá & Sumapaz
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              &ldquo;Control total de tus inmuebles, desde cualquier lugar.&rdquo;
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
                    ? 'bg-[#005088] text-white shadow-sm dark:bg-[#00805A]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#005088] dark:text-slate-300 dark:hover:bg-slate-800'
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
          {/* Insignia de Suscripción SaaS */}
          {(currentUser.role === 'agent' || currentUser.role === 'landlord') && (
            <Link
              href="/planes"
              title="Ver plan de suscripción SaaS activo"
              className="hidden items-center gap-1.5 rounded-xl border border-[#00805A]/30 bg-[#00805A]/10 px-2.5 py-1.5 text-[11px] font-bold text-[#00805A] xl:inline-flex dark:border-[#11CAA0]/30 dark:text-[#11CAA0]"
            >
              <span>
                Plan {activeSaasPlan.toUpperCase()}
                {isFreeTrialActive ? ' (Prueba 14d)' : ''}
              </span>
            </Link>
          )}

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
                <Moon className="h-3.5 w-3.5 text-[#1B365D]" />
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
                  ? 'bg-[#005088]'
                  : currentUser.role === 'landlord'
                    ? 'bg-[#00805A]'
                    : 'bg-indigo-500'
              }`}
            />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold uppercase text-slate-500">
                {currentUser.roleLabel}
              </span>
              <span className="max-w-[120px] truncate text-[11px] font-medium text-slate-800">
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#005088] px-3 py-2 text-xs font-bold text-white hover:bg-[#1B365D]"
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
