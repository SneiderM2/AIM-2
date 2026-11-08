'use client';

/**
 * @file SgiLogo.tsx
 * @description Isotipo oficial del Sistema de Gestión Inmobiliaria (SGI).
 *              Combina geométricamente:
 *              1. Escudo protector (Seguridad jurídica y tranquilidad financiera)
 *              2. Estructura inmobiliaria (Administración integral de propiedades)
 *              3. Llave digital (Acceso y control desde cualquier lugar)
 *              Paleta corporativa: Azul Marino (#005088 / #1B365D) y Verde Esmeralda (#00805A / #11CAA0).
 */

import React from 'react';

interface SgiLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'color' | 'negative';
}

export function SgiLogo({ size = 'md', variant = 'color' }: SgiLogoProps) {
  const dimensions = {
    sm: 'h-9 w-9',
    md: 'h-11 w-11',
    lg: 'h-14 w-14',
  }[size];

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-xl shadow-md transition-transform ${dimensions} ${
        variant === 'negative'
          ? 'bg-[#1B365D] ring-1 ring-[#11CAA0]/40'
          : 'bg-gradient-to-br from-[#005088] to-[#1B365D] ring-1 ring-[#00805A]/30'
      }`}
      title="SGI: Escudo Protector + Estructura Inmobiliaria + Llave Digital"
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-4/5 w-4/5"
      >
        {/* 1. Escudo Protector Exterior */}
        <path
          d="M24 4L8 10.5V22.5C8 32.8 14.8 41.9 24 44.5C33.2 41.9 40 32.8 40 22.5V10.5L24 4Z"
          stroke="#11CAA0"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="rgba(0, 128, 90, 0.15)"
        />
        {/* 2. Estructura Inmobiliaria Central (Techo y Edificio) */}
        <path
          d="M15 23L24 15L33 23"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 21.5V32H30V21.5"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 3. Llave Digital Integrada en el Núcleo */}
        <circle cx="24" cy="24.5" r="2.6" fill="#11CAA0" />
        <path
          d="M24 27.1V33.5M24 30.5H26.5M24 32.8H26"
          stroke="#11CAA0"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
