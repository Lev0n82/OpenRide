import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { 
  Car, 
  Package, 
  Truck, 
  Users, 
  Shield, 
  Coins, 
  Vote, 
  Star,
  TrendingDown,
  Clock,
  MapPin,
  CheckCircle2
} from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Decentralized • Community-Owned • Blockchain-Powered
          </Badge>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome to OpenRide
          </h1>
          <p className="text-xl text-gray-800 max-w-2xl mx-auto">
            The first truly decentralized rideshare and delivery platform. 
            Drivers keep 87% of fares. Community governance. Built on Pi Network.
          </p>
        </div>

        {/* Main Services Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Ride Service */}
          <Card className="hover:shadow-xl transition-shadow border-2 hover:border-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Car className="h-12 w-12 text-blue-600" />
                <Badge variant="default">Most Popular</Badge>
              </div>
              <CardTitle className="text-2xl">Ride with OpenRide</CardTitle>
              <CardDescription>
                Get safe, affordable rides from verified drivers in your community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>87% cheaper than Uber/Lyft</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Earn RIDE tokens on every trip</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Real-time tracking & safety features</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Pay with Pi cryptocurrency</span>
                </div>
              </div>
              
              <div className="pt-4">
                {isAuthenticated ? (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => setLocation('/ride/book')}
                  >
                    <Car className="mr-2 h-5 w-5" />
                    Book a Ride Now
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => window.location.href = getLoginUrl()}
                  >
                    Sign In to Ride
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Service */}
          <Card className="hover:shadow-xl transition-shadow border-2 hover:border-green-500">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Package className="h-12 w-12 text-green-600" />
                <Badge variant="secondary">New</Badge>
              </div>
              <CardTitle className="text-2xl">Deliver with OpenRide</CardTitle>
              <CardDescription>
                Send packages locally with fast, affordable delivery service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Same-day local delivery</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Real-time package tracking</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Proof of delivery with photos</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Earn RIDE tokens per delivery</span>
                </div>
              </div>
              
              <div className="pt-4">
                {isAuthenticated ? (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    size="lg"
                    onClick={() => setLocation('/delivery-booking')}
                  >
                    <Package className="mr-2 h-5 w-5" />
                    Send a Package
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    size="lg"
                    onClick={() => window.location.href = getLoginUrl()}
                  >
                    Sign In to Deliver
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Courier Service */}
          <Card className="hover:shadow-xl transition-shadow border-2 hover:border-purple-500">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Truck className="h-12 w-12 text-purple-600" />
                <Badge variant="secondary">Pro</Badge>
              </div>
              <CardTitle className="text-2xl">Courier with OpenRide</CardTitle>
              <CardDescription>
                Professional courier services for businesses and bulk deliveries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Multi-stop route optimization</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Scheduled pickups & deliveries</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Business accounts & invoicing</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Priority driver matching</span>
                </div>
              </div>
              
              <div className="pt-4">
                {isAuthenticated ? (
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700" 
                    size="lg"
                    onClick={() => setLocation('/delivery-booking?type=courier')}
                  >
                    <Truck className="mr-2 h-5 w-5" />
                    Book Courier Service
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700" 
                    size="lg"
                    onClick={() => window.location.href = getLoginUrl()}
                  >
                    Sign In for Courier
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Driver CTA */}
        <Card className="mb-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardContent className="py-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Become a Driver</h2>
                <p className="text-lg mb-6 text-blue-50">
                  Earn 87% of every fare. Set your own schedule. Get paid in Pi cryptocurrency. 
                  Join the decentralized revolution.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    <span className="text-sm">Only 13% fees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span className="text-sm">Flexible hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    <span className="text-sm">Earn RIDE tokens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <span className="text-sm">Full insurance</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="w-full text-lg"
                  onClick={() => isAuthenticated ? setLocation('/driver/apply') : window.location.href = getLoginUrl()}
                >
                  <Car className="mr-2 h-5 w-5" />
                  Apply to Drive
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full text-lg bg-white/10 hover:bg-white/20 text-white border-white/30"
                  onClick={() => isAuthenticated ? setLocation('/driver/apply?service=delivery') : window.location.href = getLoginUrl()}
                >
                  <Package className="mr-2 h-5 w-5" />
                  Apply for Delivery
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full text-lg bg-white/10 hover:bg-white/20 text-white border-white/30"
                  onClick={() => isAuthenticated ? setLocation('/driver/apply?service=courier') : window.location.href = getLoginUrl()}
                >
                  <Truck className="mr-2 h-5 w-5" />
                  Apply for Courier
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Features */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/governance')}>
            <CardHeader>
              <Vote className="h-10 w-10 mx-auto mb-2 text-blue-600" />
              <CardTitle className="text-lg">DAO Governance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-800">
                Vote on platform decisions. Community-owned and operated.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/insurance')}>
            <CardHeader>
              <Shield className="h-10 w-10 mx-auto mb-2 text-green-600" />
              <CardTitle className="text-lg">Insurance Pool</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-800">
                10% of fees fund our community insurance pool for all drivers.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/tokens')}>
            <CardHeader>
              <Coins className="h-10 w-10 mx-auto mb-2 text-yellow-600" />
              <CardTitle className="text-lg">RIDE Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-800">
                Earn governance tokens. Automatic buyback & burn mechanism.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => isAuthenticated ? setLocation('/admin') : window.location.href = getLoginUrl()}>
            <CardHeader>
              <Users className="h-10 w-10 mx-auto mb-2 text-purple-600" />
              <CardTitle className="text-lg">Admin Panel</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-800">
                Manage drivers, verify applications, review claims.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose OpenRide?</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-800 mb-2">87%</div>
              <div className="text-gray-800">Driver Earnings</div>
              <div className="text-sm text-gray-700 mt-1">vs 70-75% on Uber/Lyft</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-800 mb-2">13%</div>
              <div className="text-gray-800">Platform Fees</div>
              <div className="text-sm text-gray-700 mt-1">vs 25-30% on competitors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-800 mb-2">100%</div>
              <div className="text-gray-800">Community Owned</div>
              <div className="text-sm text-gray-700 mt-1">DAO governance model</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-700 mb-2">0.5%</div>
              <div className="text-gray-800">Token Buyback</div>
              <div className="text-sm text-gray-700 mt-1">Automatic quarterly burns</div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-8">How OpenRide Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">1. Request Service</h3>
              <p className="text-gray-800">
                Enter pickup and destination. Choose ride, delivery, or courier service.
              </p>
            </div>
            <div>
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">2. Get Matched</h3>
              <p className="text-gray-800">
                Our AI matches you with the best-rated driver nearby in seconds.
              </p>
            </div>
            <div>
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">3. Earn & Rate</h3>
              <p className="text-gray-800">
                Complete your trip, earn RIDE tokens, and rate your experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
