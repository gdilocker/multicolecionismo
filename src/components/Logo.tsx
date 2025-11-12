import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export default function Logo({ size = 40, className = '', showText = true }: LogoProps) {
  const iconSize = size;
  const textSize = size * 0.6;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon - M estilizado com elementos de colecionismo */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gradiente dourado premium */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FDB931" />
            <stop offset="100%" stopColor="#C6941E" />
          </linearGradient>
          <linearGradient id="goldGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B8860B" />
            <stop offset="100%" stopColor="#8B6914" />
          </linearGradient>
        </defs>

        {/* Círculo de fundo com borda dourada */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="#1A1A1A"
          stroke="url(#goldGradient)"
          strokeWidth="3"
        />

        {/* Letra M estilizada com elementos de coleção */}
        <g transform="translate(20, 25)">
          {/* Parte esquerda do M */}
          <path
            d="M 0 45 L 0 5 L 12 25 L 24 5 L 24 45"
            stroke="url(#goldGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Detalhes de coleção - três pequenos quadrados no topo */}
          <rect x="3" y="0" width="5" height="5" fill="url(#goldGradient)" rx="1" />
          <rect x="19" y="0" width="5" height="5" fill="url(#goldGradient)" rx="1" />

          {/* Estrela pequena no meio (representando premium/colecionismo) */}
          <path
            d="M 12 15 L 13.5 18 L 16.5 18.5 L 14.2 20.5 L 14.8 23.5 L 12 22 L 9.2 23.5 L 9.8 20.5 L 7.5 18.5 L 10.5 18 Z"
            fill="url(#goldGradient)"
          />

          {/* Linha inferior - base do M com detalhe */}
          <line
            x1="0"
            y1="50"
            x2="60"
            y2="50"
            stroke="url(#goldGradient)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* C estilizado ao lado direito */}
          <path
            d="M 35 10 Q 50 10 55 25 Q 50 40 35 40"
            stroke="url(#goldGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />

          {/* Pequenos detalhes de brilho */}
          <circle cx="45" cy="12" r="1.5" fill="#FFD700" opacity="0.8" />
          <circle cx="52" cy="25" r="1.5" fill="#FFD700" opacity="0.8" />
          <circle cx="45" cy="38" r="1.5" fill="#FFD700" opacity="0.8" />
        </g>
      </svg>

      {/* Texto da marca */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span
            className="font-bold bg-gradient-to-r from-[#FFD700] via-[#FDB931] to-[#C6941E] bg-clip-text text-transparent"
            style={{ fontSize: `${textSize}px` }}
          >
            Multicolecionismo
          </span>
          <span
            className="text-gray-400 font-medium"
            style={{ fontSize: `${textSize * 0.4}px` }}
          >
            .social
          </span>
        </div>
      )}
    </div>
  );
}
