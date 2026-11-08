'use client';

/**
 * @file page.tsx (/panel)
 * @description Panel Centralizado de Gestión con vistas estrictamente independientes
 *              por Rol (Propietario, Arrendatario, Administrador) conforme a los requerimientos
 *              específicos de la Región del Sumapaz (Fusagasugá) y leyes colombianas.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  ExternalLink,
  FileSignature,
  FileWarning,
  KeyRound,
  MapPin,
  Plus,
  PlusCircle,
  Scale,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import {
  usePropTech,
  type ApplicationStatusType,
  type PropertyStatusType,
} from '../../context/PropTechContext';
import type { PROPERTY_TYPES } from '../../lib/validations/proptech.schemas';

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export default function RoleCrudPanelPage() {
  const {
    currentUser,
    properties,
    applications,
    contracts,
    payments,
    pqrsClaims,
    createProperty,
    updateProperty,
    deleteProperty,
    createApplication,
    updateApplicationStatus,
    deleteApplication,
    signContractByRole,
    payMonthlyCanon,
    createPqrs,
    updatePqrsStatus,
    deletePqrs,
  } = usePropTech();

  // Estado para creación de inmueble (Propietario / Admin)
  const [showCreatePropertyForm, setShowCreatePropertyForm] = useState(false);
  const [newPropTitle, setNewPropTitle] = useState('');
  const [newPropCity, setNewPropCity] = useState('Fusagasugá');
  const [newPropNeighborhood, setNewPropNeighborhood] = useState('Balmoral');
  const [newPropType, setNewPropType] =
    useState<(typeof PROPERTY_TYPES)[number]>('apartamento');
  const [newPropEstrato, setNewPropEstrato] = useState<1 | 2 | 3 | 4 | 5 | 6>(4);
  const [newPropValuation, setNewPropValuation] = useState(180000000);
  const [newPropRent, setNewPropRent] = useState(1400000);
  const [newPropAdmin, setNewPropAdmin] = useState(150000);
  const [newPropArea, setNewPropArea] = useState(82);
  const [newPropBeds, setNewPropBeds] = useState(3);
  const [newPropBaths, setNewPropBaths] = useState(2);

  // Estado para edición rápida de canon
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editRentVal, setEditRentVal] = useState<number>(0);

  // Estado para nueva postulación (Arrendatario)
  const [selectedApplyPropertyId, setSelectedApplyPropertyId] = useState<string>(
    properties[0]?.id ?? ''
  );
  const [declaredIncome, setDeclaredIncome] = useState(4500000);
  const [employerName, setEmployerName] = useState('Alcaldía de Fusagasugá');
  const [coSignerName, setCoSignerName] = useState('Jorge Enrique Gómez');
  const [coSignerIncome, setCoSignerIncome] = useState(5800000);

  // Estado para nuevo reclamo PQRS (Arrendatario)
  const [pqrsSubject, setPqrsSubject] = useState('');
  const [pqrsDescription, setPqrsDescription] = useState('');
  const [pqrsType, setPqrsType] = useState<
    | 'reparacion_necesaria'
    | 'reparacion_locativa'
    | 'facturacion_canon'
    | 'servicios_publicos'
    | 'terminacion_contrato'
    | 'habeas_data_arco'
  >('reparacion_necesaria');

  const handleCreatePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropTitle.trim()) return;

    createProperty({
      title: newPropTitle.trim(),
      propertyType: newPropType,
      city: newPropCity,
      neighborhood: newPropNeighborhood,
      department: 'Cundinamarca (Región del Sumapaz)',
      addressLine: `Carrera 6 # 14 - 30 (${newPropNeighborhood}), ${newPropCity}`,
      estrato: newPropEstrato,
      commercialValuationCop: newPropValuation,
      cadastralValuationCop: Math.round(newPropValuation * 0.65),
      monthlyRentCop: newPropRent,
      administrationFeeCop: newPropAdmin,
      isAdministrationIncluded: false,
      privateAreaM2: newPropArea,
      bedrooms: newPropBeds,
      bathrooms: newPropBaths,
      parkingSpots: 1,
      latitude: 4.3365,
      longitude: -74.3638,
      coverImageUrl:
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
      matriculaInmobiliaria: `050C-${Math.floor(1000000 + Math.random() * 9000000)}`,
      status: 'available',
    });

    setNewPropTitle('');
    setShowCreatePropertyForm(false);
  };

  const handleCreateApplicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplyPropertyId) return;
    createApplication({
      propertyId: selectedApplyPropertyId,
      declaredMonthlyIncomeCop: declaredIncome,
      employmentType: 'empleado',
      employerName,
      coSignerFullName: coSignerName,
      coSignerIncomeCop: coSignerIncome,
    });
  };

  const handleCreatePqrsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pqrsSubject.trim() || !pqrsDescription.trim()) return;
    createPqrs({
      propertyTitle: properties[0]?.title ?? 'Inmueble Arrendado en Fusagasugá',
      claimType: pqrsType,
      subject: pqrsSubject.trim(),
      description: pqrsDescription.trim(),
    });
    setPqrsSubject('');
    setPqrsDescription('');
  };

  // Cuotas pendientes del arrendatario
  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const paidPayments = payments.filter((p) => p.status === 'paid');

  // Conteo de inmuebles por ocupación para el Administrador
  const totalProps = properties.length;
  const rentedProps = properties.filter((p) => p.status === 'rented');
  const availableProps = properties.filter((p) => p.status === 'available');
  const reviewProps = properties.filter((p) => p.status === 'under_review');

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      {/* =====================================================================
          CABECERA PERSONALIZADA CON VISTA ESTRICTA DEL ROL ACTUAL
         ===================================================================== */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
                  currentUser.role === 'agent'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                    : currentUser.role === 'landlord'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'
                }`}
              >
                Sesión: {currentUser.roleLabel}
              </span>
              <span className="font-mono text-xs text-slate-500">
                {currentUser.documentType} {currentUser.documentNumber} • {currentUser.email}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
              Bienvenido, {currentUser.fullName}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {currentUser.role === 'landlord' &&
                'Gestión de tus inmuebles en arriendo en la Región del Sumapaz (Fusagasugá) y aprobación de postulaciones.'}
              {currentUser.role === 'tenant' &&
                'Consulta de tus cánones mensuales, qué cuota te falta por pagar y estado de tus postulaciones.'}
              {currentUser.role === 'agent' &&
                'Control global de inventario de inmuebles, estado de ocupación (Disponible u Ocupado) y auditoría legal.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Ver Buscador</span>
            </Link>
          </div>
        </div>
      </div>

      {/* =====================================================================
          1. VISTA EXCLUSIVA: ARRENDATARIO / INQUILINO (TENANT)
          "lo único que ve el arrendatario, y además de eso qué cuota le falta"
         ===================================================================== */}
      {currentUser.role === 'tenant' && (
        <div className="space-y-8">
          {/* Alerta Destacada: ¿Qué cuota le falta al arrendatario? */}
          <div className="rounded-2xl border-2 border-indigo-500 bg-indigo-50/60 p-6 shadow-sm dark:bg-indigo-950/20">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  <CreditCard className="h-3.5 w-3.5" />
                  Estado de Cuenta • ¿Qué cuota le falta?
                </span>
                {pendingPayments.length > 0 ? (
                  <div className="mt-3">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      Tienes {pendingPayments.length} cuota pendiente por pagar:
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                      {pendingPayments[0].billingPeriod} — Inmueble:{' '}
                      {pendingPayments[0].propertyTitle}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      Fecha límite de pago: <strong>{pendingPayments[0].dueDate}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="mt-3">
                    <h2 className="flex items-center gap-2 text-xl font-extrabold text-emerald-800 dark:text-emerald-400">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      ¡Estás al día! No tienes cuotas pendientes de arriendo.
                    </h2>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Todos tus cánones de arrendamiento han sido cancelados oportunamente.
                    </p>
                  </div>
                )}
              </div>

              {pendingPayments.length > 0 && (
                <div className="flex flex-col items-start gap-2 rounded-xl border border-indigo-200 bg-white p-4 shadow-sm md:items-end dark:border-indigo-900 dark:bg-slate-900">
                  <span className="text-[11px] font-bold uppercase text-slate-500">
                    Total a Pagar (Incluye Admón)
                  </span>
                  <span className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400">
                    {copFormatter.format(pendingPayments[0].totalAmountCop)}
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => payMonthlyCanon(pendingPayments[0].id, 'pse')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Pagar con PSE
                    </button>
                    <button
                      type="button"
                      onClick={() => payMonthlyCanon(pendingPayments[0].id, 'nequi')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                      Pagar con Nequi
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Historial de Pagos y Comprobantes Ley 820 (Art. 11) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Historial de Pagos y Comprobantes de Arriendo (Art. 11 Ley 820)
            </h3>
            <p className="text-xs text-slate-500">
              Comprobantes válidos emitidos ante la DIAN y registrados de forma inmutable.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                    <th className="p-3">Periodo / Concepto</th>
                    <th className="p-3">Inmueble</th>
                    <th className="p-3">Total Pagado</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Comprobante Transaccional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">{pay.billingPeriod}</td>
                      <td className="p-3 text-slate-700">{pay.propertyTitle}</td>
                      <td className="p-3 font-extrabold text-slate-900">
                        {copFormatter.format(pay.totalAmountCop)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            pay.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pay.status === 'paid' ? 'Pagado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {pay.status === 'paid' ? (
                          <span className="text-emerald-700">
                            ✓ {pay.gatewayReference} ({pay.paymentMethod?.toUpperCase()})
                          </span>
                        ) : (
                          <span className="text-amber-700">Ref: {pay.gatewayReference}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Postulaciones del Arrendatario a Inmuebles en Sumapaz */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
                <Users className="h-5 w-5 text-indigo-600" />
                Mis Postulaciones a Inmuebles en Sumapaz
              </h3>
              <p className="text-xs text-slate-500">
                Consulta el estado de tu estudio crediticio Datacrédito y aprobación de arriendo.
              </p>
            </div>

            {/* Formulario para postularse */}
            <form
              onSubmit={handleCreateApplicationSubmit}
              className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3 text-xs"
            >
              <h4 className="font-bold text-slate-900">
                Radicar Nueva Postulación a Inmueble Disponible
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold uppercase text-slate-700">
                    Inmueble en Fusagasugá / Sumapaz
                  </label>
                  <select
                    value={selectedApplyPropertyId}
                    onChange={(e) => setSelectedApplyPropertyId(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs"
                  >
                    {properties
                      .filter((p) => p.status === 'available')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.neighborhood}, {p.city} — {copFormatter.format(p.monthlyRentCop)})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700">
                    Ingresos Mensuales (COP)
                  </label>
                  <input
                    type="number"
                    value={declaredIncome}
                    onChange={(e) => setDeclaredIncome(Number(e.target.value))}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700">
                    Empresa / Ocupación
                  </label>
                  <input
                    type="text"
                    value={employerName}
                    onChange={(e) => setEmployerName(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Enviar Postulación con Estudio Datacrédito
                </button>
              </div>
            </form>

            {/* Listado de postulaciones */}
            <div className="mt-4 space-y-2.5">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 text-xs sm:flex-row sm:items-center"
                >
                  <div>
                    <h4 className="font-bold text-slate-900">{app.propertyTitle}</h4>
                    <p className="text-slate-500">
                      {app.propertyCity} • Canon: {copFormatter.format(app.monthlyRentCop)} •
                      Ingresos declarados: {copFormatter.format(app.declaredMonthlyIncomeCop)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-xs font-bold text-emerald-400">
                      Score: {app.riskScore}/1000
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
                        app.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {app.status === 'approved'
                        ? 'Aprobada'
                        : app.status === 'rejected'
                          ? 'Rechazada'
                          : 'En Estudio'}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteApplication(app.id)}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Mis Contratos y Firma Digital SHA-256 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
              <FileSignature className="h-5 w-5 text-emerald-600" />
              Mis Contratos de Arrendamiento (Ley 820 de 2003)
            </h3>
            <p className="text-xs text-slate-500">
              Contratos celebrados bajo la Ley 527 de 1999 con firma digital y no repudio.
            </p>
            <div className="mt-4 space-y-3">
              {contracts.map((cnt) => (
                <div
                  key={cnt.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono font-bold text-emerald-700">
                      {cnt.contractNumber}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        cnt.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {cnt.status === 'active' ? 'Sellado y Activo' : 'Firma Pendiente'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900">{cnt.propertyTitle}</h4>
                  <p className="text-slate-600">
                    Canon mensual: {copFormatter.format(cnt.agreedMonthlyRentCop)} • Depósito Art. 16: $0 COP
                  </p>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                    <span className="text-[11px] text-slate-500">
                      Firma Arrendatario:{' '}
                      <strong className={cnt.tenantSignedAt ? 'text-emerald-700' : 'text-amber-700'}>
                        {cnt.tenantSignedAt ? 'Firmado' : 'Pendiente'}
                      </strong>
                    </span>
                    {!cnt.tenantSignedAt && (
                      <button
                        type="button"
                        onClick={() => signContractByRole(cnt.id, 'tenant')}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                      >
                        Firmar Electrónicamente (SHA-256)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Radicación de PQRS y Reparaciones Art. 19 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
              <FileWarning className="h-5 w-5 text-amber-600" />
              Radicar Reparaciones Locativas/Necesarias y PQRS (Art. 19 Ley 820)
            </h3>
            <p className="text-xs text-slate-500">
              Solicitud oficial con término perentorio de 15 días hábiles conforme a la SIC.
            </p>
            <form onSubmit={handleCreatePqrsSubmit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700">Tipo</label>
                <select
                  value={pqrsType}
                  onChange={(e) => setPqrsType(e.target.value as typeof pqrsType)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs"
                >
                  <option value="reparacion_necesaria">Reparación Necesaria (Arrendador)</option>
                  <option value="reparacion_locativa">Reparación Locativa (Inquilino)</option>
                  <option value="facturacion_canon">Facturación Canon / IPC</option>
                  <option value="habeas_data_arco">Habeas Data / Ley 1581</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold uppercase text-slate-700">Asunto</label>
                <input
                  type="text"
                  value={pqrsSubject}
                  onChange={(e) => setPqrsSubject(e.target.value)}
                  placeholder="Ej: Mantenimiento de tubería en cocina"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="h-9 w-full rounded-lg bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Radicar Solicitud
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* =====================================================================
          2. VISTA EXCLUSIVA: PROPIETARIO / ARRENDADOR (LANDLORD)
          "si ingreso como propietario tiene que solo la de propietario"
         ===================================================================== */}
      {currentUser.role === 'landlord' && (
        <div className="space-y-8">
          {/* Métricas del Propietario */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-500">Mis Inmuebles</span>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{properties.length}</p>
              <p className="text-[11px] text-emerald-700">En Sumapaz (Fusagasugá)</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-500">Inmuebles Arrendados</span>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{rentedProps.length}</p>
              <p className="text-[11px] text-indigo-700">Generando renta mensual</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-500">Postulaciones Recibidas</span>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{applications.length}</p>
              <p className="text-[11px] text-amber-700">Pendientes de tu aprobación</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-500">Contratos Vigentes</span>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{contracts.length}</p>
              <p className="text-[11px] text-emerald-700">Sellados Ley 820</p>
            </div>
          </div>

          {/* CRUD de Mis Inmuebles (Propietario) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  CRUD de Mis Inmuebles (Fusagasugá y Sumapaz)
                </h2>
                <p className="text-xs text-slate-500">
                  Crea, edita el canon mensual, modifica el estado o elimina tus inmuebles.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreatePropertyForm(!showCreatePropertyForm)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                {showCreatePropertyForm ? 'Cerrar Formulario' : 'Crear Nuevo Inmueble'}
              </button>
            </div>

            {/* Formulario de Creación de Inmueble */}
            {showCreatePropertyForm && (
              <form
                onSubmit={handleCreatePropertySubmit}
                className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3 text-xs"
              >
                <h3 className="font-bold text-slate-900">
                  Registrar Inmueble en Fusagasugá / Región del Sumapaz
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold uppercase text-slate-700">Título</label>
                    <input
                      type="text"
                      value={newPropTitle}
                      onChange={(e) => setNewPropTitle(e.target.value)}
                      placeholder="Ej: Casa Campestre con Jardín en Chinauta"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-slate-700">Municipio</label>
                    <select
                      value={newPropCity}
                      onChange={(e) => setNewPropCity(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs"
                    >
                      <option value="Fusagasugá">Fusagasugá</option>
                      <option value="Silvania">Silvania</option>
                      <option value="Arbeláez">Arbeláez</option>
                      <option value="Pasca">Pasca</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-slate-700">Barrio / Sector</label>
                    <input
                      type="text"
                      value={newPropNeighborhood}
                      onChange={(e) => setNewPropNeighborhood(e.target.value)}
                      placeholder="Ej: Balmoral, Manila, Chinauta"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div>
                    <label className="block font-bold uppercase text-slate-700">Tipo</label>
                    <select
                      value={newPropType}
                      onChange={(e) =>
                        setNewPropType(e.target.value as (typeof PROPERTY_TYPES)[number])
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs"
                    >
                      <option value="apartamento">Apartamento</option>
                      <option value="casa">Casa</option>
                      <option value="apartaestudio">Apartaestudio</option>
                      <option value="local_comercial">Local Comercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-slate-700">Estrato (1-6)</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={newPropEstrato}
                      onChange={(e) =>
                        setNewPropEstrato(Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6)
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-slate-700">Avalúo Comercial</label>
                    <input
                      type="number"
                      value={newPropValuation}
                      onChange={(e) => setNewPropValuation(Number(e.target.value))}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-slate-700">Canon Mensual</label>
                    <input
                      type="number"
                      value={newPropRent}
                      onChange={(e) => setNewPropRent(Number(e.target.value))}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="h-9 w-full rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      Guardar Inmueble
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Tabla de Inmuebles del Propietario */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                    <th className="p-3">Inmueble / Matrícula SNR</th>
                    <th className="p-3">Ubicación (Sumapaz)</th>
                    <th className="p-3">Canon Mensual</th>
                    <th className="p-3">Cumple Ley 820 (Art. 18)</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {properties.map((prop) => {
                    const isEditing = editingPropertyId === prop.id;
                    return (
                      <tr key={prop.id} className="hover:bg-slate-50/80">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{prop.title}</p>
                          <p className="font-mono text-[11px] text-slate-500">
                            SNR: {prop.matriculaInmobiliaria} • {prop.privateAreaM2} m²
                          </p>
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-slate-800">
                            {prop.neighborhood}, {prop.city}
                          </span>
                          <span className="ml-1.5 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            E{prop.estrato}
                          </span>
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                value={editRentVal}
                                onChange={(e) => setEditRentVal(Number(e.target.value))}
                                className="h-8 w-28 rounded border border-emerald-500 px-2 text-xs font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  updateProperty(prop.id, { monthlyRentCop: editRentVal });
                                  setEditingPropertyId(null);
                                }}
                                className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white"
                              >
                                OK
                              </button>
                            </div>
                          ) : (
                            <span className="font-extrabold text-slate-900">
                              {copFormatter.format(prop.monthlyRentCop)}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <ShieldCheck className="h-3 w-3" />
                            &le; 1% Comercial
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={prop.status}
                            onChange={(e) =>
                              updateProperty(prop.id, {
                                status: e.target.value as PropertyStatusType,
                              })
                            }
                            className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800"
                          >
                            <option value="available">Disponible</option>
                            <option value="rented">Arrendado / Ocupado</option>
                            <option value="under_review">En Revisión</option>
                            <option value="inactive">Inactivo</option>
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPropertyId(prop.id);
                                setEditRentVal(prop.monthlyRentCop);
                              }}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProperty(prop.id)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                            >
                              Borrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Gestión de Postulaciones Recibidas (Aprobar / Rechazar) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
              <Users className="h-5 w-5 text-indigo-600" />
              Postulaciones Recibidas de Arrendatarios
            </h3>
            <p className="text-xs text-slate-500">
              Aprueba solicitudes solventes para generar automáticamente el contrato Ley 820.
            </p>
            <div className="mt-4 space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 text-xs sm:flex-row sm:items-center"
                >
                  <div>
                    <h4 className="font-bold text-slate-900">{app.applicantName}</h4>
                    <p className="text-slate-500">
                      Inmueble: <strong>{app.propertyTitle}</strong> • Ingresos: {copFormatter.format(app.declaredMonthlyIncomeCop)} • Deudor solidario: {app.coSignerFullName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-700">
                      Score: {app.riskScore}/1000
                    </span>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-indigo-700">
                      {app.status}
                    </span>
                    {app.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => updateApplicationStatus(app.id, 'approved')}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        Aprobar Solicitud
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Firma de Contratos por el Propietario */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
              <FileSignature className="h-5 w-5 text-emerald-600" />
              Contratos y Firma Electrónica (SHA-256)
            </h3>
            <div className="mt-4 space-y-3">
              {contracts.map((cnt) => (
                <div
                  key={cnt.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:flex-row sm:items-center"
                >
                  <div>
                    <span className="font-mono font-bold text-emerald-700">
                      {cnt.contractNumber}
                    </span>
                    <h4 className="font-bold text-slate-900">{cnt.propertyTitle}</h4>
                    <p className="text-slate-500">
                      Canon: {copFormatter.format(cnt.agreedMonthlyRentCop)} • Inquilino: {cnt.tenantName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-600">
                      Firma Propietario:{' '}
                      <strong className={cnt.landlordSignedAt ? 'text-emerald-700' : 'text-amber-700'}>
                        {cnt.landlordSignedAt ? 'Firmado' : 'Pendiente'}
                      </strong>
                    </span>
                    {!cnt.landlordSignedAt && (
                      <button
                        type="button"
                        onClick={() => signContractByRole(cnt.id, 'landlord')}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        Firmar como Propietario
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          3. VISTA EXCLUSIVA: ADMINISTRADOR / SECRETARIO (AGENT)
          "el administrador solo tiene que dejar ver qué inmuebles tiene,
          en qué sitios, demás información general, y si está ocupado o no"
         ===================================================================== */}
      {currentUser.role === 'agent' && (
        <div className="space-y-8">
          {/* Métricas Principales del Administrador */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-500">
                Total Inmuebles en Sumapaz
              </span>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{totalProps}</p>
              <p className="text-[11px] text-slate-600">Fusagasugá, Silvania, Arbeláez</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-500">
                Inmuebles Ocupados / Arrendados
              </span>
              <p className="mt-1 text-2xl font-extrabold text-emerald-700">{rentedProps.length}</p>
              <p className="text-[11px] text-emerald-700">Contratos activos celebrados</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-500">
                Inmuebles Disponibles
              </span>
              <p className="mt-1 text-2xl font-extrabold text-indigo-700">{availableProps.length}</p>
              <p className="text-[11px] text-indigo-700">Publicados en el buscador</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase text-slate-500">
                En Revisión Jurídica
              </span>
              <p className="mt-1 text-2xl font-extrabold text-amber-700">{reviewProps.length}</p>
              <p className="text-[11px] text-amber-700">Verificación de matrícula SNR</p>
            </div>
          </div>

          {/* SECCIÓN PRINCIPAL SOLICITADA POR EL USUARIO PARA EL ADMINISTRADOR:
              "qué inmuebles tiene, en qué sitios, demás información general, y si está ocupado o no está ocupado" */}
          <section className="rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  Inventario General de Inmuebles en Sumapaz: Ubicación y Estado de Ocupación
                </h2>
                <p className="text-xs text-slate-500">
                  Control oficial para Administrador / Secretario: visualiza qué inmuebles existen, en qué sitios de Fusagasugá o Sumapaz están ubicados, sus datos generales y si están ocupados o disponibles.
                </p>
              </div>

              <span className="rounded-full bg-slate-900 px-3.5 py-1 text-xs font-bold text-white dark:bg-slate-800">
                {properties.length} Inmuebles Auditados
              </span>
            </div>

            {/* Tabla Detallada del Administrador */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <th className="p-3">Inmueble / Matrícula SNR</th>
                    <th className="p-3">Sitio / Ubicación en Sumapaz</th>
                    <th className="p-3">¿Está Ocupado o Disponible?</th>
                    <th className="p-3">Canon Mensual (COP)</th>
                    <th className="p-3">Detalles Generales</th>
                    <th className="p-3">Tope Legal Art. 18</th>
                    <th className="p-3 text-right">Actualizar Ocupación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {properties.map((prop) => {
                    const isOccupied = prop.status === 'rented';
                    return (
                      <tr key={prop.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                        {/* Nombre del Inmueble */}
                        <td className="p-3">
                          <p className="font-extrabold text-slate-900 dark:text-white">
                            {prop.title}
                          </p>
                          <p className="font-mono text-[11px] text-slate-500">
                            Matrícula SNR: {prop.matriculaInmobiliaria} • Propietario: {prop.ownerName}
                          </p>
                        </td>

                        {/* Sitio / Ubicación en Fusagasugá / Sumapaz */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>
                              {prop.neighborhood}, {prop.city}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {prop.addressLine} • Estrato {prop.estrato}
                          </p>
                        </td>

                        {/* ¿Ocupado o No Ocupado? */}
                        <td className="p-3">
                          {isOccupied ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                              <span className="h-2 w-2 rounded-full bg-emerald-600" />
                              OCUPADO (Arrendado)
                            </span>
                          ) : prop.status === 'available' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900 dark:bg-blue-950 dark:text-blue-300">
                              <span className="h-2 w-2 rounded-full bg-blue-600" />
                              DISPONIBLE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                              <span className="h-2 w-2 rounded-full bg-amber-600" />
                              EN REVISIÓN
                            </span>
                          )}
                        </td>

                        {/* Canon Mensual */}
                        <td className="p-3">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {copFormatter.format(prop.monthlyRentCop)}
                          </span>
                          <p className="text-[10px] text-slate-500">
                            Admón: {copFormatter.format(prop.administrationFeeCop)}
                          </p>
                        </td>

                        {/* Información General */}
                        <td className="p-3 text-[11px] text-slate-600 dark:text-slate-400">
                          <p>
                            Área: <strong>{prop.privateAreaM2} m²</strong> • Tipo:{' '}
                            <strong className="capitalize">{prop.propertyType}</strong>
                          </p>
                          <p>
                            Habitaciones: <strong>{prop.bedrooms}</strong> • Baños:{' '}
                            <strong>{prop.bathrooms}</strong> • Parq:{' '}
                            <strong>{prop.parkingSpots}</strong>
                          </p>
                        </td>

                        {/* Tope Legal Art. 18 Ley 820 */}
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
                            <ShieldCheck className="h-3 w-3" />
                            Cumple (&le; 1%)
                          </span>
                        </td>

                        {/* Conmutador de Ocupación por el Admin */}
                        <td className="p-3 text-right">
                          <select
                            value={prop.status}
                            onChange={(e) =>
                              updateProperty(prop.id, {
                                status: e.target.value as PropertyStatusType,
                              })
                            }
                            className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            <option value="available">Disponible</option>
                            <option value="rented">Ocupado / Arrendado</option>
                            <option value="under_review">En Revisión</option>
                            <option value="inactive">Inactivo</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Módulos Adicionales de Control del Administrador */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Contratos Auditados SHA-256 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Contratos de Arrendamiento Activos (Ley 820 de 2003)
                </h3>
                <Link href="/contratos" className="text-xs font-bold text-emerald-600 hover:underline">
                  Ver módulo completo &rarr;
                </Link>
              </div>
              <div className="mt-3 space-y-2.5">
                {contracts.map((cnt) => (
                  <div key={cnt.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex justify-between font-mono font-bold text-emerald-700">
                      <span>{cnt.contractNumber}</span>
                      <span className="uppercase">{cnt.status}</span>
                    </div>
                    <p className="mt-1 font-bold text-slate-900 dark:text-white">{cnt.propertyTitle}</p>
                    <p className="text-slate-500">
                      Arrendador: {cnt.landlordName} • Arrendatario: {cnt.tenantName}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* PQRS y Reclamaciones SIC */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Radicados PQRS y Reparaciones (Término 15 Días SIC)
                </h3>
                <Link href="/legal" className="text-xs font-bold text-amber-600 hover:underline">
                  Ver módulo legal &rarr;
                </Link>
              </div>
              <div className="mt-3 space-y-2.5">
                {pqrsClaims.map((claim) => (
                  <div key={claim.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex justify-between font-mono font-bold text-indigo-700">
                      <span>{claim.radicadoNumber}</span>
                      <span className="uppercase">{claim.status}</span>
                    </div>
                    <p className="mt-1 font-bold text-slate-900 dark:text-white">{claim.subject}</p>
                    <p className="text-slate-500">
                      Vence: {claim.legalDeadlineDate} • Solicitante: {claim.claimantName}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
