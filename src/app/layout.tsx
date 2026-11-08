import type { Metadata } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Navbar } from '../components/layout/Navbar';
import { PropTechProvider } from '../context/PropTechContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'PropTech Colombia | Plataforma Inmobiliaria Transaccional y Legal-Tech',
  description:
    'Plataforma web PropTech empresarial para Colombia bajo el estándar IEEE 830, Ley 820 de 2003, Ley 1581 de 2012 (Habeas Data) y Ley 527 de 1999 (Firma Electrónica SHA-256).',
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
