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
    sm: { icon: 'w-5 h-5', text: 'text-sm' },
    md: { icon: 'w-7 h-7', text: 'text-lg' },
    lg: { icon: 'w-9 h-9', text: 'text-2xl' },
    xl: { icon: 'w-12 h-12', text: 'text-3xl' }
  };

  const iconColor = variant === 'white' ? '#FFFFFF' : '#EB0029';
  const textColor = variant === 'white' ? 'text-white' : variant === 'dark' ? 'text-gray-900' : 'text-[#EB0029]';

  return (
    <div className={`inline-flex items-center gap-2 font-bold tracking-wider select-none ${className}`}>
      {/* Official Banorte 3-chevron emblem */}
      <svg
        className={sizeMap[size].icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top/Right bar */}
        <polygon
          points="46,12 88,12 60,44 18,44"
          fill={iconColor}
        />
        {/* Middle bar */}
        <polygon
          points="32,40 74,40 46,72 4,72"
          fill={iconColor}
        />
        {/* Bottom/Left bar */}
        <polygon
          points="18,68 60,68 32,100 -10,100"
          fill={iconColor}
        />
      </svg>
      {showText && (
        <span className={`font-black tracking-widest font-['Plus_Jakarta_Sans',sans-serif] ${textColor} ${sizeMap[size].text}`}>
          BANORTE
        </span>
      )}
    </div>
  );
};

