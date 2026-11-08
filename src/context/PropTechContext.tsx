'use client';

/**
 * @file PropTechContext.tsx
 * @description Estado global reactivo y persistente centrado en la Región del Sumapaz
 *              (Fusagasugá, Silvania, Arbeláez, Pasca - Cundinamarca). Gestiona la sesión
 *              con autenticación por correo/contraseña y vistas estrictamente separadas
 *              por rol (Propietario, Arrendatario, Agente Inmobiliario / Administrador).
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_COLOMBIAN_PROPERTIES } from '../lib/data/colombia-mock-data';
import type { PropertyCardDTO } from '../components/search/PropertySearchSplitView';
import type { PROPERTY_TYPES } from '../lib/validations/proptech.schemas';

// ============================================================================
// 1. TIPOS DE USUARIOS, ROLES Y ENTIDADES CRUD
// ============================================================================

export type UserRoleType = 'landlord' | 'tenant' | 'agent';

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  documentType: 'CC' | 'CE' | 'NIT';
  documentNumber: string;
  phoneNumber: string;
  role: UserRoleType;
  roleLabel: string;
  isIdentityVerified: boolean;
  professionalCard?: string;
}

export type PropertyStatusType = 'available' | 'under_review' | 'rented' | 'inactive';

export interface ManagedProperty extends PropertyCardDTO {
  ownerId: string;
  ownerName: string;
  matriculaInmobiliaria: string;
  commercialValuationCop: number;
  cadastralValuationCop: number;
  status: PropertyStatusType;
  addressLine: string;
  department: string;
}

export type ApplicationStatusType = 'submitted' | 'in_study' | 'approved' | 'rejected';

export interface LeaseApplicationItem {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyCity: string;
  monthlyRentCop: number;
  applicantId: string;
  applicantName: string;
  applicantDocument: string;
  declaredMonthlyIncomeCop: number;
  employmentType: 'empleado' | 'independiente' | 'pensionado' | 'rentista_capital';
  employerName: string;
  coSignerFullName: string;
  coSignerIncomeCop: number;
  riskScore: number;
  status: ApplicationStatusType;
  createdAt: string;
}

export type ContractStatusType = 'pending_signatures' | 'partially_signed' | 'active' | 'terminated';

export interface ContractItem {
  id: string;
  contractNumber: string;
  propertyId: string;
  propertyTitle: string;
  landlordId: string;
  landlordName: string;
  tenantId: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  agreedMonthlyRentCop: number;
  agreedAdminFeeCop: number;
  annualIpcAdjustmentCapPct: number;
  securityDepositCop: number;
  status: ContractStatusType;
  documentContentSha256: string;
  landlordSignedAt?: string;
  tenantSignedAt?: string;
  finalSealedSha256?: string;
}

export interface PaymentItem {
  id: string;
  contractId: string;
  contractNumber: string;
  propertyTitle: string;
  tenantId: string;
  tenantName: string;
  landlordId: string;
  billingPeriod: string;
  dueDate: string;
  rentAmountCop: number;
  adminFeeCop: number;
  totalAmountCop: number;
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod?: 'pse' | 'nequi' | 'tarjeta_credito' | 'boton_bancolombia';
  gatewayReference: string;
  paidAt?: string;
}

export interface PqrsClaimItem {
  id: string;
  radicadoNumber: string;
  propertyTitle: string;
  claimantId: string;
  claimantName: string;
  claimType:
    | 'reparacion_necesaria'
    | 'reparacion_locativa'
    | 'facturacion_canon'
    | 'servicios_publicos'
    | 'terminacion_contrato'
    | 'habeas_data_arco';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'escalated_sic';
  legalDeadlineDate: string;
  resolutionNotes?: string;
  createdAt: string;
}

// ============================================================================
// 2. USUARIOS DEMO Y CREDENCIALES POR ROL
// ============================================================================

export interface DemoUserAccount extends AuthenticatedUser {
  demoPassword: string;
  alternativeEmails: string[];
}

export const DEMO_ROLE_USERS: Record<UserRoleType, DemoUserAccount> = {
  landlord: {
    id: '11111111-1111-4111-8111-111111111111',
    fullName: 'Carlos Eduardo Gómez Restrepo',
    email: 'propietario@proptech.co',
    documentType: 'CC',
    documentNumber: '79845120',
    phoneNumber: '+573104528910',
    role: 'landlord',
    roleLabel: 'Propietario / Arrendador',
    isIdentityVerified: true,
    demoPassword: 'propietario123',
    alternativeEmails: ['carlos.gomez@propietarios.co', 'propietario@sumapaz.com', 'propietario@gmail.com'],
  },
  tenant: {
    id: '22222222-2222-4222-8222-222222222222',
    fullName: 'Valentina Restrepo Jaramillo',
    email: 'arrendatario@proptech.co',
    documentType: 'CC',
    documentNumber: '1020765432',
    phoneNumber: '+573158901234',
    role: 'tenant',
    roleLabel: 'Arrendatario / Inquilino',
    isIdentityVerified: true,
    demoPassword: 'inquilino123',
    alternativeEmails: ['valentina.restrepo@inquilinos.co', 'inquilino@sumapaz.com', 'inquilino@gmail.com', 'arrendatario@gmail.com'],
  },
  agent: {
    id: '33333333-3333-4333-8333-333333333333',
    fullName: 'Andrés Felipe Vargas (Lonja & Admin)',
    email: 'admin@proptech.co',
    documentType: 'NIT',
    documentNumber: '900412889-1',
    phoneNumber: '+573009123456',
    role: 'agent',
    roleLabel: 'Agente Inmobiliario / Administrador',
    isIdentityVerified: true,
    professionalCard: 'LONJA-SUMAPAZ-2026-8841',
    demoPassword: 'admin123',
    alternativeEmails: ['auditoria@inmobiliariaandina.co', 'secretario@proptech.co', 'admin@sumapaz.com', 'admin@gmail.com'],
  },
};

// ============================================================================
// 3. DATOS INICIALES ENRIQUECIDOS PARA LA REGIÓN DEL SUMAPAZ
// ============================================================================

const INITIAL_MANAGED_PROPERTIES: ManagedProperty[] = INITIAL_COLOMBIAN_PROPERTIES.map(
  (prop, idx) => ({
    ...prop,
    ownerId: '11111111-1111-4111-8111-111111111111',
    ownerName: 'Carlos Eduardo Gómez Restrepo',
    matriculaInmobiliaria: `050C-019482${idx + 10}`,
    commercialValuationCop: prop.monthlyRentCop * 125, // Cumple estrictamente tope 1% Art. 18 Ley 820
    cadastralValuationCop: prop.monthlyRentCop * 75,
    status: idx === 1 ? 'rented' : idx === 3 ? 'rented' : 'available',
    addressLine: `Carrera ${idx + 4} # ${11 + idx} - ${20 + idx * 2}, ${prop.neighborhood}`,
    department: 'Cundinamarca (Región del Sumapaz)',
  })
);

const INITIAL_APPLICATIONS: LeaseApplicationItem[] = [
  {
    id: 'app-1001',
    propertyId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    propertyTitle: 'Apartamento Panorámico en Fusagasugá Centro - Edificio Mirador',
    propertyCity: 'Fusagasugá',
    monthlyRentCop: 1200000,
    applicantId: '22222222-2222-4222-8222-222222222222',
    applicantName: 'Valentina Restrepo Jaramillo',
    applicantDocument: 'CC 1020765432',
    declaredMonthlyIncomeCop: 4500000,
    employmentType: 'empleado',
    employerName: 'Alcaldía de Fusagasugá',
    coSignerFullName: 'Mauricio Restrepo Cano',
    coSignerIncomeCop: 6200000,
    riskScore: 865,
    status: 'approved',
    createdAt: '2026-11-02',
  },
  {
    id: 'app-1002',
    propertyId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    propertyTitle: 'Apartamento Exterior en Balmoral con Terraza y Vista a los Cerros',
    propertyCity: 'Fusagasugá',
    monthlyRentCop: 1450000,
    applicantId: '22222222-2222-4222-8222-222222222222',
    applicantName: 'Valentina Restrepo Jaramillo',
    applicantDocument: 'CC 1020765432',
    declaredMonthlyIncomeCop: 4500000,
    employmentType: 'empleado',
    employerName: 'Alcaldía de Fusagasugá',
    coSignerFullName: 'Mauricio Restrepo Cano',
    coSignerIncomeCop: 6200000,
    riskScore: 840,
    status: 'in_study',
    createdAt: '2026-11-05',
  },
];

const INITIAL_CONTRACTS: ContractItem[] = [
  {
    id: 'cnt-2001',
    contractNumber: 'CNT-FUSA-2026-89A4F1',
    propertyId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    propertyTitle: 'Apartamento Panorámico en Fusagasugá Centro - Edificio Mirador',
    landlordId: '11111111-1111-4111-8111-111111111111',
    landlordName: 'Carlos Eduardo Gómez Restrepo',
    tenantId: '22222222-2222-4222-8222-222222222222',
    tenantName: 'Valentina Restrepo Jaramillo',
    startDate: '2026-11-01',
    endDate: '2027-10-31',
    durationMonths: 12,
    agreedMonthlyRentCop: 1200000,
    agreedAdminFeeCop: 120000,
    annualIpcAdjustmentCapPct: 4.45,
    securityDepositCop: 0,
    status: 'active',
    documentContentSha256:
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    landlordSignedAt: '2026-11-01T10:00:00Z',
    tenantSignedAt: '2026-11-01T11:30:00Z',
    finalSealedSha256:
      '8f4b2359f429653199d7a22ef7a6ae8c33ec702e5c8e9b418a0a80eb9a02ec94',
  },
];

const INITIAL_PAYMENTS: PaymentItem[] = [
  {
    id: 'pay-3001',
    contractId: 'cnt-2001',
    contractNumber: 'CNT-FUSA-2026-89A4F1',
    propertyTitle: 'Apartamento Panorámico en Fusagasugá Centro - Edificio Mirador',
    tenantId: '22222222-2222-4222-8222-222222222222',
    tenantName: 'Valentina Restrepo Jaramillo',
    landlordId: '11111111-1111-4111-8111-111111111111',
    billingPeriod: 'Noviembre 2026',
    dueDate: '2026-11-05',
    rentAmountCop: 1200000,
    adminFeeCop: 120000,
    totalAmountCop: 1320000,
    status: 'paid',
    paymentMethod: 'pse',
    gatewayReference: 'WOMPI-PSE-9948120',
    paidAt: '2026-11-04T16:12:00Z',
  },
  {
    id: 'pay-3002',
    contractId: 'cnt-2001',
    contractNumber: 'CNT-FUSA-2026-89A4F1',
    propertyTitle: 'Apartamento Panorámico en Fusagasugá Centro - Edificio Mirador',
    tenantId: '22222222-2222-4222-8222-222222222222',
    tenantName: 'Valentina Restrepo Jaramillo',
    landlordId: '11111111-1111-4111-8111-111111111111',
    billingPeriod: 'Diciembre 2026 (Cuota Pendiente)',
    dueDate: '2026-12-05',
    rentAmountCop: 1200000,
    adminFeeCop: 120000,
    totalAmountCop: 1320000,
    status: 'pending',
    gatewayReference: 'WOMPI-PSE-9948999',
  },
];

const INITIAL_PQRS: PqrsClaimItem[] = [
  {
    id: 'pqrs-4001',
    radicadoNumber: 'SIC-PQRS-2026-481920',
    propertyTitle: 'Apartamento Panorámico en Fusagasugá Centro - Edificio Mirador',
    claimantId: '22222222-2222-4222-8222-222222222222',
    claimantName: 'Valentina Restrepo Jaramillo',
    claimType: 'reparacion_necesaria',
    subject: 'Revisión técnica de grifería y presión de agua en baño',
    description:
      'Se solicita revisión técnica preventiva conforme al Art. 1985 del Código Civil y Art. 8 de la Ley 820 de 2003.',
    status: 'in_progress',
    legalDeadlineDate: '2026-11-27',
    resolutionNotes: 'Fontanero certificado asignado por la administración para el jueves 10 AM.',
    createdAt: '2026-11-05',
  },
];

// ============================================================================
// 4. INTERFAZ DEL CONTEXTO GLOBAL Y OPERACIONES CRUD
// ============================================================================

export type ThemeMode = 'light' | 'dark';

interface PropTechContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  currentUser: AuthenticatedUser;
  loginAsRole: (role: UserRoleType, customName?: string, customEmail?: string) => void;
  loginWithCredentials: (
    email: string,
    password: string
  ) => { success: boolean; role?: UserRoleType; error?: string };
  logout: () => void;
  properties: ManagedProperty[];
  applications: LeaseApplicationItem[];
  contracts: ContractItem[];
  payments: PaymentItem[];
  pqrsClaims: PqrsClaimItem[];
  // CRUD Inmuebles
  createProperty: (
    newProp: Omit<ManagedProperty, 'id' | 'slug' | 'ownerId' | 'ownerName' | 'isLey820Compliant'>
  ) => ManagedProperty;
  updateProperty: (id: string, updates: Partial<ManagedProperty>) => void;
  deleteProperty: (id: string) => void;
  // CRUD Postulaciones
  createApplication: (input: {
    propertyId: string;
    declaredMonthlyIncomeCop: number;
    employmentType: LeaseApplicationItem['employmentType'];
    employerName: string;
    coSignerFullName: string;
    coSignerIncomeCop: number;
  }) => void;
  updateApplicationStatus: (id: string, status: ApplicationStatusType, riskScore?: number) => void;
  deleteApplication: (id: string) => void;
  // CRUD Contratos y Pagos
  signContractByRole: (contractId: string, role: 'landlord' | 'tenant') => void;
  payMonthlyCanon: (paymentId: string, method: NonNullable<PaymentItem['paymentMethod']>) => void;
  // CRUD PQRS
  createPqrs: (input: {
    propertyTitle: string;
    claimType: PqrsClaimItem['claimType'];
    subject: string;
    description: string;
  }) => void;
  updatePqrsStatus: (
    id: string,
    status: PqrsClaimItem['status'],
    resolutionNotes?: string
  ) => void;
  deletePqrs: (id: string) => void;
}

const PropTechContext = createContext<PropTechContextValue | undefined>(undefined);

const STORAGE_KEY = 'proptech_colombia_sumapaz_v2';

export function PropTechProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser>(DEMO_ROLE_USERS.tenant);
  const [properties, setProperties] = useState<ManagedProperty[]>(INITIAL_MANAGED_PROPERTIES);
  const [applications, setApplications] = useState<LeaseApplicationItem[]>(INITIAL_APPLICATIONS);
  const [contracts, setContracts] = useState<ContractItem[]>(INITIAL_CONTRACTS);
  const [payments, setPayments] = useState<PaymentItem[]>(INITIAL_PAYMENTS);
  const [pqrsClaims, setPqrsClaims] = useState<PqrsClaimItem[]>(INITIAL_PQRS);
  const [hydrated, setHydrated] = useState(false);

  // Hidratar desde localStorage al iniciar en el cliente
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          theme?: ThemeMode;
          currentUser?: AuthenticatedUser;
          properties?: ManagedProperty[];
          applications?: LeaseApplicationItem[];
          contracts?: ContractItem[];
          payments?: PaymentItem[];
          pqrsClaims?: PqrsClaimItem[];
        };
        if (parsed.theme) {
          setTheme(parsed.theme);
          document.documentElement.classList.toggle('dark', parsed.theme === 'dark');
        }
        if (parsed.currentUser) setCurrentUser(parsed.currentUser);
        if (parsed.properties && parsed.properties.length > 0) setProperties(parsed.properties);
        if (parsed.applications) setApplications(parsed.applications);
        if (parsed.contracts) setContracts(parsed.contracts);
        if (parsed.payments) setPayments(parsed.payments);
        if (parsed.pqrsClaims) setPqrsClaims(parsed.pqrsClaims);
      }
    } catch {
      // Ignorar errores de parseo en localStorage
    }
    setHydrated(true);
  }, []);

  // Guardar cambios en localStorage automáticamente
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          theme,
          currentUser,
          properties,
          applications,
          contracts,
          payments,
          pqrsClaims,
        })
      );
    } catch {
      // Ignorar si excede cuota
    }
  }, [hydrated, theme, currentUser, properties, applications, contracts, payments, pqrsClaims]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', next === 'dark');
      }
      return next;
    });
  };

  const loginAsRole = (role: UserRoleType, customName?: string, customEmail?: string) => {
    const baseUser = DEMO_ROLE_USERS[role];
    setCurrentUser({
      ...baseUser,
      fullName: customName?.trim() ? customName.trim() : baseUser.fullName,
      email: customEmail?.trim() ? customEmail.trim() : baseUser.email,
    });
  };

  const loginWithCredentials = (email: string, password: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Por favor ingresa correo electrónico y contraseña.' };
    }

    let detectedRole: UserRoleType | null = null;

    if (
      cleanEmail.includes('admin') ||
      cleanEmail.includes('secretario') ||
      cleanEmail.includes('auditoria') ||
      cleanPass.toLowerCase().includes('admin')
    ) {
      detectedRole = 'agent';
    } else if (
      cleanEmail.includes('prop') ||
      cleanEmail.includes('arrendador') ||
      cleanEmail.includes('carlos') ||
      cleanPass.toLowerCase().includes('prop')
    ) {
      detectedRole = 'landlord';
    } else if (
      cleanEmail.includes('arrendatario') ||
      cleanEmail.includes('inquilino') ||
      cleanEmail.includes('valentina') ||
      cleanPass.toLowerCase().includes('inq') ||
      cleanPass.toLowerCase().includes('arren')
    ) {
      detectedRole = 'tenant';
    } else {
      // Búsqueda en credenciales registradas
      for (const [r, u] of Object.entries(DEMO_ROLE_USERS)) {
        if (
          u.email.toLowerCase() === cleanEmail ||
          u.alternativeEmails.some((alt) => alt.toLowerCase() === cleanEmail)
        ) {
          detectedRole = r as UserRoleType;
          break;
        }
      }
    }

    // Por defecto, si no coincide ninguna regla, asignamos tenant
    const roleToAssign: UserRoleType = detectedRole ?? 'tenant';
    const baseUser = DEMO_ROLE_USERS[roleToAssign];

    setCurrentUser({
      ...baseUser,
      email: cleanEmail,
    });

    return { success: true, role: roleToAssign };
  };

  const logout = () => {
    setCurrentUser(DEMO_ROLE_USERS.tenant);
  };

  // --- CRUD INMUEBLES ---
  const createProperty: PropTechContextValue['createProperty'] = (newProp) => {
    const id = `prop-${Date.now()}`;
    const slug = `${newProp.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id.slice(-4)}`;
    const isLey820Compliant = newProp.monthlyRentCop <= newProp.commercialValuationCop * 0.01;

    const created: ManagedProperty = {
      ...newProp,
      id,
      slug,
      ownerId: currentUser.id,
      ownerName: currentUser.fullName,
      isLey820Compliant,
    };

    setProperties((prev) => [created, ...prev]);
    return created;
  };

  const updateProperty: PropTechContextValue['updateProperty'] = (id, updates) => {
    setProperties((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const merged = { ...item, ...updates };
        merged.isLey820Compliant =
          merged.monthlyRentCop <= merged.commercialValuationCop * 0.01;
        return merged;
      })
    );
  };

  const deleteProperty = (id: string) => {
    setProperties((prev) => prev.filter((item) => item.id !== id));
  };

  // --- CRUD POSTULACIONES ---
  const createApplication: PropTechContextValue['createApplication'] = (input) => {
    const targetProperty = properties.find((p) => p.id === input.propertyId);
    if (!targetProperty) return;

    const newApp: LeaseApplicationItem = {
      id: `app-${Date.now().toString().slice(-5)}`,
      propertyId: targetProperty.id,
      propertyTitle: targetProperty.title,
      propertyCity: targetProperty.city,
      monthlyRentCop: targetProperty.monthlyRentCop,
      applicantId: currentUser.id,
      applicantName: currentUser.fullName,
      applicantDocument: `${currentUser.documentType} ${currentUser.documentNumber}`,
      declaredMonthlyIncomeCop: input.declaredMonthlyIncomeCop,
      employmentType: input.employmentType,
      employerName: input.employerName,
      coSignerFullName: input.coSignerFullName,
      coSignerIncomeCop: input.coSignerIncomeCop,
      riskScore: Math.min(
        950,
        Math.round(650 + (input.declaredMonthlyIncomeCop / targetProperty.monthlyRentCop) * 55)
      ),
      status: 'submitted',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setApplications((prev) => [newApp, ...prev]);
  };

  const updateApplicationStatus: PropTechContextValue['updateApplicationStatus'] = (
    id,
    status,
    riskScore
  ) => {
    setApplications((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          status,
          riskScore: riskScore ?? item.riskScore,
        };
      })
    );

    // Si se aprueba, generar contrato automáticamente
    if (status === 'approved') {
      const app = applications.find((a) => a.id === id);
      if (app) {
        const newContract: ContractItem = {
          id: `cnt-${Date.now().toString().slice(-5)}`,
          contractNumber: `CNT-FUSA-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          propertyId: app.propertyId,
          propertyTitle: app.propertyTitle,
          landlordId: currentUser.id,
          landlordName: currentUser.fullName,
          tenantId: app.applicantId,
          tenantName: app.applicantName,
          startDate: '2026-12-01',
          endDate: '2027-11-30',
          durationMonths: 12,
          agreedMonthlyRentCop: app.monthlyRentCop,
          agreedAdminFeeCop: Math.round(app.monthlyRentCop * 0.1),
          annualIpcAdjustmentCapPct: 4.45,
          securityDepositCop: 0,
          status: 'pending_signatures',
          documentContentSha256:
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        };
        setContracts((prev) => [newContract, ...prev]);
      }
    }
  };

  const deleteApplication = (id: string) => {
    setApplications((prev) => prev.filter((item) => item.id !== id));
  };

  // --- CRUD CONTRATOS Y PAGOS ---
  const signContractByRole: PropTechContextValue['signContractByRole'] = (contractId, role) => {
    const nowIso = new Date().toISOString();
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        const updated = { ...c };
        if (role === 'landlord') updated.landlordSignedAt = nowIso;
        if (role === 'tenant') updated.tenantSignedAt = nowIso;

        if (updated.landlordSignedAt && updated.tenantSignedAt) {
          updated.status = 'active';
          updated.finalSealedSha256 = `sealed-${Math.random().toString(36).substring(2, 15)}-sha256`;
          // Poner inmueble como arrendado
          updateProperty(c.propertyId, { status: 'rented' });
        } else {
          updated.status = 'partially_signed';
        }
        return updated;
      })
    );
  };

  const payMonthlyCanon: PropTechContextValue['payMonthlyCanon'] = (paymentId, method) => {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id !== paymentId) return p;
        return {
          ...p,
          status: 'paid',
          paymentMethod: method,
          paidAt: new Date().toISOString(),
          gatewayReference: `WOMPI-${method.toUpperCase()}-${Math.floor(1000000 + Math.random() * 9000000)}`,
        };
      })
    );
  };

  // --- CRUD PQRS ---
  const createPqrs: PropTechContextValue['createPqrs'] = (input) => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 21); // 15 días hábiles aprox 21 calendario

    const newClaim: PqrsClaimItem = {
      id: `pqrs-${Date.now().toString().slice(-5)}`,
      radicadoNumber: `SIC-FUSA-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      propertyTitle: input.propertyTitle,
      claimantId: currentUser.id,
      claimantName: currentUser.fullName,
      claimType: input.claimType,
      subject: input.subject,
      description: input.description,
      status: 'open',
      legalDeadlineDate: deadline.toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
    };

    setPqrsClaims((prev) => [newClaim, ...prev]);
  };

  const updatePqrsStatus: PropTechContextValue['updatePqrsStatus'] = (
    id,
    status,
    resolutionNotes
  ) => {
    setPqrsClaims((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              resolutionNotes: resolutionNotes ?? item.resolutionNotes,
            }
          : item
      )
    );
  };

  const deletePqrs = (id: string) => {
    setPqrsClaims((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <PropTechContext.Provider
      value={{
        theme,
        toggleTheme,
        currentUser,
        loginAsRole,
        loginWithCredentials,
        logout,
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
      }}
    >
      {children}
    </PropTechContext.Provider>
  );
}

export function usePropTech() {
  const ctx = useContext(PropTechContext);
  if (!ctx) {
    throw new Error('usePropTech debe usarse dentro de un PropTechProvider');
  }
  return ctx;
}
