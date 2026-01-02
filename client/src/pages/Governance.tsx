import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Vote, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Governance() {
  const utils = trpc.useUtils();
  const { data: proposals } = trpc.governance.getActive.useQuery();

  const vote = trpc.governance.vote.useMutation({
    onSuccess: () => {
      utils.governance.getActive.invalidate();
      toast.success("Vote submitted!");
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">DAO Governance</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>About DAO Governance</CardTitle>
            <CardDescription>
              RIDE token holders vote on platform decisions through a three-tier system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Tier 1: Emergency (24 hours)</h3>
                <p className="text-gray-800">Critical safety issues, fraud alerts, major bugs</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Tier 2: Operational (3-5 days)</h3>
                <p className="text-gray-800">Fee adjustments, insurance policies, driver verification</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Tier 3: Strategic (7 days)</h3>
                <p className="text-gray-800">Major partnerships, platform changes, new features</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Active Proposals</h2>
          <Button onClick={() => toast.info("Create proposal feature coming soon!")}>
            Create Proposal
          </Button>
        </div>

        {!proposals || proposals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-800">
              No active proposals at the moment
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {proposals.map((proposal) => (
              <Card key={proposal.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{proposal.title}</CardTitle>
                      <CardDescription className="mt-2">{proposal.description}</CardDescription>
                    </div>
                    <Badge>{proposal.tier}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <Clock className="w-4 h-4" />
                      <span>Ends: {new Date(proposal.votingEndsAt).toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-800">For</p>
                        <p className="text-2xl font-bold text-green-600">{proposal.votesFor}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-800">Against</p>
                        <p className="text-2xl font-bold text-red-600">{proposal.votesAgainst}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => vote.mutate({ proposalId: proposal.id, voteChoice: 'for' })}
                        disabled={vote.isPending}
                      >
                        Vote For
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => vote.mutate({ proposalId: proposal.id, voteChoice: 'against' })}
                        disabled={vote.isPending}
                      >
                        Vote Against
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
