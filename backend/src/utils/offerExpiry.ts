import { GarageOffer, OfferStatus } from '../models/GarageOffer';
import { AssistanceRequest } from '../models/AssistanceRequest';
import { RequestStatus } from '../types';

/**
 * Mark expired offers as EXPIRED
 * This should be called periodically (e.g., every hour via cron job)
 */
export const expireOldOffers = async (): Promise<{ expiredCount: number }> => {
  try {
    const now = new Date();
    
    // Find all pending offers that have expired
    const expiredOffers = await GarageOffer.find({
      status: OfferStatus.PENDING,
      expiresAt: { $lte: now },
    });

    if (expiredOffers.length === 0) {
      return { expiredCount: 0 };
    }

    // Update expired offers
    await GarageOffer.updateMany(
      {
        status: OfferStatus.PENDING,
        expiresAt: { $lte: now },
      },
      {
        $set: {
          status: OfferStatus.EXPIRED,
        },
      }
    );

    // Group expired offers by request ID
    const requestIds = [...new Set(expiredOffers.map(o => o.requestId.toString()))];

    // Check each request to see if all offers expired
    for (const requestId of requestIds) {
      const allOffers = await GarageOffer.find({ requestId });
      const hasActivOffers = allOffers.some(
        o => o.status === OfferStatus.PENDING || o.status === OfferStatus.ACCEPTED
      );

      // If no active offers remain and request is still waiting for offers
      if (!hasActivOffers) {
        const request = await AssistanceRequest.findById(requestId);
        if (
          request &&
          (request.status === RequestStatus.BROADCASTED ||
            request.status === RequestStatus.OFFERS_RECEIVED)
        ) {
          // Mark request as expired
          request.status = RequestStatus.EXPIRED;
          request.statusHistory.push({
            status: RequestStatus.EXPIRED,
            updatedAt: new Date(),
            updatedBy: 'system',
            notes: 'All offers expired without acceptance',
          });
          await request.save();
        }
      }
    }

    console.log(`✓ Expired ${expiredOffers.length} old offers`);
    return { expiredCount: expiredOffers.length };
  } catch (error) {
    console.error('Error expiring old offers:', error);
    throw error;
  }
};

/**
 * Check and expire offers for a specific request
 * Useful when user tries to interact with an offer
 */
export const checkAndExpireRequestOffers = async (requestId: string): Promise<void> => {
  const now = new Date();
  
  await GarageOffer.updateMany(
    {
      requestId,
      status: OfferStatus.PENDING,
      expiresAt: { $lte: now },
    },
    {
      $set: {
        status: OfferStatus.EXPIRED,
      },
    }
  );
};
