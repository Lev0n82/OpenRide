import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MapPin, Navigation, DollarSign, Clock, User, Car, Phone, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type RideStatus = 'searching' | 'matched' | 'driver_arriving' | 'in_progress' | 'completed';

export default function RideBooking() {
  const [, setLocation] = useLocation();
  
  // Location inputs
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  
  // Ride details
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [baseFare, setBaseFare] = useState(0);
  const [totalFare, setTotalFare] = useState(0);
  
  // Ride state
  const [rideStatus, setRideStatus] = useState<RideStatus | null>(null);
  const [currentRideId, setCurrentRideId] = useState<number | null>(null);
  const [matchedDriver, setMatchedDriver] = useState<any>(null);
  
  // Check for active ride
  const { data: activeRideData } = trpc.ride.getActive.useQuery(undefined, {
    refetchInterval: rideStatus ? 3000 : false, // Poll every 3s if ride is active
  });

  // Request ride mutation
  const requestRideMutation = trpc.ride.request.useMutation({
    onSuccess: (data: any) => {
      setCurrentRideId(data.rideId);
      setRideStatus('searching');
      toast.success('Ride requested! Searching for nearby drivers...');
    },
    onError: (error: any) => {
      toast.error(`Failed to request ride: ${error.message}`);
    },
  });

  // Cancel ride mutation
  const cancelRideMutation = trpc.ride.cancel.useMutation({
    onSuccess: () => {
      setRideStatus(null);
      setCurrentRideId(null);
      setMatchedDriver(null);
      toast.success('Ride cancelled');
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel ride: ${error.message}`);
    },
  });

  // Calculate fare when addresses change
  useEffect(() => {
    if (pickupAddress && destinationAddress) {
      // Simulated calculation - in production, use Google Maps Distance Matrix API
      const estimatedDistance = Math.random() * 20 + 5; // 5-25 km
      const estimatedDuration = estimatedDistance * 3; // ~3 min per km in traffic
      const calculatedBaseFare = 5 + (estimatedDistance * 1.5); // $5 base + $1.50/km
      const calculatedTotalFare = calculatedBaseFare * 1.13; // Add 13% network fee

      setDistance(estimatedDistance);
      setDuration(estimatedDuration);
      setBaseFare(calculatedBaseFare);
      setTotalFare(calculatedTotalFare);
    }
  }, [pickupAddress, destinationAddress]);

  // Update ride status based on active ride
  useEffect(() => {
    const activeRide = activeRideData?.ride;
    if (activeRide) {
      setCurrentRideId(activeRide.id);
      
      switch (activeRide.status) {
        case 'requested':
          setRideStatus('searching');
          break;
        case 'accepted':
          setRideStatus('matched');
          // Fetch driver details
          if (activeRide.driverId) {
            // In production, fetch driver profile
            setMatchedDriver({
              name: 'Driver Name',
              rating: 4.8,
              vehicle: 'Toyota Camry',
              licensePlate: 'ABC-1234',
              phone: '+1 (555) 123-4567',
            });
          }
          break;
        case 'driver_arriving':
          setRideStatus('driver_arriving');
          break;
        case 'in_progress':
          setRideStatus('in_progress');
          break;
        case 'completed':
          setRideStatus('completed');
          break;
      }
    } else {
      setRideStatus(null);
      setCurrentRideId(null);
      setMatchedDriver(null);
    }
  }, [activeRideData]);

  const handleRequestRide = () => {
    if (!pickupAddress || !destinationAddress) {
      toast.error('Please enter both pickup and destination addresses');
      return;
    }

    requestRideMutation.mutate({
      pickupAddress,
      dropoffAddress: destinationAddress,
      pickupLat: '43.6532', // Mock coordinates - use geocoding in production
      pickupLng: '-79.3832',
      dropoffLat: '43.7', // Mock coordinates
      dropoffLng: '-79.4',
      estimatedDistance: distance,
      estimatedDuration: duration,
      estimatedFare: totalFare,
    });
  };

  const handleCancelRide = () => {
    if (currentRideId) {
      cancelRideMutation.mutate({ rideId: currentRideId });
    }
  };

  // Render ride status view
  if (rideStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="container max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-6 w-6" />
                Your Ride
              </CardTitle>
              <CardDescription>
                {rideStatus === 'searching' && 'Finding a driver near you...'}
                {rideStatus === 'matched' && 'Driver matched! They are on their way'}
                {rideStatus === 'driver_arriving' && 'Driver is arriving soon'}
                {rideStatus === 'in_progress' && 'Enjoy your ride!'}
                {rideStatus === 'completed' && 'Ride completed'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Badge */}
              <div className="flex justify-center">
                <Badge variant={rideStatus === 'searching' ? 'secondary' : 'default'} className="text-lg px-4 py-2">
                  {rideStatus === 'searching' && '🔍 Searching for driver...'}
                  {rideStatus === 'matched' && '✅ Driver matched'}
                  {rideStatus === 'driver_arriving' && '🚗 Driver arriving'}
                  {rideStatus === 'in_progress' && '🛣️ In progress'}
                  {rideStatus === 'completed' && '✅ Completed'}
                </Badge>
              </div>

              {/* Map Placeholder */}
              <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2" />
                  <p>Map View</p>
                  <p className="text-sm">Real-time tracking will appear here</p>
                </div>
              </div>

              {/* Trip Details */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-semibold">Pickup</p>
                    <p className="text-sm text-gray-600">{pickupAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-red-600 mt-1" />
                  <div>
                    <p className="font-semibold">Destination</p>
                    <p className="text-sm text-gray-600">{destinationAddress}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Driver Details (if matched) */}
              {matchedDriver && (
                <>
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Your Driver
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{matchedDriver.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Rating</p>
                        <p className="font-medium flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {matchedDriver.rating}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Vehicle</p>
                        <p className="font-medium flex items-center gap-1">
                          <Car className="h-4 w-4" />
                          {matchedDriver.vehicle}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">License Plate</p>
                        <p className="font-medium">{matchedDriver.licensePlate}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={`tel:${matchedDriver.phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call Driver
                      </a>
                    </Button>
                  </div>
                  <Separator />
                </>
              )}

              {/* Fare Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Fare</span>
                  <span>${baseFare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Network Fee (13%)</span>
                  <span>${(totalFare - baseFare).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${totalFare.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {rideStatus === 'searching' && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCancelRide}
                    disabled={cancelRideMutation.isPending}
                  >
                    Cancel Request
                  </Button>
                )}
                {rideStatus === 'matched' && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleCancelRide}
                    disabled={cancelRideMutation.isPending}
                  >
                    Cancel Ride
                  </Button>
                )}
                {rideStatus === 'completed' && (
                  <Button
                    className="w-full"
                    onClick={() => setLocation('/rider/rate')}
                  >
                    Rate Your Driver
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render booking form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-6 w-6" />
              Book a Ride
            </CardTitle>
            <CardDescription>
              Enter your pickup and destination to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Map Placeholder */}
            <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-2" />
                <p>Map View</p>
                <p className="text-sm">Select pickup and destination on map</p>
              </div>
            </div>

            {/* Location Inputs */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="pickup" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  Pickup Location
                </Label>
                <Input
                  id="pickup"
                  placeholder="Enter pickup address"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="destination" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-600" />
                  Destination
                </Label>
                <Input
                  id="destination"
                  placeholder="Where are you going?"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Ride Estimate (if addresses entered) */}
            {pickupAddress && destinationAddress && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold">Ride Estimate</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Distance</p>
                        <p className="font-medium">{distance.toFixed(1)} km</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-medium">{Math.round(duration)} min</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base Fare</span>
                      <span>${baseFare.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Insurance (10%)</span>
                      <span>${(baseFare * 0.10).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Developer Fee (2.5%)</span>
                      <span>${(baseFare * 0.025).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Token Buyback (0.5%)</span>
                      <span>${(baseFare * 0.005).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Total Fare
                      </span>
                      <span>${totalFare.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      💰 You'll earn <strong>{Math.round(distance)} RIDE tokens</strong> for completing this ride!
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Request Ride Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleRequestRide}
              disabled={!pickupAddress || !destinationAddress || requestRideMutation.isPending}
            >
              {requestRideMutation.isPending ? 'Requesting...' : 'Request Ride'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
