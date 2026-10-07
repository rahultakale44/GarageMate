import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, DollarSign, MessageSquare, Send, Loader2 } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';

interface SubmitOfferModalProps {
  requestId: string;
  requestDetails?: {
    issueCategory?: string;
    address?: string;
    distance?: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const SubmitOfferModal = ({ requestId, requestDetails, onClose, onSuccess }: SubmitOfferModalProps) => {
  const [estimatedArrivalMinutes, setEstimatedArrivalMinutes] = useState('30');
  const [visitFee, setVisitFee] = useState('200');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const eta = parseInt(estimatedArrivalMinutes);
    const fee = parseInt(visitFee);

    if (eta < 5 || eta > 180) {
      setError('ETA must be between 5 and 180 minutes');
      return;
    }

    if (fee < 0) {
      setError('Visit fee cannot be negative');
      return;
    }

    setSubmitting(true);

    try {
      await axiosInstance.post(API_ENDPOINTS.OFFERS.SUBMIT(requestId), {
        estimatedArrivalMinutes: eta,
        visitFee: fee,
        message: message.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit offer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-900">Submit Your Offer</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-dark-600 hover:bg-dark-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {requestDetails && (
          <div className="mb-4 p-3 bg-dark-50 rounded-lg text-sm">
            <p className="text-dark-700 font-medium mb-1">
              {requestDetails.issueCategory?.replace(/_/g, ' ')}
            </p>
            <p className="text-dark-600 text-xs">{requestDetails.address}</p>
            {requestDetails.distance !== undefined && (
              <p className="text-dark-500 text-xs mt-1">
                Distance: {requestDetails.distance.toFixed(1)} km
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-dark-700">
              <Clock className="w-4 h-4" />
              Estimated Arrival Time (minutes) *
            </label>
            <input
              type="number"
              min="5"
              max="180"
              value={estimatedArrivalMinutes}
              onChange={(e) => setEstimatedArrivalMinutes(e.target.value)}
              className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm"
              placeholder="e.g. 30"
              required
            />
            <p className="text-xs text-dark-500">
              Time needed to reach the customer's location (5-180 minutes)
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-dark-700">
              <DollarSign className="w-4 h-4" />
              Visit Fee (₹) *
            </label>
            <input
              type="number"
              min="0"
              step="10"
              value={visitFee}
              onChange={(e) => setVisitFee(e.target.value)}
              className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm"
              placeholder="e.g. 200"
              required
            />
            <p className="text-xs text-dark-500">
              Charge for visiting the customer's location
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-dark-700">
              <MessageSquare className="w-4 h-4" />
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm"
              placeholder="Add a message for the customer (max 500 characters)"
            />
            <p className="text-xs text-dark-500">
              {message.length}/500 characters
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-dark-200 px-4 py-2 text-sm font-medium text-dark-700 hover:bg-dark-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Offer
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SubmitOfferModal;
