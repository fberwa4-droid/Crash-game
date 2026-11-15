import React from 'react';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'subtle' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#E5322D] hover:bg-[#cc2924] dark:hover:bg-[#FF4A44] text-white border border-transparent',
  outline:
    'bg-transparent border border-[var(--hairline-strong)] text-[var(--text)] hover:bg-[var(--surface)]',
  ghost:
    'bg-transparent border border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]',
  subtle:
    'bg-[var(--surface)] border border-[var(--hairline)] text-[var(--text)] hover:bg-[var(--surface-hover)]',
  danger:
    'bg-transparent border border-[#E5322D]/50 text-[#E5322D] hover:bg-[#E5322D]/10',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'subtle',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className = '',
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...rest}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
          />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
