import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SGI — Sistema de Gestión Inmobiliaria',
    short_name: 'SGI PropTech',
    description:
      'Control total de tus inmuebles, desde cualquier lugar. Plataforma SaaS de gestión inmobiliaria para Fusagasugá y la Región del Sumapaz.',
    start_url: '/',
    id: '/',
    display: 'standalone',
    background_color: '#1B365D',
    theme_color: '#005088',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'es-CO',
    categories: ['business', 'finance', 'productivity', 'utilities'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Buscador Sumapaz',
        short_name: 'Buscador',
        description: 'Explora inmuebles disponibles en Fusagasugá y Sumapaz',
        url: '/',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Panel de Control',
        short_name: 'Panel',
        description: 'Accede a tus propiedades, cánones y contratos',
        url: '/panel',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Publicar Inmueble',
        short_name: 'Publicar',
        description: 'Publica un inmueble con validación del 1% Ley 820',
        url: '/publicar',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Planes SaaS',
        short_name: 'Planes',
        description: 'Planes de suscripción y prueba gratuita de 14 días',
        url: '/planes',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
