'use client';

/**
 * @file Navbar.tsx
 * @description Barra de navegación corporativa responsiva del Sistema de Gestión Inmobiliaria (SGI).
 *              Adaptable a móviles, tablets y monitores de escritorio.
 *              Incluye menú hamburguesa deslizante (Drawer), barra de navegación táctil inferior,
 *              cambiador de rol rápido y soporte PWA.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  FileSignature,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  Scale,
  Search,
  Sparkles,
  Sun,
  UserCheck,
  X,
  Smartphone,
} from 'lucide-react';
import {
  usePropTech,
  DEMO_ROLE_USERS,
  type UserRoleType,
} from '../../context/PropTechContext';
import { SgiLogo } from './SgiLogo';
import { MobileBottomNav } from './MobileBottomNav';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    loginWithCredentials,
    logout,
    theme,
    toggleTheme,
    activeSaasPlan,
    isFreeTrialActive,
  } = usePropTech();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cerrar menú móvil al navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Evitar scroll cuando el drawer móvil está abierto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Enlaces de navegación con control estricto de acceso por rol
  const navItems = [
    {
      href: '/',
      label: 'Buscador Sumapaz',
      shortLabel: 'Buscador',
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
            : 'Mi Panel Inquilino',
      shortLabel: 'Panel',
      icon: LayoutGrid,
      allowedRoles: ['tenant', 'landlord', 'agent'],
    },
    {
      href: '/planes',
      label: 'Planes SaaS',
      shortLabel: 'Planes',
      icon: CreditCard,
      allowedRoles: ['tenant', 'landlord', 'agent'],
    },
    {
      href: '/publicar',
      label: 'Publicar Inmueble',
      shortLabel: 'Publicar',
      icon: PlusCircle,
      allowedRoles: ['landlord', 'agent'],
    },
    {
      href: '/contratos',
      label: 'Contratos SHA-256',
      shortLabel: 'Contratos',
      icon: FileSignature,
      allowedRoles: ['agent'],
    },
    {
      href: '/dashboard',
      label: 'KPIs & IPC DANE',
      shortLabel: 'KPIs',
      icon: BarChart3,
      allowedRoles: ['agent'],
    },
    {
      href: '/legal',
      label: 'Habeas Data & PQRS',
      shortLabel: 'Legal / PQRS',
      icon: Scale,
      allowedRoles: ['agent'],
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    item.allowedRoles.includes(currentUser.role)
  );

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleQuickSwitchRole = (roleKey: UserRoleType) => {
    const demo = DEMO_ROLE_USERS[roleKey];
    loginWithCredentials(demo.email, demo.demoPassword);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 text-slate-800 shadow-sm backdrop-blur-md transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3 lg:px-8">
          {/* Identidad Corporativa: SGI */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <SgiLogo size="sm" variant={theme === 'dark' ? 'negative' : 'color'} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="truncate text-sm font-extrabold tracking-tight text-[#1B365D] sm:text-base dark:text-white">
                  SGI • PropTech
                </span>
                <span className="rounded-full bg-[#00805A]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#00805A] sm:text-[10px] dark:bg-[#11CAA0]/20 dark:text-[#11CAA0]">
                  Sumapaz
                </span>
              </div>
              <p className="hidden text-[11px] font-medium text-slate-500 md:block">
                &ldquo;Control total de tus inmuebles, desde cualquier lugar.&rdquo;
              </p>
            </div>
          </Link>

          {/* Enlaces de Escritorio (Desktop: lg+) */}
          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-1 lg:flex xl:gap-1.5"
          >
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all xl:px-3 xl:py-2 ${
                    isActive
                      ? 'bg-[#005088] text-white shadow-sm dark:bg-[#00805A]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#005088] dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Controles de la barra superior */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Insignia de Suscripción SaaS (Desktop) */}
            {(currentUser.role === 'agent' || currentUser.role === 'landlord') && (
              <Link
                href="/planes"
                title="Ver plan de suscripción SaaS activo"
                className="hidden items-center gap-1.5 rounded-xl border border-[#00805A]/30 bg-[#00805A]/10 px-2.5 py-1.5 text-[11px] font-bold text-[#00805A] 2xl:inline-flex dark:border-[#11CAA0]/30 dark:text-[#11CAA0]"
              >
                <span>
                  Plan {activeSaasPlan.toUpperCase()}
                  {isFreeTrialActive ? ' (Prueba)' : ''}
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
              className={`inline-flex items-center gap-1 rounded-xl border px-2 py-1.5 text-xs font-bold transition-all sm:px-2.5 ${
                theme === 'dark'
                  ? 'border-amber-400/40 bg-neutral-800 text-amber-300 hover:bg-neutral-700'
                  : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-3.5 w-3.5 text-[#1B365D]" />
                  <span className="hidden xl:inline">Tema Negro</span>
                </>
              ) : (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden xl:inline">Tema Blanco</span>
                </>
              )}
            </button>

            {/* Insignia del Rol Activo */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-xs sm:px-2.5 sm:py-1.5 dark:border-slate-800 dark:bg-slate-800/60">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  currentUser.role === 'agent'
                    ? 'bg-[#005088]'
                    : currentUser.role === 'landlord'
                      ? 'bg-[#00805A]'
                      : 'bg-indigo-500'
                }`}
              />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold uppercase text-slate-500 sm:text-[10px]">
                  {currentUser.role === 'agent'
                    ? 'Admin'
                    : currentUser.role === 'landlord'
                      ? 'Dueño'
                      : 'Inquilino'}
                </span>
                <span className="hidden max-w-[100px] truncate text-[11px] font-semibold text-slate-800 sm:inline sm:max-w-[120px] dark:text-slate-200">
                  {currentUser.fullName.split(' ')[0]}
                </span>
              </div>
            </div>

            {/* Botón Salir / Login (Desktop) */}
            <div className="hidden lg:flex items-center">
              {pathname !== '/login' ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Cerrar sesión actual"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Salir</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#005088] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1B365D]"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Login</span>
                </Link>
              )}
            </div>

            {/* Botón Hamburguesa Móvil / Tablet (lg:hidden) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de opciones'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 lg:hidden dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* DRAWER / MENÚ MÓVIL DESLIZANTE */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menú principal de navegación"
          className="fixed inset-0 z-50 flex justify-end lg:hidden"
        >
          {/* Backdrop con desenfoque */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Panel deslizante */}
          <aside className="relative flex h-full w-[88vw] max-w-sm flex-col overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
            {/* Cabecera del Drawer */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <SgiLogo size="sm" variant={theme === 'dark' ? 'negative' : 'color'} />
                <div>
                  <h3 className="text-sm font-extrabold text-[#1B365D] dark:text-white">
                    SGI Fusagasugá
                  </h3>
                  <p className="text-[10px] text-[#00805A] dark:text-[#11CAA0]">
                    Región del Sumapaz
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tarjeta de Usuario Activo */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white font-bold text-xs ${
                    currentUser.role === 'agent'
                      ? 'bg-[#005088]'
                      : currentUser.role === 'landlord'
                        ? 'bg-[#00805A]'
                        : 'bg-indigo-600'
                  }`}
                >
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    {currentUser.fullName}
                  </p>
                  <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              {/* Selector Rápido de Rol para pruebas en vivo */}
              <div className="mt-3 border-t border-slate-200 pt-2.5 dark:border-slate-700">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Cambiar Rol Activo:
                </p>
                <div className="mt-1.5 grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => handleQuickSwitchRole('tenant')}
                    className={`rounded-lg py-1 px-1 text-[10px] font-bold transition-all ${
                      currentUser.role === 'tenant'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Inquilino
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSwitchRole('landlord')}
                    className={`rounded-lg py-1 px-1 text-[10px] font-bold transition-all ${
                      currentUser.role === 'landlord'
                        ? 'bg-[#00805A] text-white shadow'
                        : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Dueño
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSwitchRole('agent')}
                    className={`rounded-lg py-1 px-1 text-[10px] font-bold transition-all ${
                      currentUser.role === 'agent'
                        ? 'bg-[#005088] text-white shadow'
                        : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>
            </div>

            {/* Insignia SaaS */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#00805A]/15 to-[#11CAA0]/15 p-2.5 text-xs text-[#00805A] dark:text-[#11CAA0]">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="h-4 w-4" />
                <span>Plan {activeSaasPlan.toUpperCase()}</span>
              </div>
              <Link
                href="/planes"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[11px] font-extrabold underline"
              >
                {isFreeTrialActive ? 'Prueba 14d Activa' : 'Ver Planes'}
              </Link>
            </div>

            {/* Enlaces de Navegación Móvil */}
            <div className="mt-4 flex-1 space-y-1">
              <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Módulos del Sistema
              </p>
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#005088] text-white shadow-sm dark:bg-[#00805A]'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Pie del Drawer */}
            <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2">
                  {theme === 'light' ? (
                    <Moon className="h-4 w-4 text-[#1B365D]" />
                  ) : (
                    <Sun className="h-4 w-4 text-amber-400" />
                  )}
                  <span>{theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
                </div>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] dark:bg-slate-700">
                  {theme === 'light' ? 'Tema Negro' : 'Tema Blanco'}
                </span>
              </button>

              <div className="mt-3 flex gap-2">
                {pathname !== '/login' ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-50 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#005088] py-2.5 text-xs font-bold text-white hover:bg-[#1B365D]"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Iniciar Sesión</span>
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Barra de Navegación Inferior para Dispositivos Móviles */}
      <MobileBottomNav onOpenMobileMenu={() => setMobileMenuOpen(true)} />
    </>
  );
}
