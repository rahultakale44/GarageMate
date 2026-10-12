import { Link } from 'react-router-dom';
import { Crown, Calendar, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MySubscriptionResponse } from '@/types/subscription';
import {
  getStatusLabel,
  getStatusColor,
  formatBillingInterval,
  PLAN_DETAILS,
} from '@/types/subscription';

interface UserSubscriptionCardProps {
  subscriptionData: MySubscriptionResponse | null;
  loading?: boolean;
  error?: string | null;
}

const UserSubscriptionCard = ({ subscriptionData, loading, error }: UserSubscriptionCardProps) => {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 border border-dark-200"
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <span className="ml-3 text-dark-600">Loading membership...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 border border-red-200"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">Unable to load membership</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
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
  const isProMember = !isFreePlan && subscription;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${
        isProMember
          ? 'from-orange-50 to-orange-100 border-2 border-orange-300'
          : 'from-white to-gray-50 border border-dark-200'
      } rounded-xl p-6 shadow-sm`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-lg ${
              isProMember ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gray-200'
            }`}
          >
            <Crown className={`w-6 h-6 ${isProMember ? 'text-white' : 'text-gray-500'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-dark-900">
              {planInfo.displayName} Membership
            </h3>
            <p className="text-sm text-dark-600">
              {isProMember ? 'Premium benefits active' : 'Explore Pro benefits'}
            </p>
          </div>
        </div>
        {subscription && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              getStatusColor(status) === 'green'
                ? 'bg-green-100 text-green-700'
                : getStatusColor(status) === 'yellow'
                  ? 'bg-yellow-100 text-yellow-700'
                  : getStatusColor(status) === 'red'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
            }`}
          >
            {getStatusLabel(status)}
          </span>
        )}
      </div>

      {isProMember && subscription ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-dark-700">
            <Calendar className="w-4 h-4" />
            <span>
              {subscription.billingInterval === 'MONTHLY' ? 'Monthly' : 'Annual'} plan • ₹
              {subscription.amount}/{formatBillingInterval(subscription.billingInterval)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-dark-700">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>
              Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN')}
            </span>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-yellow-800">Cancellation Scheduled</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Your membership will end on{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-orange-200">
            <Link
              to="/pro"
              className="block w-full text-center px-4 py-2 bg-white border border-orange-300 rounded-lg text-sm font-medium text-orange-700 hover:bg-orange-50 transition-colors"
            >
              Manage Membership
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {planInfo.features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-dark-700">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-dark-200">
            <Link
              to="/pro"
              className="block w-full text-center px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-sm font-semibold text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
            >
              Explore Pro Benefits →
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default UserSubscriptionCard;
