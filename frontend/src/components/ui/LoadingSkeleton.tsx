import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

// ── Generic loading skeleton ──────────────────────────────────────────────────

export const LoadingSkeleton: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`space-y-3 ${className}`} role="status" aria-label="Loading">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={`h-4 rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
    ))}
    <span className="sr-only">Loading…</span>
  </div>
);

// ── Card skeleton ─────────────────────────────────────────────────────────────

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`bg-white rounded-xl border border-slate-200 p-5 space-y-4 ${className}`}
    role="status"
    aria-label="Loading"
  >
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2 rounded" />
        <Skeleton className="h-3 w-1/3 rounded" />
      </div>
    </div>
    <Skeleton className="h-3 w-full rounded" />
    <Skeleton className="h-3 w-4/5 rounded" />
    <span className="sr-only">Loading…</span>
  </div>
);

// ── Table skeleton ────────────────────────────────────────────────────────────

export const TableSkeleton: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className = '',
}) => (
  <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`} role="status" aria-label="Loading">
    {/* Header */}
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-3 rounded" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, row) => (
      <div
        key={row}
        className="px-4 py-3 border-b border-slate-100 last:border-0 grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, col) => (
          <Skeleton key={col} className={`h-4 rounded ${col === 0 ? 'w-3/4' : 'w-full'}`} />
        ))}
      </div>
    ))}
    <span className="sr-only">Loading…</span>
  </div>
);
