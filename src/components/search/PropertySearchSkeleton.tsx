'use client';

/**
 * @file PropertySearchSkeleton.tsx
 * @description Pantalla de carga con efectos Shimmer luminiscentes y marcadores geoespaciales
 *              simulados (Carga de distracción para sensación de inmediatez instantánea).
 */

import React from 'react';
import { Compass, Sparkles } from 'lucide-react';

export function PropertySearchSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17]">
      {/* 1. Barra superior de filtros simulada */}
      <div className="border-b border-slate-200 bg-white/80 px-3 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex flex-1 items-center gap-2">
            <div className="h-10 w-full max-w-sm rounded-xl sgi-shimmer" />
            <div className="h-10 w-24 rounded-xl sgi-shimmer" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="h-8 w-28 rounded-lg sgi-shimmer" />
            <div className="h-8 w-24 rounded-lg sgi-shimmer" />
            <div className="h-8 w-32 rounded-lg sgi-shimmer" />
          </div>
        </div>
      </div>

      {/* 2. Encabezado de resultados simulado */}
      <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="h-6 w-72 rounded-lg sgi-shimmer" />
            </div>
            <div className="h-4 w-96 max-w-full rounded-md sgi-shimmer" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 rounded-xl sgi-shimmer" />
          </div>
        </div>

        {/* 3. Grid Split-View: Tarjetas + Mapa */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 pb-16">
          {/* Columna Izquierda: 4 Tarjetas Shimmer */}
          <div className="lg:col-span-7 xl:col-span-7">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  {/* Imagen Shimmer con insignia */}
                  <div className="relative aspect-[16/10] w-full sgi-shimmer">
                    <div className="absolute left-3 top-3 h-6 w-20 rounded-full bg-white/60 dark:bg-slate-800/60" />
                    <div className="absolute right-3 top-3 h-6 w-24 rounded-full bg-white/60 dark:bg-slate-800/60" />
                  </div>

                  {/* Contenido de la tarjeta */}
                  <div className="flex flex-1 flex-col p-4 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div className="h-6 w-32 rounded-md sgi-shimmer" />
                      <div className="h-4 w-16 rounded-md sgi-shimmer" />
                    </div>
                    <div className="h-4 w-4/5 rounded-md sgi-shimmer" />
                    <div className="h-3 w-1/2 rounded-md sgi-shimmer" />

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="h-5 rounded sgi-shimmer" />
                      <div className="h-5 rounded sgi-shimmer" />
                      <div className="h-5 rounded sgi-shimmer" />
                    </div>

                    <div className="pt-2">
                      <div className="h-9 w-full rounded-xl sgi-shimmer" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Mapa Radar Geoespacial Simulado */}
          <div className="hidden lg:col-span-5 xl:col-span-5 lg:block">
            <div className="sgi-map-panel sticky w-full overflow-hidden rounded-2xl border border-slate-300 bg-slate-100 shadow-inner dark:border-slate-800 dark:bg-slate-900">
              {/* Header flotante del mapa */}
              <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/95">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Sincronizando Cartografía Sumapaz...
                  </span>
                </div>
                <Compass className="h-4 w-4 text-[#005088] animate-spin" style={{ animationDuration: '6s' }} />
              </div>

              {/* Fondo del radar con cuadrícula */}
              <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-emerald-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-950/20">
                {/* Cuadrícula cartográfica sutil */}
                <div
                  className="absolute inset-0 opacity-20 dark:opacity-10"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #00805A 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* Pulso del radar geoespacial */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-36 w-36 rounded-full bg-[#11CAA0]/15 animate-radar" />
                  <div className="absolute h-24 w-24 rounded-full bg-[#00805A]/25 animate-radar" style={{ animationDelay: '0.6s' }} />
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#005088] to-[#11CAA0] text-white shadow-xl">
                    <Sparkles className="h-6 w-6 animate-pulse" />
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 text-center">
                  <span className="inline-block rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur-sm dark:bg-slate-800/90 dark:text-slate-200">
                    Fusagasugá • Silvania • Pasca • Arbeláez
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
