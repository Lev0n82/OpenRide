import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Shield, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function Insurance() {
  const { data: pool } = trpc.insurance.getPool.useQuery();
  const { data: myClaims } = trpc.insurance.getMyClaims.useQuery();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Insurance Pool</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-800">Total Reserves</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-3xl font-bold">
                  ${((pool?.totalReserves || 0) / 100).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-800">Total Claims</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
                <span className="text-3xl font-bold">
                  ${((pool?.totalClaims || 0) / 100).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-800">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-3xl font-bold">
                  ${((pool?.totalPaid || 0) / 100).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>About the Insurance Pool</CardTitle>
            <CardDescription>
              10% of all ride fares fund our community-owned insurance pool
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-800 mb-4">
              OpenRide's decentralized insurance model ensures full coverage for all rides while
              keeping costs low. The pool is managed by the DAO and backed by traditional reinsurance.
            </p>
            <Button onClick={() => toast.info("File claim feature coming soon!")}>
              File a Claim
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Claims</CardTitle>
          </CardHeader>
          <CardContent>
            {!myClaims || myClaims.length === 0 ? (
              <p className="text-gray-800">No claims filed yet</p>
            ) : (
              <div className="space-y-4">
                {myClaims.map((claim) => (
                  <div key={claim.id} className="flex justify-between items-center border-b pb-4">
                    <div>
                      <p className="font-semibold">{claim.claimType}</p>
                      <p className="text-sm text-gray-800">{claim.description}</p>
                      <p className="text-xs text-gray-700 mt-1">
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge>{claim.status}</Badge>
                      <p className="text-lg font-bold mt-1">
                        ${(claim.amountRequested / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
