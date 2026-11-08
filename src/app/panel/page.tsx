'use client';

/**
 * @file page.tsx (/panel)
 * @description Panel Centralizado de Gestión y CRUDs por Rol (`landlord`, `tenant`, `agent`)
 *              sincronizado en tiempo real con el Buscador, Contratos, Pagos y PQRS.
 */

import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Edit3,
  FileSignature,
  FileWarning,
  Plus,
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
  type UserRoleType,
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
    loginAsRole,
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

  // Estado para formulario de Creación de Inmueble (Propietario / Agente)
  const [showCreatePropertyForm, setShowCreatePropertyForm] = useState(false);
  const [newPropTitle, setNewPropTitle] = useState('');
  const [newPropCity, setNewPropCity] = useState('Bogotá D.C.');
  const [newPropNeighborhood, setNewPropNeighborhood] = useState('Chapinero');
  const [newPropType, setNewPropType] =
    useState<(typeof PROPERTY_TYPES)[number]>('apartamento');
  const [newPropEstrato, setNewPropEstrato] = useState<1 | 2 | 3 | 4 | 5 | 6>(4);
  const [newPropValuation, setNewPropValuation] = useState(320000000);
  const [newPropRent, setNewPropRent] = useState(2800000);
  const [newPropAdmin, setNewPropAdmin] = useState(310000);
  const [newPropArea, setNewPropArea] = useState(78);
  const [newPropBeds, setNewPropBeds] = useState(2);
  const [newPropBaths, setNewPropBaths] = useState(2);

  // Estado para Edición Rápida de Inmueble
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editRentVal, setEditRentVal] = useState<number>(0);

  // Estado para Nueva Postulación (Arrendatario)
  const [selectedApplyPropertyId, setSelectedApplyPropertyId] = useState<string>(
    properties[0]?.id ?? ''
  );
  const [declaredIncome, setDeclaredIncome] = useState(11500000);
  const [employerName, setEmployerName] = useState('Ecopetrol S.A.');
  const [coSignerName, setCoSignerName] = useState('Jorge Enrique Restrepo');
  const [coSignerIncome, setCoSignerIncome] = useState(14000000);

  // Estado para Nuevo Reclamo PQRS (Arrendatario)
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
      department: 'Cundinamarca',
      addressLine: `Carrera 15 # 85 - 20 (${newPropNeighborhood})`,
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
      latitude: 4.6682,
      longitude: -74.0535,
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
      propertyTitle: properties[0]?.title ?? 'Inmueble Arrendado',
      claimType: pqrsType,
      subject: pqrsSubject.trim(),
      description: pqrsDescription.trim(),
    });
    setPqrsSubject('');
    setPqrsDescription('');
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      {/* =====================================================================
          CABECERA DEL PANEL Y CONMUTADOR EN VIVO DE LOS 3 ROLES
         ===================================================================== */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-lg">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-extrabold uppercase text-slate-950">
                Sesión Activa: {currentUser.roleLabel}
              </span>
              <span className="font-mono text-xs text-slate-300">
                {currentUser.documentType} {currentUser.documentNumber} • {currentUser.email}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold text-white">
              Bienvenido, {currentUser.fullName}
            </h1>
            <p className="text-xs text-slate-400">
              Cambia de rol con un clic para probar los CRUDs y permisos específicos de Propietario, Arrendatario y Agente/Administrador:
            </p>
          </div>

          {/* Botones de cambio instantáneo de Rol */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { role: 'landlord', label: '1. Vista Propietario (CRUD Inmuebles)' },
                { role: 'tenant', label: '2. Vista Arrendatario (Postulación & Pagos)' },
                { role: 'agent', label: '3. Vista Agente / Admin (Auditoría Global)' },
              ] as Array<{ role: UserRoleType; label: string }>
            ).map((btn) => {
              const isSelected = currentUser.role === btn.role;
              return (
                <button
                  key={btn.role}
                  type="button"
                  onClick={() => loginAsRole(btn.role)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-300'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <UserCheck className="h-4 w-4" />
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================================
          RESUMEN DE MÉTRICAS DEL SISTEMA EN TIEMPO REAL
         ===================================================================== */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-500">
            Inmuebles en Plataforma
          </span>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{properties.length}</p>
          <p className="text-[11px] text-emerald-700">
            {properties.filter((p) => p.status === 'available').length} disponibles en mapa
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-500">
            Solicitudes de Arriendo
          </span>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{applications.length}</p>
          <p className="text-[11px] text-indigo-700">
            {applications.filter((a) => a.status === 'approved').length} aprobadas
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-500">
            Contratos Ley 820 / SHA-256
          </span>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{contracts.length}</p>
          <p className="text-[11px] text-emerald-700">
            {contracts.filter((c) => c.status === 'active').length} sellados con mérito ejecutivo
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-500">
            Reclamos PQRS / SIC
          </span>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{pqrsClaims.length}</p>
          <p className="text-[11px] text-amber-700">
            Control legal de 15 días hábiles
          </p>
        </div>
      </div>

      {/* =====================================================================
          SECCIÓN 1: CRUD DE INMUEBLES (PROPIETARIO Y AGENTE/ADMIN)
         ===================================================================== */}
      {(currentUser.role === 'landlord' || currentUser.role === 'agent') && (
        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                <Building2 className="h-5 w-5 text-emerald-600" />
                CRUD de Inmuebles ({currentUser.role === 'landlord' ? 'Mis Propiedades' : 'Auditoría Global Agente/Admin'})
              </h2>
              <p className="text-xs text-slate-500">
                Crea, edita el canon mensual, cambia el estado de publicación o elimina inmuebles. Los cambios se sincronizan en vivo con el Buscador y Mapa Principal (`/`).
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

          {/* Formulario Desplegable de Creación Rápida de Inmueble */}
          {showCreatePropertyForm && (
            <form
              onSubmit={handleCreatePropertySubmit}
              className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-4 text-xs"
            >
              <h3 className="text-sm font-bold text-slate-900">
                Registrar Nuevo Inmueble (Con Validación Automática Art. 18 Ley 820)
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold uppercase text-slate-700">Título del Inmueble</label>
                  <input
                    type="text"
                    value={newPropTitle}
                    onChange={(e) => setNewPropTitle(e.target.value)}
                    placeholder="Ej: Apartamento Dúplex en Parque Virrey"
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700">Ciudad</label>
                  <select
                    value={newPropCity}
                    onChange={(e) => setNewPropCity(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm"
                  >
                    <option value="Bogotá D.C.">Bogotá D.C.</option>
                    <option value="Medellín">Medellín</option>
                    <option value="Cali">Cali</option>
                    <option value="Barranquilla">Barranquilla</option>
                    <option value="Bucaramanga">Bucaramanga</option>
                    <option value="Chía">Chía</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700">Barrio</label>
                  <input
                    type="text"
                    value={newPropNeighborhood}
                    onChange={(e) => setNewPropNeighborhood(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
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
                <div>
                  <label className="block font-bold uppercase text-slate-700">Área (m²)</label>
                  <input
                    type="number"
                    value={newPropArea}
                    onChange={(e) => setNewPropArea(Number(e.target.value))}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="h-9 w-full rounded-lg bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    Guardar Inmueble
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-[11px] text-slate-600">
                <span>
                  Tope Legal Art. 18 (1%): <strong>{copFormatter.format(newPropValuation * 0.01)}</strong>
                </span>
                <span>
                  Administración: <strong>{copFormatter.format(newPropAdmin)}</strong>
                </span>
                <span>
                  Habitaciones: <strong>{newPropBeds}</strong> • Baños: <strong>{newPropBaths}</strong>
                </span>
              </div>
            </form>
          )}

          {/* Tabla CRUD de Inmuebles */}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                  <th className="p-3">Inmueble / Matrícula SNR</th>
                  <th className="p-3">Ciudad / Estrato</th>
                  <th className="p-3">Canon Mensual (COP)</th>
                  <th className="p-3">Cumplimiento Ley 820</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones CRUD</th>
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
                        <span className="ml-2 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
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
                              className="h-8 w-32 rounded border border-emerald-500 px-2 text-xs font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                updateProperty(prop.id, { monthlyRentCop: editRentVal });
                                setEditingPropertyId(null);
                              }}
                              className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white"
                            >
                              Guardar
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm font-extrabold text-slate-900">
                            {copFormatter.format(prop.monthlyRentCop)}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {prop.isLey820Compliant ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            &le; 1% Comercial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                            Excede Tope Art. 18
                          </span>
                        )}
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
                          <option value="available">Disponible (En Buscador)</option>
                          <option value="under_review">En Revisión Jurídica</option>
                          <option value="rented">Arrendado</option>
                          <option value="inactive">Inactivo</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPropertyId(prop.id);
                              setEditRentVal(prop.monthlyRentCop);
                            }}
                            title="Editar canon mensual"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProperty(prop.id)}
                            title="Eliminar inmueble"
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      )}

      {/* =====================================================================
          SECCIÓN 2: CRUD DE POSTULACIONES Y ESTUDIO DE SOLVENCIA (LOS 3 ROLES)
         ===================================================================== */}
      <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <Users className="h-5 w-5 text-indigo-600" />
            {currentUser.role === 'tenant'
              ? 'CRUD de Mis Postulaciones a Inmuebles (Arrendatario)'
              : 'Gestión de Postulaciones Recibidas y Estudio de Solvencia'}
          </h2>
          <p className="text-xs text-slate-500">
            {currentUser.role === 'tenant'
              ? 'Postúlate a cualquier inmueble disponible adjuntando tus ingresos y deudor solidario, o cancela solicitudes enviadas.'
              : 'Evalúa el puntaje de riesgo crediticio, aprueba candidatos (generando automáticamente el contrato Ley 820) o rechaza solicitudes.'}
          </p>
        </div>

        {/* Formulario para que el Arrendatario cree una nueva postulación */}
        {currentUser.role === 'tenant' && (
          <form
            onSubmit={handleCreateApplicationSubmit}
            className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 space-y-4 text-xs"
          >
            <h3 className="text-sm font-bold text-slate-900">
              Radicar Nueva Postulación de Arrendamiento
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
              <div className="sm:col-span-2">
                <label className="block font-bold uppercase text-slate-700">
                  Seleccionar Inmueble Disponible
                </label>
                <select
                  value={selectedApplyPropertyId}
                  onChange={(e) => setSelectedApplyPropertyId(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium"
                >
                  {properties
                    .filter((p) => p.status === 'available')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.city} — {copFormatter.format(p.monthlyRentCop)})
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
                  Empresa / Actividad
                </label>
                <input
                  type="text"
                  value={employerName}
                  onChange={(e) => setEmployerName(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-700">
                  Deudor Solidario
                </label>
                <input
                  type="text"
                  value={coSignerName}
                  onChange={(e) => setCoSignerName(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white shadow hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Enviar Postulación y Autorizar Estudio Datacrédito
              </button>
            </div>
          </form>
        )}

        {/* Tabla de Postulaciones */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                <th className="p-3">Postulante / Documento</th>
                <th className="p-3">Inmueble Solicitado</th>
                <th className="p-3">Ingresos vs Canon</th>
                <th className="p-3">Deudor Solidario</th>
                <th className="p-3">Score Riesgo</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/80">
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{app.applicantName}</p>
                    <p className="font-mono text-[11px] text-slate-500">
                      {app.applicantDocument} • {app.employerName}
                    </p>
                  </td>
                  <td className="p-3">
                    <p className="font-semibold text-slate-800">{app.propertyTitle}</p>
                    <p className="text-[11px] text-slate-500">{app.propertyCity}</p>
                  </td>
                  <td className="p-3">
                    <p className="font-bold text-emerald-700">
                      Ingresos: {copFormatter.format(app.declaredMonthlyIncomeCop)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Canon: {copFormatter.format(app.monthlyRentCop)}
                    </p>
                  </td>
                  <td className="p-3">
                    <p className="font-medium text-slate-800">{app.coSignerFullName}</p>
                    <p className="text-[11px] text-slate-500">
                      {copFormatter.format(app.coSignerIncomeCop)} / mes
                    </p>
                  </td>
                  <td className="p-3">
                    <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-xs font-bold text-emerald-400">
                      {app.riskScore} / 1000
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
                        app.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {(currentUser.role === 'landlord' || currentUser.role === 'agent') && (
                        <>
                          <button
                            type="button"
                            onClick={() => updateApplicationStatus(app.id, 'approved')}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Aprobar y Crear Contrato
                          </button>
                          <button
                            type="button"
                            onClick={() => updateApplicationStatus(app.id, 'rejected')}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-rose-700"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Rechazar
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteApplication(app.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* =====================================================================
          SECCIÓN 3: CONTRATOS LEY 820, FIRMA SHA-256 Y RECAUDO DE CÁNONES
         ===================================================================== */}
      <div className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Contratos y Firma Electrónica por Rol */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
            <FileSignature className="h-5 w-5 text-emerald-600" />
            Contratos de Arrendamiento (Ley 820/2003 & Firma Ley 527/1999)
          </h2>
          <p className="text-xs text-slate-500">
            Firma según tu rol activo. Cuando tanto Arrendador como Arrendatario firman, se emite el sello SHA-256 definitivo y el inmueble pasa a estado `rented`.
          </p>

          <div className="mt-4 space-y-4">
            {contracts.map((cnt) => (
              <div
                key={cnt.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-emerald-700">
                      {cnt.contractNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{cnt.propertyTitle}</h3>
                  </div>
                  <span
                    className={`rounded-full px-3 py-0.5 text-[11px] font-bold uppercase ${
                      cnt.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {cnt.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600 sm:grid-cols-3">
                  <span>
                    Canon: <strong>{copFormatter.format(cnt.agreedMonthlyRentCop)}</strong>
                  </span>
                  <span>
                    Depósito Art. 16: <strong>$0 COP (Cumple Ley)</strong>
                  </span>
                  <span>
                    Reajuste IPC: <strong>{cnt.annualIpcAdjustmentCapPct}%</strong>
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2.5">
                  <div className="space-y-0.5 text-[11px]">
                    <p>
                      Firma Arrendador:{' '}
                      <strong className={cnt.landlordSignedAt ? 'text-emerald-700' : 'text-amber-700'}>
                        {cnt.landlordSignedAt ? `Firmado (${cnt.landlordSignedAt.slice(0, 10)})` : 'Pendiente'}
                      </strong>
                    </p>
                    <p>
                      Firma Arrendatario:{' '}
                      <strong className={cnt.tenantSignedAt ? 'text-emerald-700' : 'text-amber-700'}>
                        {cnt.tenantSignedAt ? `Firmado (${cnt.tenantSignedAt.slice(0, 10)})` : 'Pendiente'}
                      </strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(currentUser.role === 'landlord' || currentUser.role === 'agent') &&
                      !cnt.landlordSignedAt && (
                        <button
                          type="button"
                          onClick={() => signContractByRole(cnt.id, 'landlord')}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                          Firmar como Arrendador (SHA-256)
                        </button>
                      )}

                    {(currentUser.role === 'tenant' || currentUser.role === 'agent') &&
                      !cnt.tenantSignedAt && (
                        <button
                          type="button"
                          onClick={() => signContractByRole(cnt.id, 'tenant')}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                        >
                          Firmar como Arrendatario (SHA-256)
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pagos de Canon Mensual (PSE / Nequi / Wompi) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
            <CreditCard className="h-5 w-5 text-indigo-600" />
            Control y Pago de Cánones Mensuales (PSE / Wompi)
          </h2>
          <p className="text-xs text-slate-500">
            Emisión de comprobantes obligatorios conforme al Artículo 11 de la Ley 820 de 2003.
          </p>

          <div className="mt-4 space-y-3">
            {payments.map((pay) => (
              <div
                key={pay.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{pay.billingPeriod}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                      pay.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {pay.status === 'paid' ? 'PAGADO' : 'PENDIENTE DE PAGO'}
                  </span>
                </div>

                <p className="text-slate-600">{pay.propertyTitle}</p>
                <p className="text-sm font-extrabold text-slate-900">
                  Total: {copFormatter.format(pay.totalAmountCop)}{' '}
                  <span className="text-[11px] font-normal text-slate-500">
                    (Incluye admón.)
                  </span>
                </p>

                {pay.status === 'pending' ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => payMonthlyCanon(pay.id, 'pse')}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      Pagar con PSE
                    </button>
                    <button
                      type="button"
                      onClick={() => payMonthlyCanon(pay.id, 'nequi')}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                    >
                      Pagar con Nequi
                    </button>
                  </div>
                ) : (
                  <p className="font-mono text-[11px] text-emerald-700">
                    ✓ Comprobante {pay.gatewayReference} • Método: {pay.paymentMethod?.toUpperCase()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* =====================================================================
          SECCIÓN 4: CRUD DE RECLAMOS, REPARACIONES ART. 19 LEY 820 Y PQRS SIC
         ===================================================================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <FileWarning className="h-5 w-5 text-amber-600" />
            CRUD de PQRS, Reparaciones Necesarias/Locativas (Art. 19 Ley 820) y Trazabilidad SIC
          </h2>
          <p className="text-xs text-slate-500">
            El arrendatario radica solicitudes de reparación o derechos ARCO; el propietario o agente actualiza el estado y registra la solución dentro de los 15 días hábiles de ley.
          </p>
        </div>

        {/* Formulario para crear PQRS */}
        <form
          onSubmit={handleCreatePqrsSubmit}
          className="mt-5 grid grid-cols-1 gap-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 text-xs sm:grid-cols-4"
        >
          <div>
            <label className="block font-bold uppercase text-slate-700">Tipo de Solicitud</label>
            <select
              value={pqrsType}
              onChange={(e) => setPqrsType(e.target.value as typeof pqrsType)}
              className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs"
            >
              <option value="reparacion_necesaria">Reparación Necesaria (Arrendador)</option>
              <option value="reparacion_locativa">Reparación Locativa (Arrendatario)</option>
              <option value="facturacion_canon">Facturación Canon / IPC</option>
              <option value="habeas_data_arco">Habeas Data / Derechos ARCO</option>
            </select>
          </div>
          <div>
            <label className="block font-bold uppercase text-slate-700">Asunto</label>
            <input
              type="text"
              value={pqrsSubject}
              onChange={(e) => setPqrsSubject(e.target.value)}
              placeholder="Ej: Humedad en techo de alcoba"
              className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs"
              required
            />
          </div>
          <div>
            <label className="block font-bold uppercase text-slate-700">Descripción</label>
            <input
              type="text"
              value={pqrsDescription}
              onChange={(e) => setPqrsDescription(e.target.value)}
              placeholder="Detalle de la solicitud..."
              className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="h-9 w-full rounded-lg bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800"
            >
              Radicar PQRS (15 Días Hábiles)
            </button>
          </div>
        </form>

        {/* Listado CRUD de PQRS */}
        <div className="mt-5 space-y-3">
          {pqrsClaims.map((claim) => (
            <div
              key={claim.id}
              className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 p-4 text-xs sm:flex-row sm:items-center"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-700">
                    {claim.radicadoNumber}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                    {claim.claimType.replace('_', ' ')}
                  </span>
                  <span className="text-slate-400">
                    Vence: <strong>{claim.legalDeadlineDate}</strong>
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900">{claim.subject}</p>
                <p className="text-slate-600">{claim.description}</p>
                {claim.resolutionNotes && (
                  <p className="text-emerald-700">
                    <strong>Respuesta:</strong> {claim.resolutionNotes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={claim.status}
                  onChange={(e) =>
                    updatePqrsStatus(
                      claim.id,
                      e.target.value as typeof claim.status,
                      'Atendido y documentado en plataforma conforme a Ley 820/2003.'
                    )
                  }
                  className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold"
                >
                  <option value="open">Abierto</option>
                  <option value="in_progress">En Trámite</option>
                  <option value="resolved">Resuelto</option>
                  <option value="escalated_sic">Escalado SIC</option>
                </select>

                <button
                  type="button"
                  onClick={() => deletePqrs(claim.id)}
                  className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700 hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
