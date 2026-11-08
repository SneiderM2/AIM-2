'use client';

/**
 * @file Navbar.tsx
 * @description Barra de navegación empresarial con Selector Rápido de los 3 Roles,
 *              Botón de Cambio de Tema (Blanco / Negro) y acceso a `/login` y `/panel`.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Building2,
  FileSignature,
  LayoutGrid,
  LogIn,
  Moon,
  PlusCircle,
  Scale,
  Search,
  Sun,
  UserCheck,
} from 'lucide-react';
import { usePropTech, type UserRoleType } from '../../context/PropTechContext';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Buscador & Mapa',
    icon: Search,
  },
  {
    href: '/panel',
    label: 'Panel CRUD (3 Roles)',
    icon: LayoutGrid,
  },
  {
    href: '/publicar',
    label: 'Publicar',
    icon: PlusCircle,
  },
  {
    href: '/contratos',
    label: 'Contratos SHA-256',
    icon: FileSignature,
  },
  {
    href: '/dashboard',
    label: 'KPIs & IPC',
    icon: BarChart3,
  },
  {
    href: '/legal',
    label: 'Habeas Data & PQRS',
    icon: Scale,
  },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { currentUser, loginAsRole, theme, toggleTheme } = usePropTech();

  return (
    <nav className="border-b border-slate-800 bg-slate-950 text-white">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Marca PropTech Colombia */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight text-white sm:text-base">
                PropTech Colombia
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30">
                Legal-Tech
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Ley 820/2003 • Ley 1581/2012 • Ley 527/1999
            </p>
          </div>
        </Link>

        {/* Enlaces de Módulos */}
        <div className="flex flex-wrap items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Selector Rápido de Rol + Botón Cambio de Tema (Blanco / Negro) + Login */}
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
                ? 'border-white bg-white text-black shadow-sm hover:bg-neutral-200'
                : 'border-slate-700 bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-3.5 w-3.5 text-emerald-400" />
                <span>Tema Negro</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span>Tema Blanco</span>
              </>
            )}
          </button>

          {/* Selector Rápido de Rol Activo */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs">
            <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden text-[11px] text-slate-400 sm:inline">Rol:</span>
            <select
              value={currentUser.role}
              onChange={(e) => loginAsRole(e.target.value as UserRoleType)}
              aria-label="Cambiar rol activo"
              className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none"
            >
              <option value="landlord" className="bg-slate-900 text-white">
                Propietario (Landlord)
              </option>
              <option value="tenant" className="bg-slate-900 text-white">
                Arrendatario (Tenant)
              </option>
              <option value="agent" className="bg-slate-900 text-white">
                Agente / Admin
              </option>
            </select>
          </div>

          <Link
            href="/login"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
              pathname === '/login'
                ? 'bg-white text-slate-950'
                : 'border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Roles / Login</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
