'use client';

/**
 * @file page.tsx (/login)
 * @description Pantalla de Inicio de Sesión y Selector de los 3 Roles del Ecosistema PropTech
 *              (Propietario/Arrendador, Arrendatario/Inquilino, Agente/Administrador) con Habeas Data.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  KeyRound,
  Lock,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  DEMO_ROLE_USERS,
  usePropTech,
  type UserRoleType,
} from '../../context/PropTechContext';

const ROLE_CARDS: Array<{
  role: UserRoleType;
  title: string;
  subtitle: string;
  badge: string;
  permissions: string[];
  accentColor: string;
}> = [
  {
    role: 'landlord',
    title: 'Propietario / Arrendador',
    subtitle: 'Carlos Eduardo Gómez (CC 79.845.120)',
    badge: 'Rol 1 • Landlord',
    permissions: [
      'CRUD completo de sus inmuebles (Crear, Editar canon/estado, Eliminar)',
      'Aprobar o rechazar postulaciones de arrendatarios',
      'Generar contratos Ley 820 y firmar electrónicamente (SHA-256)',
      'Visualizar recaudo de cánones y reajustes IPC DANE',
    ],
    accentColor: 'border-emerald-500 bg-emerald-50/50',
  },
  {
    role: 'tenant',
    title: 'Arrendatario / Inquilino',
    subtitle: 'Valentina Restrepo (CC 1.020.765.432)',
    badge: 'Rol 2 • Tenant',
    permissions: [
      'Buscar inmuebles en mapa PostGIS y postularse con estudio de solvencia',
      'CRUD de sus postulaciones (Crear, Consultar scoring, Cancelar)',
      'Firmar contratos electrónicamente con OTP (Ley 527 de 1999)',
      'Pagar cánones mensuales vía PSE/Nequi y radicar PQRS (Art. 19 Ley 820)',
    ],
    accentColor: 'border-indigo-500 bg-indigo-50/50',
  },
  {
    role: 'agent',
    title: 'Agente Inmobiliario / Admin',
    subtitle: 'Andrés Felipe Vargas (NIT 900.412.889-1)',
    badge: 'Rol 3 • Agent & Admin',
    permissions: [
      'CRUD global de todos los inmuebles y auditoría del tope 1% (Art. 18 Ley 820)',
      'Calificación de solvencia crediticia (Scoring 0–1000) y aprobación',
      'Supervisión de contratos sellados y certificados probatorios CGP',
      'Gestión y resolución de PQRS con control de 15 días hábiles ante la SIC',
    ],
    accentColor: 'border-amber-500 bg-amber-50/50',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, loginAsRole } = usePropTech();

  const [selectedRole, setSelectedRole] = useState<UserRoleType>(currentUser.role);
  const [customName, setCustomName] = useState(DEMO_ROLE_USERS[currentUser.role].fullName);
  const [customEmail, setCustomEmail] = useState(DEMO_ROLE_USERS[currentUser.role].email);
  const [acceptedHabeasData, setAcceptedHabeasData] = useState(true);

  const handleSelectRoleCard = (role: UserRoleType) => {
    setSelectedRole(role);
    setCustomName(DEMO_ROLE_USERS[role].fullName);
    setCustomEmail(DEMO_ROLE_USERS[role].email);
  };

  const handleQuickLogin = (role: UserRoleType) => {
    loginAsRole(role);
    router.push('/panel');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedHabeasData) return;
    loginAsRole(selectedRole, customName, customEmail);
    router.push('/panel');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800">
          <KeyRound className="h-3.5 w-3.5" />
          Autenticación RBAC Multi-Rol • Supabase Auth + Row Level Security
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
          Iniciar Sesión en PropTech Colombia
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
          Selecciona cualquiera de los <strong>3 roles del ecosistema inmobiliario</strong> para ingresar directamente a su Panel CRUD personalizado o inicia sesión con tus credenciales.
        </p>
      </div>

      {/* Tarjetas de Acceso Rápido para los 3 Roles */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {ROLE_CARDS.map((card) => {
          const isCurrent = currentUser.role === card.role;
          return (
            <div
              key={card.role}
              onClick={() => handleSelectRoleCard(card.role)}
              className={`cursor-pointer rounded-2xl border-2 p-6 transition-all ${
                selectedRole === card.role
                  ? `${card.accentColor} shadow-lg`
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-white">
                  {card.badge}
                </span>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Sesión Activa
                  </span>
                )}
              </div>

              <h2 className="mt-4 text-lg font-extrabold text-slate-900">{card.title}</h2>
              <p className="text-xs font-medium text-slate-500">{card.subtitle}</p>

              <ul className="mt-4 space-y-2 text-xs text-slate-700">
                {card.permissions.map((perm) => (
                  <li key={perm} className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickLogin(card.role);
                }}
                className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow transition hover:bg-emerald-600"
              >
                <UserCheck className="h-4 w-4" />
                Entrar como {card.title.split(' / ')[0]} y abrir CRUD
              </button>
            </div>
          );
        })}
      </div>

      {/* Formulario de Inicio de Sesión Personalizado con Habeas Data */}
      <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Acceso Personalizado con Consentimiento Habeas Data (Ley 1581 de 2012)
            </h3>
            <p className="text-xs text-slate-500">
              Configura el nombre, correo y rol activo para probar todos los flujos transaccionales.
            </p>
          </div>
        </div>

        <form onSubmit={handleCustomSubmit} className="mt-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block font-bold uppercase text-slate-700">Rol Seleccionado</label>
              <select
                value={selectedRole}
                onChange={(e) => handleSelectRoleCard(e.target.value as UserRoleType)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900"
              >
                <option value="landlord">1. Propietario / Arrendador</option>
                <option value="tenant">2. Arrendatario / Inquilino</option>
                <option value="agent">3. Agente Inmobiliario / Admin</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-700">Nombre Completo</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-700">Correo Electrónico</label>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                required
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <input
              type="checkbox"
              checked={acceptedHabeasData}
              onChange={(e) => setAcceptedHabeasData(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600"
              required
            />
            <span className="text-[11px] leading-relaxed text-slate-700">
              Autorizo de manera previa, expresa e informada el tratamiento de mis datos personales conforme a la <strong>Ley 1581 de 2012</strong> y el <strong>Decreto 1377 de 2013</strong>, así como el uso de firma electrónica criptográfica bajo la <strong>Ley 527 de 1999</strong>.
            </span>
          </label>

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow hover:bg-emerald-700"
          >
            <Users className="h-4 w-4" />
            Iniciar Sesión e Ir al Panel CRUD de {DEMO_ROLE_USERS[selectedRole].roleLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
