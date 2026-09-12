import React from 'react';

interface BanorteLogoProps {
  className?: string;
  variant?: 'white' | 'red' | 'dark';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const BanorteLogo: React.FC<BanorteLogoProps> = ({
  className = '',
  variant = 'red',
  showText = true,
  size = 'md'
}) => {
  const sizeMap = {
    sm: { icon: 'w-6 h-6', text: 'text-[13px]' },
    md: { icon: 'w-8 h-8', text: 'text-lg' },
    lg: { icon: 'w-11 h-11', text: 'text-2xl' },
    xl: { icon: 'w-14 h-14', text: 'text-3xl' }
  };

  const textColor =
    variant === 'white' ? 'text-white' : variant === 'dark' ? 'text-[#1A1A1A]' : 'text-[#E30613]';

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <img
        src="/banorte-logo.png"
        alt="Banorte"
        className={`${sizeMap[size].icon} object-contain ${
          variant === 'white' ? 'brightness-0 invert' : ''
        }`}
      />
      {showText && (
        <span
          className={`font-semibold tracking-[0.18em] uppercase ${textColor} ${sizeMap[size].text}`}
          style={{ fontFamily: "'Montserrat', 'Source Sans 3', sans-serif" }}
        >
          BANORTE
        </span>
      )}
    </div>
  );
};
