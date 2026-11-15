import React from 'react';
import { X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export const ToastViewport: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-[calc(100vw-2rem)] sm:max-w-sm pointer-events-none safe-bottom"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md transition-all duration-150 ${
            toast.tone === 'error'
              ? 'bg-[var(--bg-elevated)] border-[#E5322D]/60 text-[var(--text)]'
              : 'bg-[var(--bg-elevated)] border-[var(--hairline-strong)] text-[var(--text)]'
          }`}
        >
          <span className="leading-snug">{toast.message}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {toast.actionLabel && toast.onAction ? (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  dismissToast(toast.id);
                }}
                className="font-mono text-xs font-medium text-[#E5322D] hover:underline px-1.5 py-1 cursor-pointer"
              >
                {toast.actionLabel}
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
