import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Car, MapPin, Clock, Star, Zap } from 'lucide-react';
import { DashboardShell, type NavItem } from '@/components/layout/DashboardShell';

const userNavItems: NavItem[] = [
  { icon: AlertCircle, label: 'Dashboard',    path: '/user/dashboard' },
  { icon: MapPin,      label: 'Find Garages', path: '/user/nearby-garages' },
  { icon: Zap,         label: 'Emergency',    path: '/user/emergency' },
  { icon: Clock,       label: 'My Requests',  path: '/user/requests' },
  { icon: Car,         label: 'My Vehicles',  path: '/user/vehicles' },
  { icon: Star,        label: 'My Reviews',   path: '/user/reviews' },
];

interface UserPageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  headerActions?: ReactNode;
}

const UserPageLayout = ({
  children,
  title,
  subtitle,
  backTo = '/user/dashboard',
  backLabel = 'Back to Dashboard',
  headerActions,
}: UserPageLayoutProps) => {
  return (
    <DashboardShell navItems={userNavItems}>
      {/* Page heading */}
      <div className="mb-6">
        <Link to={backTo}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-3">
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 flex-shrink-0">{headerActions}</div>
          )}
        </div>
      </div>
      {children}
    </DashboardShell>
  );
};

export default UserPageLayout;
