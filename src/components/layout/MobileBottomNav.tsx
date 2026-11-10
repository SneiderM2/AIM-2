'use client';

/**
 * @file MobileBottomNav.tsx
 * @description Barra de navegación inferior fija para teléfonos móviles y tablets.
 *              Proporciona ergonomía táctil (Thumb-Zone) óptima para PWA.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CreditCard,
  FileSignature,
  LayoutGrid,
  Menu,
  PlusCircle,
  Search,
} from 'lucide-react';
import { usePropTech } from '../../context/PropTechContext';

interface MobileBottomNavProps {
  onOpenMobileMenu: () => void;
}

export function MobileBottomNav({ onOpenMobileMenu }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { currentUser } = usePropTech();

  // Determinar acción primaria según rol
  const primaryAction =
    currentUser.role === 'agent'
      ? { href: '/contratos', label: 'Contratos', icon: FileSignature }
      : currentUser.role === 'landlord'
        ? { href: '/publicar', label: 'Publicar', icon: PlusCircle }
        : { href: '/planes', label: 'Planes', icon: CreditCard };

  const PrimaryIcon = primaryAction.icon;

  return (
    <nav
      aria-label="Navegación inferior móvil"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md xl:hidden dark:border-slate-800 dark:bg-slate-900/95"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {/* 1. Buscador */}
        <Link
          href="/"
          className={`active-press flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-bold transition-all ${
            pathname === '/'
              ? 'text-[#005088] dark:text-[#11CAA0]'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Search className="h-5 w-5 transition-transform duration-200" />
          <span>Buscador</span>
        </Link>

        {/* 2. Panel Centralizado */}
        <Link
          href="/panel"
          className={`active-press flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-bold transition-all ${
            pathname === '/panel'
              ? 'text-[#005088] dark:text-[#11CAA0]'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <LayoutGrid className="h-5 w-5 transition-transform duration-200" />
          <span>Panel</span>
        </Link>

        {/* 3. Acción Primaria según Rol */}
        <Link
          href={primaryAction.href}
          className={`active-press flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-bold transition-all ${
            pathname === primaryAction.href
              ? 'text-[#005088] dark:text-[#11CAA0]'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00805A]/15 text-[#00805A] shadow-sm transition-transform duration-200 dark:bg-[#11CAA0]/20 dark:text-[#11CAA0]">
            <PrimaryIcon className="h-4 w-4" />
          </div>
          <span>{primaryAction.label}</span>
        </Link>

        {/* 4. Planes SaaS (oculto si ya es la acción primaria del rol) */}
        {primaryAction.href !== '/planes' && (
          <Link
            href="/planes"
            className={`active-press flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-bold transition-all ${
              pathname === '/planes'
                ? 'text-[#005088] dark:text-[#11CAA0]'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <CreditCard className="h-5 w-5 transition-transform duration-200" />
            <span>Planes</span>
          </Link>
        )}

        {/* 5. Menú Completo / Drawer */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="active-press flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-all dark:text-slate-400 dark:hover:text-white"
          aria-label="Abrir menú de navegación completo"
        >
          <Menu className="h-5 w-5 transition-transform duration-200" />
          <span>Más</span>
        </button>
      </div>
    </nav>
  );
}
