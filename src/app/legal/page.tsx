'use client';

/**
 * @file page.tsx (/legal)
 * @description Módulos RF-01 y RF-08: Captura Inmutable de Consentimiento Habeas Data (Ley 1581 de 2012)
 *              y Radicación de Reclamos / Reparaciones Art. 19 Ley 820 con Trazabilidad SIC (15 días hábiles).
 */

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  Lock,
  Scale,
  ShieldAlert,
} from 'lucide-react';
import { usePropTech } from '../../context/PropTechContext';
import {
  createPqrsClaimAction,
  registerHabeasDataConsentAction,
} from '../actions/proptech.actions';

const OFFICIAL_CONSENT_TEXT =
  'En cumplimiento de la Ley 1581 de 2012 y el Decreto Reglamentario 1377 de 2013, autorizo de manera previa, expresa, informada e inequívoca a PropTech Colombia S.A.S. para recolectar, almacenar, consultar en centrales de riesgo (Ley 1266 de 2008) y tratar mis datos personales con fines de estudio de solvencia, suscripción electrónica de contratos (Ley 527 de 1999) y gestión inmobiliaria, conociendo mis derechos ARCO de conocer, actualizar, rectificar y suprimir mi información.';

const POLICY_SHA256_HASH =
  '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';

export default function LegalAndPqrsPage() {
  const { currentUser } = usePropTech();
  const [isPending, startTransition] = useTransition();

  // Control de Acceso: Exclusivo Administrador / Secretario
  if (currentUser.role !== 'agent') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">
          Módulo Reservado para el Administrador
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          La inspección de consentimientos Habeas Data (Ley 1581) y trazabilidad procesal de 15 días hábiles ante la SIC está reservada para el Administrador / Lonja Inmobiliaria. Para radicar o consultar tus PQRS particulares, dirígete a tu panel principal.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/panel"
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700"
          >
            Ir a Mi Panel
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Iniciar Sesión como Administrador
          </Link>
        </div>
      </div>
    );
  }

  // Estado RF-01: Habeas Data (Ley 1581 de 2012)
  const [documentType, setDocumentType] = useState<'CC' | 'CE' | 'NIT'>('CC');
  const [documentNumber, setDocumentNumber] = useState('1020765432');
  const [phoneNumber, setPhoneNumber] = useState('+573104567890');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [acceptedElectronicSig, setAcceptedElectronicSig] = useState(true);
  const [acceptedCreditBureau, setAcceptedCreditBureau] = useState(true);

  const [consentReceipt, setConsentReceipt] = useState<{
    consentId: string;
    ipAddress: string;
    userAgent: string;
    acceptedAtIso: string;
    policyDocumentHash: string;
  } | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);

  // Estado RF-08: PQRS y Reparaciones Locativas/Necesarias (Art. 19 Ley 820 & SIC)
  const [claimType, setClaimType] = useState<
    | 'reparacion_necesaria'
    | 'reparacion_locativa'
    | 'facturacion_canon'
    | 'servicios_publicos'
    | 'terminacion_contrato'
    | 'habeas_data_arco'
  >('reparacion_necesaria');
  const [subject, setSubject] = useState(
    'Filtración en tubería matriz del baño principal no imputable al arrendatario'
  );
  const [description, setDescription] = useState(
    'Solicito la intervención urgente para reparación necesaria conforme al Art. 1985 del Código Civil y la Ley 820 de 2003, dado que existe humedad interna en el muro divisorio.'
  );
  const [pqrsReceipt, setPqrsReceipt] = useState<{
    radicadoNumber: string;
    legalDeadlineDate: string;
    normativeBasis: string;
  } | null>(null);

  const handleRegisterConsent = (e: React.FormEvent) => {
    e.preventDefault();
    setConsentError(null);
    startTransition(async () => {
      const res = await registerHabeasDataConsentAction({
        userId: '22222222-2222-4222-8222-222222222222',
        documentType,
        documentNumber,
        phoneNumber,
        policyVersion: 'v2.1.0',
        policyDocumentHash: POLICY_SHA256_HASH,
        consentTextAccepted: OFFICIAL_CONSENT_TEXT,
        acceptedPrivacyPolicy: acceptedPrivacy as true,
        acceptedTermsOfService: acceptedTerms as true,
        acceptedElectronicSignatureAgreement: acceptedElectronicSig as true,
        acceptedCreditBureauQuery: acceptedCreditBureau,
      });

      if (!res.success || !res.data) {
        setConsentError(res.error ?? 'Error al registrar el consentimiento.');
        return;
      }
      setConsentReceipt(res.data);
    });
  };

  const handleCreatePqrs = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createPqrsClaimAction({
        claimType,
        subject,
        description,
      });
      if (res.success && res.data) {
        setPqrsReceipt(res.data);
      }
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 border-b border-slate-200 pb-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
          <Scale className="h-3.5 w-3.5" />
          Módulos RF-01 & RF-08 • Ley 1581 de 2012 (Habeas Data) + PQRS y Reparaciones Ley 820 (SIC)
        </span>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
          Centro de Cumplimiento Habeas Data, Derechos ARCO y PQRS Inmobiliarias
        </h1>
        <p className="text-sm text-slate-600">
          Registro probatorio inmutable de consentimiento (protegido por trigger PostgreSQL) y radicación de reclamos con término legal de 15 días hábiles.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Columna Izquierda: RF-01 Consentimiento Habeas Data */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Lock className="h-4 w-4 text-emerald-600" />
            RF-01: Captura Inmutable de Autorización Habeas Data (Ley 1581/2012)
          </h2>

          <form onSubmit={handleRegisterConsent} className="mt-4 space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold uppercase text-slate-700">Tipo Doc.</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as 'CC' | 'CE' | 'NIT')}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm"
                >
                  <option value="CC">CC</option>
                  <option value="CE">CE</option>
                  <option value="NIT">NIT</option>
                </select>
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-700">Documento</label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-700">Celular (+57)</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-700">
              <p className="font-bold text-slate-900">
                Texto de Autorización Expresa (Política v2.1.0 — SHA-256:{' '}
                <code>{POLICY_SHA256_HASH.slice(0, 16)}...</code>):
              </p>
              <p className="mt-1">{OFFICIAL_CONSENT_TEXT}</p>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                <span>
                  Acepto de manera previa, expresa e informada la{' '}
                  <strong>Política de Tratamiento de Datos Personales (Ley 1581 de 2012)</strong>.
                </span>
              </label>

              <label className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                <span>
                  Acepto los <strong>Términos y Condiciones Generales</strong> de la plataforma.
                </span>
              </label>

              <label className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={acceptedElectronicSig}
                  onChange={(e) => setAcceptedElectronicSig(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                <span>
                  Acepto el acuerdo de validez jurídica y probatoria de{' '}
                  <strong>Firma Electrónica (Ley 527 de 1999 y Decreto 2364 de 2012)</strong>.
                </span>
              </label>

              <label className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={acceptedCreditBureau}
                  onChange={(e) => setAcceptedCreditBureau(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                <span>
                  Autorizo la consulta y reporte en centrales de riesgo crediticio (Ley 1266 de 2008).
                </span>
              </label>
            </div>

            {consentError && (
              <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-rose-900">
                {consentError}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow hover:bg-emerald-700"
            >
              <ClipboardCheck className="h-4 w-4" />
              Registrar Traza Inmutable en `legal_consents`
            </button>
          </form>

          {consentReceipt && (
            <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 font-mono text-[11px] text-emerald-950 space-y-1">
              <p className="font-sans text-xs font-bold text-emerald-800">
                ✓ Consentimiento sellado e inmutable (Protegido por trigger `trg_legal_consents_immutable`)
              </p>
              <p>
                <strong>Consent UUID:</strong> {consentReceipt.consentId}
              </p>
              <p>
                <strong>IP Origen:</strong> {consentReceipt.ipAddress}
              </p>
              <p>
                <strong>Timestamp UTC:</strong> {consentReceipt.acceptedAtIso}
              </p>
              <p className="break-all">
                <strong>Policy SHA-256:</strong> {consentReceipt.policyDocumentHash}
              </p>
            </div>
          )}
        </section>

        {/* Columna Derecha: RF-08 Módulo de Reclamos, Reparaciones y PQRS (SIC) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <FileWarning className="h-4 w-4 text-indigo-600" />
            RF-08: Radicación de PQRS y Reparaciones (Art. 19 Ley 820 / SIC)
          </h2>

          <form onSubmit={handleCreatePqrs} className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase text-slate-700">
                Tipología Legal del Reclamo o Solicitud
              </label>
              <select
                value={claimType}
                onChange={(e) =>
                  setClaimType(e.target.value as typeof claimType)
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium"
              >
                <option value="reparacion_necesaria">
                  Reparación Necesaria / Estructural (Cargo del Arrendador - Art. 1985 C.C.)
                </option>
                <option value="reparacion_locativa">
                  Reparación Locativa Ordinaria (Cargo del Arrendatario - Art. 1998 C.C.)
                </option>
                <option value="facturacion_canon">
                  Revisión de Facturación o Reajuste IPC (Art. 18 y 20 Ley 820)
                </option>
                <option value="servicios_publicos">
                  Servicios Públicos Domiciliarios (Art. 15 Ley 820)
                </option>
                <option value="terminacion_contrato">
                  Notificación de Preaviso o Terminación (Art. 22 a 24 Ley 820)
                </option>
                <option value="habeas_data_arco">
                  Ejercicio de Derechos ARCO — Habeas Data (Art. 15 Ley 1581/2012)
                </option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-700">
                Asunto del Radicado
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-700">
                Descripción Fáctica y Pretensión
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white shadow hover:bg-slate-800"
            >
              <ShieldAlert className="h-4 w-4" />
              Radicar PQRS con Trazabilidad SIC (15 Días Hábiles)
            </button>
          </form>

          {pqrsReceipt && (
            <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-xs text-indigo-950 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                <span>Radicado Oficial Emitido: {pqrsReceipt.radicadoNumber}</span>
              </div>
              <p>
                <strong>Fecha Límite Legal de Respuesta (15 días hábiles - Ley 1755/2015):</strong>{' '}
                <span className="font-mono font-bold">{pqrsReceipt.legalDeadlineDate}</span>
              </p>
              <p>
                <strong>Fundamento Normativo Aplicado:</strong> {pqrsReceipt.normativeBasis}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
