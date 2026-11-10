import type { Metadata, Viewport } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Navbar } from '../components/layout/Navbar';
import { PwaRegistrar } from '../components/pwa/PwaRegistrar';
import { PropTechProvider } from '../context/PropTechContext';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#005088',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'SGI | Sistema de Gestión Inmobiliaria • Fusagasugá y Región del Sumapaz',
  description:
    'Control total de tus inmuebles, desde cualquier lugar. Plataforma SaaS de gestión inmobiliaria para Fusagasugá y Sumapaz bajo Ley 820 de 2003, Ley 1581 de 2012 y Ley 527 de 1999.',
  applicationName: 'SGI PropTech',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SGI PropTech',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CO">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SGI PropTech" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <PropTechProvider>
          <NuqsAdapter>
            <Navbar />
            <main className="min-h-[calc(100vh-4rem)] pb-20 xl:pb-6">
              {children}
            </main>
            <PwaRegistrar />
          </NuqsAdapter>
        </PropTechProvider>
      </body>
    </html>
  );
}
