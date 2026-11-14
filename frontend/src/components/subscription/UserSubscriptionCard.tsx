import { Link } from 'react-router-dom';
import { Crown, Calendar, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import type { MySubscriptionResponse } from '@/types/subscription';
import {
  getStatusLabel,
  getStatusColor,
  formatBillingInterval,
  PLAN_DETAILS,
} from '@/types/subscription';
import { Badge } from '@/components/ui/Badge';

interface UserSubscriptionCardProps {
  subscriptionData: MySubscriptionResponse | null;
  loading?: boolean;
  error?: string | null;
}

const UserSubscriptionCard = ({ subscriptionData, loading, error }: UserSubscriptionCardProps) => {
  if (loading) {
    return (
      <div className="dark-card p-5 flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
        <span className="ml-2.5 text-sm text-slate-500">Loading membership…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dark-card p-5" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!subscriptionData) return null;

  const { subscription, plan, status, isFree: isFreePlan } = subscriptionData;
  const planInfo = PLAN_DETAILS[plan];
  const isProMember = !isFreePlan && subscription;

  const statusColorMap: Record<string, 'green' | 'yellow' | 'orange' | 'red' | 'slate'> = {
    green: 'green', yellow: 'yellow', orange: 'orange', red: 'red', gray: 'slate',
  };
  const statusVariant = statusColorMap[getStatusColor(status)] ?? 'slate';

  return (
    <div
      className="dark-card p-5"
      style={isProMember ? { borderColor: 'rgba(249,115,22,0.25)', background: 'rgba(249,115,22,0.06)' } : {}}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: isProMember ? 'rgba(249,115,22,0.20)' : 'rgba(255,255,255,0.08)' }}
          >
            <Crown className={`w-4 h-4 ${isProMember ? 'text-orange-400' : 'text-slate-500'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{planInfo.displayName} Membership</p>
            <p className="text-xs text-slate-500">
              {isProMember ? 'Premium benefits active' : 'Explore Pro benefits'}
            </p>
          </div>
        </div>
        {subscription && <Badge variant={statusVariant}>{getStatusLabel(status)}</Badge>}
      </div>

      {isProMember && subscription ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {subscription.billingInterval === 'MONTHLY' ? 'Monthly' : 'Annual'} · ₹
              {subscription.amount}/{formatBillingInterval(subscription.billingInterval)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            <span>Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN')}</span>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(234,179,8,0.10)', border: '1px solid rgba(234,179,8,0.20)' }}>
              <AlertCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300">
                Cancellation scheduled — ends {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN')}
              </p>
            </div>
          )}

          <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {planInfo.features.slice(0, 3).map((feature, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-slate-400 mb-1.5">
                <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                {feature}
              </div>
            ))}
          </div>

          <Link to="/pro"
            className="block w-full text-center py-2 text-xs font-semibold text-orange-400 rounded-lg hover:text-orange-300 transition-colors mt-1"
            style={{ border: '1px solid rgba(249,115,22,0.25)' }}>
            Manage Membership
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {planInfo.features.slice(0, 3).map((feature, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-slate-500">
              <CheckCircle className="w-3 h-3 text-slate-600 flex-shrink-0 mt-0.5" />
              {feature}
            </div>
          ))}
          <Link to="/pro"
            className="block w-full text-center py-2.5 text-xs font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors mt-1"
            style={{ boxShadow: '0 2px 10px rgba(249,115,22,0.30)' }}>
            Explore Pro Benefits →
          </Link>
        </div>
      )}
    </div>
  );
};

export default UserSubscriptionCard;
