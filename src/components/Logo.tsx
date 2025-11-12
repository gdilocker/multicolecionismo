import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export default function Logo({ size = 40, className = '', showText = true }: LogoProps) {
  const textSize = size * 0.6;

  return (
    <div className={`flex items-center ${className}`}>
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
