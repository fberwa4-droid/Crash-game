import React, { useEffect, useRef, useState } from 'react';

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onSelect: () => void;
}

interface MenuProps {
  trigger: (props: {
    onClick: (e: React.MouseEvent) => void;
    'aria-expanded': boolean;
    'aria-haspopup': 'menu';
  }) => React.ReactNode;
  items: MenuItem[];
  align?: 'left' | 'right';
}

export const Menu: React.FC<MenuProps> = ({ trigger, items, align = 'right' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
      onClick={(e) => e.stopPropagation()}
    >
      {trigger({
        onClick: (e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        },
        'aria-expanded': open,
        'aria-haspopup': 'menu',
      })}

      {open ? (
        <div
          role="menu"
          className={`absolute top-full mt-1.5 z-40 min-w-[196px] rounded-xl border border-[var(--hairline-strong)] bg-[var(--bg-elevated)] py-1.5 shadow-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onSelect();
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors cursor-pointer ${
                item.danger
                  ? 'text-[#E5322D] hover:bg-[#E5322D]/10'
                  : 'text-[var(--text)] hover:bg-[var(--surface)]'
              }`}
            >
              {item.icon ? <span className="shrink-0 opacity-80">{item.icon}</span> : null}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
