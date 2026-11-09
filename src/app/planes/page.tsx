'use client';

/**
 * @file page.tsx (/planes)
 * @description Módulo SaaS de Suscripción Mensual, Prueba Gratuita de 14 días,
 *              Flujograma Técnico de 8 pasos e Identidad Corporativa del
 *              Sistema de Gestión Inmobiliaria (SGI) en Fusagasugá y Sumapaz.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Cloud,
  CreditCard,
  FileSignature,
  KeyRound,
  Layers,
  Palette,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { usePropTech } from '../../context/PropTechContext';
import { SgiLogo } from '../../components/layout/SgiLogo';

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const SAAS_PLANS = [
  {
    id: 'basico' as const,
    name: 'Plan Básico',
    capacity: '1 a 5 Inmuebles (Hasta 10)',
    priceCop: 35000,
    target: 'Ideal para propietarios y administradores independientes en Fusagasugá.',
    badge: 'Iniciación Digital',
    features: [
      'Registro centralizado de propiedades e inquilinos',
      'Control de cánones mensuales y estado de ocupación',
      'Generación de contratos bajo Ley 820 de 2003',
      'Notificaciones de cobro por correo electrónico',
      'Acceso web 24/7 desde celular o computador',
    ],
  },
  {
    id: 'pyme' as const,
    name: 'Plan PYME / Estándar',
    capacity: '6 a 20 Inmuebles (Hasta 50)',
    priceCop: 75000,
    target: 'Diseñado para pequeñas y medianas inmobiliarias locales en la Región del Sumapaz.',
    badge: 'Más Popular en Sumapaz',
    popular: true,
    features: [
      'Todo lo incluido en el Plan Básico',
      'Recordatorios automáticos de cobro por WhatsApp y Email',
      'Recaudo digital integrado con botón PSE y Nequi',
      'Firma electrónica criptográfica SHA-256 (Ley 527)',
      'Estudio de solvencia y riesgo de arrendatarios',
    ],
  },
  {
    id: 'pro' as const,
    name: 'Plan Pro / Premium',
    capacity: '21 a 50+ Inmuebles (Ilimitado)',
    priceCop: 140000,
    target: 'Para inmobiliarias consolidadas con alto volumen de cartera y auditoría.',
    badge: 'Máxima Escalabilidad',
    features: [
      'Todo lo incluido en el Plan PYME',
      'Dashboard financiero en tiempo real y simulador IPC DANE',
      'Módulo de cumplimiento Habeas Data (Ley 1581) y PQRS SIC',
      'Reportes ejecutivos consolidados para propietarios',
      'Soporte técnico prioritario Nivel 2 y backups diarios en AWS',
    ],
  },
];

const SERVICE_FLOW_STEPS = [
  {
    step: 1,
    title: 'Demostración Comercial',
    desc: 'Contacto y demo interactiva del software en Fusagasugá y el Sumapaz.',
  },
  {
    step: 2,
    title: 'Registro y Activación',
    desc: 'Creación del usuario administrador y activación inmediata en la nube.',
  },
  {
    step: 3,
    title: 'Carga de Portafolio',
    desc: 'Registro e importación de inmuebles, propietarios y arrendatarios.',
  },
  {
    step: 4,
    title: 'Parametrización Legal',
    desc: 'Configuración de contratos Ley 820, cánones, topes 1% y fechas de corte.',
  },
  {
    step: 5,
    title: 'Notificación Automática',
    desc: 'Envío programado de avisos y recordatorios de cobro por WhatsApp y Correo.',
  },
  {
    step: 6,
    title: 'Recaudo Digital PSE',
    desc: 'Pago en línea o registro manual con actualización instantánea de cartera.',
  },
  {
    step: 7,
    title: 'Reportes en Tiempo Real',
    desc: 'Generación automática de estados financieros e indicadores de mora.',
  },
  {
    step: 8,
    title: 'Soporte y Cloud AWS',
    desc: 'Acompañamiento continuo, respaldos diarios y mantenimiento preventivo.',
  },
];

export default function SaasPlansAndBrandPage() {
  const { activeSaasPlan, isFreeTrialActive, activateSaasPlan } = usePropTech();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSelectPlan = (planId: 'basico' | 'pyme' | 'pro', freeTrial: boolean) => {
    activateSaasPlan(planId, freeTrial);
    const planObj = SAAS_PLANS.find((p) => p.id === planId);
    setToastMessage(
      freeTrial
        ? `¡Prueba Gratuita de 14 días activada en el ${planObj?.name}! Sin tarjeta de crédito.`
        : `¡Has seleccionado el ${planObj?.name} (${copFormatter.format(planObj?.priceCop ?? 0)} / mes)!`
    );
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10 lg:px-8 space-y-10 sm:space-y-14">
      {/* Notificación flotante */}
      {toastMessage && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-3 right-3 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-[#11CAA0] bg-[#1B365D] px-4 py-3.5 text-xs font-bold text-white shadow-2xl sm:bottom-6 sm:left-auto sm:right-6"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#11CAA0]" />
          <span className="flex-1">{toastMessage}</span>
        </aside>
      )}

      {/* =====================================================================
          1. HERO CORPORATIVO SGI: PROPUESTA DE VALOR Y SLOGAN OFICIAL
         ===================================================================== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B365D] via-[#005088] to-[#00805A] p-8 text-white shadow-xl sm:p-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="space-y-4 lg:col-span-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#11CAA0] backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Modelo SaaS 100% Cloud • Sin Cláusulas de Permanencia
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              &ldquo;Control total de tus inmuebles, desde cualquier lugar.&rdquo;
            </h1>

            <p className="text-base font-medium text-slate-100 sm:text-lg">
              &ldquo;Orden y tranquilidad para quienes cuidan el patrimonio de las familias colombianas.&rdquo;
            </p>

            <p className="max-w-2xl text-xs leading-relaxed text-slate-200 sm:text-sm">
              El <strong>Sistema de Gestión Inmobiliaria (SGI)</strong> reemplaza las hojas de cálculo desorganizadas y cuadernos manuales en Fusagasugá y la Región del Sumapaz, automatizando contratos digitales, recordatorios de cobro por WhatsApp/Correo y recaudos vía PSE.
            </p>

            {/* 3 Pilares Clave de la Arquitectura de Marca */}
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white">
                <ShieldCheck className="h-4 w-4 text-[#11CAA0]" />
                1. Seguridad Jurídica
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white">
                <KeyRound className="h-4 w-4 text-[#11CAA0]" />
                2. Control Total 24/7
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white">
                <Cloud className="h-4 w-4 text-[#11CAA0]" />
                3. Escalabilidad Cloud AWS
              </span>
            </div>
          </div>

          {/* Tarjeta Destacada: Prueba Gratuita de 14 Días (Freemium) */}
          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-[#11CAA0] px-3 py-1 text-[11px] font-extrabold uppercase text-[#1B365D]">
                Estrategia Freemium
              </span>
              <Rocket className="h-5 w-5 text-[#11CAA0]" />
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Prueba Gratuita por 14 Días
            </h2>
            <p className="text-xs text-slate-200 leading-relaxed">
              Digitaliza tu cartera inmobiliaria en Fusagasugá sin costo inicial y sin tarjeta de crédito. Incluye todos los módulos para Administrador, Propietario y Arrendatario.
            </p>
            <button
              type="button"
              onClick={() => handleSelectPlan('pyme', true)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#11CAA0] px-4 text-xs font-extrabold text-[#1B365D] shadow-lg transition hover:bg-emerald-300"
            >
              <span>Activar Prueba Gratuita de 14 Días</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. PLANES DE SUSCRIPCIÓN MENSUAL SAAS (ESTUDIO DE MERCADO & FINANCIERO)
         ===================================================================== */}
      <section className="space-y-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#005088]/10 px-3.5 py-1 text-xs font-bold text-[#005088] dark:bg-[#11CAA0]/15 dark:text-[#11CAA0]">
            <CreditCard className="h-3.5 w-3.5" />
            Precios Transparentes y Escalables • Región del Sumapaz
          </span>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
            Planes de Suscripción Mensual SGI
          </h2>
          <p className="mx-auto mt-1 max-w-2xl text-xs text-slate-500 sm:text-sm">
            Selecciona el plan acorde al número de propiedades que administras. Sin costos ocultos ni cláusulas de permanencia.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {SAAS_PLANS.map((plan) => {
            const isSelected = activeSaasPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl border-2 p-6 transition-all ${
                  plan.popular
                    ? 'border-[#00805A] bg-white shadow-xl dark:border-[#11CAA0] dark:bg-slate-900'
                    : 'border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
                        plan.popular
                          ? 'bg-[#00805A] text-white'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {plan.badge}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#00805A] dark:text-[#11CAA0]">
                        <CheckCircle2 className="h-4 w-4" />
                        Plan Activo
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="mt-0.5 text-xs font-bold text-[#005088] dark:text-[#11CAA0]">
                    Capacidad: {plan.capacity}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">{plan.target}</p>

                  <div className="mt-5 flex items-baseline gap-1 border-y border-slate-100 py-4 dark:border-slate-800">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {copFormatter.format(plan.priceCop)}
                    </span>
                    <span className="text-xs font-medium text-slate-500">COP / mes</span>
                  </div>

                  <ul className="mt-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00805A] dark:text-[#11CAA0]" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 space-y-2 pt-4">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan.id, false)}
                    className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition ${
                      plan.popular
                        ? 'bg-[#00805A] text-white shadow hover:bg-emerald-700'
                        : 'bg-[#005088] text-white hover:bg-[#1B365D]'
                    }`}
                  >
                    <span>Suscribirse al {plan.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan.id, true)}
                    className="inline-flex h-9 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    Probar 14 días gratis
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Servicio Adicional de Onboarding e Implementación Inicial */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase text-[#00805A]">
                Servicio Complementario de Acompañamiento en Fusagasugá
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Onboarding, Configuración Inicial y Migración Masiva de Cartera
              </h3>
              <p className="text-xs text-slate-500">
                Digitalizamos tus hojas de Excel o registros físicos de contratos actuales, configuramos tu cuenta administrador y capacitamos presencialmente a tu equipo en Fusagasugá.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <div className="text-right">
                <span className="block text-xl font-extrabold text-slate-900 dark:text-white">
                  $150.000 COP
                </span>
                <span className="text-[11px] text-slate-500">Pago único inicial</span>
              </div>
              <Link
                href="/panel"
                className="rounded-xl bg-[#005088] px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-[#1B365D]"
              >
                Ir al Panel SGI
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. FLUJOGRAMA DEL PROCESO PRODUCTIVO / PRESTACIÓN DEL SERVICIO (8 PASOS)
         ===================================================================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 border-b border-slate-200 pb-4 dark:border-slate-800">
          <span className="text-xs font-bold uppercase text-[#005088] dark:text-[#11CAA0]">
            Estudio Técnico • Ficha Técnica v1.0.0
          </span>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
            Flujograma de Prestación del Servicio SGI (8 Pasos)
          </h2>
          <p className="text-xs text-slate-500">
            Ruta operativa estandarizada desde la demostración comercial en Fusagasugá hasta la generación de reportes y soporte en la nube.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_FLOW_STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#005088] text-xs font-extrabold text-white">
                  {item.step}
                </span>
                <span className="text-[10px] font-bold uppercase text-[#00805A] dark:text-[#11CAA0]">
                  Paso 0{item.step}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          4. IDENTIDAD CORPORATIVA, CONCEPTO DEL LOGO Y PSICOLOGÍA DEL COLOR
         ===================================================================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 border-b border-slate-200 pb-4 dark:border-slate-800">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-[#00805A] dark:text-[#11CAA0]">
            <Palette className="h-3.5 w-3.5" />
            Manual de Imagen Corporativa SGI
          </span>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
            Isotipo Oficial y Psicología del Color
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Concepto del Logo (Versión Clara y Versión Negativa) */}
          <div className="space-y-4 lg:col-span-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Construcción Visual del Isotipo (Llave + Estructura + Escudo)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              El isotipo de <strong>SGI</strong> integra tres elementos geométricos: la <strong>estructura arquitectónica</strong> (administración de finca raíz), la <strong>llave digital</strong> (acceso y control remoto) y el <strong>escudo protector</strong> (respaldo legal Ley 820 y seguridad patrimonial).
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 text-center">
                <SgiLogo size="lg" variant="color" />
                <span className="mt-2 text-xs font-bold text-[#1B365D]">
                  Versión Principal
                </span>
                <span className="text-[10px] text-slate-500">Fondo Claro (#F8FAFC)</span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-[#1B365D] p-4 text-center">
                <SgiLogo size="lg" variant="negative" />
                <span className="mt-2 text-xs font-bold text-white">
                  Versión Negativa
                </span>
                <span className="text-[10px] text-[#11CAA0]">Fondo Oscuro (#1B365D)</span>
              </div>
            </div>
          </div>

          {/* Paleta Corporativa HEX y Psicología del Color */}
          <div className="space-y-4 lg:col-span-7">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Paleta Corporativa Oficial y Proporción Visual (60% • 30% • 10%)
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Color 1: Azul Marino 60% */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="h-12 w-full rounded-lg bg-[#005088] shadow-inner" />
                <div className="mt-3">
                  <span className="text-[10px] font-extrabold uppercase text-[#005088] dark:text-sky-400">
                    60% Dominante
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Azul Marino Corporativo
                  </h4>
                  <p className="font-mono text-xs text-slate-500">#005088 / #1B365D</p>
                  <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    Transmite confianza, seriedad institucional, estabilidad y respaldo profesional.
                  </p>
                </div>
              </div>

              {/* Color 2: Verde Esmeralda 30% */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="h-12 w-full rounded-lg bg-[#00805A] shadow-inner" />
                <div className="mt-3">
                  <span className="text-[10px] font-extrabold uppercase text-[#00805A] dark:text-[#11CAA0]">
                    30% Secundario
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Verde Esmeralda / Menta
                  </h4>
                  <p className="font-mono text-xs text-slate-500">#00805A / #11CAA0</p>
                  <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    Representa crecimiento económico, rentabilidad, tranquilidad financiera y frescura digital.
                  </p>
                </div>
              </div>

              {/* Color 3: Blanco Hueso 10% */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="h-12 w-full rounded-lg border border-slate-300 bg-[#F8FAFC] shadow-inner" />
                <div className="mt-3">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500">
                    10% Contraste
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Blanco Hueso / Gris Claro
                  </h4>
                  <p className="font-mono text-xs text-slate-500">#F4F9F5 / #F8FAFC</p>
                  <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    Garantiza legibilidad impecable, orden visual y estética minimalista limpia.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
