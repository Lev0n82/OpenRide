import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Car, Users, Shield, Coins, Vote, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              OpenRide
            </h1>
            <p className="text-2xl text-gray-700 mb-4">
              The Future of Decentralized Ridesharing
            </p>
            <p className="text-lg text-gray-600 mb-8">
              Community-owned. Blockchain-powered. Driver-first.
            </p>
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <a href={getLoginUrl()}>Get Started</a>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <Card>
              <CardHeader>
                <Car className="w-12 h-12 text-blue-600 mb-4" />
                <CardTitle>87% Driver Earnings</CardTitle>
                <CardDescription>
                  Drivers keep 87% of fares vs 70-75% on traditional platforms
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Vote className="w-12 h-12 text-purple-600 mb-4" />
                <CardTitle>DAO Governance</CardTitle>
                <CardDescription>
                  RIDE token holders vote on platform decisions and policies
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="w-12 h-12 text-green-600 mb-4" />
                <CardTitle>Community Insurance</CardTitle>
                <CardDescription>
                  10% of fares fund our own insurance pool for full coverage
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Coins className="w-12 h-12 text-yellow-600 mb-4" />
                <CardTitle>Earn RIDE Tokens</CardTitle>
                <CardDescription>
                  Drivers earn 10 RIDE per ride, riders earn 1 RIDE per ride
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="w-12 h-12 text-red-600 mb-4" />
                <CardTitle>Token Buyback</CardTitle>
                <CardDescription>
                  0.5% of fares automatically buy and burn RIDE tokens quarterly
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="w-12 h-12 text-indigo-600 mb-4" />
                <CardTitle>Pi Network Integration</CardTitle>
                <CardDescription>
                  Built on Pi blockchain with verified KYC for all users
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* How It Works */}
          <div className="mt-20 text-center">
            <h2 className="text-4xl font-bold mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Sign Up</h3>
                <p className="text-gray-600">
                  Create your account with Manus OAuth and choose to be a driver or rider
                </p>
              </div>
              <div>
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Get Verified</h3>
                <p className="text-gray-600">
                  Drivers complete Pi Network KYC and upload required documents
                </p>
              </div>
              <div>
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Start Riding</h3>
                <p className="text-gray-600">
                  Request or accept rides, earn RIDE tokens, and participate in governance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user - show dashboard links
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to OpenRide, {user?.name}!</h1>
          <p className="text-xl text-gray-600">Choose your role to get started</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Car className="w-16 h-16 text-blue-600 mb-4" />
              <CardTitle className="text-2xl">Drive with OpenRide</CardTitle>
              <CardDescription className="text-base">
                Earn 87% of fares plus RIDE tokens. Set your own schedule.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" size="lg">
                <Link href="/driver">Driver Dashboard</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-16 h-16 text-purple-600 mb-4" />
              <CardTitle className="text-2xl">Ride with OpenRide</CardTitle>
              <CardDescription className="text-base">
                Get safe, affordable rides. Earn RIDE tokens. Vote on governance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" size="lg">
                <Link href="/rider">Rider Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="mt-12 grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <Button asChild variant="outline" className="h-auto py-4">
            <Link href="/governance">
              <div className="text-center">
                <Vote className="w-8 h-8 mx-auto mb-2" />
                <div>DAO Governance</div>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto py-4">
            <Link href="/insurance">
              <div className="text-center">
                <Shield className="w-8 h-8 mx-auto mb-2" />
                <div>Insurance Pool</div>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto py-4">
            <Link href="/tokens">
              <div className="text-center">
                <Coins className="w-8 h-8 mx-auto mb-2" />
                <div>My Tokens</div>
              </div>
            </Link>
          </Button>

          {user?.role === 'admin' && (
            <Button asChild variant="outline" className="h-auto py-4">
              <Link href="/admin">
                <div className="text-center">
                  <Shield className="w-8 h-8 mx-auto mb-2" />
                  <div>Admin Panel</div>
                </div>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
