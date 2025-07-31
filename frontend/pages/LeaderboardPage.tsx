import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import backend from '~backend/client';

export default function LeaderboardPage() {
  const { user } = useAuth();

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => backend.user.getLeaderboard(),
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Leaderboard</h1>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-lg">Loading leaderboard...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Streaks */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Trophy className="h-6 w-6 text-yellow-400" />
                <span>Top Win Streaks</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboard?.topStreaks.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 rounded ${
                    isCurrentUser(entry.id) ? 'bg-indigo-600' : 'bg-gray-700'
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
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {entry.ptBalance} PT
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">
                      {entry.streak}
                    </div>
                    <div className="text-xs text-gray-400">streak</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top PT Holders */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <span className="text-2xl">🔮</span>
                <span>Top PT Holders</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboard?.topPtHolders.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 rounded ${
                    isCurrentUser(entry.id) ? 'bg-indigo-600' : 'bg-gray-700'
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
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {entry.streak} win streak
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-400">
                      {entry.ptBalance}
                    </div>
                    <div className="text-xs text-gray-400">PT</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* User's Position */}
      {user && leaderboard && (
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Your Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{user.streak}</div>
                <div className="text-indigo-100">Current Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{user.ptBalance}</div>
                <div className="text-indigo-100">PT Balance</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{user.etBalance}</div>
                <div className="text-indigo-100">ET Balance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
