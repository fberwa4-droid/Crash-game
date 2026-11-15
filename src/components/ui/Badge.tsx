import React from 'react';
import { Check } from 'lucide-react';

interface VerifiedBadgeProps {
  className?: string;
  label?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  className = '',
  label = 'Verified contributor',
}) => {
  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center h-4 w-4 rounded-full border border-[var(--hairline-strong)] bg-[var(--surface)] text-[var(--text)] shrink-0 ${className}`}
    >
      <Check className="h-2.5 w-2.5" strokeWidth={2.2} aria-hidden="true" />
    </span>
  );
};
