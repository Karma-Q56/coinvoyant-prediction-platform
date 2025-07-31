import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Gift, Trophy, TrendingUp, Coins, Star, Shield, Zap, Users, Calendar } from 'lucide-react';
import backend from '~backend/client';

export default function HomePage() {
  const { user } = useAuth();

  const { data: predictions, isLoading, error } = useQuery({
    queryKey: ['featured-predictions'],
    queryFn: async () => {
      try {
        return await backend.prediction.listPredictions({ status: 'open' });
      } catch (error) {
        console.error('Failed to fetch predictions:', error);
        return { predictions: [] };
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  const featuredPredictions = predictions?.predictions.slice(0, 3) || [];

  const getPredictionTypeBadge = (type: string) => {
    return type === 'daily' ? 
      <Badge className="bg-orange-600 text-white">
        <Zap className="h-3 w-3 mr-1" />
        Daily
      </Badge> :
      <Badge className="bg-blue-600 text-white">
        <Calendar className="h-3 w-3 mr-1" />
        Long Term
      </Badge>;
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-8 py-8 md:py-16">
        <div className="flex justify-center">
          <Coins className="h-16 w-16 md:h-24 md:w-24 text-indigo-400" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Welcome to CoinVoyant
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto px-4">
          The ultimate prediction-based entertainment platform where your insights become rewards. 
          Use tokens to predict real-world events, compete with others, and win amazing prizes!
        </p>
        
        {!user && (
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 px-4">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
                Get Started Free
              </Button>
            </Link>
            <Link to="/predictions">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                Browse Predictions
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* How It Works Section */}
      <div className="space-y-8 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white">How CoinVoyant Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <Card className="bg-gray-800 border-gray-700 text-center">
            <CardContent className="p-6 md:p-8">
              <Target className="h-12 w-12 md:h-16 md:w-16 text-indigo-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Make Predictions</h3>
              <p className="text-gray-300">
                Use PredictTokens (PT) to vote on upcoming events across sports, entertainment, politics, and more.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 text-center">
            <CardContent className="p-6 md:p-8">
              <Trophy className="h-12 w-12 md:h-16 md:w-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Win Rewards</h3>
              <p className="text-gray-300">
                Correct predictions earn you double your PT back, plus streak bonuses for consecutive wins.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 text-center">
            <CardContent className="p-6 md:p-8">
              <Gift className="h-12 w-12 md:h-16 md:w-16 text-pink-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Enter Sweepstakes</h3>
              <p className="text-gray-300">
                Use Entertainment Tokens (ET) or PredictTokens (PT) to enter sweepstakes for real prizes and exclusive rewards.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-8 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white">Why Choose CoinVoyant?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start space-x-4 p-4">
            <Star className="h-8 w-8 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Real Rewards</h3>
              <p className="text-gray-300">Win actual prizes and tokens that have real value in our ecosystem.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4">
            <Shield className="h-8 w-8 text-green-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Fair & Transparent</h3>
              <p className="text-gray-300">All predictions are resolved fairly with transparent results and payouts.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4">
            <Zap className="h-8 w-8 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Daily & Long-term Events</h3>
              <p className="text-gray-300">Choose from quick daily predictions or strategic long-term forecasts.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4">
            <TrendingUp className="h-8 w-8 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Flexible Betting</h3>
              <p className="text-gray-300">Bet any amount above the minimum - higher stakes mean higher rewards!</p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4">
            <Users className="h-8 w-8 text-indigo-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Community Driven</h3>
              <p className="text-gray-300">Compete with friends and climb the leaderboards together.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4">
            <Coins className="h-8 w-8 text-orange-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Dual Token System</h3>
              <p className="text-gray-300">ET and PT for different activities - maximize your earning potential.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Predictions */}
      {!isLoading && !error && featuredPredictions.length > 0 && (
        <div className="space-y-8 px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white">Featured Predictions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPredictions.map((prediction) => (
              <Card key={prediction.id} className="bg-gray-800 border-gray-700 hover:border-indigo-500 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-base md:text-lg text-white pr-2 mb-2">{prediction.question}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">
                          {prediction.category}
                        </span>
                        {getPredictionTypeBadge(prediction.predictionType)}
                      </div>
                    </div>
                    {prediction.imageUrl && (
                      <img 
                        src={prediction.imageUrl} 
                        alt="Prediction" 
                        className="w-16 h-16 object-cover rounded ml-2 flex-shrink-0"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-300">
                    Min bet: {prediction.requiredPt} PT
                  </div>
                  <div className="text-sm text-gray-400">
                    Closes: {new Date(prediction.closesAt).toLocaleDateString()}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {prediction.options.map((option) => (
                      <div key={option} className="text-center p-2 bg-gray-700 rounded text-sm">
                        <div className="text-white">{option}</div>
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
              <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                View All Predictions
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12 px-4">
          <div className="text-lg text-gray-400">Loading featured predictions...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12 px-4">
          <div className="text-lg text-gray-400">Unable to load predictions at the moment</div>
        </div>
      )}

      {/* Action Buttons */}
      {user && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
          <Link to="/predictions">
            <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 border-0 hover:from-indigo-700 hover:to-purple-700 transition-all cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6 md:p-8 text-center">
                <Target className="h-10 w-10 md:h-12 md:w-12 text-white mb-4" />
                <h3 className="text-lg md:text-xl font-bold text-white mb-2">Make Predictions</h3>
                <p className="text-indigo-100 text-sm">Vote on upcoming events and win PT</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/sweepstakes">
            <Card className="bg-gradient-to-br from-pink-600 to-red-600 border-0 hover:from-pink-700 hover:to-red-700 transition-all cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6 md:p-8 text-center">
                <Gift className="h-10 w-10 md:h-12 md:w-12 text-white mb-4" />
                <h3 className="text-lg md:text-xl font-bold text-white mb-2">Enter Sweepstakes</h3>
                <p className="text-pink-100 text-sm">Use ET or PT to enter for amazing prizes</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/leaderboard">
            <Card className="bg-gradient-to-br from-green-600 to-teal-600 border-0 hover:from-green-700 hover:to-teal-700 transition-all cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6 md:p-8 text-center">
                <Trophy className="h-10 w-10 md:h-12 md:w-12 text-white mb-4" />
                <h3 className="text-lg md:text-xl font-bold text-white mb-2">Leaderboard</h3>
                <p className="text-green-100 text-sm">See top players and your ranking</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* CTA Section */}
      {!user && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 md:p-12 text-center mx-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to Start Predicting?</h2>
          <p className="text-indigo-100 mb-6 text-lg">
            Join thousands of users already earning rewards with their predictions!
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold">
              Sign Up Now - It's Free!
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
