import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star,
  ArrowLeft,
  Loader2,
  MessageSquare,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';

interface ReviewRecord {
  _id: string;
  garageId: {
    _id: string;
    name: string;
    address: string;
    city: string;
  };
  requestId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const MyReviewsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get(API_ENDPOINTS.REVIEWS.MY);
      setReviews(response.data?.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load reviews';
      setError(message);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReviews();
  }, [user?._id]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-dark-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-dark-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/user/dashboard')}
            className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-dark-900">My Reviews</h1>
              <p className="text-dark-600 mt-2">
                Your feedback and ratings for garages you've visited
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
            <p className="text-dark-600">Loading your reviews...</p>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-red-200 p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-dark-900 mb-2">Unable to Load Reviews</h3>
            <p className="text-dark-600 mb-6">{error}</p>
            <button
              onClick={() => void fetchReviews()}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        ) : reviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-dark-200 p-12 text-center"
          >
            <div className="w-20 h-20 bg-dark-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-10 h-10 text-dark-400" />
            </div>
            <h3 className="text-xl font-semibold text-dark-900 mb-2">No reviews yet</h3>
            <p className="text-dark-600 mb-6">
              You haven't reviewed any garages yet. Complete a service request to leave your first review.
            </p>
            <button
              onClick={() => navigate('/user/requests')}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              View My Requests
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review, index) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-dark-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Garage Header */}
                <div className="p-6 bg-dark-50 border-b border-dark-200">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/user/garages/${review.garageId._id}`)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-dark-900 hover:text-primary-600 transition-colors">
                            {review.garageId.name}
                          </h3>
                          <p className="text-sm text-dark-600">
                            {review.garageId.city}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-dark-500">
                      <Calendar className="w-4 h-4" />
                      {formatDate(review.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {renderStars(review.rating)}
                        <span className="text-lg font-semibold text-dark-900">
                          {review.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {review.comment && (
                      <div className="bg-dark-50 rounded-lg p-4 border border-dark-100">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="w-5 h-5 text-dark-400 flex-shrink-0 mt-0.5" />
                          <p className="text-dark-700 leading-relaxed">{review.comment}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-dark-100">
                    <button
                      onClick={() => navigate(`/user/garages/${review.garageId._id}`)}
                      className="px-4 py-2 border border-dark-300 text-dark-700 rounded-lg font-medium hover:bg-dark-50 transition-colors"
                    >
                      View Garage
                    </button>
                    {review.requestId && (
                      <button
                        onClick={() => navigate(`/user/requests`)}
                        className="px-4 py-2 border border-dark-300 text-dark-700 rounded-lg font-medium hover:bg-dark-50 transition-colors"
                      >
                        View Request
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-white rounded-xl border border-dark-200 p-6"
          >
            <h3 className="text-lg font-semibold text-dark-900 mb-4">Your Review Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-1">
                  {reviews.length}
                </div>
                <div className="text-sm text-dark-600">Total Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-1">
                  {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                </div>
                <div className="text-sm text-dark-600">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-1">
                  {new Set(reviews.map(r => r.garageId._id)).size}
                </div>
                <div className="text-sm text-dark-600">Garages Reviewed</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Info Banner */}
        {reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Thank You for Your Feedback!</h4>
                <p className="text-sm text-blue-700">
                  Your reviews help other users find quality garages and help garages improve their services.
                  Keep sharing your experiences!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyReviewsPage;
