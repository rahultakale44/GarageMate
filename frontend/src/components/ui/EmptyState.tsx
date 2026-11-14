import React from 'react';
import { PackageOpen, Search, FileX, WifiOff, AlertCircle } from 'lucide-react';

type EmptyVariant = 'default' | 'search' | 'error' | 'offline' | 'no-data';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  variant?: EmptyVariant;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

const defaultIcons: Record<EmptyVariant, React.ReactNode> = {
  default:  <PackageOpen className="w-10 h-10 text-slate-300" />,
  search:   <Search className="w-10 h-10 text-slate-300" />,
  error:    <AlertCircle className="w-10 h-10 text-red-300" />,
  offline:  <WifiOff className="w-10 h-10 text-slate-300" />,
  'no-data':<FileX className="w-10 h-10 text-slate-300" />,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  variant = 'default',
  action,
  className = '',
  compact = false,
}) => (
  <div
    className={[
      'flex flex-col items-center justify-center text-center',
      compact ? 'py-8 px-4' : 'py-16 px-6',
      className,
    ].join(' ')}
  >
    <div className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
      {icon ?? defaultIcons[variant]}
    </div>
    <h3 className="text-base font-semibold text-slate-700 mb-1.5">{title}</h3>
    {description && (
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
