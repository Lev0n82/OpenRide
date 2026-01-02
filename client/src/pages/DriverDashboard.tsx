import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Car, DollarSign, Star, TrendingUp, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function DriverDashboard() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: profile } = trpc.driver.getMyProfile.useQuery();
  const { data: ridesData } = trpc.ride.getMyRides.useQuery();
  const { data: activeRide } = trpc.ride.getActive.useQuery();

  const setAvailability = trpc.driver.setAvailability.useMutation({
    onSuccess: () => {
      utils.driver.getMyProfile.invalidate();
      toast.success("Availability updated");
    },
  });

  const acceptRide = trpc.ride.accept.useMutation({
    onSuccess: () => {
      utils.ride.getActive.invalidate();
      utils.ride.getAvailable.invalidate();
      toast.success("Ride accepted!");
    },
  });

  const updateRideStatus = trpc.ride.updateStatus.useMutation({
    onSuccess: () => {
      utils.ride.getActive.invalidate();
      utils.ride.getMyRides.invalidate();
      toast.success("Ride status updated");
    },
  });

  const { data: availableRides } = trpc.ride.getAvailable.useQuery(undefined, {
    enabled: profile?.verificationStatus === 'approved' && profile?.isAvailable,
    refetchInterval: 5000,
  });

  if (!profile) {
    return (
      <>
        <a href="#main-content" className="sr-only">
          Skip to main content
        </a>
        <div className="min-h-screen bg-gray-50 p-8">
          <main id="main-content" className="container mx-auto max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle>Become a Driver</CardTitle>
                <CardDescription>
                  Join OpenRide as a driver and start earning 87% of fares plus RIDE tokens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">You haven't applied to be a driver yet.</p>
                <Button onClick={() => toast.info("Driver application coming soon!")} aria-label="Apply to become a driver">Apply Now</Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </>
    );
  }

  if (profile.verificationStatus === 'pending') {
    return (
      <>
        <a href="#main-content" className="sr-only">
          Skip to main content
        </a>
        <div className="min-h-screen bg-gray-50 p-8">
          <main id="main-content" className="container mx-auto max-w-4xl">
            <Card>
              <CardHeader>
                <AlertCircle className="w-12 h-12 text-yellow-600 mb-4" aria-hidden="true" />
                <CardTitle>Verification Pending</CardTitle>
                <CardDescription>
                  Your driver application is under review.
                </CardDescription>
              </CardHeader>
            </Card>
          </main>
        </div>
      </>
    );
  }

  const driverRides = ridesData?.asDriver || [];
  const completedRides = driverRides.filter(r => r.status === 'completed');
  const totalEarnings = completedRides.reduce((sum, r) => sum + (r.driverEarnings || 0), 0);
  const averageRating = profile.averageRating / 100;

  return (
    <>
      <a href="#main-content" className="sr-only">
        Skip to main content
      </a>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto">
          <header>
            <h1 className="text-4xl font-bold mb-8">Driver Dashboard</h1>
          </header>

          <main id="main-content">
            {/* Stats Section */}
            <section aria-labelledby="stats-heading" className="mb-8">
              <h2 id="stats-heading" className="sr-only">Driver Statistics</h2>
              <div className="grid md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Rides</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Car className="w-5 h-5 text-blue-600" aria-hidden="true" />
                      <span className="text-3xl font-bold" aria-label={`${profile.totalRides} total rides completed`}>{profile.totalRides}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" aria-hidden="true" />
                      <span className="text-3xl font-bold" aria-label={`$${(totalEarnings / 100).toFixed(2)} total earnings`}>${(totalEarnings / 100).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Average Rating</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" aria-hidden="true" />
                      <span className="text-3xl font-bold" aria-label={`${averageRating.toFixed(2)} out of 5 stars average rating`}>{averageRating.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">RIDE Tokens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" aria-hidden="true" />
                      <span className="text-3xl font-bold" aria-label={`${user?.rideTokenBalance || 0} RIDE tokens`}>{user?.rideTokenBalance || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Availability Section */}
            <section aria-labelledby="availability-heading" className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle id="availability-heading">Availability Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Switch
                      id="availability-toggle"
                      checked={profile.isAvailable}
                      onCheckedChange={(checked) => setAvailability.mutate({ isAvailable: checked })}
                      aria-label={profile.isAvailable ? "Currently available for rides. Toggle to go offline." : "Currently offline. Toggle to become available for rides."}
                    />
                    <Label htmlFor="availability-toggle" className="text-lg">
                      {profile.isAvailable ? (
                        <span className="text-green-600 font-semibold">Available for Rides</span>
                      ) : (
                        <span className="text-gray-600">Offline</span>
                      )}
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Active Ride Section */}
            {activeRide && activeRide.role === 'driver' && (
              <section aria-labelledby="active-ride-heading" className="mb-8">
                <Card className="border-blue-500 border-2">
                  <CardHeader>
                    <CardTitle id="active-ride-heading">Active Ride</CardTitle>
                    <Badge>{activeRide.ride.status}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="font-semibold">Pickup:</p>
                        <p className="text-gray-600">{activeRide.ride.pickupAddress}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Dropoff:</p>
                        <p className="text-gray-600">{activeRide.ride.dropoffAddress}</p>
                      </div>
                      <nav aria-label="Ride status actions" className="flex gap-2">
                        {activeRide.ride.status === 'accepted' && (
                          <Button 
                            onClick={() => updateRideStatus.mutate({ rideId: activeRide.ride.id, status: 'driver_arriving' })}
                            aria-label="Update status to on my way"
                          >
                            I'm On My Way
                          </Button>
                        )}
                        {activeRide.ride.status === 'driver_arriving' && (
                          <Button 
                            onClick={() => updateRideStatus.mutate({ rideId: activeRide.ride.id, status: 'in_progress' })}
                            aria-label="Start the ride"
                          >
                            Start Ride
                          </Button>
                        )}
                        {activeRide.ride.status === 'in_progress' && (
                          <Button 
                            onClick={() => updateRideStatus.mutate({ rideId: activeRide.ride.id, status: 'completed' })}
                            aria-label="Complete the ride"
                          >
                            Complete Ride
                          </Button>
                        )}
                      </nav>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Available Rides Section */}
            {profile.isAvailable && !activeRide && (
              <section aria-labelledby="available-rides-heading" className="mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle id="available-rides-heading">Available Rides</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!availableRides || availableRides.length === 0 ? (
                      <p className="text-gray-600" role="status">No rides available right now.</p>
                    ) : (
                      <ul className="space-y-4" aria-label="List of available rides">
                        {availableRides.map((ride) => (
                          <li key={ride.id}>
                            <Card>
                              <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-semibold mb-1">Pickup: {ride.pickupAddress}</p>
                                    <p className="text-gray-600 mb-2">Dropoff: {ride.dropoffAddress}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-green-600 mb-2" aria-label={`Fare: $${((ride.estimatedFare || 0) / 100).toFixed(2)}`}>
                                      ${((ride.estimatedFare || 0) / 100).toFixed(2)}
                                    </p>
                                    <Button 
                                      onClick={() => acceptRide.mutate({ rideId: ride.id })}
                                      aria-label={`Accept ride from ${ride.pickupAddress} to ${ride.dropoffAddress}`}
                                    >
                                      Accept
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
