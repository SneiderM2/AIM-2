import type { Metadata } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Navbar } from '../components/layout/Navbar';
import { PropTechProvider } from '../context/PropTechContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'SGI | Sistema de Gestión Inmobiliaria • Fusagasugá y Región del Sumapaz',
  description:
    'Control total de tus inmuebles, desde cualquier lugar. Plataforma SaaS de gestión inmobiliaria para Fusagasugá y Sumapaz bajo Ley 820 de 2003, Ley 1581 de 2012 y Ley 527 de 1999.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CO">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <PropTechProvider>
          <NuqsAdapter>
            <Navbar />
            {children}
          </NuqsAdapter>
        </PropTechProvider>
      </body>
    </html>
  );
}
