import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Clock, TrendingDown } from 'lucide-react';
import backend from '~backend/client';

export default function MyPredictionsPage() {
  const { user } = useAuth();

  const { data: userPredictions, isLoading } = useQuery({
    queryKey: ['user-predictions', user?.id],
    queryFn: () => backend.prediction.getUserPredictions({ userId: user!.id }),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Please sign in to view your predictions</h1>
      </div>
    );
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'won':
        return 'bg-green-600';
      case 'lost':
        return 'bg-red-600';
      default:
        return 'bg-yellow-600';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'won':
        return <Trophy className="h-4 w-4" />;
      case 'lost':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const stats = userPredictions?.predictions.reduce(
    (acc, pred) => {
      acc.total++;
      if (pred.outcome === 'won') acc.won++;
      if (pred.outcome === 'lost') acc.lost++;
      if (pred.outcome === 'pending') acc.pending++;
      acc.totalPtSpent += pred.ptSpent;
      return acc;
    },
    { total: 0, won: 0, lost: 0, pending: 0, totalPtSpent: 0 }
  ) || { total: 0, won: 0, lost: 0, pending: 0, totalPtSpent: 0 };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Predictions</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">Total Predictions</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.won}</div>
            <div className="text-sm text-gray-400">Won</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.lost}</div>
            <div className="text-sm text-gray-400">Lost</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-sm text-gray-400">Pending</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.totalPtSpent}</div>
            <div className="text-sm text-gray-400">PT Spent</div>
          </CardContent>
        </Card>
      </div>

      {/* Predictions List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-lg">Loading your predictions...</div>
        </div>
      ) : userPredictions?.predictions.length === 0 ? (
        <div className="text-center py-12">
          <Target className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400 mb-2">No predictions yet</h2>
          <p className="text-gray-500">Start making predictions to see them here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userPredictions?.predictions.map((prediction) => (
            <Card key={prediction.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-white pr-4">
                    {prediction.question}
                  </CardTitle>
                  <Badge className={`${getOutcomeColor(prediction.outcome)} text-white`}>
                    <div className="flex items-center space-x-1">
                      {getOutcomeIcon(prediction.outcome)}
                      <span className="capitalize">{prediction.outcome}</span>
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Your Choice:</span>
                    <div className="font-medium text-white">{prediction.optionSelected}</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-400">PT Spent:</span>
                    <div className="font-medium text-purple-400">{prediction.ptSpent} PT</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-400">Date:</span>
                    <div className="font-medium text-white">
                      {new Date(prediction.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {prediction.status === 'resolved' && prediction.correctOption && (
                  <div className="p-3 bg-gray-700 rounded">
                    <span className="text-gray-400">Correct Answer: </span>
                    <span className="font-medium text-white">{prediction.correctOption}</span>
                    {prediction.outcome === 'won' && (
                      <div className="text-green-400 text-sm mt-1">
                        🎉 You won {prediction.ptSpent * 2} PT!
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
