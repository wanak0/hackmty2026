import React from 'react';
import { Icon } from './Icon';

interface SectionHeaderProps {
  icon?: string;
  title: string;
  subtitle?: string;
  tag?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon = 'sparkles',
  title,
  subtitle,
  tag
}) => {
  return (
    <div className="flex items-start gap-3 mb-1">
      <Icon name={icon} tone="primary" size="lg" />
      <div className="min-w-0 flex-1">
        {tag && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#E30613] block mb-0.5">
            {tag}
          </span>
        )}
        <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-snug">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-gray-500 font-medium mt-0.5 leading-relaxed">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
