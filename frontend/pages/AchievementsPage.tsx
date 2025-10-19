import { useQuery, useMutation, useQueryClient } from '@tantml:react-query';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Lock, CheckCircle, Trophy, Calendar, Coins } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

export default function AchievementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: achievementsData } = useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: () => backend.user.listAchievements(),
    enabled: !!user,
  });

  const checkAchievementsMutation = useMutation({
    mutationFn: () => backend.user.checkAchievements(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      if (data.newAchievements.length > 0) {
        toast({
          title: `${data.newAchievements.length} New Achievement${data.newAchievements.length > 1 ? 's' : ''}!`,
          description: `You earned ${data.tokensEarned} PT!`,
        });
      } else {
        toast({
          title: 'All Caught Up!',
          description: 'No new achievements yet. Keep predicting!',
        });
      }
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

  const unlockedAchievements = achievementsData?.achievements.filter(a => a.earned) || [];
  const lockedAchievements = achievementsData?.achievements.filter(a => !a.earned) || [];
  const monthlyAchievements = achievementsData?.achievements.filter(a => a.isMonthly) || [];
  const permanentAchievements = achievementsData?.achievements.filter(a => !a.isMonthly) || [];

  const totalCount = achievementsData?.achievements.length || 0;
  const unlockedCount = unlockedAchievements.length;

  return (
    <div className="space-y-6 px-4">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Achievements</h1>
        <p className="text-gray-400 font-medium">Unlock badges and earn bonus tokens</p>
      </div>

      <Card className="bg-gradient-to-r from-yellow-600 to-orange-600 border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-white">{unlockedCount} / {totalCount}</h3>
              <p className="text-orange-100 font-medium">Achievements Unlocked</p>
            </div>
            <Trophy className="h-12 w-12 text-white" />
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 mb-4">
            <div
              className="bg-white h-3 rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
            ></div>
          </div>
          <Button
            onClick={() => checkAchievementsMutation.mutate()}
            disabled={checkAchievementsMutation.isPending}
            className="w-full bg-white text-orange-600 hover:bg-orange-50 font-semibold"
          >
            {checkAchievementsMutation.isPending ? 'Checking...' : 'Check for New Achievements'}
          </Button>
        </CardContent>
      </Card>

      {unlockedAchievements.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <span>Unlocked Achievements</span>
              <Badge className="bg-green-600 ml-auto">{unlockedAchievements.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unlockedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-4 rounded-lg border-2 border-green-600 bg-gradient-to-br from-green-900/30 to-emerald-900/30"
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl">{achievement.badgeIcon || '🏆'}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-green-400">{achievement.name}</h3>
                        {achievement.isMonthly && (
                          <Badge className="bg-blue-600 text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            Monthly
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 font-medium mb-2">
                        {achievement.description}
                      </p>
                      <div className="flex items-center space-x-1 text-xs font-semibold text-yellow-400">
                        <Coins className="h-3 w-3" />
                        <span>+{achievement.tokenReward} PT</span>
                      </div>
                      {achievement.earnedAt && (
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                          Unlocked {new Date(achievement.earnedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Lock className="h-6 w-6 text-gray-400" />
            <span>Locked Achievements</span>
            <Badge className="bg-gray-600 ml-auto">{lockedAchievements.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="p-4 rounded-lg border-2 border-gray-600 bg-gray-700/50"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-3xl grayscale opacity-50">
                    {achievement.badgeIcon || '🔒'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-300">{achievement.name}</h3>
                      {achievement.isMonthly && (
                        <Badge className="bg-blue-600 text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          Monthly
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 font-medium mb-2">
                      {achievement.description}
                    </p>
                    <div className="flex items-center space-x-1 text-xs font-semibold text-gray-500 mb-2">
                      <Coins className="h-3 w-3" />
                      <span>+{achievement.tokenReward} PT</span>
                    </div>
                    <div className="text-xs text-gray-400 font-medium">
                      Requirement: {achievement.requirementValue} {achievement.requirementType}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Trophy className="h-6 w-6 text-purple-400" />
              <span>Permanent Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm font-medium mb-4">
              These achievements are earned once and stay with you forever!
            </p>
            <div className="space-y-2">
              {permanentAchievements.slice(0, 5).map((achievement) => (
                <div key={achievement.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                  <div className="flex items-center space-x-2">
                    <span className={achievement.earned ? '' : 'grayscale opacity-50'}>
                      {achievement.badgeIcon || '🏆'}
                    </span>
                    <span className={`text-sm font-medium ${achievement.earned ? 'text-white' : 'text-gray-400'}`}>
                      {achievement.name}
                    </span>
                  </div>
                  {achievement.earned ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-blue-600">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Calendar className="h-6 w-6 text-blue-400" />
              <span>Monthly Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm font-medium mb-4">
              These reset every month. Earn them again for more tokens!
            </p>
            <div className="space-y-2">
              {monthlyAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                  <div className="flex items-center space-x-2">
                    <span className={achievement.earned ? '' : 'grayscale opacity-50'}>
                      {achievement.badgeIcon || '📅'}
                    </span>
                    <span className={`text-sm font-medium ${achievement.earned ? 'text-white' : 'text-gray-400'}`}>
                      {achievement.name}
                    </span>
                  </div>
                  {achievement.earned ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
