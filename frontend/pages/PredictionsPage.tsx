import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Clock, Target, TrendingUp } from 'lucide-react';
import backend from '~backend/client';

export default function PredictionsPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [votingPrediction, setVotingPrediction] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [ptAmount, setPtAmount] = useState<string>('');

  const { data: predictions, isLoading, error } = useQuery({
    queryKey: ['predictions', selectedCategory],
    queryFn: () => backend.prediction.listPredictions({ 
      category: selectedCategory || undefined,
      status: 'open'
    }),
    retry: 3,
    retryDelay: 1000,
  });

  const voteMutation = useMutation({
    mutationFn: (data: { predictionId: number; option: string; ptAmount: number }) =>
      backend.prediction.vote({
        userId: user!.id,
        predictionId: data.predictionId,
        option: data.option,
        ptAmount: data.ptAmount,
      }),
    onSuccess: (data) => {
      updateUser({ ptBalance: data.newPtBalance });
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

  const handleVote = (predictionId: number) => {
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

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Please sign in to view predictions</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4 text-red-400">Error loading predictions</h1>
        <p className="text-gray-400">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Predictions</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="text-purple-400">🔮 {user.ptBalance} PT</span>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-700">
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
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-lg">Loading predictions...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {predictions?.predictions.map((prediction) => (
            <Card key={prediction.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-white pr-4">
                    {prediction.question}
                  </CardTitle>
                  <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded whitespace-nowrap">
                    {prediction.category}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <span>Min: {prediction.requiredPt} PT</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{getTimeRemaining(prediction.closesAt)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {prediction.options.map((option) => (
                    <div key={option} className="p-3 bg-gray-700 rounded text-center">
                      <div className="font-medium text-white">{option}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        {prediction.voteCounts[option] || 0} votes
                      </div>
                    </div>
                  ))}
                </div>

                {votingPrediction === prediction.id ? (
                  <div className="space-y-4 p-4 bg-gray-700 rounded">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Select Option</Label>
                      <Select value={selectedOption} onValueChange={setSelectedOption}>
                        <SelectTrigger className="bg-gray-600 border-gray-500">
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
                      <Label className="text-gray-300">PT Amount (Min: {prediction.requiredPt})</Label>
                      <Input
                        type="number"
                        value={ptAmount}
                        onChange={(e) => setPtAmount(e.target.value)}
                        min={prediction.requiredPt}
                        max={user.ptBalance}
                        className="bg-gray-600 border-gray-500"
                        placeholder="Enter PT amount"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleVote(prediction.id)}
                        disabled={voteMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700"
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
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setVotingPrediction(prediction.id)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    disabled={new Date() > new Date(prediction.closesAt)}
                  >
                    {new Date() > new Date(prediction.closesAt) ? 'Closed' : 'Make Prediction'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {predictions?.predictions.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400 mb-2">No predictions available</h2>
          <p className="text-gray-500">Check back later for new predictions to vote on!</p>
        </div>
      )}
    </div>
  );
}
