import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  trend?: { value: string; positive: boolean; neutral?: boolean };
  note?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  iconBg = 'bg-orange-50',
  trend,
  note,
  className = '',
  size = 'md',
}) => (
  <div
    className={[
      'bg-white rounded-xl border border-slate-200 shadow-card',
      'transition-all duration-200 hover:shadow-card-hover hover:border-slate-300',
      size === 'md' ? 'p-5' : 'p-4',
      className,
    ].join(' ')}
  >
    <div className="flex items-start justify-between gap-2">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      {trend && (
        <span
          className={[
            'inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
            trend.neutral
              ? 'bg-slate-100 text-slate-500'
              : trend.positive
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-600',
          ].join(' ')}
        >
          {trend.neutral ? (
            <Minus className="w-3 h-3" />
          ) : trend.positive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {trend.value}
        </span>
      )}
    </div>
    <div className="mt-3">
      <p className={`font-bold text-slate-900 leading-tight ${size === 'md' ? 'text-2xl' : 'text-xl'}`}>
        {value}
      </p>
      <p className="text-sm text-slate-500 mt-0.5 font-medium">{label}</p>
      {note && <p className="text-xs text-slate-400 mt-1">{note}</p>}
    </div>
  </div>
);
