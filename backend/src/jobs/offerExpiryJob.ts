import cron from 'node-cron';
import { expireOldOffers } from '../utils/offerExpiry';

/**
 * Schedule offer expiry job
 * Runs every hour to check and expire old offers
 */
export const scheduleOfferExpiryJob = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('Running offer expiry job...');
    try {
      const result = await expireOldOffers();
      if (result.expiredCount > 0) {
        console.log(`✓ Offer expiry job completed: ${result.expiredCount} offers expired`);
      }
    } catch (error) {
      console.error('✗ Offer expiry job failed:', error);
    }
  });

  console.log('✓ Offer expiry job scheduled (runs every hour)');
};
