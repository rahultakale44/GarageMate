import React from 'react';

type BadgeVariant = 'green' | 'red' | 'orange' | 'blue' | 'slate' | 'yellow' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  green:  'bg-green-50  text-green-700  border-green-200',
  red:    'bg-red-50    text-red-700    border-red-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  blue:   'bg-blue-50   text-blue-700   border-blue-200',
  slate:  'bg-slate-100 text-slate-600  border-slate-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

const dotClasses: Record<BadgeVariant, string> = {
  green:  'bg-green-500',
  red:    'bg-red-500',
  orange: 'bg-orange-500',
  blue:   'bg-blue-500',
  slate:  'bg-slate-400',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'slate',
  children,
  className = '',
  dot = false,
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border ${variantClasses[variant]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClasses[variant]}`} />
      )}
      {children}
    </span>
  );
};

// Semantic status badge for request/subscription statuses
interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusMap: Record<string, { variant: BadgeVariant; label: string; dot?: boolean }> = {
  // Request statuses
  PAYMENT_PENDING:       { variant: 'yellow',  label: 'Payment Pending', dot: true },
  SEARCHING_GARAGE:      { variant: 'blue',    label: 'Finding Garage', dot: true },
  GARAGE_ACCEPTED:       { variant: 'blue',    label: 'Garage Accepted', dot: true },
  MECHANIC_ASSIGNED:     { variant: 'orange',  label: 'Mechanic Assigned', dot: true },
  MECHANIC_DISPATCHED:   { variant: 'orange',  label: 'En Route', dot: true },
  SERVICE_IN_PROGRESS:   { variant: 'orange',  label: 'In Progress', dot: true },
  AWAITING_PAYMENT:      { variant: 'yellow',  label: 'Awaiting Payment', dot: true },
  SERVICE_COMPLETED:     { variant: 'green',   label: 'Completed' },
  PAID:                  { variant: 'green',   label: 'Paid' },
  CLOSED:                { variant: 'slate',   label: 'Closed' },
  CANCELLED:             { variant: 'red',     label: 'Cancelled' },
  PENDING:               { variant: 'yellow',  label: 'Pending', dot: true },
  REJECTED:              { variant: 'red',     label: 'Rejected' },
  // Verification statuses
  APPROVED:              { variant: 'green',   label: 'Approved' },
  UNDER_REVIEW:          { variant: 'blue',    label: 'Under Review', dot: true },
  SUSPENDED:             { variant: 'red',     label: 'Suspended' },
  // Subscription statuses
  ACTIVE:                { variant: 'green',   label: 'Active', dot: true },
  PAST_DUE:              { variant: 'orange',  label: 'Past Due', dot: true },
  EXPIRED:               { variant: 'red',     label: 'Expired' },
  // Garage availability
  available:             { variant: 'green',   label: 'Available', dot: true },
  busy:                  { variant: 'red',     label: 'Busy', dot: true },
  // Urgency
  HIGH:                  { variant: 'red',     label: 'High' },
  MEDIUM:                { variant: 'yellow',  label: 'Medium' },
  LOW:                   { variant: 'slate',   label: 'Low' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusMap[status] ?? { variant: 'slate' as BadgeVariant, label: status };
  return (
    <Badge variant={config.variant} className={className} dot={config.dot}>
      {config.label}
    </Badge>
  );
};
