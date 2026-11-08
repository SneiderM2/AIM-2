'use client';

/**
 * @file PropertySearchSplitView.tsx
 * @description Buscador Inmobiliario Avanzado con sincronización de estado en URL mediante `nuqs`,
 *              conectado en vivo al estado CRUD global (`usePropTech`) y Layout Split-View.
 */

import React, { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import {
  Bath,
  BedDouble,
  Building2,
  Car,
  CheckCircle2,
  Filter,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  Maximize2,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { PROPERTY_TYPES } from '../../lib/validations/proptech.schemas';
import { usePropTech } from '../../context/PropTechContext';

// ============================================================================
// 1. DEFINICIÓN DE PARSERS TIPADOS PARA URL SEARCH PARAMS (`nuqs`)
// ============================================================================

export const SORT_OPTIONS = ['recent', 'price_asc', 'price_desc', 'area_desc'] as const;

export const propertySearchParsers = {
  q: parseAsString.withDefault(''),
  city: parseAsString.withDefault(''),
  type: parseAsStringLiteral(PROPERTY_TYPES),
  minPrice: parseAsInteger,
  maxPrice: parseAsInteger,
  estratos: parseAsArrayOf(parseAsInteger).withDefault([]),
  bedrooms: parseAsInteger,
  sortBy: parseAsStringLiteral(SORT_OPTIONS).withDefault('recent'),
  page: parseAsInteger.withDefault(1),
};

// ============================================================================
// 2. INTERFACES ESTRICTAS DE MODELO DE VISTA (CARDS & PINS)
// ============================================================================

export interface PropertyCardDTO {
  id: string;
  slug: string;
  title: string;
  propertyType: (typeof PROPERTY_TYPES)[number];
  city: string;
  neighborhood: string;
  estrato: 1 | 2 | 3 | 4 | 5 | 6;
  monthlyRentCop: number;
  administrationFeeCop: number;
  isAdministrationIncluded: boolean;
  privateAreaM2: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  latitude: number;
  longitude: number;
  coverImageUrl: string;
  isLey820Compliant: boolean;
}

export interface PropertySearchSplitViewProps {
  initialProperties: PropertyCardDTO[];
  totalCount: number;
  availableCities?: string[];
}

const COLOMBIAN_CITIES = [
  'Bogotá D.C.',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Bucaramanga',
  'Pereira',
  'Envigado',
  'Chía',
] as const;

const ESTRATO_LEVELS = [1, 2, 3, 4, 5, 6] as const;

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// ============================================================================
// 3. COMPONENTE PRINCIPAL: BUSCADOR AVANZADO + LAYOUT SPLIT-VIEW
// ============================================================================

export function PropertySearchSplitView({
  initialProperties,
  availableCities = [...COLOMBIAN_CITIES],
}: PropertySearchSplitViewProps) {
  const { properties: liveManagedProperties, createApplication, currentUser } = usePropTech();
  const [isPending, startTransition] = useTransition();
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState<string | null>(null);
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'map'>('list');
  const [appliedPropertyToast, setAppliedPropertyToast] = useState<string | null>(null);

  // Sincronización bidireccional en tiempo real con la URL del navegador usando `nuqs`
  const [filters, setFilters] = useQueryStates(propertySearchParsers, {
    history: 'push',
    shallow: false,
    startTransition,
  });

  // Fuente de datos: propiedades activas sincronizadas con el Panel CRUD
  const sourceProperties: PropertyCardDTO[] = useMemo(() => {
    if (liveManagedProperties && liveManagedProperties.length > 0) {
      return liveManagedProperties.filter((p) => p.status === 'available');
    }
    return initialProperties;
  }, [liveManagedProperties, initialProperties]);

  const handleToggleEstrato = (estratoValue: number) => {
    const current = filters.estratos ?? [];
    const exists = current.includes(estratoValue);
    const updated = exists
      ? current.filter((item) => item !== estratoValue)
      : [...current, estratoValue].sort((a, b) => a - b);

    void setFilters({
      estratos: updated.length > 0 ? updated : null,
      page: 1,
    });
  };

  const handleResetAllFilters = () => {
    void setFilters({
      q: null,
      city: null,
      type: null,
      minPrice: null,
      maxPrice: null,
      estratos: null,
      bedrooms: null,
      sortBy: 'recent',
      page: 1,
    });
  };

  const handleQuickApply = (property: PropertyCardDTO) => {
    createApplication({
      propertyId: property.id,
      declaredMonthlyIncomeCop: property.monthlyRentCop * 3.5,
      employmentType: 'empleado',
      employerName: 'Empresa Verificada S.A.S.',
      coSignerFullName: 'Carlos Alberto Jaramillo (Deudor Solidario)',
      coSignerIncomeCop: property.monthlyRentCop * 4,
    });
    setAppliedPropertyToast(property.title);
    setTimeout(() => setAppliedPropertyToast(null), 4500);
  };

  const filteredProperties = useMemo(() => {
    const matches = sourceProperties.filter((prop) => {
      if (filters.city && prop.city !== filters.city) return false;
      if (filters.type && prop.propertyType !== filters.type) return false;
      if (typeof filters.minPrice === 'number' && prop.monthlyRentCop < filters.minPrice) {
        return false;
      }
      if (typeof filters.maxPrice === 'number' && prop.monthlyRentCop > filters.maxPrice) {
        return false;
      }
      if (filters.estratos.length > 0 && !filters.estratos.includes(prop.estrato)) {
        return false;
      }
      if (typeof filters.bedrooms === 'number' && prop.bedrooms < filters.bedrooms) {
        return false;
      }
      if (filters.q.trim() !== '') {
        const needle = filters.q.toLowerCase();
        const matchesText =
          prop.title.toLowerCase().includes(needle) ||
          prop.neighborhood.toLowerCase().includes(needle) ||
          prop.city.toLowerCase().includes(needle);
        if (!matchesText) return false;
      }
      return true;
    });

    return [...matches].sort((a, b) => {
      if (filters.sortBy === 'price_asc') return a.monthlyRentCop - b.monthlyRentCop;
      if (filters.sortBy === 'price_desc') return b.monthlyRentCop - a.monthlyRentCop;
      if (filters.sortBy === 'area_desc') return b.privateAreaM2 - a.privateAreaM2;
      return 0;
    });
  }, [sourceProperties, filters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.q) count++;
    if (filters.city) count++;
    if (filters.type) count++;
    if (filters.minPrice !== null) count++;
    if (filters.maxPrice !== null) count++;
    if (filters.estratos.length > 0) count++;
    if (filters.bedrooms !== null) count++;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Notificación flotante al postularse */}
      {appliedPropertyToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-400 bg-slate-900 px-5 py-4 text-xs font-bold text-white shadow-2xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <div>
            <p>¡Postulación radicada para: {appliedPropertyToast}!</p>
            <Link href="/panel" className="text-emerald-400 underline">
              Ver estado y aprobar en el Panel CRUD &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* BARRA SUPERIOR STICKY DE FILTROS MULTIDIMENSIONALES */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2.5">
              <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={filters.q}
                  onChange={(e) =>
                    void setFilters(
                      { q: e.target.value || null, page: 1 },
                      { history: 'replace' }
                    )
                  }
                  placeholder="Barrio, sector o código..."
                  aria-label="Buscar por barrio, sector o palabra clave"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              <select
                value={filters.city}
                onChange={(e) =>
                  void setFilters({ city: e.target.value || null, page: 1 })
                }
                aria-label="Filtrar por ciudad en Colombia"
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              >
                <option value="">Todas las ciudades</option>
                {availableCities.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>

              <select
                value={filters.type ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  void setFilters({
                    type: val ? (val as (typeof PROPERTY_TYPES)[number]) : null,
                    page: 1,
                  });
                }}
                aria-label="Filtrar por tipo de inmueble"
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              >
                <option value="">Tipo de inmueble</option>
                <option value="apartamento">Apartamento</option>
                <option value="casa">Casa</option>
                <option value="apartaestudio">Apartaestudio</option>
                <option value="local_comercial">Local Comercial</option>
                <option value="oficina">Oficina</option>
                <option value="bodega">Bodega</option>
              </select>

              <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Canon (COP):
                </span>
                <input
                  type="number"
                  step={100000}
                  min={0}
                  value={filters.minPrice ?? ''}
                  onChange={(e) => {
                    const parsed = e.target.value ? parseInt(e.target.value, 10) : null;
                    void setFilters({ minPrice: parsed, page: 1 }, { history: 'replace' });
                  }}
                  placeholder="Mín $"
                  aria-label="Canon mínimo en pesos colombianos"
                  className="h-8 w-28 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  step={100000}
                  min={0}
                  value={filters.maxPrice ?? ''}
                  onChange={(e) => {
                    const parsed = e.target.value ? parseInt(e.target.value, 10) : null;
                    void setFilters({ maxPrice: parsed, page: 1 }, { history: 'replace' });
                  }}
                  placeholder="Máx $"
                  aria-label="Canon máximo en pesos colombianos"
                  className="h-8 w-28 rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="group"
                aria-label="Filtrar por estrato socioeconómico"
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1"
              >
                <span className="px-2 text-xs font-semibold text-slate-600">Estrato:</span>
                {ESTRATO_LEVELS.map((lvl) => {
                  const isSelected = filters.estratos.includes(lvl);
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleToggleEstrato(lvl)}
                      aria-pressed={isSelected}
                      className={`h-7 w-7 rounded-md text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>

              <select
                value={filters.bedrooms ?? ''}
                onChange={(e) => {
                  const parsed = e.target.value ? parseInt(e.target.value, 10) : null;
                  void setFilters({ bedrooms: parsed, page: 1 });
                }}
                aria-label="Habitaciones mínimas"
                className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700"
              >
                <option value="">Hab. (Todas)</option>
                <option value="1">1+ Hab.</option>
                <option value="2">2+ Hab.</option>
                <option value="3">3+ Hab.</option>
                <option value="4">4+ Hab.</option>
              </select>

              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    void setFilters({
                      sortBy: e.target.value as (typeof SORT_OPTIONS)[number],
                      page: 1,
                    })
                  }
                  aria-label="Ordenar resultados"
                  className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700"
                >
                  <option value="recent">Más recientes</option>
                  <option value="price_asc">Canon: menor a mayor</option>
                  <option value="price_desc">Canon: mayor a menor</option>
                  <option value="area_desc">Mayor área privada</option>
                </select>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Limpiar ({activeFiltersCount})
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL SPLIT-VIEW */}
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              Inmuebles Verificados en Arriendo ({currentUser.roleLabel})
            </h1>
            <p className="text-xs text-slate-600 sm:text-sm">
              Mostrando <span className="font-semibold text-slate-900">{filteredProperties.length}</span> de{' '}
              <span className="font-semibold text-slate-900">{sourceProperties.length}</span> propiedades activas bajo{' '}
              <span className="font-medium text-emerald-700">Ley 820 de 2003</span>
              {isPending && (
                <span className="ml-2 inline-block animate-pulse rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                  Sincronizando URL...
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/panel"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Abrir Panel CRUD ({currentUser.roleLabel.split(' / ')[0]})
            </Link>

            <div className="flex lg:hidden">
              <button
                type="button"
                onClick={() => setMobileViewMode(mobileViewMode === 'list' ? 'map' : 'list')}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow"
              >
                {mobileViewMode === 'list' ? (
                  <>
                    <MapIcon className="h-4 w-4" />
                    Ver Mapa
                  </>
                ) : (
                  <>
                    <Filter className="h-4 w-4" />
                    Ver Lista ({filteredProperties.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* COLUMNA IZQUIERDA: LISTADO DE TARJETAS */}
          <section
            aria-label="Listado de inmuebles disponibles"
            className={`lg:col-span-7 xl:col-span-7 ${
              mobileViewMode === 'map' ? 'hidden lg:block' : 'block'
            }`}
          >
            {filteredProperties.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <Building2 className="mb-3 h-12 w-12 text-slate-400" />
                <h2 className="text-base font-bold text-slate-800">
                  No encontramos inmuebles con estos filtros
                </h2>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                  Intenta ampliar el rango de canon mensual o seleccionar otros estratos socioeconómicos.
                </p>
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="mt-5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {filteredProperties.map((property) => {
                  const isHighlighted =
                    hoveredPropertyId === property.id ||
                    selectedMapPropertyId === property.id;

                  return (
                    <article
                      key={property.id}
                      onMouseEnter={() => setHoveredPropertyId(property.id)}
                      onMouseLeave={() => setHoveredPropertyId(null)}
                      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-200 ${
                        isHighlighted
                          ? 'border-emerald-600 ring-2 ring-emerald-600/25 shadow-lg'
                          : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200">
                        <img
                          src={property.coverImageUrl}
                          alt={property.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                          <span className="rounded-md bg-slate-900/85 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                            Estrato {property.estrato}
                          </span>
                          <span className="rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold capitalize text-slate-800 shadow-sm">
                            {property.propertyType.replace('_', ' ')}
                          </span>
                        </div>

                        {property.isLey820Compliant && (
                          <div className="absolute bottom-2.5 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-700/95 px-2.5 py-0.5 text-[11px] font-medium text-white shadow">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Garantía Ley 820
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-4">
                        <div>
                          <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                            <span>
                              {property.neighborhood}, {property.city}
                            </span>
                          </div>

                          <h2 className="mt-1 line-clamp-1 text-base font-bold text-slate-900 group-hover:text-emerald-700">
                            {property.title}
                          </h2>

                          <div className="mt-2.5">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xl font-extrabold text-slate-900">
                                {copFormatter.format(property.monthlyRentCop)}
                              </span>
                              <span className="text-xs font-medium text-slate-500">/ mes</span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {property.isAdministrationIncluded ? (
                                <span className="font-medium text-emerald-700">
                                  Administración incluida
                                </span>
                              ) : property.administrationFeeCop > 0 ? (
                                `+ ${copFormatter.format(property.administrationFeeCop)} admón.`
                              ) : (
                                'Sin cuota de administración'
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-slate-100 pt-3 space-y-3">
                          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <Maximize2 className="h-3.5 w-3.5 text-slate-400" />
                              {property.privateAreaM2} m²
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <BedDouble className="h-3.5 w-3.5 text-slate-400" />
                              {property.bedrooms} Hab.
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Bath className="h-3.5 w-3.5 text-slate-400" />
                              {property.bathrooms} Baños
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Car className="h-3.5 w-3.5 text-slate-400" />
                              {property.parkingSpots} Parq.
                            </span>
                          </div>

                          {/* Botones de Acción Directa Conectados al CRUD */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleQuickApply(property)}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-600"
                            >
                              <Send className="h-3.5 w-3.5" />
                              Postularme
                            </button>
                            <Link
                              href="/panel"
                              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                            >
                              CRUD
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* COLUMNA DERECHA: CONTENEDOR DE MAPA INTERACTIVO STICKY */}
          <aside
            aria-label="Mapa georreferenciado de inmuebles"
            className={`lg:col-span-5 xl:col-span-5 ${
              mobileViewMode === 'list' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="sticky top-[5.25rem] h-[calc(100vh-6.5rem)] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-inner">
              <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/95 px-3.5 py-2 shadow-md backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-800">
                    PostGIS EPSG:4326 • {filteredProperties.length} pines activos
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Sincronizado con CRUD
                </span>
              </div>

              <div className="relative flex h-full w-full flex-col justify-between bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] p-6 pt-20">
                <div className="flex flex-wrap content-start gap-2.5 overflow-y-auto pr-1">
                  {filteredProperties.map((property) => {
                    const isPinActive =
                      hoveredPropertyId === property.id ||
                      selectedMapPropertyId === property.id;

                    return (
                      <button
                        key={property.id}
                        type="button"
                        onClick={() =>
                          setSelectedMapPropertyId(
                            selectedMapPropertyId === property.id ? null : property.id
                          )
                        }
                        onMouseEnter={() => setHoveredPropertyId(property.id)}
                        onMouseLeave={() => setHoveredPropertyId(null)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                          isPinActive
                            ? 'scale-110 bg-emerald-500 text-slate-950 ring-4 ring-emerald-400/40 shadow-lg'
                            : 'bg-white text-slate-900 shadow hover:bg-emerald-50'
                        }`}
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{copFormatter.format(property.monthlyRentCop)}</span>
                        <span className="rounded bg-slate-900/10 px-1.5 py-0.5 text-[10px]">
                          E{property.estrato}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedMapPropertyId && (
                  <div className="z-10 mt-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                    {(() => {
                      const selected = filteredProperties.find(
                        (p) => p.id === selectedMapPropertyId
                      );
                      if (!selected) return null;
                      return (
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[11px] font-bold uppercase text-emerald-700">
                              {selected.neighborhood} • Estrato {selected.estrato}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900">
                              {selected.title}
                            </h3>
                            <p className="mt-0.5 text-sm font-extrabold text-slate-900">
                              {copFormatter.format(selected.monthlyRentCop)}{' '}
                              <span className="text-xs font-normal text-slate-500">
                                ({selected.privateAreaM2} m² • {selected.bedrooms} Hab.)
                              </span>
                            </p>
                            <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                              Coords: {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
                            </p>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickApply(selected)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                              Postularme
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedMapPropertyId(null)}
                              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                            >
                              Cerrar
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
