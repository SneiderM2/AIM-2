-- =============================================================================
-- PLATAFORMA PROPTECH COLOMBIA - ESQUEMA DE BASE DE DATOS DE PRODUCCIÓN (DDL)
-- Motor: PostgreSQL 15+ (Supabase)
-- Marco Legal: Ley 820 de 2003, Ley 1581 de 2012, Ley 527 de 1999
-- =============================================================================

-- 1. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS ENUMERADOS (DOMINIO INMOBILIARIO Y REGULATORIO COLOMBIANO)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('landlord', 'tenant', 'agent', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE identity_doc_type AS ENUM ('CC', 'CE', 'NIT', 'TI', 'PP', 'PEP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE property_status AS ENUM ('available', 'under_review', 'rented', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE property_type AS ENUM ('apartamento', 'casa', 'apartaestudio', 'local_comercial', 'oficina', 'bodega');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE lease_destination AS ENUM ('vivienda_urbana', 'comercial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('draft', 'submitted', 'in_study', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE contract_status AS ENUM ('draft', 'pending_signatures', 'partially_signed', 'active', 'terminated', 'expired', 'disputed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_periodicity AS ENUM ('mensual', 'trimestral', 'semestral', 'anual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('pse', 'tarjeta_credito', 'nequi', 'daviplata', 'transferencia_bancaria', 'boton_bancolombia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'paid', 'overdue', 'annulled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE pqrs_type AS ENUM ('reparacion_necesaria', 'reparacion_locativa', 'facturacion_canon', 'servicios_publicos', 'terminacion_contrato', 'habeas_data_arco');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE pqrs_status AS ENUM ('open', 'in_progress', 'awaiting_evidence', 'resolved', 'escalated_sic', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. FUNCIONES UTILITARIAS DE AUDITORÍA E INMUTABILIDAD
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función que garantiza la inmutabilidad estricta de registros legales (Ley 1581/2012 y Ley 527/1999)
CREATE OR REPLACE FUNCTION public.prevent_modification_of_immutable_records()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'VIOLACIÓN DE INTEGRIDAD LEGAL (Ley 1581/2012 & Ley 527/1999): Los registros de auditoría y consentimiento en la tabla % son estrictamente inmutables y no admiten operaciones UPDATE ni DELETE.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. TABLA: profiles (Usuarios e Identidad Legal en Colombia)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    document_type identity_doc_type NOT NULL DEFAULT 'CC',
    document_number VARCHAR(30) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    role user_role NOT NULL DEFAULT 'tenant',
    is_identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
    identity_verified_at TIMESTAMPTZ,
    professional_card_number VARCHAR(50), -- Matrícula inmobiliaria / lonja para agentes
    bank_Shared_code VARCHAR(20),         -- Código ACH banco para dispersión de cánones
    bank_account_type VARCHAR(20),        -- Ahorros / Corriente
    bank_account_number_encrypted BYTEA,  -- Cifrado simétrico con pgcrypto
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_profiles_document UNIQUE (document_type, document_number),
    CONSTRAINT chk_profiles_phone_colombia CHECK (phone_number ~ '^\+57[0-9]{10}$')
);

CREATE INDEX idx_profiles_role ON public.profiles(role) WHERE is_active = TRUE;
CREATE INDEX idx_profiles_document ON public.profiles(document_type, document_number);

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 5. TABLA: legal_consents (Trazabilidad Inmutable Habeas Data - Ley 1581/2012)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.legal_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    policy_version VARCHAR(32) NOT NULL,
    policy_document_hash CHAR(64) NOT NULL, -- SHA-256 del PDF/texto de la Política de Tratamiento de Datos
    consent_text_accepted TEXT NOT NULL,
    accepted_privacy_policy BOOLEAN NOT NULL DEFAULT TRUE,
    accepted_terms_of_service BOOLEAN NOT NULL DEFAULT TRUE,
    accepted_credit_bureau_query BOOLEAN NOT NULL DEFAULT FALSE, -- Autorización consulta centrales de riesgo (Ley 1266/2008)
    accepted_electronic_signature BOOLEAN NOT NULL DEFAULT TRUE, -- Acuerdo de firma electrónica (Decreto 2364/2012)
    ip_address INET NOT NULL,
    user_agent TEXT NOT NULL,
    geolocation_hint VARCHAR(100),
    revoked_at TIMESTAMPTZ, -- En caso de revocatoria ARCO se inserta nuevo evento, nunca se borra el original
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_mandatory_consents CHECK (accepted_privacy_policy = TRUE AND accepted_terms_of_service = TRUE),
    CONSTRAINT chk_policy_hash_format CHECK (policy_document_hash ~ '^[a-fA-F0-9]{64}$')
);

CREATE INDEX idx_legal_consents_user_version ON public.legal_consents(user_id, policy_version, created_at DESC);

-- Bloqueo absoluto de UPDATE y DELETE para cumplimiento probatorio ante la SIC
CREATE TRIGGER trg_legal_consents_immutable
    BEFORE UPDATE OR DELETE ON public.legal_consents
    FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_of_immutable_records();

-- =============================================================================
-- 6. TABLA: properties (Inmuebles con Georreferenciación PostGIS y Reglas Ley 820)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    matricula_inmobiliaria VARCHAR(50) NOT NULL UNIQUE, -- Folio de matrícula SNR
    catastral_chip VARCHAR(50),
    title VARCHAR(180) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    property_type property_type NOT NULL,
    destination lease_destination NOT NULL DEFAULT 'vivienda_urbana',
    status property_status NOT NULL DEFAULT 'under_review',
    department VARCHAR(80) NOT NULL,
    city VARCHAR(80) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    address_line TEXT NOT NULL,
    estrato SMALLINT NOT NULL,
    commercial_valuation_cop NUMERIC(15, 2) NOT NULL, -- Avalúo comercial estimado (Base tope Art. 18 Ley 820)
    cadastral_valuation_cop NUMERIC(15, 2),           -- Avalúo catastral (Mínimo el 50% del comercial según Art. 18 Ley 820)
    monthly_rent_cop NUMERIC(12, 2) NOT NULL,         -- Canon mensual en Pesos Colombianos (COP)
    administration_fee_cop NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_administration_included BOOLEAN NOT NULL DEFAULT FALSE,
    private_area_m2 NUMERIC(8, 2) NOT NULL,
    built_area_m2 NUMERIC(8, 2) NOT NULL,
    bedrooms SMALLINT NOT NULL DEFAULT 1,
    bathrooms SMALLINT NOT NULL DEFAULT 1,
    parking_spots SMALLINT NOT NULL DEFAULT 0,
    floor_number SMALLINT,
    construction_year SMALLINT,
    amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    location GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)) STORED,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    -- Restricciones de negocio y cumplimiento legal colombiano
    CONSTRAINT chk_properties_estrato CHECK (estrato BETWEEN 1 AND 6),
    CONSTRAINT chk_properties_positive_values CHECK (
        monthly_rent_cop > 0
        AND administration_fee_cop >= 0
        AND commercial_valuation_cop > 0
        AND private_area_m2 > 0
        AND built_area_m2 >= private_area_m2
    ),
    -- Ley 820 de 2003 Art. 18: El canon mensual de vivienda urbana no puede exceder el 1% del valor comercial del inmueble
    CONSTRAINT chk_ley820_art18_max_canon CHECK (
        destination <> 'vivienda_urbana' OR (monthly_rent_cop <= (commercial_valuation_cop * 0.01))
    ),
    -- Ley 820 de 2003 Art. 18: El valor comercial estimado no puede exceder el equivalente a dos (2) veces el avalúo catastral vigente
    CONSTRAINT chk_ley820_art18_catastral_limit CHECK (
        cadastral_valuation_cop IS NULL OR destination <> 'vivienda_urbana' OR (commercial_valuation_cop <= (cadastral_valuation_cop * 2.0))
    ),
    -- Coordenadas restringidas al territorio continental e insular de la República de Colombia
    CONSTRAINT chk_colombia_geographic_bounds CHECK (
        latitude BETWEEN -4.231687 AND 13.394722
        AND longitude BETWEEN -81.735620 AND -66.847222
    ),
    CONSTRAINT chk_rooms_non_negative CHECK (bedrooms >= 0 AND bathrooms >= 1 AND parking_spots >= 0)
);

-- Índices compuestos para el buscador avanzado y georreferenciación
CREATE INDEX idx_properties_location_gist ON public.properties USING GIST (location);
CREATE INDEX idx_properties_search_filters ON public.properties(status, city, property_type, estrato, monthly_rent_cop)
    WHERE status = 'available';
CREATE INDEX idx_properties_owner ON public.properties(owner_id);
CREATE INDEX idx_properties_agent ON public.properties(agent_id) WHERE agent_id IS NOT NULL;

CREATE TRIGGER trg_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 7. TABLA: property_media (Galería Multimedia, Planos y Recorridos)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.property_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    media_type VARCHAR(30) NOT NULL DEFAULT 'image', -- 'image', 'floor_plan', 'video', 'tour_360'
    display_order SMALLINT NOT NULL DEFAULT 0,
    is_cover BOOLEAN NOT NULL DEFAULT FALSE,
    file_size_bytes INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width_px INTEGER,
    height_px INTEGER,
    alt_text VARCHAR(255),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_media_size_positive CHECK (file_size_bytes > 0 AND file_size_bytes <= 52428800), -- Máx 50MB
    CONSTRAINT chk_media_order_non_negative CHECK (display_order >= 0)
);

CREATE INDEX idx_property_media_property_order ON public.property_media(property_id, is_cover DESC, display_order ASC);

-- =============================================================================
-- 8. TABLA: lease_applications (Postulaciones y Estudio de Solvencia)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lease_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status application_status NOT NULL DEFAULT 'submitted',
    declared_monthly_income_cop NUMERIC(14, 2) NOT NULL,
    other_verified_income_cop NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    monthly_expenses_cop NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    employment_type VARCHAR(50) NOT NULL, -- 'empleado', 'independiente', 'pensionado', 'rentista_capital'
    employer_or_activity_name VARCHAR(180) NOT NULL,
    job_seniority_months SMALLINT NOT NULL DEFAULT 0,
    co_signer_full_name VARCHAR(200),      -- Deudor solidario (Figura legal permitida en Colombia, a diferencia del depósito)
    co_signer_document_type identity_doc_type,
    co_signer_document_number VARCHAR(30),
    co_signer_monthly_income_cop NUMERIC(14, 2),
    -- Rutas en bucket privado de Supabase Storage (solo accesibles vía Signed URLs temporales)
    identity_doc_storage_path TEXT NOT NULL,
    income_proof_storage_path TEXT NOT NULL,
    bank_statements_storage_path TEXT NOT NULL,
    tax_return_storage_path TEXT,
    co_signer_docs_storage_path TEXT,
    risk_score SMALLINT, -- Puntaje de estudio de solvencia (0 - 1000)
    reviewer_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    consent_id UUID NOT NULL REFERENCES public.legal_consents(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_income_positive CHECK (declared_monthly_income_cop > 0 AND other_verified_income_cop >= 0 AND monthly_expenses_cop >= 0),
    CONSTRAINT chk_risk_score_range CHECK (risk_score IS NULL OR (risk_score BETWEEN 0 AND 1000))
);

CREATE INDEX idx_lease_applications_property ON public.lease_applications(property_id, status);
CREATE INDEX idx_lease_applications_applicant ON public.lease_applications(applicant_id, created_at DESC);

CREATE TRIGGER trg_lease_applications_updated_at
    BEFORE UPDATE ON public.lease_applications
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 9. TABLA: contracts (Contratos Ley 820 de 2003 y Firma Electrónica Ley 527/1999)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_number VARCHAR(40) NOT NULL UNIQUE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    application_id UUID UNIQUE REFERENCES public.lease_applications(id) ON DELETE RESTRICT,
    landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    destination lease_destination NOT NULL DEFAULT 'vivienda_urbana',
    status contract_status NOT NULL DEFAULT 'draft',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_months SMALLINT NOT NULL,
    agreed_monthly_rent_cop NUMERIC(12, 2) NOT NULL,
    agreed_admin_fee_cop NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_due_day SMALLINT NOT NULL DEFAULT 5, -- Día máximo de pago de cada período mensual
    -- Ley 820 Art. 20: Reajuste anual del canon de vivienda urbana no puede superar el 100% del IPC del año calendario inmediatamente anterior
    annual_ipc_adjustment_cap_pct NUMERIC(5, 2) NOT NULL,
    reference_dane_ipc_year SMALLINT NOT NULL,
    penalty_clause_cop NUMERIC(14, 2) NOT NULL, -- Cláusula penal por incumplimiento (usualmente 2 a 3 cánones)
    -- Ley 820 Art. 16: Prohibición de depósitos y cauciones reales en contratos de arrendamiento de vivienda urbana
    security_deposit_cop NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notice_period_months SMALLINT NOT NULL DEFAULT 3, -- Art. 22 y 24 Ley 820: Preaviso mínimo de 3 meses
    draft_pdf_storage_path TEXT,
    signed_pdf_storage_path TEXT,
    -- Integridad y Sellado Criptográfico (Ley 527 de 1999 & Decreto 2364 de 2012)
    document_content_sha256 CHAR(64) NOT NULL, -- Hash del contenido original del contrato antes de firmas
    landlord_signature_hash CHAR(64),
    landlord_signed_at TIMESTAMPTZ,
    landlord_signer_ip INET,
    landlord_signer_user_agent TEXT,
    tenant_signature_hash CHAR(64),
    tenant_signed_at TIMESTAMPTZ,
    tenant_signer_ip INET,
    tenant_signer_user_agent TEXT,
    final_sealed_document_sha256 CHAR(64), -- Hash definitivo del PDF sellado con estampado cronológico
    audit_certificate_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    terminated_at TIMESTAMPTZ,
    termination_legal_cause VARCHAR(120), -- Art. 22 (Arrendador) o Art. 24 (Arrendatario) Ley 820 de 2003
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    -- Restricciones Legales Inquebrantables (Ley 820 de 2003)
    CONSTRAINT chk_contract_dates CHECK (end_date > start_date AND duration_months >= 1),
    CONSTRAINT chk_contract_parties_distinct CHECK (landlord_id <> tenant_id),
    CONSTRAINT chk_contract_due_day CHECK (payment_due_day BETWEEN 1 AND 28),
    -- PROHIBICIÓN ESTRICTA ART. 16 LEY 820 DE 2003: Prohibición de depósitos en efectivo para vivienda urbana
    CONSTRAINT chk_ley820_art16_no_deposit_vivienda CHECK (
        destination <> 'vivienda_urbana' OR security_deposit_cop = 0.00
    ),
    -- Preaviso mínimo de 3 meses en vivienda urbana (Art. 22 y 24 Ley 820)
    CONSTRAINT chk_ley820_preaviso_minimo CHECK (
        destination <> 'vivienda_urbana' OR notice_period_months >= 3
    ),
    CONSTRAINT chk_contract_hashes_hex CHECK (
        document_content_sha256 ~ '^[a-fA-F0-9]{64}$'
        AND (landlord_signature_hash IS NULL OR landlord_signature_hash ~ '^[a-fA-F0-9]{64}$')
        AND (tenant_signature_hash IS NULL OR tenant_signature_hash ~ '^[a-fA-F0-9]{64}$')
        AND (final_sealed_document_sha256 IS NULL OR final_sealed_document_sha256 ~ '^[a-fA-F0-9]{64}$')
    )
);

CREATE INDEX idx_contracts_landlord ON public.contracts(landlord_id, status);
CREATE INDEX idx_contracts_tenant ON public.contracts(tenant_id, status);
CREATE INDEX idx_contracts_property ON public.contracts(property_id, status);

CREATE TRIGGER trg_contracts_updated_at
    BEFORE UPDATE ON public.contracts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 10. TABLA: payments (Recaudo de Cánones, Administración y Reajustes IPC)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    periodicity payment_periodicity NOT NULL DEFAULT 'mensual',
    rent_amount_cop NUMERIC(12, 2) NOT NULL,
    admin_fee_amount_cop NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    late_interest_amount_cop NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount_cop NUMERIC(12, 2) GENERATED ALWAYS AS (rent_amount_cop + admin_fee_amount_cop + late_interest_amount_cop) STORED,
    ipc_applied_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    payment_method payment_method,
    payment_gateway VARCHAR(50), -- 'wompi', 'epayco', 'mercadopago', 'placetopay'
    gateway_transaction_id VARCHAR(120) UNIQUE,
    gateway_reference VARCHAR(120) NOT NULL UNIQUE,
    status payment_status NOT NULL DEFAULT 'pending',
    receipt_storage_path TEXT,
    electronic_invoice_cufe VARCHAR(128), -- Código Único de Factura Electrónica DIAN (si aplica)
    paid_at TIMESTAMPTZ,
    webhook_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_payments_amounts CHECK (rent_amount_cop > 0 AND admin_fee_amount_cop >= 0 AND late_interest_amount_cop >= 0),
    CONSTRAINT chk_payments_period CHECK (billing_period_end >= billing_period_start)
);

CREATE INDEX idx_payments_contract_status ON public.payments(contract_id, status, due_date DESC);
CREATE INDEX idx_payments_tenant_due ON public.payments(tenant_id, status, due_date ASC);
CREATE INDEX idx_payments_landlord ON public.payments(landlord_id, status, paid_at DESC);

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 11. TABLA: pqrs_claims (Módulo de Reclamos, Reparaciones Art. 19 Ley 820 y SIC)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.pqrs_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    radicado_number VARCHAR(40) NOT NULL UNIQUE, -- Número único de radicado trazable ante la SIC
    contract_id UUID REFERENCES public.contracts(id) ON DELETE RESTRICT,
    property_id UUID REFERENCES public.properties(id) ON DELETE RESTRICT,
    claimant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    respondent_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    claim_type pqrs_type NOT NULL,
    status pqrs_status NOT NULL DEFAULT 'open',
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    evidence_storage_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
    legal_deadline_date DATE NOT NULL, -- Máximo 15 días hábiles según Ley 1755 de 2015 / Ley 1480 de 2011
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_pqrs_claimant ON public.pqrs_claims(claimant_id, status);
CREATE INDEX idx_pqrs_contract ON public.pqrs_claims(contract_id, status);

CREATE TRIGGER trg_pqrs_claims_updated_at
    BEFORE UPDATE ON public.pqrs_claims
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 12. SEGURIDAD A NIVEL DE FILA (ROW LEVEL SECURITY - RLS EXHAUSTIVO)
-- =============================================================================

-- Funciones helper en esquema public para evaluación rápida de roles sin recursión en RLS
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_agent()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'agent') AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Habilitar RLS en el 100% de las tablas del dominio
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pqrs_claims ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 12.1 Políticas para `profiles`
-- -----------------------------------------------------------------------------
CREATE POLICY "profiles_select_own_or_privileged" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id
        OR public.is_admin_or_agent()
        OR EXISTS (
            SELECT 1 FROM public.contracts c
            WHERE (c.landlord_id = auth.uid() AND c.tenant_id = profiles.id)
               OR (c.tenant_id = auth.uid() AND c.landlord_id = profiles.id)
        )
    );

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.current_user_role() = 'admin')
    WITH CHECK (auth.uid() = id OR public.current_user_role() = 'admin');

-- -----------------------------------------------------------------------------
-- 12.2 Políticas para `legal_consents` (Inmutables, solo lectura e inserción propia)
-- -----------------------------------------------------------------------------
CREATE POLICY "legal_consents_select_own_or_admin" ON public.legal_consents
    FOR SELECT USING (auth.uid() = user_id OR public.current_user_role() = 'admin');

CREATE POLICY "legal_consents_insert_own" ON public.legal_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 12.3 Políticas para `properties`
-- -----------------------------------------------------------------------------
CREATE POLICY "properties_select_public_available_or_stakeholder" ON public.properties
    FOR SELECT USING (
        status = 'available'
        OR owner_id = auth.uid()
        OR agent_id = auth.uid()
        OR public.current_user_role() = 'admin'
    );

CREATE POLICY "properties_insert_landlord_or_agent" ON public.properties
    FOR INSERT WITH CHECK (
        (owner_id = auth.uid() AND public.current_user_role() IN ('landlord', 'admin'))
        OR (agent_id = auth.uid() AND public.current_user_role() = 'agent')
    );

CREATE POLICY "properties_update_owner_agent_admin" ON public.properties
    FOR UPDATE USING (
        owner_id = auth.uid()
        OR agent_id = auth.uid()
        OR public.current_user_role() = 'admin'
    )
    WITH CHECK (
        owner_id = auth.uid()
        OR agent_id = auth.uid()
        OR public.current_user_role() = 'admin'
    );

CREATE POLICY "properties_delete_owner_or_admin" ON public.properties
    FOR DELETE USING (owner_id = auth.uid() OR public.current_user_role() = 'admin');

-- -----------------------------------------------------------------------------
-- 12.4 Políticas para `property_media`
-- -----------------------------------------------------------------------------
CREATE POLICY "property_media_select_all" ON public.property_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = property_media.property_id
              AND (p.status = 'available' OR p.owner_id = auth.uid() OR p.agent_id = auth.uid() OR public.current_user_role() = 'admin')
        )
    );

CREATE POLICY "property_media_manage_owner_or_agent" ON public.property_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = property_media.property_id
              AND (p.owner_id = auth.uid() OR p.agent_id = auth.uid() OR public.current_user_role() = 'admin')
        )
    );

-- -----------------------------------------------------------------------------
-- 12.5 Políticas para `lease_applications`
-- -----------------------------------------------------------------------------
CREATE POLICY "applications_select_applicant_owner_agent_admin" ON public.lease_applications
    FOR SELECT USING (
        applicant_id = auth.uid()
        OR public.current_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = lease_applications.property_id
              AND (p.owner_id = auth.uid() OR p.agent_id = auth.uid())
        )
    );

CREATE POLICY "applications_insert_tenant" ON public.lease_applications
    FOR INSERT WITH CHECK (
        applicant_id = auth.uid()
        AND public.current_user_role() IN ('tenant', 'admin')
    );

CREATE POLICY "applications_update_stakeholders" ON public.lease_applications
    FOR UPDATE USING (
        (applicant_id = auth.uid() AND status IN ('draft', 'submitted'))
        OR public.current_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = lease_applications.property_id
              AND (p.owner_id = auth.uid() OR p.agent_id = auth.uid())
        )
    );

-- -----------------------------------------------------------------------------
-- 12.6 Políticas para `contracts`
-- -----------------------------------------------------------------------------
CREATE POLICY "contracts_select_parties_or_privileged" ON public.contracts
    FOR SELECT USING (
        landlord_id = auth.uid()
        OR tenant_id = auth.uid()
        OR agent_id = auth.uid()
        OR public.current_user_role() = 'admin'
    );

CREATE POLICY "contracts_insert_landlord_agent_admin" ON public.contracts
    FOR INSERT WITH CHECK (
        landlord_id = auth.uid()
        OR agent_id = auth.uid()
        OR public.current_user_role() = 'admin'
    );

CREATE POLICY "contracts_update_parties_or_admin" ON public.contracts
    FOR UPDATE USING (
        landlord_id = auth.uid()
        OR tenant_id = auth.uid()
        OR agent_id = auth.uid()
        OR public.current_user_role() = 'admin'
    );

-- -----------------------------------------------------------------------------
-- 12.7 Políticas para `payments`
-- -----------------------------------------------------------------------------
CREATE POLICY "payments_select_contract_parties_or_admin" ON public.payments
    FOR SELECT USING (
        tenant_id = auth.uid()
        OR landlord_id = auth.uid()
        OR public. is_admin_or_agent()
    );

CREATE POLICY "payments_insert_system_or_landlord" ON public.payments
    FOR INSERT WITH CHECK (
        landlord_id = auth.uid()
        OR public.is_admin_or_agent()
    );

CREATE POLICY "payments_update_admin_or_landlord" ON public.payments
    FOR UPDATE USING (
        landlord_id = auth.uid()
        OR public.current_user_role() = 'admin'
    );

-- -----------------------------------------------------------------------------
-- 12.8 Políticas para `pqrs_claims`
-- -----------------------------------------------------------------------------
CREATE POLICY "pqrs_select_involved_or_admin" ON public.pqrs_claims
    FOR SELECT USING (
        claimant_id = auth.uid()
        OR respondent_id = auth.uid()
        OR public.is_admin_or_agent()
    );

CREATE POLICY "pqrs_insert_claimant" ON public.pqrs_claims
    FOR INSERT WITH CHECK (claimant_id = auth.uid());

CREATE POLICY "pqrs_update_involved_or_admin" ON public.pqrs_claims
    FOR UPDATE USING (
        claimant_id = auth.uid()
        OR respondent_id = auth.uid()
        OR public.is_admin_or_agent()
    );
