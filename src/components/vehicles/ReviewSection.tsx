import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Send, User } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import { Review } from '../../types';

interface ReviewSectionProps {
  vehicleId: number;
  canReview?: boolean;
  bookingId?: number;
  onReviewSubmitted?: () => void;
}

export default function ReviewSection({ vehicleId, canReview, bookingId, onReviewSubmitted }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(canReview);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [vehicleId]);

  const fetchReviews = async () => {
    try {
      const data = await reviewService.getVehicleReviews(vehicleId);
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reviewService.submitReview({
        vehicle_id: vehicleId,
        rating,
        comment,
        booking_id: bookingId
      });
      setComment('');
      setRating(5);
      setShowForm(false);
      fetchReviews();
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      console.error('Failed to submit review', err);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="text-xl font-display font-bold flex items-center gap-2 text-white">
          <MessageSquare className="w-5 h-5 text-gold" />
          Customer Reviews ({reviews.length})
        </h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1 text-[11px] font-bold bg-gold text-dark px-2 py-0.5 rounded">
            <Star className="w-3 h-3 fill-current" />
            {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="bg-dark-3 p-6 rounded-xl space-y-4 border border-gold/15"
          >
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Your Perception:</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={`rating-star-btn-${vehicleId}-${num}`}
                    type="button"
                    onClick={() => setRating(num)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        num <= rating ? 'text-gold fill-current' : 'text-white/10'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              required
              placeholder="Record your experience..."
              className="w-full p-4 bg-dark-2 border border-white/5 rounded-lg text-white text-sm focus:border-gold/50 transition-all outline-none min-h-[100px] placeholder:text-muted/20"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              disabled={submitting}
              type="submit"
              className="btn-primary w-full py-4 text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
            >
              {submitting ? 'Archiving...' : (
                <>
                  <Send className="w-3 h-3" />
                  Submit Review
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-muted/40 italic text-xs uppercase tracking-widest font-bold">
            Zero logs found. Be the first to record.
          </div>
        ) : (
          reviews.map((review, i) => (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={`review-${review.id}-${i}`}
              className="bg-dark-1 p-5 rounded-xl border border-white/5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-dark-3 flex items-center justify-center border border-white/5">
                    <User className="w-4 h-4 text-gold/40" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-none mb-1">{review.userName}</h4>
                    <p className="text-[10px] text-muted font-bold tracking-tighter">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={`review-star-${review.id}-${i}`}
                      className={`w-2.5 h-2.5 ${
                        i < review.rating ? 'text-gold fill-current' : 'text-white/5'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed italic border-l border-gold/10 pl-4">
                "{review.comment}"
              </p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
