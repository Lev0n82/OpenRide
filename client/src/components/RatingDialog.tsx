import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: number;
  role: 'rider' | 'driver';
  otherPartyName: string;
}

export function RatingDialog({ open, onOpenChange, rideId, role, otherPartyName }: RatingDialogProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const utils = trpc.useUtils();

  const submitRatingMutation = trpc.ride.rate.useMutation({
    onSuccess: () => {
      toast.success('Rating submitted successfully!');
      utils.ride.getActive.invalidate();
      utils.ride.getMyRides.invalidate();
      onOpenChange(false);
      setRating(5);
      setComment('');
    },
    onError: (error: any) => {
      toast.error(`Failed to submit rating: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    submitRatingMutation.mutate({
      rideId,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your {role === 'rider' ? 'Driver' : 'Rider'}</DialogTitle>
          <DialogDescription>
            How was your experience with {otherPartyName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              {rating === 5 && 'Excellent!'}
              {rating === 4 && 'Great'}
              {rating === 3 && 'Good'}
              {rating === 2 && 'Fair'}
              {rating === 1 && 'Poor'}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Additional Comments (Optional)
            </label>
            <Textarea
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {comment.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitRatingMutation.isPending}
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitRatingMutation.isPending || rating === 0}
          >
            {submitRatingMutation.isPending ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
