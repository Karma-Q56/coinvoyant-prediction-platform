import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Crown, Trophy, Zap, CheckCircle, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

export default function PremiumPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const upgradeMutation = useMutation({
    mutationFn: () => backend.user.upgradePremium({ userId: user?.id || 0 }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({
        title: 'Welcome to Premium!',
        description: `You received ${data.newBalance} PT to get started!`,
      });
    },
    onError: (error: Error) => {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const features = [
    {
      icon: <Zap className="h-6 w-6 text-yellow-400" />,
      title: '300 Starting Tokens',
      description: 'Get 300 PT every month instead of 100',
      premium: true,
    },
    {
      icon: <Trophy className="h-6 w-6 text-purple-400" />,
      title: 'Exclusive Leaderboard',
      description: 'Compete with premium users only',
      premium: true,
    },
    {
      icon: <Crown className="h-6 w-6 text-yellow-400" />,
      title: 'Premium Badge',
      description: 'Show off your premium status',
      premium: true,
    },
    {
      icon: <Sparkles className="h-6 w-6 text-pink-400" />,
      title: 'Special Cosmetics',
      description: 'Unlock exclusive profile badges',
      premium: true,
    },
  ];

  return (
    <div className="space-y-6 px-4 max-w-4xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 mb-4">
          <Sparkles className="h-8 w-8 text-purple-400" />
          <h1 className="text-3xl md:text-4xl font-bold text-white">Premium</h1>
          <Sparkles className="h-8 w-8 text-purple-400" />
        </div>
        <p className="text-gray-400 font-medium">Elevate your prediction game</p>
      </div>

      {user?.isPremium ? (
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
          <CardContent className="p-8 text-center">
            <Crown className="h-16 w-16 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">You're Premium!</h2>
            <p className="text-purple-100 font-medium mb-4">
              Enjoy all the exclusive benefits and compete at the highest level
            </p>
            <Badge className="bg-white text-purple-600 font-semibold text-lg px-4 py-2">
              Premium Member
            </Badge>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-600">
          <CardHeader>
            <CardTitle className="text-center">
              <div className="text-3xl font-bold text-white mb-2">Upgrade to Premium</div>
              <p className="text-purple-200 text-base font-medium">
                One-time upgrade. Unlimited benefits.
              </p>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-6">
              <div className="text-5xl font-bold text-white mb-2">FREE</div>
              <p className="text-purple-200 font-medium">During Beta</p>
            </div>

            <Button
              onClick={() => upgradeMutation.mutate()}
              disabled={upgradeMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg py-6"
            >
              {upgradeMutation.isPending ? 'Upgrading...' : 'Upgrade Now'}
            </Button>

            <p className="text-center text-sm text-purple-200 font-medium">
              Get +200 bonus tokens immediately upon upgrade!
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="bg-gray-800 border-gray-700 hover:border-purple-600 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gray-700 rounded-lg">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    {feature.premium && (
                      <Badge className="bg-purple-600 text-white text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 font-medium">{feature.description}</p>
                </div>
                {user?.isPremium ? (
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-500 flex-shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Premium vs Freemium</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Feature</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-semibold">Freemium</th>
                  <th className="text-center py-3 px-4 text-purple-400 font-semibold">Premium</th>
                </tr>
              </thead>
              <tbody className="text-gray-300 font-medium">
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4">Monthly Starting Tokens</td>
                  <td className="text-center py-3 px-4">100 PT</td>
                  <td className="text-center py-3 px-4 text-purple-400 font-bold">300 PT</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4">Leaderboard Access</td>
                  <td className="text-center py-3 px-4">Freemium Only</td>
                  <td className="text-center py-3 px-4 text-purple-400 font-bold">Both Boards</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4">Watch Ads for Tokens</td>
                  <td className="text-center py-3 px-4"><CheckCircle className="h-4 w-4 text-green-400 mx-auto" /></td>
                  <td className="text-center py-3 px-4"><CheckCircle className="h-4 w-4 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4">Achievements</td>
                  <td className="text-center py-3 px-4"><CheckCircle className="h-4 w-4 text-green-400 mx-auto" /></td>
                  <td className="text-center py-3 px-4"><CheckCircle className="h-4 w-4 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4">Head2Head Challenges</td>
                  <td className="text-center py-3 px-4"><CheckCircle className="h-4 w-4 text-green-400 mx-auto" /></td>
                  <td className="text-center py-3 px-4"><CheckCircle className="h-4 w-4 text-green-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Premium Badge</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4"><CheckCircle className="h-4 w-4 text-purple-400 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
