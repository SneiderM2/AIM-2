'use client';

/**
 * @file page.tsx (/login)
 * @description Pantalla de Inicio de Sesión limpia y profesional.
 *              Un único formulario con Correo Electrónico y Contraseña.
 *              Deriva automáticamente la vista y permisos según las credenciales del usuario
 *              (Propietario, Arrendatario, Agente / Administrador) bajo la Ley 1581 de 2012.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { usePropTech } from '../../context/PropTechContext';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithCredentials, currentUser } = usePropTech();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedHabeasData, setAcceptedHabeasData] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!acceptedHabeasData) {
      setErrorMessage(
        'Debes aceptar el consentimiento de tratamiento de datos personales (Ley 1581 de 2012).'
      );
      return;
    }

    setIsSubmitting(true);
    const result = loginWithCredentials(email, password);

    if (result.success) {
      router.push('/panel');
    } else {
      setErrorMessage(result.error ?? 'Credenciales no válidas.');
      setIsSubmitting(false);
    }
  };

  const autofillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Cabecera del Login */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Iniciar Sesión
          </h1>
          <p className="mt-2 text-xs text-slate-500">
            Plataforma PropTech & Legal-Tech • Región del Sumapaz (Fusagasugá)
          </p>
        </div>

        {/* Tarjeta del Formulario Principal */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo: Correo Electrónico */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Correo Electrónico
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@proptech.co"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>

            {/* Campo: Contraseña */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Contraseña
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>

            {/* Habeas Data Ley 1581 de 2012 */}
            <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <input
                type="checkbox"
                checked={acceptedHabeasData}
                onChange={(e) => setAcceptedHabeasData(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                required
              />
              <span className="text-[11px] leading-relaxed text-slate-600">
                Acepto el tratamiento de mis datos personales conforme a la{' '}
                <strong>Ley 1581 de 2012</strong> y firma electrónica bajo la{' '}
                <strong>Ley 527 de 1999</strong>.
              </span>
            </label>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              <UserCheck className="h-4 w-4" />
              <span>{isSubmitting ? 'Verificando...' : 'Iniciar Sesión'}</span>
            </button>
          </form>
        </div>

        {/* Guía de Credenciales Autorizadas (Sumapaz) */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 shadow-sm">
          <p className="font-bold text-slate-800">
            Credenciales de acceso para pruebas por rol:
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-xs border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">1. Arrendatario / Inquilino</p>
                <p className="font-mono text-[11px] text-slate-500">
                  arrendatario@proptech.co • inquilino123
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  autofillCredentials('arrendatario@proptech.co', 'inquilino123')
                }
                className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100"
              >
                Cargar
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-xs border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">2. Propietario / Arrendador</p>
                <p className="font-mono text-[11px] text-slate-500">
                  propietario@proptech.co • propietario123
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  autofillCredentials('propietario@proptech.co', 'propietario123')
                }
                className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
              >
                Cargar
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-xs border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">3. Administrador / Agente</p>
                <p className="font-mono text-[11px] text-slate-500">
                  admin@proptech.co • admin123
                </p>
              </div>
              <button
                type="button"
                onClick={() => autofillCredentials('admin@proptech.co', 'admin123')}
                className="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100"
              >
                Cargar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
