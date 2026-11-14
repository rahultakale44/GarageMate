import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  className = '',
}) => (
  <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 ${className}`}>
    <div className="min-w-0">
      <h1 className="text-xl font-semibold text-slate-900 truncate">{title}</h1>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
  </div>
);
