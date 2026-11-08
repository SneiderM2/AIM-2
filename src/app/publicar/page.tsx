'use client';

/**
 * @file page.tsx (/publicar)
 * @description Módulo RF-02: Publicación de Inmuebles con validación en tiempo real
 *              del Artículo 18 de la Ley 820 de 2003 y Georreferenciación PostGIS.
 */

import React, { useState, useTransition } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  MapPin,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { publishPropertyAction } from '../actions/proptech.actions';
import type { PropertyPublicationInput } from '../../lib/validations/proptech.schemas';

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export default function PublishPropertyPage() {
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<PropertyPublicationInput>({
    matriculaInmobiliaria: '050C-01489210',
    catastralChip: 'AAA0098BCDE',
    title: 'Apartamento Exterior en Rosales con Vista a los Cerros Orientales',
    description:
      'Inmueble de lujo en séptimo piso exterior con acabados arquitectónicos modernos, iluminación natural cruzada, ventanería termoacústica, cocina abierta equipada y dos parqueaderos independientes en sótano.',
    propertyType: 'apartamento',
    destination: 'vivienda_urbana',
    department: 'Cundinamarca',
    city: 'Bogotá D.C.',
    neighborhood: 'Los Rosales',
    addressLine: 'Carrera 4 # 72 - 35 Apto 702',
    estrato: 6,
    commercialValuationCop: 480000000,
    cadastralValuationCop: 280000000,
    monthlyRentCop: 4500000,
    administrationFeeCop: 720000,
    isAdministrationIncluded: false,
    privateAreaM2: 124,
    builtAreaM2: 136,
    bedrooms: 3,
    bathrooms: 3,
    parkingSpots: 2,
    floorNumber: 7,
    constructionYear: 2021,
    amenities: ['Vigilancia 24/7', 'Gimnasio', 'Terraza BBQ', 'Planta Eléctrica Suplencia Total'],
    latitude: 4.6559,
    longitude: -74.0512,
  });

  const [actionResult, setActionResult] = useState<{
    success: boolean;
    error?: string;
    fieldErrors?: Record<string, string[] | undefined>;
    data?: {
      propertyId: string;
      slug: string;
      maxLegalCanonCop: number;
      postgisWkt: string;
    };
  } | null>(null);

  // Cálculo reactivo del tope legal Art. 18 Ley 820 de 2003 (1% del avalúo comercial)
  const maxLegalRentArt18 = formState.commercialValuationCop * 0.01;
  const isRentExceedingArt18 =
    formState.destination === 'vivienda_urbana' &&
    formState.monthlyRentCop > maxLegalRentArt18;

  const isValuationExceeding2xCadastral =
    formState.destination === 'vivienda_urbana' &&
    typeof formState.cadastralValuationCop === 'number' &&
    formState.commercialValuationCop > formState.cadastralValuationCop * 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await publishPropertyAction(formState);
      setActionResult(res);
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            <Scale className="h-3.5 w-3.5" />
            Módulo RF-02 • Control Normativo Ley 820 de 2003 (Art. 18)
          </span>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
            Publicación y Georreferenciación de Inmueble
          </h1>
          <p className="text-sm text-slate-600">
            Validación automática del tope legal del canon mensual ($1\%$ del avalúo comercial) y coordenadas PostGIS (`EPSG:4326`).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Formulario Principal */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-8"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700">
                Matrícula Inmobiliaria SNR
              </label>
              <input
                type="text"
                value={formState.matriculaInmobiliaria}
                onChange={(e) =>
                  setFormState({ ...formState, matriculaInmobiliaria: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700">
                Destinación Contractual
              </label>
              <select
                value={formState.destination}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    destination: e.target.value as 'vivienda_urbana' | 'comercial',
                  })
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium"
              >
                <option value="vivienda_urbana">Vivienda Urbana (Regulada por Ley 820/2003)</option>
                <option value="comercial">Inmueble Comercial (Código de Comercio Art. 518+)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700">
              Título de la Publicación
            </label>
            <input
              type="text"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700">
                Avalúo Catastral (COP)
              </label>
              <input
                type="number"
                value={formState.cadastralValuationCop ?? 0}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    cadastralValuationCop: Number(e.target.value),
                  })
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700">
                Avalúo Comercial Estimado (COP)
              </label>
              <input
                type="number"
                value={formState.commercialValuationCop}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    commercialValuationCop: Number(e.target.value),
                  })
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700">
                Canon Mensual Solicitado (COP)
              </label>
              <input
                type="number"
                value={formState.monthlyRentCop}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    monthlyRentCop: Number(e.target.value),
                  })
                }
                className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm font-bold ${
                  isRentExceedingArt18
                    ? 'border-rose-500 bg-rose-50 text-rose-900'
                    : 'border-emerald-500 bg-emerald-50/40 text-slate-900'
                }`}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700">
                Estrato (1-6)
              </label>
              <input
                type="number"
                min={1}
                max={6}
                value={formState.estrato}
                onChange={(e) =>
                  setFormState({ ...formState, estrato: Number(e.target.value) })
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700">
                Área Privada (m²)
              </label>
              <input
                type="number"
                value={formState.privateAreaM2}
                onChange={(e) =>
                  setFormState({ ...formState, privateAreaM2: Number(e.target.value) })
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700">
                Latitud (Colombia)
              </label>
              <input
                type="number"
                step="0.0001"
                value={formState.latitude}
                onChange={(e) =>
                  setFormState({ ...formState, latitude: Number(e.target.value) })
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700">
                Longitud (Colombia)
              </label>
              <input
                type="number"
                step="0.0001"
                value={formState.longitude}
                onChange={(e) =>
                  setFormState({ ...formState, longitude: Number(e.target.value) })
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <Building2 className="h-4 w-4" />
            {isPending
              ? 'Validando en Servidor con Zod y PostGIS...'
              : 'Validar Ley 820 y Publicar Inmueble'}
          </button>
        </form>

        {/* Panel Lateral de Auditoría Jurídica en Vivo */}
        <aside className="space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-md">
            <h2 className="flex items-center gap-2 text-sm font-bold text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              Dictamen Legal en Tiempo Real (Art. 18 Ley 820)
            </h2>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl bg-slate-800/90 p-3">
                <span className="text-slate-400">Tope Máximo Legal del Canon (1% Comercial):</span>
                <p className="mt-0.5 text-lg font-extrabold text-white">
                  {copFormatter.format(maxLegalRentArt18)} / mes
                </p>
              </div>

              {isRentExceedingArt18 ? (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-950/60 p-3 text-rose-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <p>
                    <strong>Infracción Art. 18 Ley 820/2003:</strong> El canon solicitado supera el
                    1% del avalúo comercial estimado. La Server Action y el constraint SQL{' '}
                    <code>chk_ley820_art18_max_canon</code> bloquearán el registro.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/50 p-3 text-emerald-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <p>
                    <strong>Canon Conforme a Derecho:</strong> El valor mensual se encuentra dentro
                    del límite legal permitido para vivienda urbana en Colombia.
                  </p>
                </div>
              )}

              {isValuationExceeding2xCadastral && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-950/60 p-3 text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <p>
                    <strong>Alerta Inciso 2 Art. 18 Ley 820:</strong> El avalúo comercial estimado
                    excede el doble (2x) del avalúo catastral vigente.
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-slate-800/90 p-3 font-mono text-[11px] text-slate-300">
                <div className="flex items-center gap-1 text-emerald-400">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Geometría PostGIS Generada:</span>
                </div>
                <p className="mt-1 break-all">
                  SRID=4326;POINT({formState.longitude} {formState.latitude})
                </p>
              </div>
            </div>
          </div>

          {actionResult && (
            <div
              className={`rounded-2xl border p-5 text-xs ${
                actionResult.success
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                  : 'border-rose-300 bg-rose-50 text-rose-950'
              }`}
            >
              {actionResult.success && actionResult.data ? (
                <div className="space-y-2">
                  <p className="font-bold text-emerald-800">
                    ✓ Inmueble validado y registrado exitosamente
                  </p>
                  <p>
                    <strong>UUID:</strong> <code>{actionResult.data.propertyId}</code>
                  </p>
                  <p>
                    <strong>Slug:</strong> <code>{actionResult.data.slug}</code>
                  </p>
                  <p>
                    <strong>PostGIS WKT:</strong> <code>{actionResult.data.postgisWkt}</code>
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-bold text-rose-800">✗ {actionResult.error}</p>
                  {actionResult.fieldErrors &&
                    Object.entries(actionResult.fieldErrors).map(([field, messages]) => (
                      <p key={field}>
                        <strong>{field}:</strong> {messages?.join(', ')}
                      </p>
                    ))}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
