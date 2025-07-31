import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Wallet, CreditCard, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import backend from '~backend/client';

export default function WalletPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [purchaseAmount, setPurchaseAmount] = useState<string>('');
  const [showPurchase, setShowPurchase] = useState(false);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: () => backend.user.getTransactions({ userId: user!.id }),
    enabled: !!user,
  });

  const purchaseMutation = useMutation({
    mutationFn: (amount: number) =>
      backend.user.purchaseTokens({
        userId: user!.id,
        amount,
      }),
    onSuccess: (data) => {
      updateUser({
        etBalance: data.newEtBalance,
        ptBalance: data.newPtBalance,
      });
      setPurchaseAmount('');
      setShowPurchase(false);
      toast({
        title: "Purchase successful!",
        description: `Added ${data.etAdded} ET and ${data.ptAdded} PT to your wallet.`,
      });
    },
    onError: (error: any) => {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase failed",
        description: error.message || "Failed to purchase tokens",
        variant: "destructive",
      });
    },
  });

  const handlePurchase = () => {
    const amount = parseFloat(purchaseAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid dollar amount",
        variant: "destructive",
      });
      return;
    }

    if (amount < 1) {
      toast({
        title: "Minimum purchase",
        description: "Minimum purchase is $1",
        variant: "destructive",
      });
      return;
    }

    purchaseMutation.mutate(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'bonus':
      case 'win':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'vote':
      case 'sweepstakes':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Wallet className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'bonus':
      case 'win':
        return 'text-green-400';
      case 'vote':
      case 'sweepstakes':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Please sign in to view your wallet</h1>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Wallet</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-yellow-600 to-orange-600 border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <span>🪙</span>
              <span>Entertainment Tokens (ET)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">{user.etBalance}</div>
            <p className="text-yellow-100 text-sm">
              Use ET to enter sweepstakes and unlock premium features
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-indigo-600 border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <span>🔮</span>
              <span>PredictTokens (PT)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">{user.ptBalance}</div>
            <p className="text-purple-100 text-sm">
              Use PT to vote on predictions and earn rewards
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <CreditCard className="h-5 w-5" />
            <span>Buy Entertainment Tokens</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-700 rounded">
            <h3 className="font-semibold text-white mb-2">Token Exchange Rate</h3>
            <div className="space-y-1 text-sm text-gray-300">
              <div>💵 $1 = 100 ET + 10 PT bonus</div>
              <div>💵 $5 = 500 ET + 50 PT bonus</div>
              <div>💵 $10 = 1,000 ET + 100 PT bonus</div>
            </div>
          </div>

          {showPurchase ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Amount (USD)</Label>
                <Input
                  type="number"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  min="1"
                  step="0.01"
                  className="bg-gray-700 border-gray-600"
                  placeholder="Enter dollar amount"
                />
              </div>

              {purchaseAmount && !isNaN(parseFloat(purchaseAmount)) && parseFloat(purchaseAmount) > 0 && (
                <div className="p-3 bg-gray-700 rounded text-sm">
                  <div className="text-gray-300">You will receive:</div>
                  <div className="text-yellow-400">🪙 {Math.floor(parseFloat(purchaseAmount) * 100)} ET</div>
                  <div className="text-purple-400">🔮 {Math.floor(parseFloat(purchaseAmount) * 10)} PT (bonus)</div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={handlePurchase}
                  disabled={purchaseMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {purchaseMutation.isPending ? 'Processing...' : 'Purchase Now'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPurchase(false);
                    setPurchaseAmount('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowPurchase(true)}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buy Tokens
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading transactions...</div>
            </div>
          ) : transactions?.transactions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <div className="text-gray-400">No transactions yet</div>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions?.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded"
                >
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <div className="font-medium text-white">
                        {transaction.description}
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString()} at{' '}
                        {new Date(transaction.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount} {transaction.currency}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
