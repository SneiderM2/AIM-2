'use client';

/**
 * @file PropertyInteractiveRealMap.tsx
 * @description Mapa interactivo real basado en Leaflet con soporte para Cartografía Urbana
 *              (CartoDB Positron/Voyager) y Satélite Real de Alta Resolución (Esri World Imagery).
 *              Pines dinámicos con precios reales de inmuebles en Fusagasugá y Sumapaz.
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, LocateFixed, Maximize2, Sparkles, X } from 'lucide-react';
import type { PropertyCardDTO } from './PropertySearchSplitView';

interface PropertyInteractiveRealMapProps {
  properties: PropertyCardDTO[];
  hoveredPropertyId: string | null;
  selectedPropertyId: string | null;
  onSelectProperty: (id: string | null) => void;
  onHoverProperty: (id: string | null) => void;
  onQuickApply?: (property: PropertyCardDTO) => void;
}

const TILE_LAYERS = {
  streets: {
    name: 'Calles / Urbano',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    name: 'Satélite HD',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
    maxZoom: 19,
  },
};

// Formato corto de precios para pines estilo Airbnb ($1.45M, $850K)
function formatShortPrice(cop: number): string {
  if (cop >= 1000000) {
    const val = cop / 1000000;
    return `$${val % 1 === 0 ? val.toFixed(0) : val.toFixed(2)}M`;
  }
  return `$${Math.round(cop / 1000)}K`;
}

// Centro por defecto: Fusagasugá, Cundinamarca
const DEFAULT_CENTER: [number, number] = [4.3365, -74.3638];
const DEFAULT_ZOOM = 13;

export function PropertyInteractiveRealMap({
  properties,
  hoveredPropertyId,
  selectedPropertyId,
  onSelectProperty,
  onHoverProperty,
  onQuickApply,
}: PropertyInteractiveRealMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const initialFitDoneRef = useRef(false);
  const [activeTileType, setActiveTileType] = useState<'streets' | 'satellite'>('streets');
  const [activePopupProperty, setActivePopupProperty] = useState<PropertyCardDTO | null>(null);

  // 1. Inicializar Mapa de Leaflet una sola vez
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false, // Zoom personalizado abajo a la derecha
    });

    // Control de zoom en esquina inferior derecha
    L.control
      .zoom({
        position: 'bottomright',
      })
      .addTo(map);

    // Capa de mosaicos inicial (Calles / Voyager)
    const baseTile = L.tileLayer(TILE_LAYERS.streets.url, {
      attribution: TILE_LAYERS.streets.attribution,
      maxZoom: TILE_LAYERS.streets.maxZoom,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = baseTile;
    markersLayerRef.current = markersGroup;

    // Redimensionar correctamente cuando el contenedor termine de montarse
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Alternar entre Vista Urbana y Satelital HD
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayerRef.current) return;

    tileLayerRef.current.remove();
    const config = TILE_LAYERS[activeTileType];
    const newTile = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
    }).addTo(map);

    tileLayerRef.current = newTile;
  }, [activeTileType]);

  // 3. Pintar pines interactivos estilo Airbnb con precios en pesos colombianos
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    properties.forEach((property) => {
      const isSelected = selectedPropertyId === property.id;
      const isHovered = hoveredPropertyId === property.id;
      const isHighlighted = isSelected || isHovered;

      const priceText = formatShortPrice(property.monthlyRentCop);

      const html = `
        <div class="sgi-pin-wrapper ${isHighlighted ? 'pin-highlighted' : ''}">
          <div class="sgi-pin-pill ${isHighlighted ? 'active' : ''}">
            <span class="sgi-pin-text">${priceText}</span>
          </div>
          <div class="sgi-pin-pointer ${isHighlighted ? 'pointer-active' : ''}"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'sgi-marker-container',
        html,
        iconSize: [64, 32],
        iconAnchor: [32, 32],
      });

      const marker = L.marker([property.latitude, property.longitude], {
        icon: customIcon,
        zIndexOffset: isHighlighted ? 1000 : 10,
      });

      marker.on('click', () => {
        onSelectProperty(property.id);
        setActivePopupProperty(property);
        map.flyTo([property.latitude, property.longitude], Math.max(map.getZoom(), 15), {
          duration: 0.8,
        });
      });

      marker.on('mouseover', () => {
        onHoverProperty(property.id);
      });

      marker.on('mouseout', () => {
        onHoverProperty(null);
      });

      markersGroup.addLayer(marker);
    });

    // Auto-ajustar encuadre la primera vez para que todos los inmuebles sean visibles
    if (!initialFitDoneRef.current && properties.length > 0) {
      const bounds = L.latLngBounds(properties.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      initialFitDoneRef.current = true;
    }
  }, [properties, hoveredPropertyId, selectedPropertyId, onSelectProperty, onHoverProperty]);

  // 4. Volar hacia el inmueble seleccionado cuando el usuario interactúa desde la lista
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPropertyId) return;

    const prop = properties.find((p) => p.id === selectedPropertyId);
    if (prop) {
      map.flyTo([prop.latitude, prop.longitude], 16, { duration: 0.9 });
      setActivePopupProperty(prop);
    }
  }, [selectedPropertyId, properties]);

  // Encuadrar todos los inmuebles visibles
  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map || properties.length === 0) return;

    const bounds = L.latLngBounds(properties.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
  };

  // Re-centrar en el núcleo urbano de Fusagasugá
  const handleCenterFusagasuga = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.8 });
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
      {/* Contenedor DOM para Leaflet */}
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Barra superior de herramientas sobre el mapa */}
      <div className="absolute left-3 right-3 top-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Insignia de estado */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            {properties.length} inmuebles en Sumapaz
          </span>
        </div>

        {/* Botones de control del mapa */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/95 p-1 shadow-md backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          {/* Alternar Satélite / Calles */}
          <button
            type="button"
            onClick={() => setActiveTileType(activeTileType === 'streets' ? 'satellite' : 'streets')}
            title="Cambiar entre mapa callejero y satelital HD"
            className={`active-press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              activeTileType === 'satellite'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{activeTileType === 'satellite' ? 'Satélite HD' : 'Calles'}</span>
          </button>

          {/* Encuadrar todos los pines */}
          <button
            type="button"
            onClick={handleFitAll}
            title="Ajustar zoom para ver todos los inmuebles"
            className="active-press inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          {/* Centrar en Fusagasugá */}
          <button
            type="button"
            onClick={handleCenterFusagasuga}
            title="Centrar en el casco urbano de Fusagasugá"
            className="active-press inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
          >
            <LocateFixed className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Mini-Card flotante interactiva al hacer clic en un pin */}
      {activePopupProperty && (
        <div className="absolute bottom-4 left-3 right-3 z-[400] mx-auto max-w-sm rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md transition-all animate-fade-in-up dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex gap-3">
            <img
              src={activePopupProperty.coverImageUrl}
              alt={activePopupProperty.title}
              className="h-20 w-24 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-1">
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {activePopupProperty.propertyType.replace('_', ' ')} • Estrato {activePopupProperty.estrato}
                </span>
                <button
                  type="button"
                  onClick={() => setActivePopupProperty(null)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <h4 className="mt-1 line-clamp-1 text-xs font-bold text-slate-900 dark:text-white">
                {activePopupProperty.title}
              </h4>

              <p className="line-clamp-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {activePopupProperty.fictitiousAddress || `${activePopupProperty.neighborhood}, ${activePopupProperty.city}`}
              </p>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-extrabold text-[#005088] dark:text-[#11CAA0]">
                  ${activePopupProperty.monthlyRentCop.toLocaleString('es-CO')}
                  <span className="text-[10px] font-normal text-slate-500">/mes</span>
                </span>

                <button
                  type="button"
                  onClick={() => onQuickApply && onQuickApply(activePopupProperty)}
                  className="active-press rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow hover:bg-emerald-700"
                >
                  Postularme
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
