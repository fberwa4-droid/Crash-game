import React from 'react';
import { getAvatarPalette, getInitials } from '../../utils/format';

interface AvatarProps {
  name: string;
  seed?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-lg',
};

export const Avatar: React.FC<AvatarProps> = ({ name, seed = 0, size = 'md', className = '' }) => {
  const palette = getAvatarPalette(seed);
  return (
    <span
      aria-hidden="true"
      style={{
        backgroundColor: palette.bg,
        color: palette.fg,
        borderColor: palette.border,
      }}
      className={`inline-flex items-center justify-center rounded-full border font-mono font-medium select-none shrink-0 ${sizes[size]} ${className}`}
    >
      {getInitials(name)}
    </span>
  );
};
