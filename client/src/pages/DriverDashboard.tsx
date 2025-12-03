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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Become a Driver</CardTitle>
              <CardDescription>
                Join OpenRide as a driver and start earning 87% of fares plus RIDE tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">You haven't applied to be a driver yet.</p>
              <Button onClick={() => toast.info("Driver application coming soon!")}>Apply Now</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (profile.verificationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <AlertCircle className="w-12 h-12 text-yellow-600 mb-4" />
              <CardTitle>Verification Pending</CardTitle>
              <CardDescription>
                Your driver application is under review.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const driverRides = ridesData?.asDriver || [];
  const completedRides = driverRides.filter(r => r.status === 'completed');
  const totalEarnings = completedRides.reduce((sum, r) => sum + (r.driverEarnings || 0), 0);
  const averageRating = profile.averageRating / 100;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8">Driver Dashboard</h1>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Rides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                <span className="text-3xl font-bold">{profile.totalRides}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-3xl font-bold">${(totalEarnings / 100).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                <span className="text-3xl font-bold">{averageRating.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">RIDE Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-3xl font-bold">{user?.rideTokenBalance || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Availability Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Switch
                checked={profile.isAvailable}
                onCheckedChange={(checked) => setAvailability.mutate({ isAvailable: checked })}
              />
              <Label className="text-lg">
                {profile.isAvailable ? (
                  <span className="text-green-600 font-semibold">Available for Rides</span>
                ) : (
                  <span className="text-gray-600">Offline</span>
                )}
              </Label>
            </div>
          </CardContent>
        </Card>

        {activeRide && activeRide.role === 'driver' && (
          <Card className="mb-8 border-blue-500 border-2">
            <CardHeader>
              <CardTitle>Active Ride</CardTitle>
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
                <div className="flex gap-2">
                  {activeRide.ride.status === 'accepted' && (
                    <Button onClick={() => updateRideStatus.mutate({ rideId: activeRide.ride.id, status: 'driver_arriving' })}>
                      I'm On My Way
                    </Button>
                  )}
                  {activeRide.ride.status === 'driver_arriving' && (
                    <Button onClick={() => updateRideStatus.mutate({ rideId: activeRide.ride.id, status: 'in_progress' })}>
                      Start Ride
                    </Button>
                  )}
                  {activeRide.ride.status === 'in_progress' && (
                    <Button onClick={() => updateRideStatus.mutate({ rideId: activeRide.ride.id, status: 'completed' })}>
                      Complete Ride
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {profile.isAvailable && !activeRide && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Available Rides</CardTitle>
            </CardHeader>
            <CardContent>
              {!availableRides || availableRides.length === 0 ? (
                <p className="text-gray-600">No rides available right now.</p>
              ) : (
                <div className="space-y-4">
                  {availableRides.map((ride) => (
                    <Card key={ride.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold mb-1">Pickup: {ride.pickupAddress}</p>
                            <p className="text-gray-600 mb-2">Dropoff: {ride.dropoffAddress}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600 mb-2">
                              ${((ride.estimatedFare || 0) / 100).toFixed(2)}
                            </p>
                            <Button onClick={() => acceptRide.mutate({ rideId: ride.id })}>
                              Accept
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
