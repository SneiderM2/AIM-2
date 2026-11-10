import React, { Suspense } from 'react';
import { PropertySearchSplitView } from '../components/search/PropertySearchSplitView';
import { PropertySearchSkeleton } from '../components/search/PropertySearchSkeleton';
import { INITIAL_COLOMBIAN_PROPERTIES } from '../lib/data/colombia-mock-data';

export default function HomePage() {
  return (
    <Suspense fallback={<PropertySearchSkeleton />}>
      <PropertySearchSplitView
        initialProperties={INITIAL_COLOMBIAN_PROPERTIES}
        totalCount={INITIAL_COLOMBIAN_PROPERTIES.length}
      />
    </Suspense>
  );
}
