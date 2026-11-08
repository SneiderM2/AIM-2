# PropTech Colombia — Plataforma Transaccional & Legal-Tech

Plataforma web inmobiliaria de nivel empresarial adaptada al mercado y ordenamiento jurídico de Colombia (**Ley 820 de 2003**, **Ley 1581 de 2012 / Habeas Data**, **Ley 527 de 1999 / Firma Electrónica SHA-256** y **Estándar IEEE 830**).

## Características Principales
- **3 Roles con Panel CRUD Completo (`/login` y `/panel`):**
  1. **Propietario / Arrendador (`landlord`):** CRUD de inmuebles con validación del tope legal del 1% comercial (Art. 18 Ley 820), aprobación de postulaciones y firma electrónica.
  2. **Arrendatario / Inquilino (`tenant`):** Búsqueda georreferenciada, postulación con deudor solidario, firma electrónica con OTP, pago de cánones (PSE/Nequi) y radicación de PQRS (Art. 19 Ley 820).
  3. **Agente Inmobiliario / Admin (`agent`):** Auditoría global de propiedades, calificación de solvencia crediticia (`0–1000`) y gestión de reclamos con control de 15 días hábiles ante la SIC.
- **Buscador Inmobiliario Split-View (`/`)**: Sincronización de filtros multidimensionales en tiempo real en la URL con `nuqs` y pines PostGIS interactivos.
- **Cambio de Tema (Blanco / Negro):** Conmutador instantáneo en la barra superior con persistencia en `localStorage`.
- **Listo para GitHub Pages y Supabase:** Incluye workflow `.github/workflows/deploy-gh-pages.yml` y migración SQL completa en `supabase/migrations/0001_initial_proptech_schema.sql`.

## Inicio Rápido

```bash
npm install
npm run dev
```

Abre `http://localhost:3000` en tu navegador. Para instrucciones detalladas de despliegue en GitHub Pages y conexión con Supabase, consulta `../GUIA-COMPLETA-PROPTECH-COLOMBIA.md`.
