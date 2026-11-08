# ESPECIFICACIÓN DE REQUISITOS DE SOFTWARE (SRS - ESTÁNDAR IEEE 830)
## Plataforma PropTech Transaccional y Legal-Tech Colombia

- **Versión:** 1.0.0-PROD
- **Jurisdicción:** República de Colombia
- **Marco Regulatorio Obligatorio:**
  - **Ley 820 de 2003:** Régimen de Arrendamiento de Vivienda Urbana (Art. 14 Mérito Ejecutivo, Art. 16 Prohibición de Depósitos, Art. 18 Tope del 1% del Valor Comercial, Art. 19 Reparaciones, Art. 20 Reajuste Anual IPC DANE, Art. 22–24 Preaviso de 3 meses).
  - **Ley 1581 de 2012 y Decreto 1377 de 2013:** Régimen General de Protección de Datos Personales (Habeas Data, Derechos ARCO, Inmutabilidad de Autorización Expresa).
  - **Ley 527 de 1999 y Decreto 2364 de 2012:** Mensajes de Datos, Comercio Electrónico y Firma Electrónica Criptográfica (SHA-256 / HMAC-SHA256).
  - **Ley 1564 de 2012 (Código General del Proceso - Art. 243 a 247):** Valor probatorio de documentos y mensajes de datos en procesos judiciales civiles.

---

## 1. Matriz de Trazabilidad de Requerimientos Funcionales (RF)

| ID | Nombre del Requerimiento | Norma Colombiana | Artefacto de Base de Datos | Artefacto Backend / Frontend |
| :--- | :--- | :--- | :--- | :--- |
| **RF-01** | Registro y Consentimiento Habeas Data Inmutable | Ley 1581/2012, Dec. 1377/2013 | `public.profiles`, `public.legal_consents`, `trg_legal_consents_immutable` | `habeasDataConsentSchema`, `registerHabeasDataConsentAction`, `/legal` |
| **RF-02** | Publicación de Inmuebles con Georreferenciación y Tope Art. 18 | Ley 820/2003 Art. 18 | `public.properties`, `chk_ley820_art18_max_canon`, `idx_properties_location_gist` | `propertyPublicationSchema`, `publishPropertyAction`, `/publicar` |
| **RF-03** | Buscador Inmobiliario Multidimensional en URL (`nuqs`) | Ley 1480/2011 (Información veraz) | `idx_properties_search_filters` | `PropertySearchSplitView.tsx`, `propertySearchParsers`, `/` |
| **RF-04** | Postulación y Estudio de Solvencia con Soportes Protegidos | Ley 1266/2008, Ley 1581/2012 | `public.lease_applications` + Políticas RLS | `proptech.actions.ts` |
| **RF-05** | Emisión de Contratos Ley 820 con Prohibición de Depósito | Ley 820/2003 Art. 16, 18, 20, 22 | `public.contracts`, `chk_ley820_art16_no_deposit_vivienda` | `leaseContractCreationSchema`, `generateContractDraftAction`, `/contratos` |
| **RF-06** | Firma Electrónica SHA-256 y Certificado Probatorio Judicial | Ley 527/1999, Dec. 2364/2012, CGP Art. 244 | `public.contracts` (`audit_certificate_json`) | `contract-crypto.service.ts`, `executeElectronicSignatureAction`, `/contratos` |
| **RF-07** | Recaudo Recurrente de Cánones y Reajuste Anual IPC DANE | Ley 820/2003 Art. 10, 11, 20 | `public.payments` | `/api/webhooks/proptech`, `/dashboard` |
| **RF-08** | Módulo de Reclamos, Reparaciones y PQRS (Trazabilidad SIC) | Ley 820/2003 Art. 19, Ley 1755/2015 | `public.pqrs_claims` | `createPqrsClaimAction`, `/legal` |
