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
    <>
      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" className="sr-only">
        Skip to main content
      </a>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Hero Section */}
        <header className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4" role="status">
              Decentralized • Community-Owned • Blockchain-Powered
            </Badge>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome to OpenRide
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The first truly decentralized rideshare and delivery platform. 
              Drivers keep 87% of fares. Community governance. Built on Pi Network.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" className="container mx-auto px-4">
          {/* Main Services Grid */}
          <section aria-labelledby="services-heading" className="mb-12">
            <h2 id="services-heading" className="sr-only">Our Services</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Ride Service */}
              <article className="hover:shadow-xl transition-shadow">
                <Card className="border-2 hover:border-blue-500 h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Car className="h-12 w-12 text-blue-600" aria-hidden="true" />
                      <Badge variant="default">Most Popular</Badge>
                    </div>
                    <CardTitle className="text-2xl">Ride with OpenRide</CardTitle>
                    <CardDescription>
                      Get safe, affordable rides from verified drivers in your community
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2" aria-label="Ride service benefits">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                        <span>87% cheaper than Uber/Lyft</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                        <span>Earn RIDE tokens on every trip</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                        <span>Real-time tracking & safety features</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                        <span>Pay with Pi cryptocurrency</span>
                      </li>
                    </ul>
                    
                    <div className="pt-4">
                      {isAuthenticated ? (
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={() => setLocation('/ride/book')}
                          aria-label="Book a ride now"
                        >
                          <Car className="mr-2 h-5 w-5" aria-hidden="true" />
                          Book a Ride Now
                        </Button>
                      ) : (
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={() => window.location.href = getLoginUrl()}
                          aria-label="Sign in to book a ride"
                        >
                          Sign In to Ride
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </article>

              {/* Delivery Service */}
              <article className="hover:shadow-xl transition-shadow">
                <Card className="border-2 hover:border-green-500 h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Package className="h-12 w-12 text-green-600" aria-hidden="true" />
                      <Badge variant="secondary">New</Badge>
                    </div>
                    <CardTitle className="text-2xl">Deliver with OpenRide</CardTitle>
                    <CardDescription>
                      Send packages locally with fast, affordable delivery service
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2" aria-label="Delivery service benefits">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                        <span>Same-day local delivery</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                        <span>Real-time package tracking</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                        <span>Proof of delivery with photos</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                        <span>Earn RIDE tokens per delivery</span>
                      </li>
                    </ul>
                    
                    <div className="pt-4">
                      {isAuthenticated ? (
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700" 
                          size="lg"
                          onClick={() => setLocation('/delivery-booking')}
                          aria-label="Send a package now"
                        >
                          <Package className="mr-2 h-5 w-5" aria-hidden="true" />
                          Send a Package
                        </Button>
                      ) : (
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700" 
                          size="lg"
                          onClick={() => window.location.href = getLoginUrl()}
                          aria-label="Sign in to send a package"
                        >
                          Sign In to Deliver
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </article>

              {/* Courier Service */}
              <article className="hover:shadow-xl transition-shadow">
                <Card className="border-2 hover:border-purple-500 h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Truck className="h-12 w-12 text-purple-600" aria-hidden="true" />
                      <Badge variant="secondary">Pro</Badge>
                    </div>
                    <CardTitle className="text-2xl">Courier with OpenRide</CardTitle>
                    <CardDescription>
                      Professional courier services for businesses and bulk deliveries
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2" aria-label="Courier service benefits">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                        <span>Multi-stop route optimization</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                        <span>Scheduled pickups & deliveries</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                        <span>Business accounts & invoicing</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                        <span>Priority driver matching</span>
                      </li>
                    </ul>
                    
                    <div className="pt-4">
                      {isAuthenticated ? (
                        <Button 
                          className="w-full bg-purple-600 hover:bg-purple-700" 
                          size="lg"
                          onClick={() => setLocation('/delivery-booking?type=courier')}
                          aria-label="Book courier service now"
                        >
                          <Truck className="mr-2 h-5 w-5" aria-hidden="true" />
                          Book Courier Service
                        </Button>
                      ) : (
                        <Button 
                          className="w-full bg-purple-600 hover:bg-purple-700" 
                          size="lg"
                          onClick={() => window.location.href = getLoginUrl()}
                          aria-label="Sign in to book courier service"
                        >
                          Sign In for Courier
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </article>
            </div>
          </section>

          {/* Driver CTA */}
          <section aria-labelledby="driver-cta-heading" className="mb-12">
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
              <CardContent className="py-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 id="driver-cta-heading" className="text-3xl font-bold mb-4">Become a Driver</h2>
                    <p className="text-lg mb-6 text-blue-50">
                      Earn 87% of every fare. Set your own schedule. Get paid in Pi cryptocurrency. 
                      Join the decentralized revolution.
                    </p>
                    <ul className="grid grid-cols-2 gap-4 mb-6" aria-label="Driver benefits">
                      <li className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5" aria-hidden="true" />
                        <span className="text-sm">Only 13% fees</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="h-5 w-5" aria-hidden="true" />
                        <span className="text-sm">Flexible hours</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Coins className="h-5 w-5" aria-hidden="true" />
                        <span className="text-sm">Earn RIDE tokens</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Shield className="h-5 w-5" aria-hidden="true" />
                        <span className="text-sm">Full insurance</span>
                      </li>
                    </ul>
                  </div>
                  <nav aria-label="Driver application options" className="flex flex-col gap-4">
                    <Button 
                      size="lg" 
                      variant="secondary"
                      className="w-full text-lg"
                      onClick={() => isAuthenticated ? setLocation('/driver/apply') : window.location.href = getLoginUrl()}
                      aria-label="Apply to become a driver"
                    >
                      <Car className="mr-2 h-5 w-5" aria-hidden="true" />
                      Apply to Drive
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="w-full text-lg bg-white/10 hover:bg-white/20 text-white border-white/30"
                      onClick={() => isAuthenticated ? setLocation('/driver/apply?service=delivery') : window.location.href = getLoginUrl()}
                      aria-label="Apply to become a delivery driver"
                    >
                      <Package className="mr-2 h-5 w-5" aria-hidden="true" />
                      Apply for Delivery
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="w-full text-lg bg-white/10 hover:bg-white/20 text-white border-white/30"
                      onClick={() => isAuthenticated ? setLocation('/driver/apply?service=courier') : window.location.href = getLoginUrl()}
                      aria-label="Apply to become a courier driver"
                    >
                      <Truck className="mr-2 h-5 w-5" aria-hidden="true" />
                      Apply for Courier
                    </Button>
                  </nav>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Platform Features */}
          <section aria-labelledby="features-heading" className="mb-12">
            <h2 id="features-heading" className="text-3xl font-bold text-center mb-8">Why Choose OpenRide?</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <article className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-blue-600" aria-hidden="true" />
                </div>
                <h3 className="font-semibold mb-2">Community Owned</h3>
                <p className="text-sm text-gray-600">
                  Governed by riders and drivers through DAO voting. Your voice matters.
                </p>
              </article>

              <article className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Coins className="h-8 w-8 text-green-600" aria-hidden="true" />
                </div>
                <h3 className="font-semibold mb-2">Earn RIDE Tokens</h3>
                <p className="text-sm text-gray-600">
                  Every trip earns you governance tokens. More rides = more voting power.
                </p>
              </article>

              <article className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-purple-600" aria-hidden="true" />
                </div>
                <h3 className="font-semibold mb-2">Fully Insured</h3>
                <p className="text-sm text-gray-600">
                  Community insurance pool covers all rides. No hidden fees or surprises.
                </p>
              </article>

              <article className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-orange-600" aria-hidden="true" />
                </div>
                <h3 className="font-semibold mb-2">Verified Drivers</h3>
                <p className="text-sm text-gray-600">
                  All drivers verified through Pi Network KYC. Safety first, always.
                </p>
              </article>
            </div>
          </section>

          {/* DAO Governance */}
          <section aria-labelledby="dao-heading" className="mb-12">
            <Card>
              <CardContent className="py-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 id="dao-heading" className="text-3xl font-bold mb-4">Community Governance</h2>
                    <p className="text-lg text-gray-600 mb-6">
                      OpenRide is governed by its community through a Decentralized Autonomous Organization (DAO). 
                      Token holders vote on platform decisions, fee structures, and expansion plans.
                    </p>
                    <ul className="space-y-3" aria-label="DAO features">
                      <li className="flex items-start gap-3">
                        <Vote className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" aria-hidden="true" />
                        <div>
                          <strong className="block">Democratic Voting</strong>
                          <span className="text-sm text-gray-600">One token = one vote on all proposals</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <Coins className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" aria-hidden="true" />
                        <div>
                          <strong className="block">Treasury Management</strong>
                          <span className="text-sm text-gray-600">Community controls platform funds</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" aria-hidden="true" />
                        <div>
                          <strong className="block">Expansion Decisions</strong>
                          <span className="text-sm text-gray-600">Vote on new cities and features</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="flex flex-col gap-4">
                    <Button 
                      size="lg"
                      onClick={() => isAuthenticated ? setLocation('/dao') : window.location.href = getLoginUrl()}
                      aria-label="View active governance proposals"
                    >
                      <Vote className="mr-2 h-5 w-5" aria-hidden="true" />
                      View Active Proposals
                    </Button>
                    <Button 
                      size="lg"
                      variant="outline"
                      onClick={() => isAuthenticated ? setLocation('/dao/create') : window.location.href = getLoginUrl()}
                      aria-label="Create a new governance proposal"
                    >
                      Create Proposal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t" role="contentinfo">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              © 2025 OpenRide. Built on Pi Network. Powered by the community.
            </p>
            <nav aria-label="Footer navigation">
              <a href="/accessibility" className="text-blue-600 hover:underline">
                Accessibility Statement
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
