import { Link } from 'react-router-dom';
import { Store, Calendar, AlertCircle, CheckCircle, Loader2, TrendingUp } from 'lucide-react';
import type { MySubscriptionResponse } from '@/types/subscription';
import {
  getStatusLabel,
  getStatusColor,
  formatBillingInterval,
  PLAN_DETAILS,
  SubscriptionPlan,
} from '@/types/subscription';
import { Badge } from '@/components/ui/Badge';

interface GarageSubscriptionCardProps {
  subscriptionData: MySubscriptionResponse | null;
  loading?: boolean;
  error?: string | null;
}

const GarageSubscriptionCard = ({ subscriptionData, loading, error }: GarageSubscriptionCardProps) => {
  if (loading) {
    return (
      <div className="card p-5 flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
        <span className="ml-2.5 text-sm text-slate-500">Loading subscription…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-5 border-red-200">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!subscriptionData) return null;

  const { subscription, plan, status, isFree: isFreePlan } = subscriptionData;
  const planInfo = PLAN_DETAILS[plan];
  const isPartner = !isFreePlan && subscription;

  const statusColorMap: Record<string, 'green' | 'yellow' | 'orange' | 'red' | 'slate'> = {
    green: 'green', yellow: 'yellow', orange: 'orange', red: 'red', gray: 'slate',
  };
  const statusVariant = statusColorMap[getStatusColor(status)] ?? 'slate';

  return (
    <div className={`card p-5 ${isPartner ? 'border-orange-200 bg-orange-50/30' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isPartner
              ? plan === SubscriptionPlan.PARTNER_BUSINESS ? 'bg-purple-100' : 'bg-orange-100'
              : 'bg-slate-100'
          }`}>
            <Store className={`w-4.5 h-4.5 ${
              isPartner
                ? plan === SubscriptionPlan.PARTNER_BUSINESS ? 'text-purple-600' : 'text-orange-600'
                : 'text-slate-400'
            }`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{planInfo.displayName}</p>
            <p className="text-xs text-slate-500">
              {isPartner ? 'Active subscription' : 'Free partner plan'}
            </p>
          </div>
        </div>
        {subscription && (
          <Badge variant={statusVariant}>{getStatusLabel(status)}</Badge>
        )}
      </div>

      {isPartner && subscription ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {subscription.billingInterval === 'MONTHLY' ? 'Monthly' : 'Annual'} · ₹
              {subscription.amount.toLocaleString('en-IN')}/{formatBillingInterval(subscription.billingInterval)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            <span>Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN')}</span>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800">
                  Cancellation scheduled — ends {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100">
            {planInfo.features.slice(0, 3).map((feature, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600 mb-1">
                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                {feature}
              </div>
            ))}
          </div>

          <Link to="/garage/plans"
            className="block w-full text-center py-2 text-xs font-semibold text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors mt-2">
            Manage Subscription
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {planInfo.features.slice(0, 3).map((feature, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-slate-500">
              <CheckCircle className="w-3 h-3 text-slate-300 flex-shrink-0 mt-0.5" />
              {feature}
            </div>
          ))}
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-800">Upgrade to reach more customers and unlock analytics.</p>
          </div>
          <Link to="/garage/plans"
            className="block w-full text-center py-2.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            View Partner Plans →
          </Link>
        </div>
      )}
    </div>
  );
};

export default GarageSubscriptionCard;
