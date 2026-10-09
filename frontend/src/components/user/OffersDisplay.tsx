import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, DollarSign, MapPin, Star, CheckCircle, Loader2, MessageSquare } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';

interface Offer {
  _id: string;
  estimatedArrivalMinutes: number;
  visitFee: number;
  message?: string;
  status: string;
  createdAt: string;
  garageId: {
    _id: string;
    name: string;
    phone?: string;
    address: string;
    rating?: number;
    reviewCount?: number;
    visitingCharge?: number;
    distance?: number;
  };
}

interface OffersDisplayProps {
  requestId: string;
  offers: Offer[];
  onOfferAccepted: () => void;
}

const OffersDisplay = ({ offers, onOfferAccepted }: OffersDisplayProps) => {
  const [accepting, setAccepting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAcceptOffer = async (offerId: string) => {
    setAccepting(offerId);
    setError(null);

    try {
      await axiosInstance.post(API_ENDPOINTS.OFFERS.ACCEPT(offerId));
      onOfferAccepted();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept offer');
    } finally {
      setAccepting(null);
    }
  };

  const pendingOffers = offers.filter(o => o.status === 'PENDING');
  const acceptedOffer = offers.find(o => o.status === 'ACCEPTED');

  if (offers.length === 0) {
    return (
      <div className="rounded-2xl border border-dark-200 bg-white p-8 text-center">
        <Clock className="w-12 h-12 text-dark-300 mx-auto mb-3" />
        <p className="text-sm text-dark-600 mb-1">No offers yet</p>
        <p className="text-xs text-dark-500">
          Nearby garages have been notified. Offers will appear here.
        </p>
      </div>
    );
  }

  if (acceptedOffer) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
        <div className="flex items-start gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-900 mb-1">
              Offer Accepted
            </h3>
            <p className="text-sm text-green-700">
              You've accepted the offer from {acceptedOffer.garageId.name}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-dark-900">{acceptedOffer.garageId.name}</h4>
            {acceptedOffer.garageId.rating && (
              <span className="flex items-center gap-1 text-sm text-dark-600">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {acceptedOffer.garageId.rating.toFixed(1)}
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-dark-600">ETA</span>
              <span className="font-semibold text-dark-900">
                {acceptedOffer.estimatedArrivalMinutes} minutes
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-600">Visit Fee</span>
              <span className="font-semibold text-dark-900">
                ₹{acceptedOffer.visitFee}
              </span>
            </div>
          </div>

          {acceptedOffer.message && (
            <div className="mt-3 pt-3 border-t border-dark-200">
              <p className="text-xs text-dark-600 mb-1">Message from garage:</p>
              <p className="text-sm text-dark-700">{acceptedOffer.message}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-dark-900">
          Compare Offers ({pendingOffers.length})
        </h3>
        <p className="text-xs text-dark-500">Select the best offer for you</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {pendingOffers.map((offer) => (
          <motion.div
            key={offer._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-dark-200 bg-white p-4 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-dark-900 mb-1">
                  {offer.garageId.name}
                </h4>
                <p className="text-xs text-dark-600 line-clamp-1">
                  {offer.garageId.address}
                </p>
              </div>
              {offer.garageId.rating && (
                <span className="flex items-center gap-1 text-sm text-dark-600">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {offer.garageId.rating.toFixed(1)}
                  {offer.garageId.reviewCount !== undefined && (
                    <span className="text-xs text-dark-500">
                      ({offer.garageId.reviewCount})
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-dark-600">
                  <Clock className="w-4 h-4" />
                  ETA
                </span>
                <span className="font-semibold text-dark-900">
                  {offer.estimatedArrivalMinutes} min
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-dark-600">
                  <DollarSign className="w-4 h-4" />
                  Visit Fee
                </span>
                <span className="font-semibold text-primary-600">
                  ₹{offer.visitFee}
                </span>
              </div>

              {offer.garageId.distance !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-dark-600">
                    <MapPin className="w-4 h-4" />
                    Distance
                  </span>
                  <span className="text-dark-700">
                    {offer.garageId.distance.toFixed(1)} km
                  </span>
                </div>
              )}
            </div>

            {offer.message && (
              <div className="mb-4 p-3 bg-dark-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-dark-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-dark-700">{offer.message}</p>
                </div>
              </div>
            )}

            <button
              onClick={() => handleAcceptOffer(offer._id)}
              disabled={accepting !== null}
              className="w-full rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {accepting === offer._id ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Accept Offer
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OffersDisplay;
