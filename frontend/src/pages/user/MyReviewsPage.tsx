import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Loader2, MessageSquare, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import UserPageLayout from '@/components/layout/UserPageLayout';
import { EmptyState } from '@/components/ui/EmptyState';

interface ReviewRecord {
  _id: string;
  garageId: { _id: string; name: string; address: string; city: string };
  requestId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`w-4 h-4 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-none text-slate-200'}`} />
    ))}
  </div>
);

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
      const res = await axiosInstance.get(API_ENDPOINTS.REVIEWS.MY);
      setReviews(res.data?.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reviews');
      setReviews([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { void fetchReviews(); }, [user?._id]);

  return (
    <UserPageLayout title="My Reviews" subtitle="Your feedback and ratings for garages you've visited.">
      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading reviews…
        </div>
      ) : error ? (
        <EmptyState icon={<AlertCircle className="w-6 h-6 text-red-500" />} title="Unable to load reviews"
          description={error}
          action={<button onClick={() => void fetchReviews()} className="btn-primary text-sm">Try Again</button>} />
      ) : reviews.length === 0 ? (
        <EmptyState icon={<MessageSquare className="w-6 h-6" />} title="No reviews yet"
          description="Complete a service request to leave your first review."
          action={<button onClick={() => navigate('/user/requests')} className="btn-primary text-sm">View Requests</button>} />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="card overflow-hidden">
              {/* Garage header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
                <div className="cursor-pointer" onClick={() => navigate(`/user/garages/${review.garageId._id}`)}>
                  <p className="text-sm font-semibold text-slate-900 hover:text-orange-600 transition-colors">
                    {review.garageId.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {review.garageId.address}, {review.garageId.city}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <StarRating rating={review.rating} />
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Review body */}
              <div className="px-5 py-4">
                {review.comment ? (
                  <p className="text-sm text-slate-700 leading-relaxed">"{review.comment}"</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">No written review.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </UserPageLayout>
  );
};

export default MyReviewsPage;
