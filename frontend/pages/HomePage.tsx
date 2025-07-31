import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Gift, Trophy, TrendingUp, Users, Coins } from 'lucide-react';
import backend from '~backend/client';

export default function HomePage() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => backend.admin.getStats(),
  });

  const { data: predictions } = useQuery({
    queryKey: ['featured-predictions'],
    queryFn: () => backend.prediction.listPredictions({ status: 'open' }),
  });

  const featuredPredictions = predictions?.predictions.slice(0, 3) || [];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Coins className="h-20 w-20 text-indigo-400" />
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Welcome to CoinVoyant
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          The ultimate prediction-based entertainment platform. Use tokens to guess outcomes of real-world events and win big!
        </p>
        
        {!user && (
          <div className="flex justify-center space-x-4">
            <Link to="/register">
              <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                Get Started
              </Button>
            </Link>
            <Link to="/predictions">
              <Button variant="outline" size="lg">
                Browse Predictions
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Users</CardTitle>
            <Users className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active Predictions</CardTitle>
            <Target className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.activePredictions || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">ET in Circulation</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalEtInCirculation || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Open Sweepstakes</CardTitle>
            <Gift className="h-4 w-4 text-pink-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.openSweepstakes || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Predictions */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Featured Predictions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredPredictions.map((prediction) => (
            <Card key={prediction.id} className="bg-gray-800 border-gray-700 hover:border-indigo-500 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-white">{prediction.question}</CardTitle>
                  <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">
                    {prediction.category}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-300">
                  Required: {prediction.requiredPt} PT
                </div>
                <div className="text-sm text-gray-400">
                  Closes: {new Date(prediction.closesAt).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  {prediction.options.map((option) => (
                    <div key={option} className="flex-1 text-center p-2 bg-gray-700 rounded text-sm">
                      {option}
                      <div className="text-xs text-gray-400 mt-1">
                        {prediction.voteCounts[option] || 0} votes
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <Link to="/predictions">
            <Button size="lg" variant="outline">
              View All Predictions
            </Button>
          </Link>
        </div>
      </div>

      {/* Action Buttons */}
      {user && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/predictions">
            <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 border-0 hover:from-indigo-700 hover:to-purple-700 transition-all cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Target className="h-12 w-12 text-white mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Make Predictions</h3>
                <p className="text-indigo-100">Vote on upcoming events and win PT</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/sweepstakes">
            <Card className="bg-gradient-to-br from-pink-600 to-red-600 border-0 hover:from-pink-700 hover:to-red-700 transition-all cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Gift className="h-12 w-12 text-white mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Enter Sweepstakes</h3>
                <p className="text-pink-100">Use ET to enter for amazing prizes</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/leaderboard">
            <Card className="bg-gradient-to-br from-green-600 to-teal-600 border-0 hover:from-green-700 hover:to-teal-700 transition-all cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Trophy className="h-12 w-12 text-white mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Leaderboard</h3>
                <p className="text-green-100">See top players and your ranking</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
