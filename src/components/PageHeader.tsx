import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  badge?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  primaryAction,
  secondaryActions,
  badge
}) => {
  return (
    <header className="w-full mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{title}</h1>
          {badge && <div>{badge}</div>}
          {subtitle && <p className="text-sm sm:text-base text-slate-500">{subtitle}</p>}
        </div>

        {(primaryAction || secondaryActions) && (
          <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-shrink-0">
            {primaryAction && <div className="w-full sm:w-auto">{primaryAction}</div>}
            {secondaryActions && <div className="w-full sm:w-auto">{secondaryActions}</div>}
          </div>
        )}
      </div>
    </header>
  );
};
