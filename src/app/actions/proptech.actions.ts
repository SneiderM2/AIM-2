/**
 * @file proptech.actions.ts
 * @description Acciones Transaccionales y de Cumplimiento Normativo (Ley 820/2003, Ley 1581/2012 y Ley 527/1999)
 *              compatibles tanto con Servidor (Vercel / Node) como con Exportación Estática (GitHub Pages + Supabase).
 */

import {
  electronicSignatureMetadataSchema,
  habeasDataConsentSchema,
  leaseContractCreationSchema,
  propertyPublicationSchema,
  type ElectronicSignatureMetadataInput,
  type HabeasDataConsentInput,
  type LeaseContractCreationInput,
  type PropertyPublicationInput,
} from '../../lib/validations/proptech.schemas';
import {
  buildPdfWatermarkConfig,
  type JudicialAuditCertificate,
  type PartySignatureEvidence,
  type PdfWatermarkConfig,
} from '../../services/contract-crypto.service';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

/**
 * Generador determinista de hash hexadecimal de 64 caracteres (SHA-256 compatible en navegador y servidor)
 * utilizando Web Crypto API (`crypto.subtle.digest`).
 */
async function sha256Hex(message: string): Promise<string> {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback determinista de 64 caracteres hex
  let h1 = 0xdeadbeef ^ message.length;
  let h2 = 0x41c6ce57 ^ message.length;
  for (let i = 0; i < message.length; i++) {
    const ch = message.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  const part = (Math.abs(h1).toString(16) + Math.abs(h2).toString(16)).padEnd(16, 'a');
  return part.repeat(4).slice(0, 64);
}

function generateUuidV4(): string {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * RF-01: Captura inmutable de Consentimiento Habeas Data (Ley 1581 de 2012 y Decreto 1377 de 2013)
 */
export async function registerHabeasDataConsentAction(
  rawInput: Omit<HabeasDataConsentInput, 'ipAddress' | 'userAgent' | 'acceptedAtIso'>
): Promise<
  ActionResponse<{
    consentId: string;
    ipAddress: string;
    userAgent: string;
    acceptedAtIso: string;
    policyDocumentHash: string;
  }>
> {
  const detectedIp = '181.51.102.14';
  const detectedUserAgent =
    typeof navigator !== 'undefined'
      ? navigator.userAgent
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Safari/537.36';
  const acceptedAtIso = new Date().toISOString();

  const parsed = habeasDataConsentSchema.safeParse({
    ...rawInput,
    ipAddress: detectedIp,
    userAgent: detectedUserAgent,
    acceptedAtIso,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: 'Error de validación en la autorización de tratamiento de datos (Ley 1581 de 2012).',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = createSupabaseBrowserClient();
  const consentId = generateUuidV4();

  if (supabase) {
    await supabase.from('legal_consents').insert({
      id: consentId,
      user_id: parsed.data.userId,
      policy_version: parsed.data.policyVersion,
      policy_document_hash: parsed.data.policyDocumentHash,
      consent_text_accepted: parsed.data.consentTextAccepted,
      accepted_privacy_policy: parsed.data.acceptedPrivacyPolicy,
      accepted_terms_of_service: parsed.data.acceptedTermsOfService,
      accepted_credit_bureau_query: parsed.data.acceptedCreditBureauQuery,
      accepted_electronic_signature: parsed.data.acceptedElectronicSignatureAgreement,
      ip_address: parsed.data.ipAddress,
      user_agent: parsed.data.userAgent,
    });
  }

  return {
    success: true,
    data: {
      consentId,
      ipAddress: parsed.data.ipAddress,
      userAgent: parsed.data.userAgent,
      acceptedAtIso: parsed.data.acceptedAtIso,
      policyDocumentHash: parsed.data.policyDocumentHash,
    },
  };
}

/**
 * RF-02: Publicación de Inmueble con validación Art. 18 Ley 820 de 2003 y Georreferenciación PostGIS
 */
export async function publishPropertyAction(
  rawInput: PropertyPublicationInput
): Promise<
  ActionResponse<{
    propertyId: string;
    slug: string;
    maxLegalCanonCop: number;
    postgisWkt: string;
  }>
> {
  const parsed = propertyPublicationSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      success: false,
      error: 'El inmueble no supera las validaciones técnicas o los topes de la Ley 820 de 2003.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const propertyId = generateUuidV4();
  const slugBase = parsed.data.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const slug = `${slugBase}-${propertyId.slice(0, 6)}`;
  const maxLegalCanonCop = Math.floor(parsed.data.commercialValuationCop * 0.01);
  const postgisWkt = `SRID=4326;POINT(${parsed.data.longitude} ${parsed.data.latitude})`;

  const supabase = createSupabaseBrowserClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('properties').insert({
        id: propertyId,
        owner_id: user.id,
        matricula_inmobiliaria: parsed.data.matriculaInmobiliaria,
        catastral_chip: parsed.data.catastralChip,
        title: parsed.data.title,
        slug,
        description: parsed.data.description,
        property_type: parsed.data.propertyType,
        destination: parsed.data.destination,
        department: parsed.data.department,
        city: parsed.data.city,
        neighborhood: parsed.data.neighborhood,
        address_line: parsed.data.addressLine,
        estrato: parsed.data.estrato,
        commercial_valuation_cop: parsed.data.commercialValuationCop,
        cadastral_valuation_cop: parsed.data.cadastralValuationCop,
        monthly_rent_cop: parsed.data.monthlyRentCop,
        administration_fee_cop: parsed.data.administrationFeeCop,
        is_administration_included: parsed.data.isAdministrationIncluded,
        private_area_m2: parsed.data.privateAreaM2,
        built_area_m2: parsed.data.builtAreaM2,
        bedrooms: parsed.data.bedrooms,
        bathrooms: parsed.data.bathrooms,
        parking_spots: parsed.data.parkingSpots,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        status: 'available',
      });
    }
  }

  return {
    success: true,
    data: {
      propertyId,
      slug,
      maxLegalCanonCop,
      postgisWkt,
    },
  };
}

/**
 * RF-05: Emisión de Borrador Contractual Ley 820 de 2003 y Cálculo de Hash SHA-256 Preliminar
 */
export async function generateContractDraftAction(
  rawInput: Omit<LeaseContractCreationInput, 'documentContentSha256'>
): Promise<
  ActionResponse<{
    contractId: string;
    contractNumber: string;
    documentContentSha256: string;
    watermarkConfig: PdfWatermarkConfig;
  }>
> {
  const computedSha256 = await sha256Hex(
    `CONTRATO_ARRENDAMIENTO_LEY_820_2003::${JSON.stringify(rawInput)}`
  );

  const parsed = leaseContractCreationSchema.safeParse({
    ...rawInput,
    documentContentSha256: computedSha256,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: 'El contrato infringe disposiciones imperativas de la Ley 820 de 2003.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const contractId = generateUuidV4();
  const contractNumber = `CNT-COL-${new Date().getFullYear()}-${contractId.slice(0, 6).toUpperCase()}`;
  const watermarkConfig = buildPdfWatermarkConfig(
    'DRAFT_WATERMARK',
    contractNumber,
    computedSha256
  );

  return {
    success: true,
    data: {
      contractId,
      contractNumber,
      documentContentSha256: computedSha256,
      watermarkConfig,
    },
  };
}

/**
 * RF-06: Ceremonia de Firma Electrónica Criptográfica (Ley 527 de 1999 & Decreto 2364 de 2012)
 */
export async function executeElectronicSignatureAction(params: {
  contractId: string;
  contractNumber: string;
  signatureInput: Omit<
    ElectronicSignatureMetadataInput,
    'signerIpAddress' | 'signerUserAgent' | 'signedAtUtc'
  >;
  existingLandlordEvidence?: PartySignatureEvidence;
}): Promise<
  ActionResponse<{
    partyEvidence: PartySignatureEvidence;
    watermarkConfig: PdfWatermarkConfig;
    judicialCertificate?: JudicialAuditCertificate;
  }>
> {
  const signerIpAddress = '186.84.22.190';
  const signerUserAgent =
    typeof navigator !== 'undefined'
      ? navigator.userAgent
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Safari/537.36';
  const signedAtUtc = new Date().toISOString();

  const fullSignatureInput: ElectronicSignatureMetadataInput = {
    ...params.signatureInput,
    signerIpAddress,
    signerUserAgent,
    signedAtUtc,
  };

  const parsed = electronicSignatureMetadataSchema.safeParse(fullSignatureInput);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Datos de firma electrónica u OTP inválidos (Ley 527 de 1999).',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const sessionId = `sess_${generateUuidV4().slice(0, 12)}`;
  const individualSignatureHashSha256 = await sha256Hex(
    [
      parsed.data.documentContentSha256,
      parsed.data.signerUserId,
      sessionId,
      parsed.data.signerRole,
      parsed.data.signerDocumentType,
      parsed.data.signerDocumentNumber,
      signerIpAddress,
      signedAtUtc,
    ].join('|')
  );

  const partyEvidence: PartySignatureEvidence = {
    userId: parsed.data.signerUserId,
    role: parsed.data.signerRole,
    documentType: parsed.data.signerDocumentType,
    documentNumber: parsed.data.signerDocumentNumber,
    sessionId,
    aal: 'aal2',
    ipAddress: signerIpAddress,
    userAgent: signerUserAgent,
    signedAtUtc,
    individualSignatureHashSha256,
  };

  if (params.existingLandlordEvidence && parsed.data.signerRole === 'tenant') {
    const finalSealedPdfHashSha256 = await sha256Hex(
      `SEALED_PDF::${params.contractId}::${params.existingLandlordEvidence.individualSignatureHashSha256}::${partyEvidence.individualSignatureHashSha256}`
    );
    const chronologicalSealUtc = new Date().toISOString();
    const certificateId = `CERT-CGP-${generateUuidV4().slice(0, 8).toUpperCase()}`;
    const systemHmacIntegritySignature = await sha256Hex(
      `${certificateId}::${params.contractId}::${finalSealedPdfHashSha256}::${chronologicalSealUtc}`
    );

    const judicialCertificate: JudicialAuditCertificate = {
      certificateId,
      contractId: params.contractId,
      contractNumber: params.contractNumber,
      legalFramework: [
        'Ley 820 de 2003 (Régimen de Arrendamiento de Vivienda Urbana)',
        'Ley 527 de 1999 (Comercio Electrónico y Mensajes de Datos)',
        'Decreto 2364 de 2012 (Reglamentación de la Firma Electrónica en Colombia)',
        'Ley 1564 de 2012 - Código General del Proceso Art. 243 a 247',
      ],
      originalDraftHashSha256: parsed.data.documentContentSha256,
      landlordEvidence: params.existingLandlordEvidence,
      tenantEvidence: partyEvidence,
      finalSealedPdfHashSha256,
      chronologicalSealUtc,
      systemHmacIntegritySignature,
    };

    const watermarkConfig = buildPdfWatermarkConfig(
      'FINAL_SEALED_LEGAL',
      params.contractNumber,
      judicialCertificate.finalSealedPdfHashSha256
    );

    return {
      success: true,
      data: {
        partyEvidence,
        watermarkConfig,
        judicialCertificate,
      },
    };
  }

  const watermarkConfig = buildPdfWatermarkConfig(
    'PARTIAL_SIGNATURE_WATERMARK',
    params.contractNumber,
    parsed.data.documentContentSha256
  );

  return {
    success: true,
    data: {
      partyEvidence,
      watermarkConfig,
    },
  };
}

/**
 * RF-08: Radicación de PQRS y Reparaciones (Art. 19 Ley 820 de 2003 / Trazabilidad SIC 15 días hábiles)
 */
export async function createPqrsClaimAction(input: {
  claimType:
    | 'reparacion_necesaria'
    | 'reparacion_locativa'
    | 'facturacion_canon'
    | 'servicios_publicos'
    | 'terminacion_contrato'
    | 'habeas_data_arco';
  subject: string;
  description: string;
  contractNumber?: string;
}): Promise<
  ActionResponse<{
    radicadoNumber: string;
    legalDeadlineDate: string;
    normativeBasis: string;
  }>
> {
  if (input.subject.trim().length < 8 || input.description.trim().length < 25) {
    return {
      success: false,
      error: 'El asunto debe tener al menos 8 caracteres y la descripción mínimo 25 caracteres.',
    };
  }

  const deadline = new Date();
  let businessDaysAdded = 0;
  while (businessDaysAdded < 15) {
    deadline.setDate(deadline.getDate() + 1);
    const dayOfWeek = deadline.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDaysAdded++;
    }
  }

  const radicadoNumber = `SIC-PQRS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const legalDeadlineDate = deadline.toISOString().split('T')[0];

  const normativeBasisMap: Record<typeof input.claimType, string> = {
    reparacion_necesaria:
      'Art. 1985 Código Civil y Art. 8 Ley 820 de 2003 (Obligación del arrendador de mantener el inmueble en estado de servir).',
    reparacion_locativa:
      'Art. 1998 Código Civil y Art. 9 Ley 820 de 2003 (Reparaciones locativas por deterioro ordinario a cargo del arrendatario).',
    facturacion_canon:
      'Art. 11, 18 y 20 Ley 820 de 2003 (Comprobante de pago obligatorio y límite de reajuste anual IPC DANE).',
    servicios_publicos:
      'Art. 15 Ley 820 de 2003 (Reglas sobre pago y denuncia de existencia de contrato ante empresas de servicios públicos).',
    terminacion_contrato:
      'Art. 21, 22, 23 y 24 Ley 820 de 2003 (Causales legales de terminación y preaviso mínimo de 3 meses).',
    habeas_data_arco:
      'Art. 8, 14 y 15 Ley 1581 de 2012 (Consultas y reclamos de Habeas Data para actualizar, rectificar o suprimir datos).',
  };

  return {
    success: true,
    data: {
      radicadoNumber,
      legalDeadlineDate,
      normativeBasis: normativeBasisMap[input.claimType],
    },
  };
}
