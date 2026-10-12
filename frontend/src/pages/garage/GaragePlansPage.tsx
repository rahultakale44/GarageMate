import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check, Crown, Building2, TrendingUp, Users, BarChart3, 
  Megaphone, Shield, Home, Loader2
} from 'lucide-react';
import GarageMateLogoIcon from '@/components/shared/GarageMateLogoIcon';
import RazorpayCheckout from '@/components/payment/RazorpayCheckout';
import { useAuth } from '@/context/AuthContext';
import { getMySubscription } from '@/services/subscriptionService';
import { SubscriptionPlan, BillingInterval } from '@/types/subscription';
import type { MySubscriptionResponse } from '@/types/subscription';
import axiosInstance from '@/lib/axios';

const GaragePlansPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<MySubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch current subscription status if authenticated
  useEffect(() => {
    if (isAuthenticated && user?.role === 'GARAGE_OWNER') {
      void fetchSubscription();
    }
  }, [isAuthenticated, user]);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const data = await getMySubscription();
      setSubscriptionData(data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = async (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      // Redirect to login
      navigate('/auth/garage/login');
      return;
    }

    if (user?.role !== 'GARAGE_OWNER') {
      alert('Partner plans are only available for garage owners. Please log in with a garage owner account.');
      return;
    }

    // Check if already has active subscription for this plan
    if (subscriptionData && subscriptionData.plan === plan && subscriptionData.status === 'ACTIVE') {
      alert('You already have an active subscription for this plan!');
      return;
    }

    // Fetch garage ID first
    try {
      setLoading(true);
      const garageResponse = await axiosInstance.get('/garages/my-garage');
      const garageId = garageResponse.data?.data?._id;
      
      if (!garageId) {
        alert('Unable to find your garage. Please contact support.');
        return;
      }

      // Store garageId temporarily for payment
      sessionStorage.setItem('garageIdForPayment', garageId);

      // Set selected plan and open payment modal
      setSelectedPlan(plan);
      setShowPayment(true);
    } catch (error: any) {
      console.error('Failed to fetch garage:', error);
      alert(error.response?.data?.message || 'Failed to fetch garage information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setSelectedPlan(null);
    sessionStorage.removeItem('garageIdForPayment');
    void fetchSubscription();
    
    // Show success and redirect to dashboard
    alert('Welcome to GarageMate Partner Pro! Your subscription is now active.');
    navigate('/garage/dashboard');
  };

  const handlePaymentClose = () => {
    setShowPayment(false);
    setSelectedPlan(null);
    sessionStorage.removeItem('garageIdForPayment');
  };

  const getPlanAmount = (plan: SubscriptionPlan): number => {
    const pricing: Record<SubscriptionPlan, { monthly: number; annual: number }> = {
      [SubscriptionPlan.PARTNER_PRO]: { monthly: 499, annual: 4999 },
      [SubscriptionPlan.PARTNER_BUSINESS]: { monthly: 1499, annual: 14999 },
      [SubscriptionPlan.DRIVER_PRO]: { monthly: 199, annual: 1999 },
      [SubscriptionPlan.DRIVER_FREE]: { monthly: 0, annual: 0 },
      [SubscriptionPlan.PARTNER_FREE]: { monthly: 0, annual: 0 },
    };

    return pricing[plan]?.[billingInterval] || 0;
  };

  type PlanFeature = {
    text: string;
    included: boolean;
    bold?: boolean;
  };

  type Plan = {
    name: string;
    price: { monthly: number; annual: number };
    description: string;
    features: PlanFeature[];
    cta: string;
    color: string;
    popular?: boolean;
    note?: string;
  };

  const plans: Record<string, Plan> = {
    free: {
      name: 'Free Partner',
      price: { monthly: 0, annual: 0 },
      description: 'Get started with basic garage listing',
      features: [
        { text: 'Basic garage profile', included: true },
        { text: 'Garage discovery listing', included: true },
        { text: 'Receive service requests', included: true },
        { text: 'Basic request management', included: true },
        { text: 'Enhanced profile customization', included: false },
        { text: 'Service catalogue management', included: false },
        { text: 'Business analytics', included: false },
        { text: 'Promotional tools', included: false },
        { text: 'Priority listing', included: false },
        { text: 'Multiple staff accounts', included: false },
      ],
      cta: 'Current Plan',
      color: 'dark',
    },
    pro: {
      name: 'Partner Pro',
      price: { monthly: 499, annual: 4999 },
      description: 'Grow your business with advanced features',
      popular: true,
      features: [
        { text: 'Everything in Free, plus:', included: true, bold: true },
        { text: 'Enhanced garage profile', included: true },
        { text: 'Complete service catalogue', included: true },
        { text: 'Request and lead history', included: true },
        { text: 'Business performance analytics', included: true },
        { text: 'Promotional tools and offers', included: true },
        { text: 'Priority customer support', included: true },
        { text: 'Billing management', included: true },
        { text: 'Customer insights', included: true },
        { text: 'Up to 3 staff accounts', included: true },
      ],
      cta: 'Upgrade to Pro',
      color: 'orange',
    },
    business: {
      name: 'Partner Business',
      price: { monthly: 1499, annual: 14999 },
      description: 'Enterprise solution for multi-location businesses',
      features: [
        { text: 'Everything in Pro, plus:', included: true, bold: true },
        { text: 'Advanced analytics dashboard', included: true },
        { text: 'Multi-location management', included: true },
        { text: 'Unlimited staff accounts', included: true },
        { text: 'Custom branding options', included: true },
        { text: 'API access for integrations', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Priority feature requests', included: true },
        { text: 'White-label reports', included: true },
        { text: 'Advanced business intelligence', included: true },
      ],
      cta: 'Contact Sales',
      color: 'blue',
      note: 'Some features in development',
    },
  };

  const benefits = [
    {
      icon: BarChart3,
      title: 'Business Analytics',
      description: 'Track performance, revenue, and customer satisfaction in real-time',
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Manage mechanics, assign tasks, and monitor team productivity',
    },
    {
      icon: Megaphone,
      title: 'Marketing Tools',
      description: 'Create offers, promotions, and reach more customers effectively',
    },
    {
      icon: TrendingUp,
      title: 'Growth Insights',
      description: 'Get actionable insights to grow your garage business',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-dark-900 to-dark-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-dark-900 to-dark-800 border-b-2 border-orange-500/30 sticky top-0 z-30">
        <div className="container-custom flex items-center justify-between p-4">
          <Link to="/" className="hover:scale-105 transition-transform">
            <GarageMateLogoIcon size={45} showText={true} />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/garage/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
            >
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border-2 border-orange-500/30 rounded-full mb-6">
            <Building2 className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-semibold text-orange-400">Partner Plans</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Choose the Right Plan for Your Garage
          </h1>
          <p className="text-xl text-dark-400 max-w-2xl mx-auto">
            From basic listings to enterprise solutions, we have a plan for every garage business
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-3 p-2 bg-dark-800 border-2 border-dark-700 rounded-full">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingInterval === 'monthly'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('annual')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingInterval === 'annual'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Annual
              {billingInterval === 'annual' && (
                <span className="ml-2 text-xs text-orange-200 font-semibold">Save 17%</span>
              )}
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {Object.entries(plans).map(([key, plan], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-2xl border-2 p-8 ${
                plan.popular
                  ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500 shadow-2xl scale-105'
                  : 'bg-dark-800 border-dark-700'
              } relative`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full shadow-lg">
                    <Crown className="w-4 h-4" />
                    <span className="text-xs font-semibold">Most Popular</span>
                  </div>
                </div>
              )}

              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-dark-400 mb-6">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">
                  ₹{plan.price[billingInterval]}
                </span>
                <span className="text-dark-400 ml-2">
                  /{billingInterval === 'monthly' ? 'month' : 'year'}
                </span>
                {billingInterval === 'annual' && plan.price.annual > 0 && (
                  <div className="mt-1 text-sm text-green-400">
                    Save ₹{(plan.price.monthly * 12) - plan.price.annual}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (key === 'free') {
                    // Free plan - redirect to dashboard or register
                    if (isAuthenticated) {
                      navigate('/garage/dashboard');
                    } else {
                      navigate('/auth/garage/register');
                    }
                  } else if (key === 'pro') {
                    handleUpgradeClick(SubscriptionPlan.PARTNER_PRO);
                  } else if (key === 'business') {
                    // Business plan - could be payment or contact sales
                    alert('Partner Business plan features are coming soon! Contact sales for early access.');
                  }
                }}
                disabled={loading}
                className={`w-full py-3 px-6 rounded-lg font-semibold mb-8 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.popular
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl'
                    : 'bg-dark-700 text-white hover:bg-dark-600'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                  </span>
                ) : key === 'free' && subscriptionData && subscriptionData.plan === SubscriptionPlan.PARTNER_FREE ? (
                  plan.cta
                ) : key === 'pro' && subscriptionData && subscriptionData.plan === SubscriptionPlan.PARTNER_PRO ? (
                  'Current Plan'
                ) : key === 'business' && subscriptionData && subscriptionData.plan === SubscriptionPlan.PARTNER_BUSINESS ? (
                  'Current Plan'
                ) : (
                  plan.cta
                )}
              </button>

              <div className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      feature.included ? 'text-green-400' : 'text-dark-600'
                    }`} />
                    <span className={`text-sm ${
                      feature.bold ? 'font-semibold text-white' : 'text-dark-300'
                    }`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {plan.note && (
                <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-xs text-blue-300">{plan.note}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Upgrade Your Plan?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-dark-800 border-2 border-dark-700 rounded-xl p-6 hover:border-orange-500/50 transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-sm text-dark-400">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trust Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center bg-dark-800 border-2 border-dark-700 rounded-2xl p-8"
        >
          <Shield className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Flexible and Transparent Pricing
          </h3>
          <p className="text-dark-400 max-w-2xl mx-auto">
            ✓ No hidden fees • ✓ Cancel anytime • ✓ Secure payment processing • ✓ Money-back guarantee
          </p>
        </motion.div>
      </div>

      {/* Payment Modal */}
      {showPayment && selectedPlan && (
        <RazorpayCheckout
          plan={selectedPlan}
          billingInterval={billingInterval === 'monthly' ? BillingInterval.MONTHLY : BillingInterval.ANNUAL}
          amount={getPlanAmount(selectedPlan)}
          garageId={sessionStorage.getItem('garageIdForPayment') || undefined}
          onSuccess={handlePaymentSuccess}
          onClose={handlePaymentClose}
        />
      )}
    </div>
  );
};

export default GaragePlansPage;
