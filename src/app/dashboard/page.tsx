'use client';

/**
 * @file page.tsx (/dashboard)
 * @description Módulo RF-07 + Tremor Analytics: Métricas de recaudo de cánones,
 *              KPIs de ocupación, control de mora y Simulador de Reajuste Anual IPC DANE (Art. 20 Ley 820).
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BarChart3,
  Calculator,
  CheckCircle2,
  DollarSign,
  Lock,
  Percent,
  TrendingUp,
} from 'lucide-react';
import {
  DANE_HISTORICAL_IPC,
  TREMOR_REVENUE_SERIES,
} from '../../lib/data/colombia-mock-data';
import { usePropTech } from '../../context/PropTechContext';

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export default function AnalyticsDashboardPage() {
  const { currentUser } = usePropTech();
  const [currentRentCop, setCurrentRentCop] = useState(1400000);
  const [selectedIpcYear, setSelectedIpcYear] = useState<number>(2025);
  const [commercialValueCop, setCommercialValueCop] = useState(180000000);

  // Control de Acceso: Exclusivo Administrador / Secretario
  if (currentUser.role !== 'agent') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">
          Módulo Reservado para el Administrador
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          El panel de analítica macroeconómica, liquidador de IPC DANE y métricas consolidadas de mora está reservado para el Administrador / Lonja Inmobiliaria. Para revisar tus pagos y arriendos, ingresa a tu panel.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/panel"
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700"
          >
            Ir a Mi Panel
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Iniciar Sesión como Administrador
          </Link>
        </div>
      </div>
    );
  }

  const certifiedIpcPct = DANE_HISTORICAL_IPC[selectedIpcYear] ?? 4.45;
  const maxIncrementCop = Math.round(currentRentCop * (certifiedIpcPct / 100));
  const newAdjustedRentCop = currentRentCop + maxIncrementCop;
  const maxArt18CapCop = commercialValueCop * 0.01;
  const isWithinArt18Cap = newAdjustedRentCop <= maxArt18CapCop;

  const latestMetric = TREMOR_REVENUE_SERIES[TREMOR_REVENUE_SERIES.length - 1];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 border-b border-slate-200 pb-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
          <BarChart3 className="h-3.5 w-3.5" />
          Módulo RF-07 • Tremor Analytics & Reajuste Anual IPC DANE (Art. 20 Ley 820 de 2003)
        </span>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
          Analítica Financiera, Recaudo de Cánones y Liquidador IPC
        </h1>
        <p className="text-sm text-slate-600">
          Monitoreo de ingresos recurrentes vía PSE/Wompi, tasa de ocupación inmobiliaria y cálculo normativo de incremento anual.
        </p>
      </div>

      {/* KPIs Principales (Arquitectura Tremor Blocks) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recaudo Mensual Efectivo
            </span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {copFormatter.format(latestMetric.recaudadoCop)}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <ArrowUpRight className="h-3.5 w-3.5" />
            99.03% de la meta ({copFormatter.format(latestMetric.esperadoCop)})
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tasa de Ocupación
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {latestMetric.tasaOcupacionPct}%
          </p>
          <p className="mt-1 text-xs text-slate-500">
            +4.0% frente al semestre anterior
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Índice de Cartera en Mora
            </span>
            <Percent className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {latestMetric.moraPct}%
          </p>
          <p className="mt-1 text-xs font-medium text-emerald-700">
            Cobertura activa con deudores solidarios
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              IPC Certificado DANE ({selectedIpcYear})
            </span>
            <Calculator className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-indigo-700">
            {certifiedIpcPct}%
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Tope máximo legal Art. 20 Ley 820
          </p>
        </div>
      </div>

      {/* Gráfica de Barras Comparativa (Recaudado vs Esperado) + Simulador IPC DANE */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
          <h2 className="text-base font-bold text-slate-900">
            Evolución Semestral de Recaudo de Cánones (COP)
          </h2>
          <p className="text-xs text-slate-500">
            Conciliación automática vía Webhooks HMAC-SHA256 (`payment.canon.succeeded`)
          </p>

          <div className="mt-6 space-y-4">
            {TREMOR_REVENUE_SERIES.map((item) => {
              const ratioPct = Math.min(
                100,
                Math.round((item.recaudadoCop / item.esperadoCop) * 100)
              );
              return (
                <div key={item.month} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{item.month}</span>
                    <span className="font-mono text-slate-600">
                      {copFormatter.format(item.recaudadoCop)} /{' '}
                      {copFormatter.format(item.esperadoCop)} ({ratioPct}%)
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      style={{ width: `${ratioPct}%` }}
                      className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Simulador Legal de Reajuste Anual de Canon (Art. 20 Ley 820 de 2003) */}
        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-md lg:col-span-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <Calculator className="h-5 w-5" />
            Liquidador Oficial de Reajuste IPC (Art. 20 Ley 820)
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Cada doce (12) meses de ejecución del contrato bajo un mismo precio, el arrendador podrá incrementar el canon hasta en un 100% del IPC del año calendario inmediatamente anterior.
          </p>

          <div className="mt-5 space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase text-slate-300">
                Canon Mensual Vigente (COP)
              </label>
              <input
                type="number"
                value={currentRentCop}
                onChange={(e) => setCurrentRentCop(Number(e.target.value))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm font-bold text-white"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-300">
                Año Base IPC Certificado por el DANE
              </label>
              <select
                value={selectedIpcYear}
                onChange={(e) => setSelectedIpcYear(Number(e.target.value))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm font-bold text-white"
              >
                {Object.entries(DANE_HISTORICAL_IPC).map(([year, rate]) => (
                  <option key={year} value={year}>
                    Año {year} — IPC DANE: {rate}%
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-300">
                Avalúo Comercial del Inmueble (Verificación Tope 1% Art. 18)
              </label>
              <input
                type="number"
                value={commercialValueCop}
                onChange={(e) => setCommercialValueCop(Number(e.target.value))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm font-bold text-white"
              />
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/90 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Incremento Máximo Legal ({certifiedIpcPct}%):</span>
                <span className="font-bold text-emerald-400">
                  + {copFormatter.format(maxIncrementCop)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-2">
                <span className="font-bold text-white">Nuevo Canon Mensual Reajustado:</span>
                <span className="text-base font-extrabold text-white">
                  {copFormatter.format(newAdjustedRentCop)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 pt-1 text-[11px] text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  {isWithinArt18Cap
                    ? `Cumple el tope del 1% del valor comercial (${copFormatter.format(maxArt18CapCop)}).`
                    : `Atención: Supera el 1% del avalúo comercial (${copFormatter.format(maxArt18CapCop)}).`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
