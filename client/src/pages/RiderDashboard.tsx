import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { MapPin, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function RiderDashboard() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: ridesData } = trpc.ride.getMyRides.useQuery();
  const { data: activeRide } = trpc.ride.getActive.useQuery();

  const riderRides = ridesData?.asRider || [];
  const completedRides = riderRides.filter(r => r.status === 'completed');

  return (
    <>
      <a href="#main-content" className="sr-only">
        Skip to main content
      </a>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto">
          <header>
            <h1 className="text-4xl font-bold mb-8">Rider Dashboard</h1>
          </header>

          <main id="main-content">
            {/* Stats Section */}
            <section aria-labelledby="stats-heading" className="mb-8">
              <h2 id="stats-heading" className="sr-only">Rider Statistics</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Rides</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" aria-hidden="true" />
                      <span className="text-3xl font-bold" aria-label={`${completedRides.length} total rides completed`}>{completedRides.length}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">RIDE Tokens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-purple-600" aria-hidden="true" />
                      <span className="text-3xl font-bold" aria-label={`${user?.rideTokenBalance || 0} RIDE tokens`}>{user?.rideTokenBalance || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" aria-hidden="true" />
                      <span className="text-3xl font-bold" aria-label={`$${(completedRides.reduce((sum, r) => sum + (r.actualFare || 0), 0) / 100).toFixed(2)} total spent`}>
                        ${(completedRides.reduce((sum, r) => sum + (r.actualFare || 0), 0) / 100).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Active Ride Section */}
            {activeRide && activeRide.role === 'rider' && (
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
                      <div>
                        <p className="font-semibold">Estimated Fare:</p>
                        <p className="text-2xl font-bold text-green-600" aria-label={`Estimated fare: $${((activeRide.ride.estimatedFare || 0) / 100).toFixed(2)}`}>
                          ${((activeRide.ride.estimatedFare || 0) / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Ride Booking Section */}
            {!activeRide && (
              <section aria-labelledby="book-ride-heading" className="mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle id="book-ride-heading">Request a Ride</CardTitle>
                    <CardDescription>Enter your pickup and destination to get started</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => toast.info("Ride booking interface coming soon!")} aria-label="Book a new ride">
                      Book a Ride
                    </Button>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Recent Rides Section */}
            <section aria-labelledby="recent-rides-heading">
              <Card>
                <CardHeader>
                  <CardTitle id="recent-rides-heading">Recent Rides</CardTitle>
                </CardHeader>
                <CardContent>
                  {riderRides.length === 0 ? (
                    <p className="text-gray-600" role="status">No rides yet. Book your first ride to get started!</p>
                  ) : (
                    <ul className="space-y-4" aria-label="List of recent rides">
                      {riderRides.slice(0, 10).map((ride) => (
                        <li key={ride.id} className="flex justify-between items-center border-b pb-4">
                          <div>
                            <p className="font-semibold">{ride.pickupAddress}</p>
                            <p className="text-sm text-gray-600">to {ride.dropoffAddress}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              <time dateTime={new Date(ride.requestedAt).toISOString()}>
                                {new Date(ride.requestedAt).toLocaleDateString()}
                              </time>
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={ride.status === 'completed' ? 'default' : 'secondary'}>
                              {ride.status}
                            </Badge>
                            {ride.actualFare && (
                              <p className="text-lg font-bold text-green-600 mt-1" aria-label={`Fare: $${(ride.actualFare / 100).toFixed(2)}`}>
                                ${(ride.actualFare / 100).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
