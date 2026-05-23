import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Plus, Check, Loader2 } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import { Review } from '../../types';

interface ReviewSectionProps {
  vehicleId: number;
  canReview?: boolean;
  bookingId?: number;
  onReviewSubmitted?: () => void;
}

export default function ReviewSection({ vehicleId, canReview = false, bookingId, onReviewSubmitted }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewService.getVehicleReviews(vehicleId);
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vehicleId) {
      fetchReviews();
    }
  }, [vehicleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setFormError('Please enter a comment');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await reviewService.submitReview({
        vehicle_id: vehicleId,
        rating,
        comment: comment.trim(),
        booking_id: bookingId
      });
      setSuccess(true);
      setComment('');
      setRating(5);
      await fetchReviews();
      if (onReviewSubmitted) {
        setTimeout(() => {
          onReviewSubmitted();
        }, 1500);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* List of Reviews */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gold/60" />
          Verified Reviews ({reviews.length})
        </h3>

        {loading ? (
          <div className="flex items-center gap-3 text-xs font-medium text-muted p-6 bg-white/5 rounded-lg border border-white/5">
            <Loader2 className="w-4 h-4 animate-spin text-gold" />
            Loading reviews...
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {reviews.map((r, i) => (
              <div key={`review-item-${r.id || i}`} className="p-5 bg-white/5 rounded-lg border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">{r.userName || 'Anonymous Renter'}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={`review-star-${star}-${r.id || i}`}
                        className={`w-3.5 h-3.5 ${
                          star <= r.rating ? 'fill-gold text-gold' : 'text-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted leading-relaxed font-medium">{r.comment}</p>
                <div className="text-[9px] font-bold text-muted/40 font-mono uppercase tracking-wider">{new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white/5 rounded-lg border border-white/5">
            <p className="text-xs text-muted/60 font-bold uppercase tracking-widest">No reviews yet for this vehicle.</p>
          </div>
        )}
      </div>

      {/* Review Write Form */}
      {canReview && !success && (
        <form onSubmit={handleSubmit} className="border-t border-white/10 pt-6 space-y-6">
          <h4 className="text-xs font-black text-gold uppercase tracking-widest">Write a Review</h4>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest block">Rating</label>
            <div className="flex gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={`star-btn-${star}`}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 hover:scale-110 active:scale-95 transition-all text-gold outline-none"
                >
                  <Star
                    className={`w-6 h-6 ${(hoverRating ?? rating) >= star ? 'fill-gold text-gold' : 'text-white/20'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest block">Your Comment</label>
            <textarea
              required
              rows={3}
              placeholder="How was your driving experience? Share details about the vehicle quality, comfort, and service..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-5 py-4 bg-dark-3 border border-white/5 rounded-lg text-sm outline-none focus:border-gold/30 text-white transition-all placeholder:text-muted/20"
            />
          </div>

          {formError && (
            <p className="text-xs font-bold uppercase tracking-wider text-red-400 p-3 bg-red-500/10 rounded border border-red-500/20">{formError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gold text-dark font-black uppercase tracking-widest text-[10px] rounded-lg hover:scale-[1.01] transition-all disabled:opacity-20 active:scale-95"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {success && (
        <div className="p-6 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg flex items-center gap-3 text-xs font-black uppercase tracking-widest animate-pulse">
          <Check className="w-5 h-5 text-green-400" />
          Review Submitted successfully! Thank you.
        </div>
      )}
    </div>
  );
}
