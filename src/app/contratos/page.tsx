'use client';

/**
 * @file page.tsx (/contratos)
 * @description Módulos RF-05 y RF-06: Emisión de Contratos Ley 820 de 2003 (bloqueo de depósitos Art. 16),
 *              vista previa con marca de agua dinámica y Firma Electrónica SHA-256 (Ley 527 de 1999).
 */

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  AlertOctagon,
  CheckCircle2,
  FileCheck2,
  FileSignature,
  KeyRound,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { usePropTech } from '../../context/PropTechContext';
import {
  executeElectronicSignatureAction,
  generateContractDraftAction,
} from '../actions/proptech.actions';
import type {
  JudicialAuditCertificate,
  PartySignatureEvidence,
  PdfWatermarkConfig,
} from '../../services/contract-crypto.service';

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export default function ContractsPage() {
  const { currentUser } = usePropTech();
  const [isPending, startTransition] = useTransition();

  // Parámetros del contrato Ley 820 de 2003
  const [agreedMonthlyRentCop, setAgreedMonthlyRentCop] = useState(3850000);
  const [propertyValuationCop] = useState(450000000);
  const [securityDepositCop, setSecurityDepositCop] = useState(0);
  const [annualIpcAdjustmentCapPct, setAnnualIpcAdjustmentCapPct] = useState(5.2);
  const [noticePeriodMonths, setNoticePeriodMonths] = useState(3);
  const [otpToken, setOtpToken] = useState('482910');

  // Estado del flujo transaccional de firma
  const [draftData, setDraftData] = useState<{
    contractId: string;
    contractNumber: string;
    documentContentSha256: string;
    watermarkConfig: PdfWatermarkConfig;
  } | null>(null);

  const [landlordEvidence, setLandlordEvidence] = useState<PartySignatureEvidence | null>(null);
  const [tenantEvidence, setTenantEvidence] = useState<PartySignatureEvidence | null>(null);
  const [judicialCertificate, setJudicialCertificate] = useState<JudicialAuditCertificate | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Control de Acceso: Exclusivo Administrador.
  // IMPORTANTE: debe evaluarse DESPUÉS de todos los hooks para no alterar su orden
  // cuando el rol se hidrata desde localStorage (tenant -> agent) y React no falle.
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
          La emisión de contratos maestros Ley 820 y parametrización criptográfica SHA-256 está reservada exclusivamente para el Administrador / Lonja Inmobiliaria. Para consultar o firmar tus contratos individuales, dirígete a tu panel principal.
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

  // Paso 1: Generar Borrador y Calcular SHA-256 Inicial
  const handleCreateDraft = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await generateContractDraftAction({
        propertyId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        applicationId: 'c4eebc99-9c0b-4ef8-bb6d-6bb9bd380a99',
        landlordId: '11111111-1111-4111-8111-111111111111',
        tenantId: '22222222-2222-4222-8222-222222222222',
        destination: 'vivienda_urbana',
        startDate: '2026-12-01',
        endDate: '2027-11-30',
        durationMonths: 12,
        propertyCommercialValuationCop: propertyValuationCop,
        agreedMonthlyRentCop,
        agreedAdminFeeCop: 520000,
        paymentDueDay: 5,
        annualIpcAdjustmentCapPct,
        daneCertifiedPreviousYearIpcPct: 5.2,
        referenceDaneIpcYear: 2025,
        penaltyClauseCop: agreedMonthlyRentCop * 2,
        securityDepositCop,
        noticePeriodMonths,
      });

      if (!res.success || !res.data) {
        const detailed = res.fieldErrors
          ? Object.values(res.fieldErrors).flat().join(' | ')
          : res.error;
        setErrorMessage(detailed ?? 'Error al generar el borrador contractual.');
        return;
      }

      setDraftData(res.data);
      setLandlordEvidence(null);
      setTenantEvidence(null);
      setJudicialCertificate(null);
    });
  };

  // Paso 2: Firma Electrónica del Arrendador (Landlord)
  const handleSignAsLandlord = () => {
    if (!draftData) return;
    setErrorMessage(null);
    startTransition(async () => {
      const res = await executeElectronicSignatureAction({
        contractId: draftData.contractId,
        contractNumber: draftData.contractNumber,
        signatureInput: {
          signerUserId: '11111111-1111-4111-8111-111111111111',
          signerRole: 'landlord',
          signerDocumentType: 'CC',
          signerDocumentNumber: '79845120',
          documentContentSha256: draftData.documentContentSha256,
          otpVerificationToken: otpToken,
          expressElectronicSignatureConsent: true,
        },
      });

      if (!res.success || !res.data) {
        setErrorMessage(res.error ?? 'Error en firma del arrendador.');
        return;
      }

      setLandlordEvidence(res.data.partyEvidence);
      setDraftData({
        ...draftData,
        watermarkConfig: res.data.watermarkConfig,
      });
    });
  };

  // Paso 3: Firma Electrónica del Arrendatario (Tenant) + Emisión de Certificado Probatorio Judicial
  const handleSignAsTenantAndSeal = () => {
    if (!draftData || !landlordEvidence) return;
    setErrorMessage(null);
    startTransition(async () => {
      const res = await executeElectronicSignatureAction({
        contractId: draftData.contractId,
        contractNumber: draftData.contractNumber,
        existingLandlordEvidence: landlordEvidence,
        signatureInput: {
          signerUserId: '22222222-2222-4222-8222-222222222222',
          signerRole: 'tenant',
          signerDocumentType: 'CC',
          signerDocumentNumber: '1020765432',
          documentContentSha256: draftData.documentContentSha256,
          otpVerificationToken: otpToken,
          expressElectronicSignatureConsent: true,
        },
      });

      if (!res.success || !res.data) {
        setErrorMessage(res.error ?? 'Error en firma del arrendatario.');
        return;
      }

      setTenantEvidence(res.data.partyEvidence);
      setDraftData({
        ...draftData,
        watermarkConfig: res.data.watermarkConfig,
      });
      if (res.data.judicialCertificate) {
        setJudicialCertificate(res.data.judicialCertificate);
      }
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 border-b border-slate-200 pb-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
          <FileSignature className="h-3.5 w-3.5" />
          Módulos RF-05 & RF-06 • Ley 820 de 2003 + Firma Electrónica SHA-256 (Ley 527 de 1999)
        </span>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
          Contratación Digital y Sellado Criptográfico No Repudiable
        </h1>
        <p className="text-sm text-slate-600">
          Generación de contratos de vivienda urbana con bloqueo de depósitos en dinero (Art. 16 Ley 820), marcas de agua dinámicas y Certificado de Auditoría Probatoria (Art. 244 CGP).
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-medium text-rose-900">
          <AlertOctagon className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Panel Izquierdo: Configuración Legal del Contrato y Ceremonia de Firma */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">
              1. Parámetros Contractuales (Ley 820 de 2003)
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700">
                  Canon Mensual Acordado (Tope 1%: {copFormatter.format(propertyValuationCop * 0.01)})
                </label>
                <input
                  type="number"
                  value={agreedMonthlyRentCop}
                  onChange={(e) => setAgreedMonthlyRentCop(Number(e.target.value))}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700">
                  Depósito en Efectivo / Caución Real (COP) — Art. 16 Ley 820
                </label>
                <input
                  type="number"
                  value={securityDepositCop}
                  onChange={(e) => setSecurityDepositCop(Number(e.target.value))}
                  className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm font-bold ${
                    securityDepositCop > 0
                      ? 'border-rose-500 bg-rose-50 text-rose-900'
                      : 'border-slate-300 bg-slate-50 text-slate-900'
                  }`}
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Prueba ingresar un valor &gt; $0 para verificar el bloqueo automático del Art. 16 Ley 820.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700">
                    Reajuste Anual IPC (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={annualIpcAdjustmentCapPct}
                    onChange={(e) => setAnnualIpcAdjustmentCapPct(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700">
                    Preaviso (Meses - Art. 22)
                  </label>
                  <input
                    type="number"
                    value={noticePeriodMonths}
                    onChange={(e) => setNoticePeriodMonths(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateDraft}
                disabled={isPending}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <Lock className="h-4 w-4" />
                Generar Borrador y Calcular Hash SHA-256
              </button>
            </div>
          </div>

          {/* Panel de Ceremonia de Firma Electrónica OTP */}
          {draftData && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <KeyRound className="h-4 w-4 text-emerald-700" />
                2. Ceremonia de Firma Electrónica (Ley 527 de 1999)
              </h2>

              <div className="mt-3">
                <label className="block text-xs font-bold uppercase text-slate-700">
                  Token OTP de Segundo Factor (6 dígitos)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-sm font-bold tracking-widest"
                />
              </div>

              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={handleSignAsLandlord}
                  disabled={isPending || Boolean(landlordEvidence)}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:bg-slate-300"
                >
                  <FileSignature className="h-4 w-4" />
                  {landlordEvidence
                    ? '✓ Firmado por Arrendador (CC 79.845.120)'
                    : 'Paso A: Firmar como Arrendador (HMAC-SHA256)'}
                </button>

                <button
                  type="button"
                  onClick={handleSignAsTenantAndSeal}
                  disabled={isPending || !landlordEvidence || Boolean(tenantEvidence)}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:bg-slate-300"
                >
                  <FileCheck2 className="h-4 w-4" />
                  {tenantEvidence
                    ? '✓ Firmado por Arrendatario y Sellado Definitivo'
                    : 'Paso B: Firmar como Arrendatario y Emitir Certificado Judicial'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Panel Derecho: Previsualizador PDF con Marca de Agua Dinámica y Certificado Probatorio */}
        <div className="space-y-6 lg:col-span-7">
          <div className="relative overflow-hidden rounded-2xl border border-slate-300 bg-white p-8 shadow-md">
            {/* Marca de agua dinámica superpuesta */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center select-none p-6 text-center"
            >
              <span
                className={`font-extrabold uppercase tracking-widest ${
                  judicialCertificate
                    ? 'text-lg text-emerald-700/15'
                    : ' -rotate-12 text-xl text-rose-700/20'
                }`}
              >
                {draftData
                  ? draftData.watermarkConfig.text
                  : 'BORRADOR PRECONTRACTUAL - GENERA EL DOCUMENTO PARA CALCULAR SHA-256'}
              </span>
            </div>

            <div className="relative z-10 space-y-4 text-xs leading-relaxed text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="font-mono text-[11px] font-bold text-emerald-700">
                    {draftData ? draftData.contractNumber : 'CNT-PENDIENTE'}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    CONTRATO DE ARRENDAMIENTO DE VIVIENDA URBANA (LEY 820 DE 2003)
                  </h3>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                    judicialCertificate
                      ? 'bg-emerald-100 text-emerald-800'
                      : landlordEvidence
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {judicialCertificate
                    ? 'ACTIVO - MÉRITO EJECUTIVO (ART. 14 LEY 820)'
                    : landlordEvidence
                      ? 'FIRMA PARCIAL (1/2)'
                      : 'BORRADOR'}
                </span>
              </div>

              <p>
                <strong>CLÁUSULA PRIMERA — OBJETO Y DESTINACIÓN:</strong> El ARRENDADOR entrega a
                título de arrendamiento de vivienda urbana al ARRENDATARIO el inmueble ubicado en El
                Poblado, Medellín, destinado exclusivamente a vivienda familiar conforme a la Ley
                820 de 2003.
              </p>

              <p>
                <strong>CLÁUSULA SEGUNDA — CANON Y REAJUSTE IPC (ART. 18 y 20 LEY 820/2003):</strong>{' '}
                El canon mensual es de <strong>{copFormatter.format(agreedMonthlyRentCop)}</strong>,
                pagadero dentro de los primeros cinco (5) días de cada mes. Cumplidos doce (12)
                meses de ejecución, el canon se reajustará en un{' '}
                <strong>{annualIpcAdjustmentCapPct}%</strong>, respetando el tope máximo del 100%
                del IPC certificado por el DANE.
              </p>

              <p>
                <strong>
                  CLÁUSULA TERCERA — PROHIBICIÓN DE DEPÓSITOS Y CAUCIONES REALES (ART. 16 LEY
                  820/2003):
                </strong>{' '}
                En cumplimiento estricto del Artículo 16 de la Ley 820 de 2003, el presente contrato
                fija un depósito en dinero efectivo de{' '}
                <strong>{copFormatter.format(securityDepositCop)}</strong>.
              </p>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-[11px]">
                <p className="font-bold text-slate-700">
                  Huella Criptográfica Original del Documento (SHA-256):
                </p>
                <p className="mt-0.5 break-all text-slate-900">
                  {draftData
                    ? draftData.documentContentSha256
                    : 'Pendiente de generación del borrador...'}
                </p>
              </div>
            </div>
          </div>

          {/* Visor del Certificado de Auditoría Probatoria para Juzgados Civiles */}
          {judicialCertificate && (
            <div className="rounded-2xl border border-emerald-500/40 bg-slate-950 p-6 text-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    Certificado de Auditoría Probatoria — Ley 527 de 1999 & Art. 244 CGP
                  </h3>
                </div>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
                  {judicialCertificate.certificateId}
                </span>
              </div>

              <div className="mt-4 space-y-3 font-mono text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-400">Sello Cronológico UTC:</span>{' '}
                  <span className="text-emerald-400">
                    {judicialCertificate.chronologicalSealUtc}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Firma HMAC-SHA256 Arrendador:</span>
                  <p className="break-all text-white">
                    {judicialCertificate.landlordEvidence.individualSignatureHashSha256}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Firma HMAC-SHA256 Arrendatario:</span>
                  <p className="break-all text-white">
                    {judicialCertificate.tenantEvidence.individualSignatureHashSha256}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Hash SHA-256 PDF Sellado Definitivo:</span>
                  <p className="break-all text-emerald-300">
                    {judicialCertificate.finalSealedPdfHashSha256}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">
                    Firma Maestra de Integridad de Plataforma (No Repudio Judicial):
                  </span>
                  <p className="break-all text-amber-300">
                    {judicialCertificate.systemHmacIntegritySignature}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
