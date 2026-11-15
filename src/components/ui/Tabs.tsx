import React from 'react';

export interface TabOption<T extends string> {
  value: T;
  label: string;
}

interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<TabOption<T>>;
  variant?: 'segmented' | 'underline';
  className?: string;
}

export function Tabs<T extends string>({
  value,
  onChange,
  options,
  variant = 'segmented',
  className = '',
}: TabsProps<T>) {
  if (variant === 'underline') {
    return (
      <div
        role="tablist"
        className={`flex items-center border-b border-[var(--hairline)] ${className}`}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.value)}
              className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                active
                  ? 'text-[var(--text)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {opt.label}
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-4 bottom-0 h-[2px] bg-[#E5322D] rounded-full"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={`inline-flex items-center p-1 rounded-full border border-[var(--hairline)] bg-[var(--surface)] ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
              active
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
