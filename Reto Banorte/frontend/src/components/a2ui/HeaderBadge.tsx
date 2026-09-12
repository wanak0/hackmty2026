import React from 'react';
import { plainText } from './styles';

interface HeaderBadgeProps { tag: string; title: string; }

export const HeaderBadge: React.FC<HeaderBadgeProps> = ({ tag, title }) => (
  <header className="space-y-3 text-[#222222]">
    <p className="inline-flex rounded-full bg-[#FBF1EA] px-3 py-1 text-base font-semibold text-[#B80000]">{plainText(tag)}</p>
    <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{plainText(title)}</h2>
  </header>
);
