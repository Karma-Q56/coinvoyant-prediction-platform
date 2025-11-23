import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Trophy, TrendingUp, TrendingDown, Calendar, Zap, Users, Clock, Wallet, Star } from 'lucide-react';
import backend from '~backend/client';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: () => backend.user.getDashboard({ userId: user!.id }),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="text-center py-12 px-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white">Please sign in to view your dashboard</h1>
      </div>
    );
  }

  const getPredictionTypeBadge = (type: string) => {
    return type === 'daily' ? 
      <Badge className="bg-orange-600 text-white font-medium">
        <Zap className="h-3 w-3 mr-1" />
        Daily
      </Badge> :
      <Badge className="bg-blue-600 text-white font-medium">
        <Calendar className="h-3 w-3 mr-1" />
        Long Term
      </Badge>;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'win':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'vote':
      case 'sweepstakes':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Target className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'win':
        return 'text-green-400';
      case 'vote':
      case 'sweepstakes':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6 px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Welcome back, {user.username}!</h1>
          <p className="text-gray-300 font-medium">Here's what's happening with your predictions</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-lg text-gray-200 font-medium">Loading your dashboard...</div>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-purple-600 to-indigo-600 border-0">
              <CardContent className="p-6 text-center">
                <Trophy className="h-8 w-8 text-white mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{dashboard?.userStats.currentStreak}</div>
                <div className="text-purple-100 text-sm font-medium">Current Streak</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-600 to-teal-600 border-0">
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 text-white mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{dashboard?.userStats.totalPredictions}</div>
                <div className="text-green-100 text-sm font-medium">Total Predictions</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-600 to-orange-600 border-0">
              <CardContent className="p-6 text-center">
                <Star className="h-8 w-8 text-white mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{dashboard?.userStats.winRate}%</div>
                <div className="text-yellow-100 text-sm font-medium">Win Rate</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-600 to-red-600 border-0">
              <CardContent className="p-6 text-center">
                <Wallet className="h-8 w-8 text-white mx-auto mb-2" />
                <div className="text-lg font-bold text-white">
                  🪙 {dashboard?.userStats.etBalance} | 🔮 {dashboard?.userStats.ptBalance}
                </div>
                <div className="text-pink-100 text-sm font-medium">Your Tokens</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trending Predictions */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <TrendingUp className="h-5 w-5 text-indigo-400" />
                    <span>Trending Predictions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboard?.trendingPredictions && dashboard.trendingPredictions.length > 0 ? (
                    <div className="space-y-4">
                      {dashboard.trendingPredictions.map((prediction) => (
                        <div key={prediction.id} className="p-4 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white text-sm pr-2 mb-1">{prediction.question}</h3>
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded font-medium">
                                  {prediction.category}
                                </span>
                                {getPredictionTypeBadge(prediction.predictionType)}
                              </div>
                            </div>
                            {prediction.imageUrl && (
                              <img 
                                src={prediction.imageUrl} 
                                alt="Prediction" 
                                className="w-12 h-12 object-cover rounded ml-2 flex-shrink-0"
                              />
                            )}
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center space-x-2 text-gray-300">
                              <Users className="h-3 w-3" />
                              <span className="font-medium">{prediction.totalVotes} votes</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-300">
                              <Clock className="h-3 w-3" />
                              <span className="font-medium">{new Date(prediction.closesAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Link to="/predictions">
                        <Button variant="outline" className="w-full border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white font-medium">
                          View All Predictions
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <div className="text-gray-400 font-medium">No trending predictions available</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboard?.recentActivity && dashboard.recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {dashboard.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            {getActivityIcon(activity.type)}
                            <span className="text-gray-200 font-medium">{activity.description}</span>
                          </div>
                          {activity.amount && (
                            <span className={`font-semibold ${getActivityColor(activity.type)}`}>
                              {activity.amount > 0 ? '+' : ''}{activity.amount} {activity.currency}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-gray-400 text-sm font-medium">No recent activity</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link to="/predictions">
                    <Button className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                      <Target className="h-4 w-4 mr-2" />
                      Make Predictions
                    </Button>
                  </Link>
                  <Link to="/sweepstakes">
                    <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white font-medium">
                      <Trophy className="h-4 w-4 mr-2" />
                      Enter Sweepstakes
                    </Button>
                  </Link>
                  <Link to="/wallet">
                    <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white font-medium">
                      <Wallet className="h-4 w-4 mr-2" />
                      Buy Tokens
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Performance Summary */}
              {dashboard?.userStats?.totalPredictions && dashboard.userStats.totalPredictions > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300 font-medium">Predictions Made</span>
                      <span className="text-white font-semibold">{dashboard?.userStats?.totalPredictions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 font-medium">Correct Predictions</span>
                      <span className="text-green-400 font-semibold">{dashboard?.userStats?.totalWins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 font-medium">Win Rate</span>
                      <span className="text-yellow-400 font-semibold">{dashboard?.userStats?.winRate}%</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
