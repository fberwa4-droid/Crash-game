import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: 'sm' | 'md';
  active?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, size = 'md', active = false, className = '', children, type = 'button', ...rest }, ref) => {
    const dim = size === 'sm' ? 'h-9 w-9 min-h-[36px] min-w-[36px]' : 'h-11 w-11 min-h-[44px] min-w-[44px]';
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        className={`inline-flex items-center justify-center rounded-full transition-colors duration-150 cursor-pointer shrink-0 ${dim} ${
          active
            ? 'text-[var(--text)] bg-[var(--surface)]'
            : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
        } disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';
