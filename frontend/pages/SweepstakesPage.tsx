import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Gift, Users, Calendar, Crown, Coins } from 'lucide-react';
import backend from '~backend/client';

export default function SweepstakesPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sweepstakes, isLoading } = useQuery({
    queryKey: ['sweepstakes'],
    queryFn: () => backend.sweepstakes.listSweepstakes(),
  });

  const { data: userEntries } = useQuery({
    queryKey: ['user-entries', user?.id],
    queryFn: () => backend.sweepstakes.getUserEntries({ userId: user!.id }),
    enabled: !!user,
  });

  const enterMutation = useMutation({
    mutationFn: (sweepstakesId: number) =>
      backend.sweepstakes.enter({
        userId: user!.id,
        sweepstakesId,
      }),
    onSuccess: (data, sweepstakesId) => {
      if (data.newEtBalance !== undefined) {
        updateUser({ etBalance: data.newEtBalance });
      }
      if (data.newPtBalance !== undefined) {
        updateUser({ ptBalance: data.newPtBalance });
      }
      queryClient.invalidateQueries({ queryKey: ['sweepstakes'] });
      queryClient.invalidateQueries({ queryKey: ['user-entries'] });
      toast({
        title: "Entry submitted!",
        description: "You have successfully entered the sweepstakes.",
      });
    },
    onError: (error: any) => {
      console.error('Entry error:', error);
      toast({
        title: "Entry failed",
        description: error.message || "Failed to enter sweepstakes",
        variant: "destructive",
      });
    },
  });

  const getUserEntryCount = (sweepstakesId: number) => {
    return userEntries?.entries.find(e => e.sweepstakesId === sweepstakesId)?.entryCount || 0;
  };

  const isUserWinner = (sweepstakesId: number) => {
    return userEntries?.entries.find(e => e.sweepstakesId === sweepstakesId)?.isWinner || false;
  };

  const getCurrencyIcon = (currency: string) => {
    return currency === 'ET' ? '🪙' : '🔮';
  };

  const getCurrencyBalance = (currency: string) => {
    return currency === 'ET' ? user?.etBalance : user?.ptBalance;
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Please sign in to view sweepstakes</h1>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl md:text-3xl font-bold">Sweepstakes</h1>
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-yellow-400">🪙 {user.etBalance} ET</span>
          <span className="text-purple-400">🔮 {user.ptBalance} PT</span>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-lg">Loading sweepstakes...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sweepstakes?.sweepstakes.map((sweepstake) => {
            const userEntryCount = getUserEntryCount(sweepstake.id);
            const isWinner = isUserWinner(sweepstake.id);
            const userBalance = getCurrencyBalance(sweepstake.entryCurrency) || 0;
            const canAfford = sweepstake.entryCost === 0 || userBalance >= sweepstake.entryCost;
            
            return (
              <Card key={sweepstake.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-white pr-4 mb-2">
                        {sweepstake.title}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        {!sweepstake.isOpen && (
                          <Badge variant="secondary">Closed</Badge>
                        )}
                        {isWinner && (
                          <Badge className="bg-yellow-600 text-white">
                            <Crown className="h-3 w-3 mr-1" />
                            Winner!
                          </Badge>
                        )}
                        <Badge className={`${sweepstake.entryCurrency === 'ET' ? 'bg-yellow-600' : 'bg-purple-600'} text-white`}>
                          {getCurrencyIcon(sweepstake.entryCurrency)} {sweepstake.entryCurrency}
                        </Badge>
                      </div>
                    </div>
                    {sweepstake.imageUrl && (
                      <img 
                        src={sweepstake.imageUrl} 
                        alt="Sweepstakes" 
                        className="w-20 h-20 object-cover rounded ml-4 flex-shrink-0"
                      />
                    )}
                  </div>
                  {sweepstake.description && (
                    <p className="text-gray-300 text-sm">{sweepstake.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-yellow-600 to-orange-600 rounded text-center">
                    <Gift className="h-8 w-8 text-white mx-auto mb-2" />
                    <div className="text-lg font-bold text-white">{sweepstake.prize}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">{sweepstake.entryCount} entries</span>
                    </div>
                    
                    {sweepstake.drawDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">
                          {new Date(sweepstake.drawDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {userEntryCount > 0 && (
                    <div className="p-3 bg-gray-700 rounded">
                      <span className="text-green-400">
                        ✓ You have {userEntryCount} {userEntryCount === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold">
                      {sweepstake.entryCost === 0 ? (
                        <span className="text-green-400">FREE</span>
                      ) : (
                        <span className={sweepstake.entryCurrency === 'ET' ? 'text-yellow-400' : 'text-purple-400'}>
                          {getCurrencyIcon(sweepstake.entryCurrency)} {sweepstake.entryCost} {sweepstake.entryCurrency}
                        </span>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => enterMutation.mutate(sweepstake.id)}
                      disabled={
                        !sweepstake.isOpen ||
                        enterMutation.isPending ||
                        !canAfford
                      }
                      className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                    >
                      {enterMutation.isPending ? 'Entering...' : 'Enter Now'}
                    </Button>
                  </div>

                  {!canAfford && sweepstake.entryCost > 0 && (
                    <p className="text-red-400 text-sm">
                      Insufficient {sweepstake.entryCurrency} balance
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {sweepstakes?.sweepstakes.length === 0 && (
        <div className="text-center py-12">
          <Gift className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400 mb-2">No sweepstakes available</h2>
          <p className="text-gray-500">Check back later for new sweepstakes!</p>
        </div>
      )}
    </div>
  );
}
