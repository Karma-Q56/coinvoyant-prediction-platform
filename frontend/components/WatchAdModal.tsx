import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tv, Coins, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

interface WatchAdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adsWatchedToday: number;
  userId: number;
}

export default function WatchAdModal({ open, onOpenChange, adsWatchedToday, userId }: WatchAdModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isWatching, setIsWatching] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const maxAds = 3;
  const adsRemaining = maxAds - adsWatchedToday;

  const watchAdMutation = useMutation({
    mutationFn: () => backend.user.watchAd({ userId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Tokens Earned!',
        description: `You earned ${data.tokensEarned} PT! New balance: ${data.newBalance} PT`,
      });
      onOpenChange(false);
      setIsWatching(false);
      setCountdown(0);
    },
    onError: (error: Error) => {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsWatching(false);
      setCountdown(0);
    },
  });

  const startWatchingAd = () => {
    setIsWatching(true);
    setCountdown(5);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          watchAdMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Tv className="h-6 w-6 text-blue-400" />
            <span>Watch Ad for Tokens</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {adsRemaining === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Daily Limit Reached</h3>
              <p className="text-gray-400 font-medium">
                You've watched all 3 ads for today. Come back tomorrow for more tokens!
              </p>
            </div>
          ) : isWatching ? (
            <div className="text-center py-8">
              <div className="relative">
                <Tv className="h-24 w-24 text-blue-400 mx-auto mb-4 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl font-bold text-white">{countdown}</div>
                </div>
              </div>
              <p className="text-gray-300 font-medium">
                Watching advertisement...
              </p>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-lg text-center">
                <Coins className="h-12 w-12 text-white mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-white mb-2">Earn +5 PT</h3>
                <p className="text-blue-100 font-medium">
                  Watch a quick ad to earn prediction tokens
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400 font-medium">Ads Remaining Today</p>
                  <p className="text-2xl font-bold text-white">{adsRemaining} / {maxAds}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 font-medium">Time per Ad</p>
                  <p className="text-2xl font-bold text-white">~5s</p>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={startWatchingAd}
                  disabled={watchAdMutation.isPending || isWatching}
                  className="w-full bg-blue-600 hover:bg-blue-700 font-semibold text-lg py-6"
                >
                  {isWatching ? 'Watching...' : 'Watch Ad & Earn 5 PT'}
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="w-full border-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>

              <p className="text-xs text-center text-gray-500 font-medium">
                Note: This is a simulated ad experience. In production, actual ads would be shown.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
