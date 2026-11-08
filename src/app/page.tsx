import React, { Suspense } from 'react';
import { PropertySearchSplitView } from '../components/search/PropertySearchSplitView';
import { INITIAL_COLOMBIAN_PROPERTIES } from '../lib/data/colombia-mock-data';

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center p-12 text-sm font-medium text-slate-600">
          Cargando buscador inmobiliario y motor geoespacial PostGIS...
        </div>
      }
    >
      <PropertySearchSplitView
        initialProperties={INITIAL_COLOMBIAN_PROPERTIES}
        totalCount={INITIAL_COLOMBIAN_PROPERTIES.length}
      />
    </Suspense>
  );
}
