'use client';

/**
 * @file page.tsx (/offline)
 * @description Pantalla de contingencia y modo sin conexión (PWA) de SGI PropTech.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, WifiOff, LayoutGrid, Phone, CheckCircle2 } from 'lucide-react';
import { SgiLogo } from '../../components/layout/SgiLogo';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex justify-center">
          <SgiLogo size="lg" variant="color" />
        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
          <WifiOff className="h-4 w-4" />
          <span>Modo Sin Conexión Activado</span>
        </div>

        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#1B365D] dark:text-white sm:text-3xl">
          Sin acceso a Internet
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          No te preocupes. La aplicación progresiva (PWA) de SGI preserva tus vistas y datos en el almacenamiento local de tu dispositivo.
        </p>

        {isOnline && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>¡Conexión a internet reestablecida! Ya puedes recargar.</span>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#005088] px-5 py-3 text-xs font-extrabold text-white shadow-md hover:bg-[#1B365D] dark:bg-[#11CAA0] dark:text-[#1B365D]"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar Conexión
          </button>

          <Link
            href="/panel"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <LayoutGrid className="h-4 w-4" />
            Ver Panel Local
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Soporte Regional Inmobiliario
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Para urgencias contractuales o verificación física de predios en Fusagasugá:
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#00805A] dark:text-[#11CAA0]">
            <Phone className="h-3.5 w-3.5" />
            <span>Línea Fusagasugá: +57 (601) 867-0000 / Cel: 310 000 0000</span>
          </div>
        </div>
      </div>
    </div>
  );
}
