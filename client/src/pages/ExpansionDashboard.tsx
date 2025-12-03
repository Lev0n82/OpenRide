/**
 * Expansion Dashboard
 * 
 * AI-powered expansion management interface for admins
 * Shows market opportunities, active launches, and performance metrics
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Globe,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Target,
  Rocket,
  BarChart3,
  FileText
} from "lucide-react";

export default function ExpansionDashboard() {
  const [selectedTab, setSelectedTab] = useState("opportunities");
  
  // Fetch market opportunities
  const { data: tier1Markets } = trpc.expansion.getMarketOpportunities.useQuery({ tier: "tier1" });
  const { data: tier2Markets } = trpc.expansion.getMarketOpportunities.useQuery({ tier: "tier2" });
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Globe className="h-10 w-10 text-primary" />
            AI Expansion System
          </h1>
          <p className="text-muted-foreground mt-2">
            Autonomous market analysis, launch orchestration, and growth monitoring
          </p>
        </div>
        <Button size="lg" className="gap-2">
          <Target className="h-5 w-5" />
          Analyze New Market
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Markets Analyzed"
          value="47"
          change="+12 this month"
          icon={<Globe className="h-5 w-5" />}
          trend="up"
        />
        <MetricCard
          title="Active Launches"
          value="3"
          change="2 on track, 1 delayed"
          icon={<Rocket className="h-5 w-5" />}
          trend="neutral"
        />
        <MetricCard
          title="Total Cities"
          value="8"
          change="+2 this quarter"
          icon={<MapPin className="h-5 w-5" />}
          trend="up"
        />
        <MetricCard
          title="Expansion ROI"
          value="142%"
          change="24-month average"
          icon={<DollarSign className="h-5 w-5" />}
          trend="up"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="opportunities">Market Opportunities</TabsTrigger>
          <TabsTrigger value="launches">Active Launches</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="roadmap">Expansion Roadmap</TabsTrigger>
        </TabsList>

        {/* Market Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tier 1 Opportunities (Immediate Evaluation)</CardTitle>
              <CardDescription>
                High-priority markets with 80+ opportunity scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tier1Markets && tier1Markets.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Market</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Population</TableHead>
                      <TableHead>Competition</TableHead>
                      <TableHead>Regulatory</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tier1Markets.map((market) => (
                      <TableRow key={market.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {market.city}, {market.country}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={market.overallScore} className="w-20" />
                            <span className="text-sm font-medium">{market.overallScore}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {market.metroPopulation ? (market.metroPopulation / 1000000).toFixed(1) + "M" : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={(market.competitorCount || 0) > 2 ? "destructive" : "default"}>
                            {market.competitorCount || 0} competitors
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            market.regulatoryStatus === "permissive" ? "default" :
                            market.regulatoryStatus === "moderate" ? "secondary" :
                            "destructive"
                          }>
                            {market.regulatoryStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{market.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">View Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No Tier 1 opportunities identified yet</p>
                  <Button className="mt-4">Scan New Markets</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tier 2 Opportunities (Evaluate Within 6 Months)</CardTitle>
              <CardDescription>
                Promising markets with 60-79 opportunity scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tier2Markets && tier2Markets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tier2Markets.map((market) => (
                    <Card key={market.id}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>{market.city}</span>
                          <Badge>{market.overallScore}</Badge>
                        </CardTitle>
                        <CardDescription>{market.country}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Population</span>
                          <span className="font-medium">
                            {market.metroPopulation ? (market.metroPopulation / 1000000).toFixed(1) + "M" : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Regulatory</span>
                          <span className="font-medium">{market.regulatoryStatus}</span>
                        </div>
                        <Button size="sm" variant="outline" className="w-full mt-4">
                          View Analysis
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No Tier 2 opportunities identified</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Launches Tab */}
        <TabsContent value="launches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Market Launches</CardTitle>
              <CardDescription>
                Real-time monitoring of ongoing expansion launches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Placeholder for active launches */}
                <LaunchCard
                  city="Toronto"
                  country="Canada"
                  phase="Soft Launch"
                  health={85}
                  drivers={342}
                  targetDrivers={500}
                  rides={12453}
                  targetRides={50000}
                  daysUntilPublicLaunch={45}
                />
                <LaunchCard
                  city="Vancouver"
                  country="Canada"
                  phase="Closed Beta"
                  health={72}
                  drivers={127}
                  targetDrivers={200}
                  rides={1834}
                  targetRides={10000}
                  daysUntilPublicLaunch={90}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Performance Comparison</CardTitle>
                <CardDescription>Key metrics across all markets</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Market</TableHead>
                      <TableHead>Drivers</TableHead>
                      <TableHead>Monthly Rides</TableHead>
                      <TableHead>Avg Rating</TableHead>
                      <TableHead>Health</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Toronto</TableCell>
                      <TableCell>342</TableCell>
                      <TableCell>12,453</TableCell>
                      <TableCell>4.6 ⭐</TableCell>
                      <TableCell>
                        <Badge variant="default">85</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Vancouver</TableCell>
                      <TableCell>127</TableCell>
                      <TableCell>1,834</TableCell>
                      <TableCell>4.7 ⭐</TableCell>
                      <TableCell>
                        <Badge variant="secondary">72</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>Month-over-month growth rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <GrowthMetric label="Ride Volume" value="+34%" trend="up" />
                <GrowthMetric label="Active Drivers" value="+18%" trend="up" />
                <GrowthMetric label="Revenue" value="+42%" trend="up" />
                <GrowthMetric label="Market Share" value="+2.3%" trend="up" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expansion Roadmap Tab */}
        <TabsContent value="roadmap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>12-Month Expansion Roadmap</CardTitle>
              <CardDescription>
                Planned market launches and key milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <RoadmapQuarter
                  quarter="Q1 2025"
                  launches={[
                    { city: "Montreal", phase: "Public Launch", date: "Jan 15" },
                    { city: "Calgary", phase: "Beta Launch", date: "Mar 1" }
                  ]}
                />
                <RoadmapQuarter
                  quarter="Q2 2025"
                  launches={[
                    { city: "Ottawa", phase: "Soft Launch", date: "Apr 15" },
                    { city: "Edmonton", phase: "Planning", date: "Jun 1" }
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  trend 
}: { 
  title: string; 
  value: string; 
  change: string; 
  icon: React.ReactNode; 
  trend: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${
          trend === "up" ? "text-green-600" : 
          trend === "down" ? "text-red-600" : 
          "text-muted-foreground"
        }`}>
          {change}
        </p>
      </CardContent>
    </Card>
  );
}

function LaunchCard({
  city,
  country,
  phase,
  health,
  drivers,
  targetDrivers,
  rides,
  targetRides,
  daysUntilPublicLaunch
}: {
  city: string;
  country: string;
  phase: string;
  health: number;
  drivers: number;
  targetDrivers: number;
  rides: number;
  targetRides: number;
  daysUntilPublicLaunch: number;
}) {
  const driverProgress = (drivers / targetDrivers) * 100;
  const rideProgress = (rides / targetRides) * 100;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {city}, {country}
            </CardTitle>
            <CardDescription className="mt-1">
              <Badge variant="outline">{phase}</Badge>
              <span className="ml-2 text-sm">
                {daysUntilPublicLaunch} days until public launch
              </span>
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Health Score</div>
            <div className="text-2xl font-bold flex items-center gap-2">
              {health}
              {health >= 80 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : health >= 60 ? (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Driver Recruitment</span>
            <span className="font-medium">{drivers} / {targetDrivers}</span>
          </div>
          <Progress value={driverProgress} />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Ride Volume</span>
            <span className="font-medium">{rides.toLocaleString()} / {targetRides.toLocaleString()}</span>
          </div>
          <Progress value={rideProgress} />
        </div>
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Metrics
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            View Roadmap
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GrowthMetric({ label, value, trend }: { label: string; value: string; trend: "up" | "down" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-lg font-bold ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
          {value}
        </span>
        <TrendingUp className={`h-4 w-4 ${trend === "up" ? "text-green-600" : "text-red-600 rotate-180"}`} />
      </div>
    </div>
  );
}

function RoadmapQuarter({ 
  quarter, 
  launches 
}: { 
  quarter: string; 
  launches: Array<{ city: string; phase: string; date: string }> 
}) {
  return (
    <div>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Clock className="h-5 w-5" />
        {quarter}
      </h3>
      <div className="space-y-2 ml-7">
        {launches.map((launch, i) => (
          <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">{launch.city}</div>
              <div className="text-sm text-muted-foreground">{launch.phase}</div>
            </div>
            <Badge variant="outline">{launch.date}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
