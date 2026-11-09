'use client';

/**
 * @file PwaRegistrar.tsx
 * @description Registro automático de Service Worker y Prompt de Instalación PWA
 *              inteligente para dispositivos móviles, tablets y escritorios.
 */

import React, { useEffect, useState } from 'react';
import {
  Download,
  Share,
  Wifi,
  WifiOff,
  X,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { SgiLogo } from '../layout/SgiLogo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaRegistrar() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [networkToast, setNetworkToast] = useState<{
    type: 'online' | 'offline';
    message: string;
  } | null>(null);

  useEffect(() => {
    // 1. Detectar si ya corre como PWA instalada
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // 2. Detectar iOS (Safari no dispara beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) && !checkStandalone;
    setIsIos(isAppleDevice);

    // 3. Registrar el Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[SGI PWA] Service Worker registrado exitosamente:', registration.scope);

            // Escuchar actualizaciones
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (
                    installingWorker.state === 'installed' &&
                    navigator.serviceWorker.controller
                  ) {
                    console.log('[SGI PWA] Nueva versión disponible');
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.error('[SGI PWA] Error al registrar Service Worker:', error);
          });
      });
    }

    // 4. Capturar el evento de instalación en Android, Chrome, Edge, etc.
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Mostrar banner si el usuario no lo descartó previamente en esta sesión
      const dismissed = sessionStorage.getItem('sgi_pwa_dismissed');
      if (!dismissed && !checkStandalone) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 5. Evento de instalación exitosa
    const handleAppInstalled = () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
      setNetworkToast({
        type: 'online',
        message: '¡SGI instalado correctamente en tu dispositivo!',
      });
      setTimeout(() => setNetworkToast(null), 4000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // 6. Monitoreo de conectividad en vivo
    const handleOnline = () => {
      setNetworkToast({
        type: 'online',
        message: 'Conexión a internet reestablecida.',
      });
      setTimeout(() => setNetworkToast(null), 4000);
    };

    const handleOffline = () => {
      setNetworkToast({
        type: 'offline',
        message: 'Estás sin conexión. Operando en modo local SGI.',
      });
      setTimeout(() => setNetworkToast(null), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIos) {
        setShowIosGuide(true);
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowInstallBanner(false);
      }
    } catch (err) {
      console.warn('[SGI PWA] Error al abrir prompt:', err);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('sgi_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* Toast de estado de Red (Online / Offline) */}
      {networkToast && (
        <aside
          role="status"
          aria-live="polite"
          className={`fixed bottom-20 left-4 right-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold shadow-2xl backdrop-blur-md transition-all sm:bottom-6 sm:left-auto sm:right-6 ${
            networkToast.type === 'online'
              ? 'border border-emerald-400 bg-emerald-950/90 text-emerald-200'
              : 'border border-amber-400 bg-amber-950/90 text-amber-200'
          }`}
        >
          {networkToast.type === 'online' ? (
            <Wifi className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <WifiOff className="h-4 w-4 shrink-0 text-amber-400" />
          )}
          <span className="flex-1">{networkToast.message}</span>
        </aside>
      )}

      {/* Banner flotante de instalación PWA (Móvil, Tablet, Desktop) */}
      {showInstallBanner && !isStandalone && (
        <aside
          aria-label="Instalación de SGI PropTech"
          className="fixed bottom-20 left-3 right-3 z-40 mx-auto max-w-md rounded-2xl border border-[#11CAA0]/40 bg-gradient-to-r from-[#1B365D] via-[#005088] to-[#1B365D] p-3.5 text-white shadow-2xl sm:bottom-6 sm:left-auto sm:right-6"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 pt-0.5">
              <SgiLogo size="sm" variant="color" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold tracking-tight">Instala la App SGI</span>
                <span className="rounded bg-[#11CAA0] px-1.5 py-0.2 text-[9px] font-black uppercase text-[#1B365D]">
                  PWA
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-200">
                Acceso ultra rápido desde tu pantalla de inicio, sin descargas pesadas y con soporte sin conexión en Sumapaz.
              </p>

              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#11CAA0] px-3 py-1.5 text-xs font-black text-[#1B365D] shadow hover:bg-emerald-300"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Instalar Ahora</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
                >
                  Después
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Cerrar sugerencia de instalación"
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Modal / Guía de Instalación para iOS Safari */}
      {showIosGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
        >
          <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-[#1B365D] p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-[#11CAA0]" />
                <h3 className="text-sm font-extrabold">Instalar SGI en iOS / iPhone</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-200">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#11CAA0] text-[10px] font-bold text-[#1B365D]">
                  1
                </span>
                <p>
                  Toca el botón <strong className="text-white">Compartir</strong>{' '}
                  <Share className="inline h-3.5 w-3.5 text-[#11CAA0]" /> en la barra inferior de Safari.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#11CAA0] text-[10px] font-bold text-[#1B365D]">
                  2
                </span>
                <p>
                  Desliza hacia abajo y selecciona{' '}
                  <strong className="text-white">&ldquo;Agregar a pantalla de inicio&rdquo;</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#11CAA0] text-[10px] font-bold text-[#1B365D]">
                  3
                </span>
                <p>
                  Confirma tocando <strong className="text-white">&ldquo;Agregar&rdquo;</strong> en la esquina superior derecha.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="mt-5 w-full rounded-xl bg-[#11CAA0] py-2.5 text-center text-xs font-bold text-[#1B365D]"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
