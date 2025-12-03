import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Coins, TrendingUp, History } from "lucide-react";

export default function Tokens() {
  const { user } = useAuth();
  const { data: tokenData } = trpc.tokens.getMyTokens.useQuery();
  const { data: buybackHistory } = trpc.tokens.getBuybackHistory.useQuery();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">RIDE Tokens</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your RIDE Balance</CardTitle>
            <CardDescription>Earn tokens by completing rides and participating in governance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Coins className="w-16 h-16 text-purple-600" />
              <div>
                <p className="text-5xl font-bold">{user?.rideTokenBalance || 0}</p>
                <p className="text-gray-600 mt-2">RIDE Tokens</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Token Economics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Driver Reward:</span>
                <span className="font-semibold">10 RIDE per ride</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rider Reward:</span>
                <span className="font-semibold">1 RIDE per ride</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Buyback Fee:</span>
                <span className="font-semibold">0.5% of fares</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest Buyback</CardTitle>
            </CardHeader>
            <CardContent>
              {buybackHistory && buybackHistory.length > 0 ? (
                <div>
                  <p className="text-3xl font-bold text-purple-600">
                    {buybackHistory[0].tokensBurned}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Tokens burned on {new Date(buybackHistory[0].executedAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600">No buybacks yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {!tokenData?.transactions || tokenData.transactions.length === 0 ? (
              <p className="text-gray-600">No transactions yet</p>
            ) : (
              <div className="space-y-4">
                {tokenData.transactions.slice(0, 20).map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center border-b pb-4">
                    <div>
                      <p className="font-semibold">{tx.transactionType}</p>
                      <p className="text-sm text-gray-600">{tx.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
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
