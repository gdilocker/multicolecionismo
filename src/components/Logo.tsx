import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFC700" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
        <linearGradient id="diamondShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#FFD700" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Diamante principal - forma clean */}
      <path
        d="M 50 10 L 75 35 L 50 85 L 25 35 Z"
        fill="url(#goldGradient)"
        stroke="url(#goldGradient)"
        strokeWidth="1.5"
        strokeLinejoin="miter"
      />

      {/* Facetas superiores - profundidade luxuosa */}
      <path
        d="M 50 10 L 62.5 35 L 50 30 Z"
        fill="url(#diamondShine)"
        opacity="0.5"
      />
      <path
        d="M 50 10 L 37.5 35 L 50 30 Z"
        fill="url(#diamondShine)"
        opacity="0.3"
      />

      {/* Facetas laterais - efeito 3D */}
      <path
        d="M 25 35 L 50 30 L 50 85 Z"
        fill="#000000"
        opacity="0.15"
      />
      <path
        d="M 75 35 L 50 30 L 50 85 Z"
        fill="#000000"
        opacity="0.08"
      />

      {/* Linha central - reflexo */}
      <line
        x1="50"
        y1="10"
        x2="50"
        y2="30"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        opacity="0.6"
        strokeLinecap="round"
      />

      {/* Brilho no topo - detalhe premium */}
      <circle
        cx="50"
        cy="10"
        r="2"
        fill="#FFFFFF"
        opacity="0.8"
      />
    </svg>
  );
}
