import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, Trophy, Target, Coins, Swords, Sparkles, Crown, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

export default function EnhancedProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [copiedChallengeId, setCopiedChallengeId] = useState(false);

  const profileUserId = userId ? parseInt(userId) : currentUser?.id;

  const { data: profile } = useQuery({
    queryKey: ['enhancedProfile', profileUserId],
    queryFn: () => backend.user.getEnhancedProfile({ userId: profileUserId! }),
    enabled: !!profileUserId,
  });

  const isOwnProfile = currentUser?.id === profileUserId;

  const copyChallengeId = () => {
    if (profile?.challengeId) {
      navigator.clipboard.writeText(profile.challengeId);
      setCopiedChallengeId(true);
      toast({
        title: 'Copied!',
        description: 'Challenge ID copied to clipboard',
      });
      setTimeout(() => setCopiedChallengeId(false), 2000);
    }
  };

  if (!profile) {
    return (
      <div className="text-center py-12 px-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white">Loading profile...</h1>
      </div>
    );
  }

  const winRate = profile.totalPredictions > 0
    ? ((profile.totalWins / profile.totalPredictions) * 100).toFixed(1)
    : '0.0';

  const h2hWinRate = (profile.head2headWins + profile.head2headLosses) > 0
    ? ((profile.head2headWins / (profile.head2headWins + profile.head2headLosses)) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{profile.username}</h1>
              {profile.isPremium && (
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <p className="text-gray-400 font-medium">
              Member since {new Date(profile.joinDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {isOwnProfile && profile.challengeId && (
        <Card className="bg-gradient-to-r from-orange-600 to-red-600 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">Your Challenge ID</p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-white tracking-wider">
                    {profile.challengeId}
                  </span>
                  <Button
                    onClick={copyChallengeId}
                    size="sm"
                    variant="secondary"
                    className="bg-white/20 hover:bg-white/30"
                  >
                    {copiedChallengeId ? (
                      <CheckCircle className="h-4 w-4 text-white" />
                    ) : (
                      <Copy className="h-4 w-4 text-white" />
                    )}
                  </Button>
                </div>
              </div>
              <Swords className="h-12 w-12 text-white opacity-50" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <Coins className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{profile.ptBalance}</div>
            <div className="text-xs text-gray-400 font-medium">PT Balance</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{profile.streak}</div>
            <div className="text-xs text-gray-400 font-medium">Win Streak</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{winRate}%</div>
            <div className="text-xs text-gray-400 font-medium">Accuracy</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <Swords className="h-8 w-8 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{profile.head2headWins}</div>
            <div className="text-xs text-gray-400 font-medium">H2H Wins</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Prediction Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Total Predictions</span>
              <span className="text-white font-bold">{profile.totalPredictions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Wins</span>
              <span className="text-green-400 font-bold">{profile.totalWins}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Losses</span>
              <span className="text-red-400 font-bold">{profile.totalLosses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Win Rate</span>
              <span className="text-white font-bold">{winRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Accuracy Score</span>
              <span className="text-purple-400 font-bold">{profile.accuracyPercentage.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Swords className="h-5 w-5 text-orange-400" />
              <span>Head2Head Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Total Challenges</span>
              <span className="text-white font-bold">
                {profile.head2headWins + profile.head2headLosses}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Wins</span>
              <span className="text-green-400 font-bold">{profile.head2headWins}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Losses</span>
              <span className="text-red-400 font-bold">{profile.head2headLosses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Win Rate</span>
              <span className="text-white font-bold">{h2hWinRate}%</span>
            </div>
            {profile.head2headWins >= 10 && (
              <div className="pt-2 border-t border-gray-700">
                <Badge className="w-full justify-center bg-orange-600 text-white">
                  <Crown className="h-4 w-4 mr-1" />
                  Challenge Champion
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <span>Achievements</span>
            <Badge className="bg-yellow-600 ml-auto">{profile.achievements.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.achievements.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No achievements yet. Start predicting to earn badges!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profile.achievements.slice(0, 8).map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-3 bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-600 rounded-lg text-center"
                >
                  <div className="text-3xl mb-2">{achievement.badgeIcon || '🏆'}</div>
                  <h4 className="text-sm font-semibold text-yellow-400 mb-1">{achievement.name}</h4>
                  <p className="text-xs text-gray-400 font-medium">{achievement.description}</p>
                </div>
              ))}
            </div>
          )}
          {profile.achievements.length > 8 && (
            <div className="text-center mt-4">
              <Button variant="outline" className="border-gray-600">
                View All {profile.achievements.length} Achievements
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
