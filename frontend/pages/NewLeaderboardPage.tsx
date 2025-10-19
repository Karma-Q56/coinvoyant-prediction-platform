import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, Crown, Swords, Sparkles, Lock } from 'lucide-react';
import backend from '~backend/client';

export default function NewLeaderboardPage() {
  const { user } = useAuth();

  const { data: leaderboards, isLoading } = useQuery({
    queryKey: ['leaderboards'],
    queryFn: () => backend.user.getLeaderboards(),
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-400" />;
      default:
        return <Trophy className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
      case 2:
        return 'bg-gradient-to-r from-gray-400 to-gray-500';
      case 3:
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
      default:
        return 'bg-gray-700';
    }
  };

  const isCurrentUser = (userId: number) => user?.id === userId;

  const renderLeaderboardEntry = (entry: any) => (
    <div
      key={entry.id}
      className={`flex items-center justify-between p-4 rounded-lg transition-all ${
        isCurrentUser(entry.id) ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-650'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-full ${getRankColor(entry.rank)}`}>
          {getRankIcon(entry.rank)}
        </div>
        <div>
          <div className="font-semibold text-white flex items-center space-x-2">
            <span>{entry.username}</span>
            {isCurrentUser(entry.id) && (
              <Badge variant="secondary" className="text-xs font-medium">You</Badge>
            )}
          </div>
          <div className="text-xs text-gray-400 font-medium flex items-center space-x-3">
            <span>{entry.totalWins} wins</span>
            <span>{entry.accuracyPercentage.toFixed(1)}% accuracy</span>
            <span>{entry.streak} streak</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-purple-400">
          {entry.ptBalance}
        </div>
        <div className="text-xs text-gray-400 font-medium">PT</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 px-4">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Leaderboards</h1>
        <p className="text-gray-400 font-medium">Compete with the best prediction makers</p>
      </div>

      <Tabs defaultValue="freemium" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
          <TabsTrigger 
            value="freemium" 
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Freemium
          </TabsTrigger>
          <TabsTrigger 
            value="premium" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Premium
          </TabsTrigger>
          <TabsTrigger 
            value="head2head" 
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
          >
            <Swords className="h-4 w-4 mr-2" />
            Head2Head
          </TabsTrigger>
        </TabsList>

        <TabsContent value="freemium" className="space-y-4 mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Trophy className="h-6 w-6 text-indigo-400" />
                <span>Freemium Leaderboard</span>
                <Badge className="bg-indigo-600 text-white font-semibold ml-auto">
                  Top 100
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-400 font-medium">
                Compete with non-premium users. Monthly resets with 100 starting tokens.
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="text-lg text-gray-200 font-medium">Loading leaderboard...</div>
                </div>
              ) : (
                leaderboards?.freemiumLeaderboard.map(renderLeaderboardEntry)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="premium" className="space-y-4 mt-6">
          <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-600">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Sparkles className="h-6 w-6 text-purple-400" />
                <span>Premium Leaderboard</span>
                <Badge className="bg-purple-600 text-white font-semibold ml-auto">
                  Exclusive
                </Badge>
              </CardTitle>
              <p className="text-sm text-purple-200 font-medium">
                Premium users only. Start with 300 tokens monthly and compete at the highest level.
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="text-lg text-gray-200 font-medium">Loading leaderboard...</div>
                </div>
              ) : leaderboards?.premiumLeaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <Lock className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                  <p className="text-purple-200 font-medium">No premium users yet. Be the first!</p>
                </div>
              ) : (
                leaderboards?.premiumLeaderboard.map(renderLeaderboardEntry)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="head2head" className="space-y-4 mt-6">
          <Card className="bg-gradient-to-br from-orange-900/50 to-red-900/50 border-orange-600">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Swords className="h-6 w-6 text-orange-400" />
                <span>King of Head2Head</span>
                <Badge className="bg-orange-600 text-white font-semibold ml-auto">
                  Champions
                </Badge>
              </CardTitle>
              <p className="text-sm text-orange-200 font-medium">
                Top challenge winners. Prove your dominance in 1v1 prediction battles!
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="text-lg text-gray-200 font-medium">Loading leaderboard...</div>
                </div>
              ) : leaderboards?.head2headLeaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <Swords className="h-16 w-16 text-orange-400 mx-auto mb-4" />
                  <p className="text-orange-200 font-medium">No challenge winners yet. Be the first champion!</p>
                </div>
              ) : (
                leaderboards?.head2headLeaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                      isCurrentUser(entry.id) ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-650'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${getRankColor(entry.rank)}`}>
                        {getRankIcon(entry.rank)}
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center space-x-2">
                          <span>{entry.username}</span>
                          {isCurrentUser(entry.id) && (
                            <Badge variant="secondary" className="text-xs font-medium">You</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-medium flex items-center space-x-3">
                          <span>{entry.ptBalance} PT</span>
                          <span>{entry.accuracyPercentage.toFixed(1)}% accuracy</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-400">
                        {entry.head2headWins}
                      </div>
                      <div className="text-xs text-gray-400 font-medium">H2H wins</div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {user && (
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Your Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{user.ptBalance}</div>
                <div className="text-indigo-100 font-medium text-sm">PT Balance</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{user.streak}</div>
                <div className="text-indigo-100 font-medium text-sm">Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-indigo-100 font-medium text-sm">Total Wins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-indigo-100 font-medium text-sm">H2H Wins</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
