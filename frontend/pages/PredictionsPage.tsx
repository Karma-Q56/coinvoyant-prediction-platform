import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Clock, Target, TrendingUp, Calendar, Zap } from 'lucide-react';
import backend from '~backend/client';

export default function PredictionsPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [votingPrediction, setVotingPrediction] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [ptAmount, setPtAmount] = useState<string>('');

  const { data: predictions, isLoading, error } = useQuery({
    queryKey: ['predictions', selectedCategory, selectedType],
    queryFn: async () => {
      try {
        const params: any = { status: 'open' };
        if (selectedCategory) {
          params.category = selectedCategory;
        }
        if (selectedType) {
          params.predictionType = selectedType;
        }
        return await backend.prediction.listPredictions(params);
      } catch (error) {
        console.error('Failed to fetch predictions:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });

  const voteMutation = useMutation({
    mutationFn: async (data: { predictionId: number; option: string; ptAmount: number }) => {
      if (!user) throw new Error('User not authenticated');
      return await backend.prediction.vote({
        userId: user.id,
        predictionId: data.predictionId,
        option: data.option,
        ptAmount: data.ptAmount,
      });
    },
    onSuccess: (data) => {
      if (user) {
        updateUser({ ptBalance: data.newPtBalance });
      }
      setVotingPrediction(null);
      setSelectedOption('');
      setPtAmount('');
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      toast({
        title: "Vote submitted!",
        description: "Your prediction has been recorded.",
      });
    },
    onError: (error: any) => {
      console.error('Vote error:', error);
      toast({
        title: "Vote failed",
        description: error.message || "Failed to submit vote",
        variant: "destructive",
      });
    },
  });

  const handleVote = (predictionId: number, requiredPt: number) => {
    if (!selectedOption || !ptAmount) {
      toast({
        title: "Missing information",
        description: "Please select an option and enter PT amount",
        variant: "destructive",
      });
      return;
    }

    const amount = parseInt(ptAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid PT amount",
        variant: "destructive",
      });
      return;
    }

    if (amount < requiredPt) {
      toast({
        title: "Amount too low",
        description: `Minimum ${requiredPt} PT required`,
        variant: "destructive",
      });
      return;
    }

    voteMutation.mutate({
      predictionId,
      option: selectedOption,
      ptAmount: amount,
    });
  };

  const categories = [...new Set(predictions?.predictions.map(p => p.category) || [])];

  const getTimeRemaining = (closesAt: string) => {
    const now = new Date();
    const closes = new Date(closesAt);
    const diff = closes.getTime() - now.getTime();
    
    if (diff <= 0) return 'Closed';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

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

  if (!user) {
    return (
      <div className="text-center py-12 px-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white">Please sign in to view predictions</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-red-400">Error loading predictions</h1>
        <p className="text-gray-200 mb-4 font-medium">Please try refreshing the page</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="border-gray-500 text-gray-200 hover:bg-gray-700 hover:text-white font-medium"
        >
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Predictions</h1>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="text-sm">
            <span className="text-purple-400 font-semibold">🔮 {user.ptBalance} PT</span>
          </div>
          <div className="flex space-x-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-600 text-gray-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-600 text-gray-200">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="long_term">Long Term</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-lg text-gray-200 font-medium">Loading predictions...</div>
        </div>
      ) : predictions?.predictions && predictions.predictions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {predictions.predictions.map((prediction) => (
            <Card key={prediction.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base md:text-lg text-white pr-4 mb-2 font-semibold">
                      {prediction.question}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
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
                      className="w-20 h-20 object-cover rounded ml-4 flex-shrink-0"
                    />
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm text-gray-200">
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <span className="font-medium">Min: {prediction.requiredPt} PT</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">{getTimeRemaining(prediction.closesAt)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {prediction.options.map((option) => (
                    <div key={option} className="p-3 bg-gray-700 rounded text-center">
                      <div className="font-semibold text-white text-sm">{option}</div>
                      <div className="text-xs text-gray-200 mt-1 font-medium">
                        {prediction.voteCounts[option] || 0} votes
                      </div>
                    </div>
                  ))}
                </div>

                {votingPrediction === prediction.id ? (
                  <div className="space-y-4 p-4 bg-gray-700 rounded">
                    <div className="space-y-2">
                      <Label className="text-gray-200 font-medium">Select Option</Label>
                      <Select value={selectedOption} onValueChange={setSelectedOption}>
                        <SelectTrigger className="bg-gray-600 border-gray-500 text-gray-200">
                          <SelectValue placeholder="Choose your prediction" />
                        </SelectTrigger>
                        <SelectContent>
                          {prediction.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200 font-medium">PT Amount (Min: {prediction.requiredPt})</Label>
                      <Input
                        type="number"
                        value={ptAmount}
                        onChange={(e) => setPtAmount(e.target.value)}
                        min={prediction.requiredPt}
                        max={user.ptBalance}
                        className="bg-gray-600 border-gray-500 text-white"
                        placeholder="Enter PT amount"
                      />
                      <div className="text-xs text-gray-200 font-medium">
                        You can bet any amount above the minimum. Higher bets = higher rewards!
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <Button
                        onClick={() => handleVote(prediction.id, prediction.requiredPt)}
                        disabled={voteMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                      >
                        {voteMutation.isPending ? 'Submitting...' : 'Submit Vote'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setVotingPrediction(null);
                          setSelectedOption('');
                          setPtAmount('');
                        }}
                        className="flex-1 border-gray-500 text-gray-200 hover:bg-gray-700 hover:text-white font-medium"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setVotingPrediction(prediction.id)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    disabled={new Date() > new Date(prediction.closesAt)}
                  >
                    {new Date() > new Date(prediction.closesAt) ? 'Closed' : 'Make Prediction'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-200 mb-2">No predictions available</h2>
          <p className="text-gray-300 font-medium">Check back later for new predictions to vote on!</p>
        </div>
      )}
    </div>
  );
}
