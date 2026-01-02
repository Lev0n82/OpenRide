import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MapPin, Navigation, DollarSign, Clock, User, Car, Phone, Star, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapView } from '@/components/Map';
import { createPiPayment, isPiSDKAvailable } from '@/lib/pi';

type RideStatus = 'searching' | 'matched' | 'driver_arriving' | 'in_progress' | 'completed';

export default function RideBooking() {
  const [, setLocation] = useLocation();
  const mapRef = useRef<google.maps.Map | null>(null);
  const pickupMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const dropoffMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const driverMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const pickupAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const dropoffAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  // Location inputs
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // Ride details
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [baseFare, setBaseFare] = useState(0);
  const [totalFare, setTotalFare] = useState(0);
  
  // Ride state
  const [rideStatus, setRideStatus] = useState<RideStatus | null>(null);
  const [currentRideId, setCurrentRideId] = useState<number | null>(null);
  const [matchedDriver, setMatchedDriver] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
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
      setDriverLocation(null);
      toast.success('Ride cancelled');
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel ride: ${error.message}`);
    },
  });

  // Initialize map and autocomplete
  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    
    // Initialize directions renderer
    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true, // We'll use custom markers
      polylineOptions: {
        strokeColor: '#4F46E5',
        strokeWeight: 4,
      },
    });
    
    // Initialize autocomplete for pickup
    const pickupInput = document.getElementById('pickup-address') as HTMLInputElement;
    if (pickupInput && window.google) {
      pickupAutocompleteRef.current = new google.maps.places.Autocomplete(pickupInput, {
        fields: ['formatted_address', 'geometry', 'name'],
      });
      
      pickupAutocompleteRef.current.addListener('place_changed', () => {
        const place = pickupAutocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          const location = place.geometry.location;
          setPickupAddress(place.formatted_address || place.name || '');
          setPickupCoords({ lat: location.lat(), lng: location.lng() });
          
          // Add pickup marker
          if (pickupMarkerRef.current) {
            pickupMarkerRef.current.map = null;
          }
          pickupMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: location,
            title: 'Pickup Location',
          });
          
          map.panTo(location);
        }
      });
    }
    
    // Initialize autocomplete for dropoff
    const dropoffInput = document.getElementById('dropoff-address') as HTMLInputElement;
    if (dropoffInput && window.google) {
      dropoffAutocompleteRef.current = new google.maps.places.Autocomplete(dropoffInput, {
        fields: ['formatted_address', 'geometry', 'name'],
      });
      
      dropoffAutocompleteRef.current.addListener('place_changed', () => {
        const place = dropoffAutocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          const location = place.geometry.location;
          setDestinationAddress(place.formatted_address || place.name || '');
          setDropoffCoords({ lat: location.lat(), lng: location.lng() });
          
          // Add dropoff marker
          if (dropoffMarkerRef.current) {
            dropoffMarkerRef.current.map = null;
          }
          dropoffMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: location,
            title: 'Dropoff Location',
          });
        }
      });
    }
  };

  // Calculate route when both locations are set
  useEffect(() => {
    if (pickupCoords && dropoffCoords && mapRef.current && window.google) {
      const directionsService = new google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: pickupCoords,
          destination: dropoffCoords,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK' && result) {
            directionsRendererRef.current?.setDirections(result);
            
            const route = result.routes[0];
            const leg = route.legs[0];
            
            // Extract distance and duration
            const distanceKm = (leg.distance?.value || 0) / 1000;
            const durationMin = (leg.duration?.value || 0) / 60;
            
            // Calculate fare: $5 base + $1.50/km
            const calculatedBaseFare = 5 + (distanceKm * 1.5);
            const calculatedTotalFare = calculatedBaseFare * 1.13; // Add 13% network fee
            
            setDistance(distanceKm);
            setDuration(durationMin);
            setBaseFare(calculatedBaseFare);
            setTotalFare(calculatedTotalFare);
          } else {
            toast.error('Could not calculate route');
          }
        }
      );
    }
  }, [pickupCoords, dropoffCoords]);

  // Update driver location marker
  useEffect(() => {
    if (driverLocation && mapRef.current && window.google) {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.position = driverLocation;
      } else {
        driverMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map: mapRef.current,
          position: driverLocation,
          title: 'Driver Location',
        });
      }
      
      // Pan to driver if ride is in progress
      if (rideStatus === 'driver_arriving' || rideStatus === 'in_progress') {
        mapRef.current.panTo(driverLocation);
      }
    }
  }, [driverLocation, rideStatus]);

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
            // TODO: Fetch actual driver profile
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
          // TODO: Fetch driver location
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
      setDriverLocation(null);
    }
  }, [activeRideData]);

  // Pi payment mutations
  const approvePiPaymentMutation = trpc.pi.approvePayment.useMutation();
  const completePiPaymentMutation = trpc.pi.completePayment.useMutation();

  const handleRequestRide = async () => {
    if (!pickupAddress || !destinationAddress) {
      toast.error('Please enter both pickup and destination addresses');
      return;
    }
    
    if (!pickupCoords || !dropoffCoords) {
      toast.error('Please select valid addresses from the suggestions');
      return;
    }

    // Check if Pi SDK is available
    if (!isPiSDKAvailable()) {
      toast.error('Pi Network SDK not loaded. Please refresh the page.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Create Pi payment first
      const payment = await createPiPayment(
        totalFare,
        `OpenRide: ${pickupAddress} to ${destinationAddress}`,
        {
          rideType: 'standard',
          pickupAddress,
          destinationAddress,
          distance,
          duration,
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            try {
              await approvePiPaymentMutation.mutateAsync({ paymentId });
            } catch (error) {
              console.error('Payment approval failed:', error);
              toast.error('Payment approval failed');
            }
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
            try {
              // Create ride request
              const rideData = await requestRideMutation.mutateAsync({
                pickupAddress,
                dropoffAddress: destinationAddress,
                pickupLat: pickupCoords!.lat.toString(),
                pickupLng: pickupCoords!.lng.toString(),
                dropoffLat: dropoffCoords!.lat.toString(),
                dropoffLng: dropoffCoords!.lng.toString(),
                estimatedDistance: distance,
                estimatedDuration: duration,
                estimatedFare: totalFare,
              });

              // Complete payment
              await completePiPaymentMutation.mutateAsync({
                paymentId,
                txid,
                rideId: rideData.rideId,
                amount: totalFare,
              });

              setPaymentId(paymentId);
              setIsProcessingPayment(false);
              toast.success('Payment completed! Searching for driver...');
            } catch (error) {
              console.error('Payment completion failed:', error);
              toast.error('Payment completion failed');
              setIsProcessingPayment(false);
            }
          },
          onCancel: (paymentId) => {
            setPaymentId(null);
            setIsProcessingPayment(false);
            toast.info('Payment cancelled');
          },
          onError: (error) => {
            console.error('Payment error:', error);
            toast.error(`Payment error: ${error.message}`);
            setIsProcessingPayment(false);
          },
        }
      );

      setPaymentId(payment.identifier);
    } catch (error: any) {
      console.error('Failed to create payment:', error);
      toast.error(`Failed to create payment: ${error.message}`);
      setIsProcessingPayment(false);
    }
  };

  const handleRequestRideOld = () => {
    if (!pickupCoords || !dropoffCoords) return;
    requestRideMutation.mutate({
      pickupAddress,
      dropoffAddress: destinationAddress,
      pickupLat: pickupCoords.lat.toString(),
      pickupLng: pickupCoords.lng.toString(),
      dropoffLat: dropoffCoords.lat.toString(),
      dropoffLng: dropoffCoords.lng.toString(),
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
      <div className="min-h-screen bg-background">
        <a href="#ride-status-content" className="sr-only">
          Skip to ride status
        </a>
        <div className="h-[60vh] relative" role="region" aria-label="Live map showing driver location">
          <MapView
            initialCenter={pickupCoords || { lat: 43.6532, lng: -79.3832 }}
            initialZoom={14}
            onMapReady={handleMapReady}
            className="w-full h-full"
          />
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 right-4 bg-white shadow-lg"
            onClick={handleCancelRide}
            aria-label="Cancel ride"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        
        <main id="ride-status-content" className="container max-w-4xl mx-auto p-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {rideStatus === 'searching' && (
                  <>
                    <Navigation className="h-5 w-5 animate-pulse text-blue-600" aria-hidden="true" />
                    Searching for Driver...
                  </>
                )}
                {rideStatus === 'matched' && (
                  <>
                    <Car className="h-5 w-5 text-green-600" aria-hidden="true" />
                    Driver Found!
                  </>
                )}
                {rideStatus === 'driver_arriving' && (
                  <>
                    <Navigation className="h-5 w-5 text-orange-600" aria-hidden="true" />
                    Driver is on the way
                  </>
                )}
                {rideStatus === 'in_progress' && (
                  <>
                    <Car className="h-5 w-5 text-blue-600" aria-hidden="true" />
                    Ride in Progress
                  </>
                )}
                {rideStatus === 'completed' && (
                  <>
                    <Star className="h-5 w-5 text-yellow-600" aria-hidden="true" />
                    Ride Completed
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {rideStatus === 'searching' && 'We\'re finding the best driver for you...'}
                {rideStatus === 'matched' && 'Your driver is preparing to pick you up'}
                {rideStatus === 'driver_arriving' && 'Your driver will arrive soon'}
                {rideStatus === 'in_progress' && 'Enjoy your ride!'}
                {rideStatus === 'completed' && 'Thank you for riding with OpenRide'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {matchedDriver && (
                <section aria-labelledby="driver-info-heading">
                  <h2 id="driver-info-heading" className="sr-only">Driver Information</h2>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center" aria-hidden="true">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{matchedDriver.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                          <span aria-label={`Driver rating: ${matchedDriver.rating} out of 5 stars`}>{matchedDriver.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{matchedDriver.vehicle}</p>
                      <p className="text-sm text-muted-foreground">{matchedDriver.licensePlate}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm">{matchedDriver.phone}</span>
                    </div>
                    <Button variant="outline" size="sm" aria-label="Call driver">
                      Call Driver
                    </Button>
                  </div>
                </section>
              )}
              
              <Separator />
              
              <section aria-labelledby="trip-details-heading">
                <h2 id="trip-details-heading" className="sr-only">Trip Details</h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" aria-hidden="true" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Pickup</p>
                    <p className="text-sm text-muted-foreground">{pickupAddress}</p>
                  </div>
                </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-red-600" aria-hidden="true" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Dropoff</p>
                      <p className="text-sm text-muted-foreground">{destinationAddress}</p>
                    </div>
                  </div>
                </div>
              </section>
              
              <Separator />
              
              <section aria-labelledby="ride-stats-heading">
                <h2 id="ride-stats-heading" className="sr-only">Ride Statistics</h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold" aria-label={`Distance: ${distance.toFixed(1)} kilometers`}>{distance.toFixed(1)} km</p>
                    <p className="text-sm text-muted-foreground">Distance</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold" aria-label={`Duration: ${Math.round(duration)} minutes`}>{Math.round(duration)} min</p>
                    <p className="text-sm text-muted-foreground">Duration</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold" aria-label={`Total fare: $${totalFare.toFixed(2)}`}>${totalFare.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Total Fare</p>
                  </div>
                </div>
              </section>
              
              {rideStatus === 'searching' && (
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleCancelRide}
                  aria-label="Cancel ride request"
                >
                  Cancel Ride Request
                </Button>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Render booking form
  return (
    <div className="min-h-screen bg-background">
      <a href="#booking-form" className="sr-only">
        Skip to booking form
      </a>
      <div className="h-[60vh] relative" role="region" aria-label="Interactive map for selecting pickup and destination">
        <MapView
          initialCenter={{ lat: 43.6532, lng: -79.3832 }}
          initialZoom={12}
          onMapReady={handleMapReady}
          className="w-full h-full"
        />
      </div>
      
      <main id="booking-form" className="container max-w-4xl mx-auto p-4">
        <Card className="shadow-lg -mt-20 relative z-10">
          <CardHeader>
            <CardTitle>Book a Ride</CardTitle>
            <CardDescription>
              Enter your pickup and destination to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pickup-address">Pickup Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-green-600" aria-hidden="true" />
                <Input
                  id="pickup-address"
                  placeholder="Enter pickup address"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="pl-10"
                  aria-label="Pickup location address"
                  aria-describedby="pickup-help"
                />
                <span id="pickup-help" className="sr-only">Start typing to search for a pickup location</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dropoff-address">Destination</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-red-600" aria-hidden="true" />
                <Input
                  id="dropoff-address"
                  placeholder="Enter destination address"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="pl-10"
                  aria-label="Destination address"
                  aria-describedby="dropoff-help"
                />
                <span id="dropoff-help" className="sr-only">Start typing to search for a destination</span>
              </div>
            </div>
            
            {pickupCoords && dropoffCoords && (
              <section aria-labelledby="fare-estimate-heading">
                <h2 id="fare-estimate-heading" className="sr-only">Fare Estimate</h2>
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-muted-foreground">Distance</p>
                      <p className="font-semibold">{distance.toFixed(1)} km</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-semibold">{Math.round(duration)} min</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 p-4 bg-primary/5 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Base Fare</span>
                    <span>${baseFare.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Network Fee (13%)</span>
                    <span>${(totalFare - baseFare).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${totalFare.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paid with Pi cryptocurrency • Drivers keep 87% of base fare
                  </p>
                </div>
                
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleRequestRide}
                  disabled={requestRideMutation.isPending || isProcessingPayment}
                  aria-label="Request ride and pay with Pi cryptocurrency"
                >
                  {isProcessingPayment ? 'Processing Payment...' : requestRideMutation.isPending ? 'Requesting...' : 'Request Ride with Pi'}
                </Button>
              </section>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
