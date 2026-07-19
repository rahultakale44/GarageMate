import Razorpay from 'razorpay';

let razorpayInstance: Razorpay | null = null;

export const initializeRazorpay = (): void => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn('⚠️  Razorpay credentials not configured - Payments will not work');
      return;
    }

    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log('✅ Razorpay initialized successfully');
  } catch (error) {
    console.error('❌ Razorpay initialization failed:', error);
  }
};

export const getRazorpayInstance = (): Razorpay => {
  if (!razorpayInstance) {
    throw new Error('Razorpay is not initialized');
  }
  return razorpayInstance;
};
