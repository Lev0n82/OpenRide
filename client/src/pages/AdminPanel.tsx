import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Shield, Users, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AdminPanel() {
  const utils = trpc.useUtils();
  const { data: pendingDrivers } = trpc.driver.getPendingVerifications.useQuery();
  const { data: pendingClaims } = trpc.insurance.getPending.useQuery();

  const updateVerification = trpc.driver.updateVerification.useMutation({
    onSuccess: () => {
      utils.driver.getPendingVerifications.invalidate();
      toast.success("Driver verification updated");
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-800">Pending Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-3xl font-bold">{pendingDrivers?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-800">Pending Claims</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-3xl font-bold">{pendingClaims?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-800">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-lg font-semibold text-green-600">Operational</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pending Driver Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            {!pendingDrivers || pendingDrivers.length === 0 ? (
              <p className="text-gray-800">No pending verifications</p>
            ) : (
              <div className="space-y-4">
                {pendingDrivers.map((item) => (
                  <div key={item.driver.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-semibold text-lg">{item.user?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-800">{item.user?.email}</p>
                        <p className="text-sm text-gray-800 mt-2">
                          License: {item.driver.licenseNumber}
                        </p>
                      </div>
                      <Badge>{item.driver.verificationStatus}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateVerification.mutate({
                          driverId: item.driver.id,
                          status: 'approved',
                        })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateVerification.mutate({
                          driverId: item.driver.id,
                          status: 'rejected',
                          notes: 'Please resubmit with valid documents',
                        })}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Insurance Claims</CardTitle>
          </CardHeader>
          <CardContent>
            {!pendingClaims || pendingClaims.length === 0 ? (
              <p className="text-gray-800">No pending claims</p>
            ) : (
              <div className="space-y-4">
                {pendingClaims.map((claim) => (
                  <div key={claim.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{claim.claimType}</p>
                        <p className="text-sm text-gray-800">{claim.description}</p>
                        <p className="text-lg font-bold text-green-600 mt-2">
                          ${(claim.amountRequested / 100).toFixed(2)}
                        </p>
                      </div>
                      <Badge>{claim.status}</Badge>
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
