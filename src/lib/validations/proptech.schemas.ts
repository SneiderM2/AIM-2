/**
 * @file proptech.schemas.ts
 * @description Esquemas de validación estricta con Zod y tipado estático TypeScript
 *              para la Plataforma PropTech Colombia (Ley 820/2003, Ley 1581/2012, Ley 527/1999).
 */

import { z } from 'zod';

// ============================================================================
// 1. CONSTANTES REGULATORIAS Y DOMINIO GEODÉSICO COLOMBIANO
// ============================================================================

export const COLOMBIA_GEO_BOUNDS = {
  LAT_MIN: -4.231687, // Extremo sur (Quebrada San Antonio, Leticia)
  LAT_MAX: 13.394722, // Extremo norte (Punta Gallinas / Providencia)
  LNG_MIN: -81.73562, // Extremo oeste (Archipiélago de San Andrés)
  LNG_MAX: -66.847222, // Extremo este (Isla de San José, Guainía)
} as const;

export const DANE_MAX_ALLOWED_IPC_PCT = 15.0; // Tope técnico de seguridad para validación porcentual IPC

export const PROPERTY_TYPES = [
  'apartamento',
  'casa',
  'apartaestudio',
  'local_comercial',
  'oficina',
  'bodega',
] as const;

export const LEASE_DESTINATIONS = ['vivienda_urbana', 'comercial'] as const;

export const IDENTITY_DOC_TYPES = ['CC', 'CE', 'NIT', 'TI', 'PP', 'PEP'] as const;

const sha256Regex = /^[a-fA-F0-9]{64}$/;
const colombiaPhoneRegex = /^\+573[0-9]{9}$/;

// ============================================================================
// 2. ESQUEMA DE PUBLICACIÓN DE PROPIEDAD (Ley 820 de 2003 - Art. 18)
// ============================================================================

export const propertyPublicationBaseSchema = z.object({
  matriculaInmobiliaria: z
    .string()
    .trim()
    .min(5, 'El folio de matrícula inmobiliaria SNR debe tener al menos 5 caracteres.')
    .max(50, 'El folio de matrícula inmobiliaria no puede exceder 50 caracteres.')
    .regex(/^[0-9]{3}-[0-9]{1,10}$/, 'Formato inválido de matrícula SNR (Ej: 050-123456).'),
  catastralChip: z
    .string()
    .trim()
    .max(50)
    .optional(),
  title: z
    .string()
    .trim()
    .min(15, 'El título del inmueble debe tener mínimo 15 caracteres.')
    .max(180, 'El título no debe superar los 180 caracteres.'),
  description: z
    .string()
    .trim()
    .min(80, 'La descripción detallada del inmueble debe contener al menos 80 caracteres.')
    .max(5000, 'La descripción no puede superar los 5000 caracteres.'),
  propertyType: z.enum(PROPERTY_TYPES, {
    required_error: 'Debe seleccionar una tipología de inmueble válida.',
  }),
  destination: z.enum(LEASE_DESTINATIONS).default('vivienda_urbana'),
  department: z.string().trim().min(3, 'El departamento es obligatorio.').max(80),
  city: z.string().trim().min(2, 'El municipio o distrito es obligatorio.').max(80),
  neighborhood: z.string().trim().min(2, 'El barrio o sector es obligatorio.').max(100),
  addressLine: z.string().trim().min(8, 'La dirección física nomenclada es obligatoria.').max(250),
  estrato: z
    .number({ invalid_type_error: 'El estrato socioeconómico debe ser un número entero.' })
    .int('El estrato debe ser un número entero.')
    .min(1, 'El estrato mínimo permitido en Colombia es 1.')
    .max(6, 'El estrato máximo permitido en Colombia es 6.'),
  commercialValuationCop: z
    .number({ invalid_type_error: 'El avalúo comercial debe ser numérico.' })
    .positive('El avalúo comercial debe ser mayor a $0 COP.')
    .min(20_000_000, 'El avalúo comercial mínimo registrable es de $20.000.000 COP.'),
  cadastralValuationCop: z
    .number()
    .positive('El avalúo catastral debe ser positivo.')
    .optional(),
  monthlyRentCop: z
    .number({ invalid_type_error: 'El valor del canon mensual debe ser numérico.' })
    .positive('El canon de arrendamiento mensual debe ser mayor a $0 COP.')
    .min(200_000, 'El canon mensual mínimo permitido es de $200.000 COP.'),
  administrationFeeCop: z
    .number()
    .nonnegative('La cuota de administración no puede ser un valor negativo.')
    .default(0),
  isAdministrationIncluded: z.boolean().default(false),
  privateAreaM2: z
    .number()
    .positive('El área privada debe ser mayor a 0 m².')
    .min(12, 'El área privada mínima es de 12 m².')
    .max(10_000, 'El área privada máxima es de 10.000 m².'),
  builtAreaM2: z
    .number()
    .positive('El área construida debe ser mayor a 0 m².')
    .min(12, 'El área construida mínima es de 12 m².')
    .max(15_000, 'El área construida máxima es de 15.000 m².'),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(1, 'El inmueble debe contar con al menos 1 baño.').max(20),
  parkingSpots: z.number().int().min(0).max(20).default(0),
  floorNumber: z.number().int().min(1).max(100).optional(),
  constructionYear: z
    .number()
    .int()
    .min(1900, 'El año de construcción no puede ser anterior a 1900.')
    .max(new Date().getFullYear() + 1, 'Año de construcción inválido.')
    .optional(),
  amenities: z.array(z.string().trim().min(2).max(60)).max(40).default([]),
  latitude: z
    .number()
    .min(
      COLOMBIA_GEO_BOUNDS.LAT_MIN,
      `La latitud debe ubicarse dentro de la jurisdicción de Colombia (>= ${COLOMBIA_GEO_BOUNDS.LAT_MIN}).`
    )
    .max(
      COLOMBIA_GEO_BOUNDS.LAT_MAX,
      `La latitud debe ubicarse dentro de la jurisdicción de Colombia (<= ${COLOMBIA_GEO_BOUNDS.LAT_MAX}).`
    ),
  longitude: z
    .number()
    .min(
      COLOMBIA_GEO_BOUNDS.LNG_MIN,
      `La longitud debe ubicarse dentro de la jurisdicción de Colombia (>= ${COLOMBIA_GEO_BOUNDS.LNG_MIN}).`
    )
    .max(
      COLOMBIA_GEO_BOUNDS.LNG_MAX,
      `La longitud debe ubicarse dentro de la jurisdicción de Colombia (<= ${COLOMBIA_GEO_BOUNDS.LNG_MAX}).`
    ),
});

export const propertyPublicationSchema = propertyPublicationBaseSchema.superRefine((data, ctx) => {
  // Validación 1: Área construida >= Área privada
  if (data.builtAreaM2 < data.privateAreaM2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['builtAreaM2'],
      message: 'El área construida no puede ser inferior al área privada del inmueble.',
    });
  }

  // Validación 2 (Ley 820 de 2003 Art. 18): Tope máximo del canon mensual = 1% del avalúo comercial estimado
  if (data.destination === 'vivienda_urbana') {
    const maxLegalRentCop = data.commercialValuationCop * 0.01;
    if (data.monthlyRentCop > maxLegalRentCop) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['monthlyRentCop'],
        message: `Incumplimiento Art. 18 Ley 820 de 2003: El canon de vivienda urbana ($${data.monthlyRentCop.toLocaleString('es-CO')} COP) no puede superar el 1% del valor comercial estimado ($${maxLegalRentCop.toLocaleString('es-CO')} COP).`,
      });
    }

    // Validación 3 (Ley 820 de 2003 Art. 18 Inciso 2): El valor comercial no puede exceder 2 veces el avalúo catastral
    if (
      typeof data.cadastralValuationCop === 'number' &&
      data.commercialValuationCop > data.cadastralValuationCop * 2
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['commercialValuationCop'],
        message:
          'Incumplimiento Art. 18 Ley 820 de 2003: El avalúo comercial estimado para vivienda urbana no puede exceder dos (2) veces el avalúo catastral vigente.',
      });
    }
  }
});

// ============================================================================
// 3. ESQUEMA DE CONSENTIMIENTO HABEAS DATA (Ley 1581 de 2012 & Decreto 1377/2013)
// ============================================================================

export const habeasDataConsentSchema = z.object({
  userId: z.string().uuid('El identificador del titular del dato debe ser un UUID válido.'),
  documentType: z.enum(IDENTITY_DOC_TYPES),
  documentNumber: z
    .string()
    .trim()
    .min(5, 'Número de documento inválido.')
    .max(30),
  phoneNumber: z
    .string()
    .trim()
    .regex(
      colombiaPhoneRegex,
      'El número celular debe incluir el indicativo +57 seguido de 10 dígitos (Ej: +573001234567).'
    ),
  policyVersion: z
    .string()
    .trim()
    .regex(/^v[0-9]+\.[0-9]+\.[0-9]+$/, 'La versión de la política debe seguir SemVer (Ej: v2.1.0).'),
  policyDocumentHash: z
    .string()
    .trim()
    .regex(sha256Regex, 'El hash criptográfico de la Política de Tratamiento debe ser un SHA-256 válido.'),
  consentTextAccepted: z
    .string()
    .trim()
    .min(
      120,
      'El texto de autorización expresa de tratamiento de datos personales (Ley 1581 de 2012) debe capturarse íntegramente.'
    )
    .refine(
      (txt) => txt.includes('Ley 1581 de 2012') && txt.includes('Decreto 1377 de 2013'),
      'La declaración expresa debe citar explícitamente la Ley 1581 de 2012 y el Decreto 1377 de 2013.'
    ),
  acceptedPrivacyPolicy: z.literal(true, {
    errorMap: () => ({
      message:
        'Es obligatorio otorgar autorización previa, expresa e informada para el tratamiento de datos personales (Ley 1581 de 2012).',
    }),
  }),
  acceptedTermsOfService: z.literal(true, {
    errorMap: () => ({
      message: 'Debe aceptar los Términos y Condiciones Generales de la plataforma.',
    }),
  }),
  acceptedElectronicSignatureAgreement: z.literal(true, {
    errorMap: () => ({
      message:
        'Debe aceptar el acuerdo de validez jurídica de firma electrónica (Ley 527 de 1999 y Decreto 2364 de 2012).',
    }),
  }),
  acceptedCreditBureauQuery: z.boolean().default(false),
  ipAddress: z.string().ip({ message: 'Se requiere una dirección IP (IPv4/IPv6) válida para la traza de auditoría.' }),
  userAgent: z.string().trim().min(10, 'El User-Agent del navegador es obligatorio para el registro probatorio.'),
  acceptedAtIso: z.string().datetime({ message: 'El timestamp UTC de aceptación debe estar en formato ISO 8601.' }),
});

// ============================================================================
// 4. ESQUEMAS DE CREACIÓN Y FIRMA DE CONTRATO (Ley 820/2003 & Ley 527/1999)
// ============================================================================

export const electronicSignatureMetadataSchema = z.object({
  signerUserId: z.string().uuid('ID de firmante inválido.'),
  signerRole: z.enum(['landlord', 'tenant']),
  signerDocumentType: z.enum(IDENTITY_DOC_TYPES),
  signerDocumentNumber: z.string().trim().min(5).max(30),
  documentContentSha256: z
    .string()
    .regex(sha256Regex, 'El hash SHA-256 del documento contractual es inválido.'),
  otpVerificationToken: z
    .string()
    .length(6, 'El código OTP de segundo factor de autenticación debe tener exactamente 6 dígitos.')
    .regex(/^[0-9]{6}$/, 'El código OTP debe ser numérico.'),
  signerIpAddress: z.string().ip('Dirección IP del firmante inválida.'),
  signerUserAgent: z.string().trim().min(10, 'User-Agent del dispositivo firmante requerido.'),
  signedAtUtc: z.string().datetime('Timestamp UTC de firma electrónica inválido.'),
  expressElectronicSignatureConsent: z.literal(true, {
    errorMap: () => ({
      message:
        'El firmante debe manifestar su voluntad inequívoca de obligarse mediante firma electrónica (Art. 7 Ley 527 de 1999).',
    }),
  }),
});

export const leaseContractCreationSchema = z
  .object({
    propertyId: z.string().uuid(),
    applicationId: z.string().uuid(),
    landlordId: z.string().uuid(),
    tenantId: z.string().uuid(),
    agentId: z.string().uuid().optional(),
    destination: z.enum(LEASE_DESTINATIONS).default('vivienda_urbana'),
    startDate: z.string().date('La fecha de inicio debe tener formato YYYY-MM-DD.'),
    endDate: z.string().date('La fecha de vencimiento debe tener formato YYYY-MM-DD.'),
    durationMonths: z
      .number()
      .int()
      .min(1, 'La duración mínima del contrato es de 1 mes.')
      .max(120, 'La duración máxima inicial es de 120 meses.'),
    propertyCommercialValuationCop: z.number().positive(),
    agreedMonthlyRentCop: z.number().positive('El canon mensual acordado debe ser mayor a $0 COP.'),
    agreedAdminFeeCop: z.number().nonnegative().default(0),
    paymentDueDay: z
      .number()
      .int()
      .min(1, 'El día de corte de pago debe estar entre 1 y 28.')
      .max(28, 'El día de corte de pago debe estar entre 1 y 28 para ser válido en febrero.'),
    annualIpcAdjustmentCapPct: z
      .number()
      .min(0, 'El porcentaje de reajuste anual no puede ser negativo.')
      .max(
        DANE_MAX_ALLOWED_IPC_PCT,
        `El reajuste anual pactado no puede exceder el tope técnico del IPC certificado por el DANE (${DANE_MAX_ALLOWED_IPC_PCT}%).`
      ),
    daneCertifiedPreviousYearIpcPct: z.number().positive(),
    referenceDaneIpcYear: z.number().int().min(2020).max(2100),
    penaltyClauseCop: z.number().positive('La cláusula penal debe ser mayor a $0 COP.'),
    securityDepositCop: z.number().nonnegative().default(0),
    noticePeriodMonths: z.number().int().min(1).max(12).default(3),
    documentContentSha256: z
      .string()
      .regex(sha256Regex, 'El hash SHA-256 inicial del borrador contractual es obligatorio.'),
  })
  .superRefine((data, ctx) => {
    // 1. Validación de partes distintas
    if (data.landlordId === data.tenantId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tenantId'],
        message: 'El arrendador y el arrendatario no pueden ser la misma persona natural o jurídica.',
      });
    }

    // 2. Validación de coherencia cronológica de fechas
    const start = new Date(`${data.startDate}T00:00:00Z`);
    const end = new Date(`${data.endDate}T00:00:00Z`);
    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'La fecha de finalización del contrato debe ser estrictamente posterior a la fecha de inicio.',
      });
    }

    // 3. Reglas imperativas de orden público para Vivienda Urbana (Ley 820 de 2003)
    if (data.destination === 'vivienda_urbana') {
      // Art. 16 Ley 820: Prohibición absoluta de depósitos en dinero o cauciones reales
      if (data.securityDepositCop > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['securityDepositCop'],
          message:
            'PROHIBICIÓN LEGAL (Art. 16 Ley 820 de 2003): En contratos de arrendamiento de vivienda urbana está prohibido exigir depósitos en dinero efectivo u otra clase de cauciones reales.',
        });
      }

      // Art. 18 Ley 820: Canon mensual <= 1% del valor comercial del inmueble
      const maxAllowedCanon = data.propertyCommercialValuationCop * 0.01;
      if (data.agreedMonthlyRentCop > maxAllowedCanon) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['agreedMonthlyRentCop'],
          message: `Incumplimiento Art. 18 Ley 820 de 2003: El canon pactado ($${data.agreedMonthlyRentCop.toLocaleString('es-CO')} COP) supera el límite legal del 1% del valor comercial ($${maxAllowedCanon.toLocaleString('es-CO')} COP).`,
        });
      }

      // Art. 20 Ley 820: Reajuste anual no mayor al 100% del IPC del año calendario inmediatamente anterior
      if (data.annualIpcAdjustmentCapPct > data.daneCertifiedPreviousYearIpcPct) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['annualIpcAdjustmentCapPct'],
          message: `Incumplimiento Art. 20 Ley 820 de 2003: El incremento anual pactado (${data.annualIpcAdjustmentCapPct}%) no puede superar el 100% del IPC certificado por el DANE para el año ${data.referenceDaneIpcYear} (${data.daneCertifiedPreviousYearIpcPct}%).`,
        });
      }

      // Art. 22 y 24 Ley 820: Preaviso mínimo de tres (3) meses para terminación unilateral o no prórroga
      if (data.noticePeriodMonths < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['noticePeriodMonths'],
          message:
            'Incumplimiento Art. 22 y 24 Ley 820 de 2003: El término de preaviso para vivienda urbana no puede ser inferior a tres (3) meses.',
        });
      }
    }
  });

// ============================================================================
// 5. TIPOS INFERIDOS EXPORTADOS (ZERO `any`)
// ============================================================================

export type PropertyPublicationInput = z.infer<typeof propertyPublicationSchema>;
export type HabeasDataConsentInput = z.infer<typeof habeasDataConsentSchema>;
export type LeaseContractCreationInput = z.infer<typeof leaseContractCreationSchema>;
export type ElectronicSignatureMetadataInput = z.infer<typeof electronicSignatureMetadataSchema>;
