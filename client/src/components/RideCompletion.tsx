import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Star, DollarSign, MapPin, Clock, User } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface RideCompletionProps {
  rideId: number;
  driver: {
    name: string;
    rating: number;
    totalRides: number;
  };
  ride: {
    pickupAddress: string;
    dropoffAddress: string;
    distance: number;
    duration: number;
    actualFare: number;
  };
  onComplete: () => void;
}

export function RideCompletion({ rideId, driver, ride, onComplete }: RideCompletionProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [tip, setTip] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  const utils = trpc.useUtils();
  
  const completeRideMutation = trpc.ride.complete.useMutation({
    onSuccess: () => {
      utils.ride.getActive.invalidate();
      utils.ride.getMyRides.invalidate();
      toast.success('Thank you for your feedback!');
      onComplete();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit rating');
    },
  });
  
  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    completeRideMutation.mutate({
      rideId,
      rating,
      tip,
      feedback,
    });
  };
  
  const tipOptions = [0, 200, 300, 500, 1000]; // $0, $2, $3, $5, $10
  const totalWithTip = ride.actualFare + tip;
  const rideTokens = 1; // Riders earn 1 RIDE token per ride
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Ride Completed!</CardTitle>
        <CardDescription>How was your experience?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Driver Info */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {driver.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{driver.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{(driver.rating / 100).toFixed(2)} ({driver.totalRides} rides)</span>
            </div>
          </div>
        </div>
        
        {/* Trip Summary */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">Pickup</p>
              <p className="font-medium">{ride.pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">Dropoff</p>
              <p className="font-medium">{ride.dropoffAddress}</p>
            </div>
          </div>
          <div className="flex gap-6 text-sm text-gray-700">
            <span>{ride.distance.toFixed(1)} km</span>
            <span>•</span>
            <span>{ride.duration} min</span>
          </div>
        </div>
        
        <Separator />
        
        {/* Rating */}
        <div className="space-y-3">
          <label className="block font-semibold">Rate your driver</label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className={`h-12 w-12 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
        
        {/* Feedback */}
        <div className="space-y-2">
          <label htmlFor="feedback" className="block font-semibold">
            Additional feedback (optional)
          </label>
          <textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your experience..."
            className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px] resize-none"
            aria-label="Ride feedback"
          />
        </div>
        
        <Separator />
        
        {/* Tip Selection */}
        <div className="space-y-3">
          <label className="block font-semibold">Add a tip (optional)</label>
          <div className="grid grid-cols-5 gap-2">
            {tipOptions.map((amount) => (
              <Button
                key={amount}
                type="button"
                variant={tip === amount ? 'default' : 'outline'}
                onClick={() => setTip(amount)}
                className="w-full"
              >
                {amount === 0 ? 'No tip' : `$${(amount / 100).toFixed(0)}`}
              </Button>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* Receipt */}
        <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Ride fare</span>
            <span className="font-medium">${(ride.actualFare / 100).toFixed(2)}</span>
          </div>
          {tip > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Tip</span>
              <span className="font-medium">${(tip / 100).toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>${(totalWithTip / 100).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3 text-sm text-purple-700 bg-purple-50 p-2 rounded">
            <DollarSign className="h-4 w-4" />
            <span>You earned {rideTokens} RIDE token!</span>
          </div>
        </div>
        
        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={completeRideMutation.isPending || rating === 0}
          className="w-full h-12 text-lg"
        >
          {completeRideMutation.isPending ? 'Submitting...' : 'Complete Ride'}
        </Button>
      </CardContent>
    </Card>
  );
}
