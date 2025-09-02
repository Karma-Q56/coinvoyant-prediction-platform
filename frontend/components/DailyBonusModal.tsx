import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Gift, Coins, Calendar, Star, Zap } from 'lucide-react';
import backend from '~backend/client';

export default function DailyBonusModal() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: bonusData } = useQuery({
    queryKey: ['daily-bonus', user?.id],
    queryFn: () => backend.user.checkDailyBonus({ userId: user!.id }),
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  const claimMutation = useMutation({
    mutationFn: () => backend.user.claimDailyBonus({ userId: user!.id }),
    onSuccess: (data) => {
      if (user) {
        updateUser({ ptBalance: data.newPtBalance });
      }
      queryClient.invalidateQueries({ queryKey: ['daily-bonus'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowModal(false);
      toast({
        title: "Daily bonus claimed!",
        description: `You received ${data.bonusAmount} PT!`,
      });
    },
    onError: (error: any) => {
      console.error('Claim bonus error:', error);
      toast({
        title: "Failed to claim bonus",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Show modal when user can claim bonus
  useEffect(() => {
    if (bonusData?.canClaim && user) {
      // Add a small delay to ensure the user has fully loaded
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [bonusData, user]);

  const getDayIcon = (day: number) => {
    if (day <= 3) return <Calendar className="h-4 w-4" />;
    if (day <= 6) return <Star className="h-4 w-4" />;
    return <Zap className="h-4 w-4" />;
  };

  const getDayBonus = (day: number) => {
    return Math.min(50 + ((day - 1) * 10), 200);
  };

  if (!user || !bonusData?.canClaim) {
    return null;
  }

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-white">
            <Gift className="h-6 w-6 text-yellow-400" />
            <span>Daily Login Bonus!</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Bonus */}
          <div className="text-center space-y-4">
            <div className="p-6 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg">
              <Coins className="h-16 w-16 text-white mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">
                {bonusData.bonusAmount} PT
              </div>
              <div className="text-yellow-100">
                {bonusData.consecutiveDays === 0 ? 'Welcome bonus!' : `Day ${bonusData.consecutiveDays + 1} bonus!`}
              </div>
            </div>
            
            {bonusData.consecutiveDays > 0 && (
              <div className="text-center">
                <Badge className="bg-purple-600 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  {bonusData.consecutiveDays} day streak
                </Badge>
              </div>
            )}
          </div>

          {/* Bonus Schedule */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Login Streak Rewards</h3>
            <div className="grid grid-cols-1 gap-2">
              {[1, 2, 3, 5, 7, 10].map((day) => {
                const isCurrentOrPast = (bonusData.consecutiveDays + 1) >= day;
                const isCurrent = (bonusData.consecutiveDays + 1) === day;
                
                return (
                  <div
                    key={day}
                    className={`flex items-center justify-between p-3 rounded ${
                      isCurrent
                        ? 'bg-indigo-600 border border-indigo-400'
                        : isCurrentOrPast
                        ? 'bg-gray-700'
                        : 'bg-gray-700 opacity-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-1 rounded ${isCurrent ? 'bg-white text-indigo-600' : 'text-gray-300'}`}>
                        {getDayIcon(day)}
                      </div>
                      <span className={`font-medium ${isCurrent ? 'text-white' : 'text-gray-300'}`}>
                        Day {day}
                      </span>
                      {isCurrent && (
                        <Badge className="bg-yellow-600 text-white text-xs">
                          Today
                        </Badge>
                      )}
                    </div>
                    <span className={`font-bold ${isCurrent ? 'text-yellow-300' : 'text-purple-400'}`}>
                      {getDayBonus(day)} PT
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-gray-400 text-center">
              Keep logging in daily to increase your bonus! Max: 200 PT per day
            </div>
          </div>

          {/* Claim Button */}
          <Button
            onClick={() => claimMutation.mutate()}
            disabled={claimMutation.isPending}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold"
          >
            {claimMutation.isPending ? 'Claiming...' : 'Claim Bonus'}
          </Button>

          {/* Skip Option */}
          <Button
            variant="ghost"
            onClick={() => setShowModal(false)}
            className="w-full text-gray-400 hover:text-white hover:bg-gray-700"
          >
            Claim Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
