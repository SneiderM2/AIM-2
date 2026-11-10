'use client';

/**
 * @file RouteLoadingIndicator.tsx
 * @description Barra de progreso ultra-rápida en la parte superior del viewport (Top Loader)
 *              que proporciona retroalimentación visual inmediata (Perceived Performance)
 *              al hacer clic en cualquier enlace interno o cambio de ruta.
 *              Compatible con Static Site Generation (SSG) y export sin CSR bailouts.
 */

import React, { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

function RouteLoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Escuchar clics en enlaces internos para disparo inmediato (0ms de latencia percibida)
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      // Solo enlaces internos que no sean anclas (#) ni externos
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !target.getAttribute('target') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        try {
          const url = new URL(href, window.location.href);
          if (url.pathname === window.location.pathname && url.search === window.location.search) {
            return;
          }
        } catch {
          // Si URL falla al parsear, ignorar
        }

        setLoading(true);
        setProgress(28); // Salto inicial inmediato
      }
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
    };
  }, []);

  // Incrementar gradualmente la barra mientras la página carga
  useEffect(() => {
    if (!loading) return;

    const timer1 = setTimeout(() => setProgress((p) => Math.max(p, 65)), 120);
    const timer2 = setTimeout(() => setProgress((p) => Math.max(p, 88)), 350);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [loading]);

  // Completar y desvanecer cuando el pathname cambia
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 260);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 right-0 top-0 z-[9999] h-[3px] overflow-hidden"
    >
      <div
        className="h-full bg-gradient-to-r from-[#11CAA0] via-[#00805A] to-[#005088] shadow-[0_0_12px_rgba(17,202,160,0.8)] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition:
            progress === 100
              ? 'width 150ms ease-out, opacity 250ms 100ms ease-in'
              : 'width 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
  );
}

export function RouteLoadingIndicator() {
  return (
    <Suspense fallback={null}>
      <RouteLoadingBar />
    </Suspense>
  );
}
