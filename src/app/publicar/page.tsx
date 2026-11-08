'use client';

/**
 * @file page.tsx (/publicar)
 * @description Módulo RF-02: Publicación de Inmuebles en la Región del Sumapaz (Fusagasugá)
 *              con validación en tiempo real del Artículo 18 de la Ley 820 de 2003
 *              y Georreferenciación PostGIS. Acceso restringido para Propietarios y Administrador.
 */

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Lock,
  MapPin,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { publishPropertyAction } from '../actions/proptech.actions';
import type { PropertyPublicationInput } from '../../lib/validations/proptech.schemas';
import { usePropTech } from '../../context/PropTechContext';

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export default function PublishPropertyPage() {
  const { currentUser } = usePropTech();
  const [isPending, startTransition] = useTransition();

  const [formState, setFormState] = useState<PropertyPublicationInput>({
    matriculaInmobiliaria: '050C-01489210',
    catastralChip: 'AAA0098BCDE',
    title: 'Apartamento Exterior en Balmoral con Terraza y Vista Panorámica',
    description:
      'Inmueble residencial en Fusagasugá (Sumapaz) con acabados arquitectónicos modernos, iluminación natural cruzada, ventanería acústica, cocina abierta y parqueadero privado.',
    propertyType: 'apartamento',
    destination: 'vivienda_urbana',
    department: 'Cundinamarca',
    city: 'Fusagasugá',
    neighborhood: 'Balmoral',
    addressLine: 'Carrera 6 # 14 - 30 Apto 402',
    estrato: 4,
    commercialValuationCop: 180000000,
    cadastralValuationCop: 115000000,
    monthlyRentCop: 1450000,
    administrationFeeCop: 180000,
    isAdministrationIncluded: false,
    privateAreaM2: 88,
    builtAreaM2: 95,
    bedrooms: 3,
    bathrooms: 2,
    parkingSpots: 1,
    floorNumber: 4,
    constructionYear: 2022,
    amenities: ['Vigilancia 24/7', 'Terraza BBQ', 'Salón Social'],
    latitude: 4.3412,
    longitude: -74.367,
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

  // Control de Acceso por Rol: Solo Propietario o Administrador/Secretario
  if (currentUser.role === 'tenant') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">
          Módulo Reservado para Propietarios y Administradores
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Actualmente has iniciado sesión como <strong>Arrendatario / Inquilino</strong>. La publicación de inmuebles en la plataforma está reservada exclusivamente para propietarios y agentes inmobiliarios.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/panel"
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700"
          >
            Ir a Mi Panel de Inquilino
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Iniciar Sesión como Propietario
          </Link>
        </div>
      </div>
    );
  }

  const maxCanonLegalCop = formState.commercialValuationCop * 0.01;
  const isRentExceedingArt18 = formState.monthlyRentCop > maxCanonLegalCop;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionResult(null);

    startTransition(async () => {
      const result = await publishPropertyAction(formState);
      setActionResult(result);
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
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            Publicación y Georreferenciación de Inmueble (Sumapaz)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Validación automática del tope legal del canon mensual (1% del avalúo comercial) y coordenadas PostGIS (EPSG:4326) en Fusagasugá.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Formulario Principal */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-8 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
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
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
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
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="vivienda_urbana">Vivienda Urbana (Regulado por Ley 820/03)</option>
                <option value="comercial">Comercial (Código de Comercio)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Municipio (Región del Sumapaz)
              </label>
              <select
                value={formState.city}
                onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="Fusagasugá">Fusagasugá</option>
                <option value="Silvania">Silvania</option>
                <option value="Arbeláez">Arbeláez</option>
                <option value="Pasca">Pasca</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Barrio / Sector
              </label>
              <input
                type="text"
                value={formState.neighborhood}
                onChange={(e) => setFormState({ ...formState, neighborhood: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
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
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
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
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
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
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
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
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
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
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Latitud (Fusagasugá)
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
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Longitud (Fusagasugá)
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
              <div>
                <span className="text-slate-400">Tope Máximo Legal del Canon (1% Comercial):</span>
                <p className="text-xl font-extrabold text-white">
                  {copFormatter.format(maxCanonLegalCop)} / mes
                </p>
              </div>

              <div
                className={`rounded-xl border p-3 ${
                  isRentExceedingArt18
                    ? 'border-rose-500/50 bg-rose-950/40 text-rose-200'
                    : 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {isRentExceedingArt18 ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  )}
                  <div>
                    <span className="font-bold">
                      {isRentExceedingArt18
                        ? 'Bloqueo Normativo: Canon Ilegal'
                        : 'Canon Conforme a Derecho:'}
                    </span>
                    <p className="mt-0.5 text-[11px] leading-relaxed">
                      {isRentExceedingArt18
                        ? `El valor excede el tope legal por ${copFormatter.format(formState.monthlyRentCop - maxCanonLegalCop)}. La Ley 820 prohíbe cánones superiores al 1% del avalúo comercial.`
                        : 'El valor mensual se encuentra dentro del límite legal permitido en Colombia.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 font-mono text-[11px] text-slate-300">
                <span className="font-bold text-emerald-400">SRID:4326 (PostGIS Fusagasugá)</span>
                <p className="mt-1 truncate">
                  POINT({formState.longitude.toFixed(4)} {formState.latitude.toFixed(4)})
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
