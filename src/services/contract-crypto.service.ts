/**
 * @file contract-crypto.service.ts
 * @description Arquitectura del Flujo Transaccional de Contratación, Sellado Criptográfico SHA-256
 *              (Ley 527 de 1999 / Decreto 2364 de 2012) y Procesamiento Asíncrono de Webhooks.
 */

import { createHash, createHmac, timingSafeEqual } from 'crypto';
import type {
  ElectronicSignatureMetadataInput,
  LeaseContractCreationInput,
} from '../lib/validations/proptech.schemas';

// ============================================================================
// 1. TIPOS ESTRICTOS DE AUDITORÍA Y CERTIFICADO PROBATORIO
// ============================================================================

export type WatermarkMode = 'DRAFT_WATERMARK' | 'PARTIAL_SIGNATURE_WATERMARK' | 'FINAL_SEALED_LEGAL';

export interface PdfWatermarkConfig {
  mode: WatermarkMode;
  text: string;
  opacity: number;
  rotationDegrees: number;
  footerLegalLegend: string;
}

export interface SupabaseAuthSessionContext {
  userId: string;
  sessionId: string;
  email: string;
  aal: 'aal1' | 'aal2'; // Authenticator Assurance Level
  amr: Array<{ method: string; timestamp: number }>;
  jwtIssuedAt: number;
}

export interface PartySignatureEvidence {
  userId: string;
  role: 'landlord' | 'tenant';
  documentType: string;
  documentNumber: string;
  sessionId: string;
  aal: 'aal1' | 'aal2';
  ipAddress: string;
  userAgent: string;
  signedAtUtc: string;
  individualSignatureHashSha256: string;
}

export interface JudicialAuditCertificate {
  certificateId: string;
  contractId: string;
  contractNumber: string;
  legalFramework: string[];
  originalDraftHashSha256: string;
  landlordEvidence: PartySignatureEvidence;
  tenantEvidence: PartySignatureEvidence;
  finalSealedPdfHashSha256: string;
  chronologicalSealUtc: string;
  systemHmacIntegritySignature: string;
}

// ============================================================================
// 2. GENERADOR DE CONFIGURACIÓN DE MARCA DE AGUA DINÁMICA PARA PDF
// ============================================================================

export function buildPdfWatermarkConfig(
  mode: WatermarkMode,
  contractNumber: string,
  documentSha256: string
): PdfWatermarkConfig {
  switch (mode) {
    case 'DRAFT_WATERMARK':
      return {
        mode,
        text: `BORRADOR PRECONTRACTUAL (${contractNumber}) - SIN VALIDEZ JURÍDICA`,
        opacity: 0.22,
        rotationDegrees: -45,
        footerLegalLegend: `Borrador sujeto a revisión conforme a la Ley 820 de 2003. Huella preliminar SHA-256: ${documentSha256}`,
      };
    case 'PARTIAL_SIGNATURE_WATERMARK':
      return {
        mode,
        text: `FIRMA PARCIAL EN PROCESO (${contractNumber}) - PENDIENTE CONTRAPARTE`,
        opacity: 0.16,
        rotationDegrees: -45,
        footerLegalLegend: `Documento en tránsito de perfeccionamiento electrónico (Ley 527 de 1999). Hash base: ${documentSha256}`,
      };
    case 'FINAL_SEALED_LEGAL':
      return {
        mode,
        text: `ORIGINAL FIRMADO ELECTRÓNICAMENTE - LEY 527 DE 1999`,
        opacity: 0.08,
        rotationDegrees: 0,
        footerLegalLegend: `Mérito ejecutivo y validez probatoria (Art. 14 Ley 820/2003, Art. 244 CGP y Ley 527/1999). Sello SHA-256: ${documentSha256}`,
      };
  }
}

// ============================================================================
// 3. ALGORITMO DE SELLADO CRIPTOGRÁFICO Y NO REPUDIO (LEY 527 DE 1999)
// ============================================================================

/**
 * Calcula el hash SHA-256 determinista a partir de la estructura canónica del contrato
 * y del binario PDF generado antes de estampar las firmas.
 */
export function computeCanonicalContractHash(
  contractPayload: LeaseContractCreationInput,
  pdfBuffer: Uint8Array
): string {
  const canonicalJson = JSON.stringify({
    propertyId: contractPayload.propertyId,
    landlordId: contractPayload.landlordId,
    tenantId: contractPayload.tenantId,
    destination: contractPayload.destination,
    startDate: contractPayload.startDate,
    endDate: contractPayload.endDate,
    durationMonths: contractPayload.durationMonths,
    agreedMonthlyRentCop: contractPayload.agreedMonthlyRentCop,
    agreedAdminFeeCop: contractPayload.agreedAdminFeeCop,
    annualIpcAdjustmentCapPct: contractPayload.annualIpcAdjustmentCapPct,
    securityDepositCop: contractPayload.securityDepositCop,
    penaltyClauseCop: contractPayload.penaltyClauseCop,
    noticePeriodMonths: contractPayload.noticePeriodMonths,
  });

  return createHash('sha256')
    .update(canonicalJson, 'utf8')
    .update(pdfBuffer)
    .digest('hex');
}

/**
 * Genera el sello criptográfico individual de un firmante vinculando:
 * 1. Hash SHA-256 del contenido del contrato.
 * 2. Contexto autenticado de sesión Supabase Auth (JWT `sub`, `session_id`, `aal`).
 * 3. Metadatos de red y dispositivo (IP, User-Agent, Timestamp UTC).
 */
export function createPartyCryptographicSignature(
  signatureInput: ElectronicSignatureMetadataInput,
  authSession: SupabaseAuthSessionContext,
  serverSigningSecret: string
): PartySignatureEvidence {
  if (signatureInput.signerUserId !== authSession.userId) {
    throw new Error(
      'VIOLACIÓN DE SEGURIDAD: El usuario autenticado en la sesión de Supabase no coincide con el firmante declarado.'
    );
  }

  const canonicalSigningString = [
    `DOC_SHA256=${signatureInput.documentContentSha256}`,
    `USER_ID=${authSession.userId}`,
    `SESSION_ID=${authSession.sessionId}`,
    `AAL=${authSession.aal}`,
    `ROLE=${signatureInput.signerRole}`,
    `DOC_TYPE=${signatureInput.signerDocumentType}`,
    `DOC_NUM=${signatureInput.signerDocumentNumber}`,
    `IP=${signatureInput.signerIpAddress}`,
    `UA=${signatureInput.signerUserAgent}`,
    `TIMESTAMP_UTC=${signatureInput.signedAtUtc}`,
  ].join('|');

  const individualSignatureHashSha256 = createHmac('sha256', serverSigningSecret)
    .update(canonicalSigningString, 'utf8')
    .digest('hex');

  return {
    userId: authSession.userId,
    role: signatureInput.signerRole,
    documentType: signatureInput.signerDocumentType,
    documentNumber: signatureInput.signerDocumentNumber,
    sessionId: authSession.sessionId,
    aal: authSession.aal,
    ipAddress: signatureInput.signerIpAddress,
    userAgent: signatureInput.signerUserAgent,
    signedAtUtc: signatureInput.signedAtUtc,
    individualSignatureHashSha256,
  };
}

/**
 * Emite el Certificado de Auditoría Probatoria definitivo cuando ambas partes
 * (Arrendador y Arrendatario) han estampado su firma electrónica.
 */
export function issueJudicialAuditCertificate(params: {
  certificateId: string;
  contractId: string;
  contractNumber: string;
  originalDraftHashSha256: string;
  landlordEvidence: PartySignatureEvidence;
  tenantEvidence: PartySignatureEvidence;
  finalSealedPdfBuffer: Uint8Array;
  platformMasterHmacKey: string;
}): JudicialAuditCertificate {
  const finalSealedPdfHashSha256 = createHash('sha256')
    .update(params.finalSealedPdfBuffer)
    .digest('hex');

  const chronologicalSealUtc = new Date().toISOString();

  const legalFramework = [
    'Ley 820 de 2003 (Régimen de Arrendamiento de Vivienda Urbana)',
    'Ley 527 de 1999 (Comercio Electrónico y Mensajes de Datos)',
    'Decreto 2364 de 2012 (Reglamentación de la Firma Electrónica en Colombia)',
    'Ley 1564 de 2012 - Código General del Proceso Art. 243 a 247 (Valor probatorio de documentos electrónicos)',
  ];

  const compositeAuditDigest = [
    params.certificateId,
    params.contractId,
    params.originalDraftHashSha256,
    params.landlordEvidence.individualSignatureHashSha256,
    params.tenantEvidence.individualSignatureHashSha256,
    finalSealedPdfHashSha256,
    chronologicalSealUtc,
  ].join('::');

  const systemHmacIntegritySignature = createHmac('sha256', params.platformMasterHmacKey)
    .update(compositeAuditDigest, 'utf8')
    .digest('hex');

  return {
    certificateId: params.certificateId,
    contractId: params.contractId,
    contractNumber: params.contractNumber,
    legalFramework,
    originalDraftHashSha256: params.originalDraftHashSha256,
    landlordEvidence: params.landlordEvidence,
    tenantEvidence: params.tenantEvidence,
    finalSealedPdfHashSha256,
    chronologicalSealUtc,
    systemHmacIntegritySignature,
  };
}

// ============================================================================
// 4. VERIFICACIÓN CRIPTOGRÁFICA DE WEBHOOKS (FIRMAS Y RECAUDO DE CÁNONES)
// ============================================================================

export type PropTechWebhookEventType =
  | 'contract.signature.completed'
  | 'payment.canon.succeeded'
  | 'payment.canon.overdue';

export interface PropTechWebhookPayload {
  eventId: string;
  eventType: PropTechWebhookEventType;
  occurredAtUtc: string;
  data: {
    contractId: string;
    propertyId: string;
    paymentId?: string;
    gatewayTransactionId?: string;
    amountCop?: number;
    finalSealedDocumentSha256?: string;
  };
}

/**
 * Verifica en tiempo constante (protección contra ataques de temporización)
 * la firma HMAC-SHA256 de un evento webhook entrante.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string
): boolean {
  const expectedSignature = createHmac('sha256', webhookSecret)
    .update(rawBody, 'utf8')
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const receivedBuffer = Buffer.from(signatureHeader, 'utf8');

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
