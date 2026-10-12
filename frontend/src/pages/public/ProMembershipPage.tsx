import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Check, X, Crown, Shield, Bell, History, Users, 
  TrendingUp, ArrowRight, Sparkles, Loader2 
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RazorpayCheckout from '@/components/payment/RazorpayCheckout';
import { useAuth } from '@/context/AuthContext';
import { getMySubscription } from '@/services/subscriptionService';
import { SubscriptionPlan, BillingInterval } from '@/types/subscription';
import type { MySubscriptionResponse } from '@/types/subscription';

const ProMembershipPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [showPayment, setShowPayment] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<MySubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch current subscription status if authenticated
  useEffect(() => {
    if (isAuthenticated && user?.role === 'USER') {
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

  const handleUpgradeClick = () => {
    if (!isAuthenticated) {
      // Redirect to login
      navigate('/auth/user/login');
      return;
    }

    if (user?.role !== 'USER') {
      alert('Pro membership is only available for drivers. Please log in with a driver account.');
      return;
    }

    // Check if already has active subscription
    if (subscriptionData && subscriptionData.plan === SubscriptionPlan.DRIVER_PRO && subscriptionData.status === 'ACTIVE') {
      alert('You already have an active Pro subscription!');
      return;
    }

    // Open payment modal
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    void fetchSubscription();
    
    // Show success and redirect to dashboard
    alert('Welcome to GarageMate Pro! Your subscription is now active.');
    navigate('/user/dashboard');
  };

  const handlePaymentClose = () => {
    setShowPayment(false);
  };

  const features = {
    free: [
      { name: 'Emergency assistance requests', included: true },
      { name: 'Find nearby garages', included: true },
      { name: 'Basic vehicle management', included: true },
      { name: 'Service history tracking', included: false },
      { name: 'Maintenance reminders', included: false },
      { name: 'Family vehicle management', included: false },
      { name: 'Member discounts', included: false },
      { name: 'Priority support', included: false },
    ],
    pro: [
      { name: 'Emergency assistance requests', included: true },
      { name: 'Find nearby garages', included: true },
      { name: 'Advanced vehicle management', included: true },
      { name: 'Complete service history', included: true },
      { name: 'Automated maintenance reminders', included: true },
      { name: 'Manage family vehicles', included: true },
      { name: 'Exclusive member discounts', included: true },
      { name: 'Priority request matching', included: true },
    ],
  };

  const proPerks = [
    {
      icon: History,
      title: 'Complete Service History',
      description: 'Track every service, repair, and maintenance across all your vehicles in one place',
    },
    {
      icon: Bell,
      title: 'Smart Reminders',
      description: 'Never miss an oil change, insurance renewal, or periodic maintenance',
    },
    {
      icon: Users,
      title: 'Family Management',
      description: 'Add and manage vehicles for your entire family with shared access',
    },
    {
      icon: TrendingUp,
      title: 'Member Discounts',
      description: 'Get exclusive discounts at participating garages across your city',
    },
  ];

  const pricing = {
    monthly: { amount: 199, period: 'month', savings: null },
    annual: { amount: 1999, period: 'year', savings: '₹400' },
  };

  const currentPricing = pricing[billingInterval];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-orange-50 via-white to-orange-50/30 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f97316_1px,transparent_1px),linear-gradient(to_bottom,#f97316_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </div>
        
        <div className="container-custom relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 border-2 border-orange-200 rounded-full mb-6">
              <Crown className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700">GarageMate Pro</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-display font-bold text-dark-900 mb-6">
              Elevate Your Vehicle Care Experience
            </h1>
            
            <p className="text-xl text-dark-600 mb-8">
              Get advanced features, exclusive benefits, and priority support for all your vehicles
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Shield className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-dark-600">Cancel anytime</span>
              <span className="text-dark-300">•</span>
              <span className="text-sm text-dark-600">No hidden fees</span>
              <span className="text-dark-300">•</span>
              <span className="text-sm text-dark-600">Instant activation</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-3 p-2 bg-dark-100 rounded-full">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  billingInterval === 'monthly'
                    ? 'bg-white text-dark-900 shadow-md'
                    : 'text-dark-600 hover:text-dark-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('annual')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  billingInterval === 'annual'
                    ? 'bg-white text-dark-900 shadow-md'
                    : 'text-dark-600 hover:text-dark-900'
                }`}
              >
                Annual
                {billingInterval === 'annual' && (
                  <span className="ml-2 text-xs text-green-600 font-semibold">Save ₹400</span>
                )}
              </button>
            </div>
          </div>

          {/* Plans Comparison */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl border-2 border-dark-200 p-8"
            >
              <h3 className="text-2xl font-bold text-dark-900 mb-2">Free</h3>
              <p className="text-dark-600 mb-6">Essential features for basic vehicle care</p>
              
              <div className="mb-8">
                <span className="text-5xl font-bold text-dark-900">₹0</span>
                <span className="text-dark-600 ml-2">forever</span>
              </div>

              <Link
                to="/auth/user/register"
                className="block w-full py-3 px-6 border-2 border-dark-300 text-dark-900 text-center rounded-lg font-medium hover:bg-dark-50 transition-all mb-8"
              >
                Get Started Free
              </Link>

              <div className="space-y-4">
                {features.free.map((feature) => (
                  <div key={feature.name} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-dark-300 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? 'text-dark-700' : 'text-dark-400'}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl border-2 border-orange-400 p-8 text-white relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-semibold">Popular</span>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-orange-100 mb-6">Complete vehicle care with premium features</p>
              
              <div className="mb-8">
                <span className="text-5xl font-bold">₹{currentPricing.amount}</span>
                <span className="text-orange-100 ml-2">/{currentPricing.period}</span>
                {currentPricing.savings && (
                  <div className="mt-2">
                    <span className="text-sm text-orange-100">Save {currentPricing.savings} annually</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleUpgradeClick}
                disabled={loading}
                className="block w-full py-3 px-6 bg-white text-orange-600 text-center rounded-lg font-semibold hover:bg-orange-50 transition-all mb-8 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                  </span>
                ) : subscriptionData && subscriptionData.plan === SubscriptionPlan.DRIVER_PRO ? (
                  'Manage Subscription'
                ) : (
                  <>
                    Upgrade to Pro
                    <ArrowRight className="w-5 h-5 inline-block ml-2" />
                  </>
                )}
              </button>

              <div className="space-y-4">
                {features.pro.map((feature) => (
                  <div key={feature.name} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span>{feature.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-sm text-dark-600">
              ✓ Secure payment processing • ✓ Cancel anytime • ✓ Money-back guarantee
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pro Perks */}
      <section className="py-20 bg-gradient-to-br from-dark-50 to-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-dark-900 mb-4">
              Why Choose Pro?
            </h2>
            <p className="text-lg text-dark-600 max-w-2xl mx-auto">
              Get exclusive features designed to make vehicle care effortless
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {proPerks.map((perk, index) => (
              <motion.div
                key={perk.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border-2 border-orange-200 p-6 hover:border-orange-400 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                  <perk.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-dark-900 mb-2">{perk.title}</h3>
                <p className="text-sm text-dark-600">{perk.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="container-custom max-w-3xl">
          <h2 className="text-3xl font-display font-bold text-dark-900 mb-12 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="border-2 border-dark-200 rounded-lg p-6">
              <h3 className="font-semibold text-dark-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-dark-600">
                Yes! You can cancel your subscription at any time. You'll continue to have access to Pro features until the end of your current billing period.
              </p>
            </div>

            <div className="border-2 border-dark-200 rounded-lg p-6">
              <h3 className="font-semibold text-dark-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-dark-600">
                We accept all major credit/debit cards, UPI, net banking, and digital wallets through our secure payment partner Razorpay.
              </p>
            </div>

            <div className="border-2 border-dark-200 rounded-lg p-6">
              <h3 className="font-semibold text-dark-900 mb-2">How do member discounts work?</h3>
              <p className="text-dark-600">
                Pro members get exclusive discounts at participating garages. Discounts are automatically applied when you book services through verified partner garages.
              </p>
            </div>

            <div className="border-2 border-dark-200 rounded-lg p-6">
              <h3 className="font-semibold text-dark-900 mb-2">Is there a free trial?</h3>
              <p className="text-dark-600">
                You can use GarageMate's core features for free. Pro features require a paid subscription, but we offer a money-back guarantee if you're not satisfied.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Ready to Upgrade?
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Join thousands of drivers who trust GarageMate Pro for their vehicle care
            </p>
            <button
              onClick={handleUpgradeClick}
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-orange-600 rounded-full font-semibold text-lg hover:bg-orange-50 transition-all shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Get Started with Pro'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Payment Modal */}
      {showPayment && (
        <RazorpayCheckout
          plan={SubscriptionPlan.DRIVER_PRO}
          billingInterval={billingInterval === 'monthly' ? BillingInterval.MONTHLY : BillingInterval.ANNUAL}
          amount={currentPricing.amount}
          onSuccess={handlePaymentSuccess}
          onClose={handlePaymentClose}
        />
      )}
    </div>
  );
};

export default ProMembershipPage;
