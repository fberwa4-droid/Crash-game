import React from 'react';
import { useBrand } from '../../hooks/useBrand';

interface BrandMarkProps {
  showWordmark?: boolean;
  className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  showWordmark = true,
  className = '',
}) => {
  const { brandName } = useBrand();

  return (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle
          cx="9.5"
          cy="12"
          r="6"
          stroke="currentColor"
          strokeWidth="1.75"
          opacity="0.92"
        />
        <circle
          cx="14.5"
          cy="12"
          r="6"
          stroke="#E5322D"
          strokeWidth="1.75"
        />
      </svg>
      {showWordmark ? (
        <span className="text-[17px] font-semibold tracking-[-0.03em] lowercase text-[var(--text)]">
          {brandName}
        </span>
      ) : null}
    </span>
  );
};
