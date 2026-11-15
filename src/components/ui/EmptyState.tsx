import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 border border-[var(--hairline)] rounded-2xl bg-[var(--surface)]/50">
      {icon ? (
        <div className="mb-3 text-[var(--text-muted)]">{icon}</div>
      ) : null}
      <h3 className="text-base font-medium text-[var(--text)]">{title}</h3>
      <p className="mt-1.5 text-sm text-[var(--text-muted)] max-w-sm">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
};
