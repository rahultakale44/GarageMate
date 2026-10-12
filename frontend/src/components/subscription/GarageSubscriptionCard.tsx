import { Link } from 'react-router-dom';
import { Store, Calendar, AlertCircle, CheckCircle, Loader2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MySubscriptionResponse } from '@/types/subscription';
import {
  getStatusLabel,
  getStatusColor,
  formatBillingInterval,
  PLAN_DETAILS,
  SubscriptionPlan,
} from '@/types/subscription';

interface GarageSubscriptionCardProps {
  subscriptionData: MySubscriptionResponse | null;
  loading?: boolean;
  error?: string | null;
}

const GarageSubscriptionCard = ({ subscriptionData, loading, error }: GarageSubscriptionCardProps) => {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800 rounded-xl p-6 border border-dark-700"
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <span className="ml-3 text-dark-300">Loading subscription...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800 rounded-xl p-6 border border-red-500/30"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-300">Unable to load subscription</p>
            <p className="text-xs text-red-400 mt-1">{error}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!subscriptionData) {
    return null;
  }

  const { subscription, plan, status, isFree: isFreePlan } = subscriptionData;
  const planInfo = PLAN_DETAILS[plan];
  const isPartner = !isFreePlan && subscription;

  // Determine gradient colors based on plan
  const getGradientColors = () => {
    if (plan === SubscriptionPlan.PARTNER_BUSINESS) {
      return 'from-blue-500/10 to-purple-500/10 border-blue-500/30';
    } else if (plan === SubscriptionPlan.PARTNER_PRO) {
      return 'from-orange-500/10 to-orange-600/10 border-orange-500/30';
    }
    return 'from-dark-700 to-dark-800 border-dark-700';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${getGradientColors()} rounded-xl p-6 border-2`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-lg ${
              isPartner
                ? plan === SubscriptionPlan.PARTNER_BUSINESS
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                  : 'bg-gradient-to-br from-orange-500 to-orange-600'
                : 'bg-dark-700'
            }`}
          >
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{planInfo.displayName}</h3>
            <p className="text-sm text-dark-400">
              {isPartner ? 'Partner subscription active' : 'Free partner plan'}
            </p>
          </div>
        </div>
        {subscription && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              getStatusColor(status) === 'green'
                ? 'bg-green-500/20 text-green-400'
                : getStatusColor(status) === 'yellow'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : getStatusColor(status) === 'red'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-dark-700 text-dark-300'
            }`}
          >
            {getStatusLabel(status)}
          </span>
        )}
      </div>

      {isPartner && subscription ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-dark-300">
            <Calendar className="w-4 h-4" />
            <span>
              {subscription.billingInterval === 'MONTHLY' ? 'Monthly' : 'Annual'} plan • ₹
              {subscription.amount.toLocaleString('en-IN')}/
              {formatBillingInterval(subscription.billingInterval)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-dark-300">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>
              Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN')}
            </span>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-yellow-300">Cancellation Scheduled</p>
                  <p className="text-xs text-yellow-400/80 mt-1">
                    Subscription ends on{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Benefits Preview */}
          <div className="pt-3 border-t border-dark-700">
            <p className="text-xs text-dark-400 mb-2">Active Benefits:</p>
            <div className="space-y-1">
              {planInfo.features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-dark-300">
                  <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-dark-700 flex gap-2">
            <Link
              to="/garage/plans"
              className="flex-1 text-center px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-sm font-medium text-white hover:bg-dark-600 transition-colors"
            >
              View All Plans
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {planInfo.features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-dark-400">
                <CheckCircle className="w-4 h-4 text-dark-500 flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-orange-300">Upgrade to Grow Your Business</p>
                <p className="text-xs text-orange-400/80 mt-1">
                  Get advanced analytics, priority support, and more customers
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-dark-700">
            <Link
              to="/garage/plans"
              className="block w-full text-center px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-sm font-semibold text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
            >
              View Partner Plans →
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default GarageSubscriptionCard;
