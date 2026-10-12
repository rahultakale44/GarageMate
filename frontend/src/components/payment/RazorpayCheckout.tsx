import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { createSubscriptionOrder, verifySubscriptionPayment } from '@/services/subscriptionService';
import type { SubscriptionPlan, BillingInterval } from '@/types/subscription';

// Razorpay script types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  plan: SubscriptionPlan;
  billingInterval: BillingInterval;
  amount: number; // Display amount (not used in API, backend determines price)
  garageId?: string;
  onSuccess: () => void;
  onClose: () => void;
}

type PaymentState = 'idle' | 'creating-order' | 'processing-payment' | 'verifying' | 'success' | 'error';

const RazorpayCheckout = ({ 
  plan, 
  billingInterval, 
  garageId,
  onSuccess, 
  onClose 
}: RazorpayCheckoutProps) => {
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => {
      setPaymentState('error');
      setErrorMessage('Failed to load payment gateway. Please check your internet connection.');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Auto-initiate payment when Razorpay loads
  useEffect(() => {
    if (razorpayLoaded && paymentState === 'idle') {
      void handleInitiatePayment();
    }
  }, [razorpayLoaded, paymentState]);

  const handleInitiatePayment = async () => {
    setPaymentState('creating-order');
    setErrorMessage(null);

    try {
      // Create order on backend
      const orderData = await createSubscriptionOrder({
        plan,
        billingInterval,
        garageId,
      });

      // Open Razorpay checkout
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!razorpayKeyId) {
        throw new Error('Razorpay key not configured. Please contact support.');
      }

      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'GarageMate Pro',
        description: `${plan} - ${billingInterval}`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          setPaymentState('verifying');

          try {
            // Verify payment on backend
            await verifySubscriptionPayment({
              orderId: orderData.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              subscriptionId: orderData.subscriptionId,
            });

            setPaymentState('success');
            
            // Wait a moment to show success message
            setTimeout(() => {
              onSuccess();
            }, 1500);
          } catch (error: any) {
            setPaymentState('error');
            setErrorMessage(
              error.response?.data?.message || 
              'Payment verification failed. Please contact support with your payment ID.'
            );
          }
        },
        modal: {
          ondismiss: () => {
            if (paymentState !== 'success' && paymentState !== 'verifying') {
              setPaymentState('error');
              setErrorMessage('Payment cancelled. You can try again anytime.');
            }
          },
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#f97316', // GarageMate orange
        },
      };

      setPaymentState('processing-payment');

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      setPaymentState('error');
      setErrorMessage(
        error.response?.data?.message || 
        error.message || 
        'Failed to initiate payment. Please try again.'
      );
    }
  };

  const handleRetry = () => {
    setPaymentState('idle');
    setErrorMessage(null);
    void handleInitiatePayment();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Creating Order */}
        {(paymentState === 'idle' || paymentState === 'creating-order') && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-900 mb-2">
              Preparing Payment...
            </h3>
            <p className="text-sm text-dark-600">
              Please wait while we set up your secure payment
            </p>
          </div>
        )}

        {/* Processing Payment */}
        {paymentState === 'processing-payment' && (
          <div className="text-center py-8">
            <div className="h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-900 mb-2">
              Payment in Progress
            </h3>
            <p className="text-sm text-dark-600">
              Please complete the payment in the Razorpay window
            </p>
          </div>
        )}

        {/* Verifying Payment */}
        {paymentState === 'verifying' && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-900 mb-2">
              Verifying Payment...
            </h3>
            <p className="text-sm text-dark-600">
              Please wait while we confirm your payment
            </p>
          </div>
        )}

        {/* Success */}
        {paymentState === 'success' && (
          <div className="text-center py-8">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-dark-900 mb-2">
              Payment Successful!
            </h3>
            <p className="text-sm text-dark-600">
              Your subscription is now active
            </p>
          </div>
        )}

        {/* Error */}
        {paymentState === 'error' && (
          <div className="text-center py-6">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-dark-900 mb-2">
              Payment Failed
            </h3>
            <p className="text-sm text-dark-600 mb-6">
              {errorMessage || 'Something went wrong. Please try again.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-dark-300 rounded-lg text-sm font-medium text-dark-700 hover:bg-dark-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RazorpayCheckout;
