import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, Crown, Star, Lock } from 'lucide-react';
import backend from '~backend/client';

export default function LeaderboardPage() {
  const { user } = useAuth();

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => backend.user.getLeaderboard(),
  });

  const { data: achievements } = useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: () => backend.user.getAchievements({ userId: user!.id }),
    enabled: !!user,
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

  const getAchievementsByCategory = () => {
    if (!achievements) return {};
    
    return achievements.achievements.reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    }, {} as Record<string, typeof achievements.achievements>);
  };

  const achievementsByCategory = getAchievementsByCategory();
  const unlockedCount = achievements?.achievements.filter(a => a.unlocked).length || 0;
  const totalCount = achievements?.achievements.length || 0;

  return (
    <div className="space-y-6 px-4">
      <h1 className="text-2xl md:text-3xl font-bold text-center text-white">Leaderboard & Achievements</h1>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            Achievements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-8">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-lg text-gray-200 font-medium">Loading leaderboard...</div>
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
                              <Badge variant="secondary" className="text-xs font-medium">You</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 font-medium">
                            {entry.ptBalance} PT
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-400">
                          {entry.streak}
                        </div>
                        <div className="text-xs text-gray-400 font-medium">streak</div>
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
                              <Badge variant="secondary" className="text-xs font-medium">You</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 font-medium">
                            {entry.streak} win streak
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
                    <div className="text-indigo-100 font-medium">Current Streak</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{user.ptBalance}</div>
                    <div className="text-indigo-100 font-medium">PT Balance</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{user.etBalance}</div>
                    <div className="text-indigo-100 font-medium">ET Balance</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          {user ? (
            <>
              {/* Achievement Progress */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-2">
                      <Star className="h-6 w-6 text-yellow-400" />
                      <span>Achievement Progress</span>
                    </div>
                    <Badge className="bg-indigo-600 text-white font-semibold">
                      {unlockedCount}/{totalCount}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="text-center mt-2 text-gray-300 font-medium">
                    {Math.round((unlockedCount / totalCount) * 100)}% Complete
                  </div>
                </CardContent>
              </Card>

              {/* Achievements by Category */}
              {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
                <Card key={category} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryAchievements.map((achievement) => (
                        <div
                          key={achievement.id}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            achievement.unlocked
                              ? 'border-yellow-400 bg-gradient-to-br from-yellow-50/10 to-orange-50/10'
                              : 'border-gray-600 bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`text-2xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                              {achievement.unlocked ? achievement.icon : '🔒'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className={`font-semibold text-sm ${
                                  achievement.unlocked ? 'text-yellow-400' : 'text-gray-400'
                                }`}>
                                  {achievement.name}
                                </h3>
                                {achievement.unlocked && (
                                  <Badge className="bg-green-600 text-white text-xs font-medium">
                                    ✓
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-xs mb-2 ${
                                achievement.unlocked ? 'text-gray-200' : 'text-gray-500'
                              } font-medium`}>
                                {achievement.description}
                              </p>
                              
                              {!achievement.unlocked && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-400 font-medium">Progress</span>
                                    <span className="text-gray-300 font-semibold">
                                      {Math.min(achievement.progress, achievement.requirement)}/{achievement.requirement}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-600 rounded-full h-1.5">
                                    <div 
                                      className="bg-gradient-to-r from-indigo-400 to-purple-400 h-1.5 rounded-full transition-all duration-300"
                                      style={{ 
                                        width: `${Math.min((achievement.progress / achievement.requirement) * 100, 100)}%` 
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <div className="text-center py-12">
              <Lock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-200 mb-2">Sign in to view achievements</h2>
              <p className="text-gray-300 font-medium">Track your progress and unlock badges for your accomplishments!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
