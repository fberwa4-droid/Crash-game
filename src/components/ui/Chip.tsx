import React from 'react';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  asLink?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  active = false,
  className = '',
  children,
  type = 'button',
  ...rest
}) => {
  return (
    <button
      type={type}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs whitespace-nowrap shrink-0 border transition-colors duration-150 cursor-pointer ${
        active
          ? 'bg-[var(--text)] text-[var(--bg)] border-transparent'
          : 'bg-transparent border-[var(--hairline)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--hairline-strong)]'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};
