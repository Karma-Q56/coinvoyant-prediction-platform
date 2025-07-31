import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Users, Target, Gift, TrendingUp, Plus, CheckCircle, Shield } from 'lucide-react';
import backend from '~backend/client';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreatePrediction, setShowCreatePrediction] = useState(false);
  const [showCreateSweepstakes, setShowCreateSweepstakes] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  // Prediction form state
  const [predictionForm, setPredictionForm] = useState({
    question: '',
    category: '',
    options: ['', ''],
    requiredPt: 10,
    closesAt: '',
  });

  // Sweepstakes form state
  const [sweepstakesForm, setSweepstakesForm] = useState({
    title: '',
    description: '',
    prize: '',
    entryCost: 0,
    drawDate: '',
  });

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsCheckingAdmin(false);
        return;
      }

      try {
        const result = await backend.admin.checkAdmin({ userId: user.id });
        setIsAdmin(result.isAdmin);
      } catch (error) {
        console.error('Failed to check admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => backend.admin.getStats({ userId: user!.id }),
    enabled: !!user && isAdmin,
  });

  const { data: predictions } = useQuery({
    queryKey: ['admin-predictions'],
    queryFn: () => backend.prediction.listPredictions({}),
    enabled: isAdmin,
  });

  const { data: sweepstakes } = useQuery({
    queryKey: ['admin-sweepstakes'],
    queryFn: () => backend.sweepstakes.listSweepstakes(),
    enabled: isAdmin,
  });

  const createPredictionMutation = useMutation({
    mutationFn: (data: any) => backend.admin.createPrediction({ ...data, userId: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-predictions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setShowCreatePrediction(false);
      setPredictionForm({
        question: '',
        category: '',
        options: ['', ''],
        requiredPt: 10,
        closesAt: '',
      });
      toast({
        title: "Prediction created!",
        description: "The prediction has been successfully created.",
      });
    },
    onError: (error: any) => {
      console.error('Create prediction error:', error);
      toast({
        title: "Failed to create prediction",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const createSweepstakesMutation = useMutation({
    mutationFn: (data: any) => backend.admin.createSweepstakes({ ...data, userId: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sweepstakes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setShowCreateSweepstakes(false);
      setSweepstakesForm({
        title: '',
        description: '',
        prize: '',
        entryCost: 0,
        drawDate: '',
      });
      toast({
        title: "Sweepstakes created!",
        description: "The sweepstakes has been successfully created.",
      });
    },
    onError: (error: any) => {
      console.error('Create sweepstakes error:', error);
      toast({
        title: "Failed to create sweepstakes",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const resolvePredictionMutation = useMutation({
    mutationFn: (data: { predictionId: number; correctOption: string }) =>
      backend.admin.resolvePrediction({ ...data, userId: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-predictions'] });
      toast({
        title: "Prediction resolved!",
        description: "The prediction has been resolved and rewards distributed.",
      });
    },
    onError: (error: any) => {
      console.error('Resolve prediction error:', error);
      toast({
        title: "Failed to resolve prediction",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleCreatePrediction = () => {
    if (!predictionForm.question || !predictionForm.category || !predictionForm.closesAt) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const validOptions = predictionForm.options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      toast({
        title: "Invalid options",
        description: "Please provide at least 2 options",
        variant: "destructive",
      });
      return;
    }

    createPredictionMutation.mutate({
      question: predictionForm.question,
      category: predictionForm.category,
      options: validOptions,
      requiredPt: predictionForm.requiredPt,
      closesAt: new Date(predictionForm.closesAt),
    });
  };

  const handleCreateSweepstakes = () => {
    if (!sweepstakesForm.title || !sweepstakesForm.prize) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createSweepstakesMutation.mutate({
      title: sweepstakesForm.title,
      description: sweepstakesForm.description,
      prize: sweepstakesForm.prize,
      entryCost: sweepstakesForm.entryCost,
      drawDate: sweepstakesForm.drawDate ? new Date(sweepstakesForm.drawDate) : undefined,
    });
  };

  const updatePredictionOption = (index: number, value: string) => {
    const newOptions = [...predictionForm.options];
    newOptions[index] = value;
    setPredictionForm({ ...predictionForm, options: newOptions });
  };

  const addPredictionOption = () => {
    setPredictionForm({
      ...predictionForm,
      options: [...predictionForm.options, ''],
    });
  };

  const removePredictionOption = (index: number) => {
    if (predictionForm.options.length > 2) {
      const newOptions = predictionForm.options.filter((_, i) => i !== index);
      setPredictionForm({ ...predictionForm, options: newOptions });
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12 px-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">Please sign in to access admin</h1>
      </div>
    );
  }

  if (isCheckingAdmin) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-lg">Checking admin access...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12 px-4">
        <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-red-400">Access Denied</h1>
        <p className="text-gray-400">You do not have admin privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4">
      <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>

      {/* Stats Overview */}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Create New Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            {showCreatePrediction ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Question</Label>
                  <Textarea
                    value={predictionForm.question}
                    onChange={(e) => setPredictionForm({ ...predictionForm, question: e.target.value })}
                    className="bg-gray-700 border-gray-600"
                    placeholder="Enter prediction question"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Category</Label>
                  <Input
                    value={predictionForm.category}
                    onChange={(e) => setPredictionForm({ ...predictionForm, category: e.target.value })}
                    className="bg-gray-700 border-gray-600"
                    placeholder="e.g., Sports, Gaming, News"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Options</Label>
                  {predictionForm.options.map((option, index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        value={option}
                        onChange={(e) => updatePredictionOption(index, e.target.value)}
                        className="bg-gray-700 border-gray-600"
                        placeholder={`Option ${index + 1}`}
                      />
                      {predictionForm.options.length > 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePredictionOption(index)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addPredictionOption}
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Required PT</Label>
                    <Input
                      type="number"
                      value={predictionForm.requiredPt}
                      onChange={(e) => setPredictionForm({ ...predictionForm, requiredPt: parseInt(e.target.value) || 10 })}
                      className="bg-gray-700 border-gray-600"
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Closes At</Label>
                    <Input
                      type="datetime-local"
                      value={predictionForm.closesAt}
                      onChange={(e) => setPredictionForm({ ...predictionForm, closesAt: e.target.value })}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleCreatePrediction}
                    disabled={createPredictionMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {createPredictionMutation.isPending ? 'Creating...' : 'Create Prediction'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreatePrediction(false)}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowCreatePrediction(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Prediction
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Create New Sweepstakes</CardTitle>
          </CardHeader>
          <CardContent>
            {showCreateSweepstakes ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Title</Label>
                  <Input
                    value={sweepstakesForm.title}
                    onChange={(e) => setSweepstakesForm({ ...sweepstakesForm, title: e.target.value })}
                    className="bg-gray-700 border-gray-600"
                    placeholder="Sweepstakes title"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Description</Label>
                  <Textarea
                    value={sweepstakesForm.description}
                    onChange={(e) => setSweepstakesForm({ ...sweepstakesForm, description: e.target.value })}
                    className="bg-gray-700 border-gray-600"
                    placeholder="Optional description"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Prize</Label>
                  <Input
                    value={sweepstakesForm.prize}
                    onChange={(e) => setSweepstakesForm({ ...sweepstakesForm, prize: e.target.value })}
                    className="bg-gray-700 border-gray-600"
                    placeholder="Prize description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Entry Cost (ET)</Label>
                    <Input
                      type="number"
                      value={sweepstakesForm.entryCost}
                      onChange={(e) => setSweepstakesForm({ ...sweepstakesForm, entryCost: parseInt(e.target.value) || 0 })}
                      className="bg-gray-700 border-gray-600"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Draw Date (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={sweepstakesForm.drawDate}
                      onChange={(e) => setSweepstakesForm({ ...sweepstakesForm, drawDate: e.target.value })}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleCreateSweepstakes}
                    disabled={createSweepstakesMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {createSweepstakesMutation.isPending ? 'Creating...' : 'Create Sweepstakes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateSweepstakes(false)}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowCreateSweepstakes(true)}
                className="w-full bg-pink-600 hover:bg-pink-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Sweepstakes
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manage Predictions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Manage Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions?.predictions.filter(p => p.status === 'open').map((prediction) => (
              <div key={prediction.id} className="p-4 bg-gray-700 rounded">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white">{prediction.question}</h3>
                  <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">
                    {prediction.category}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mb-3">
                  Closes: {new Date(prediction.closesAt).toLocaleString()}
                </div>
                <div className="flex space-x-2 mb-3">
                  {prediction.options.map((option) => (
                    <div key={option} className="flex-1 text-center p-2 bg-gray-600 rounded text-sm">
                      {option}
                      <div className="text-xs text-gray-400 mt-1">
                        {prediction.voteCounts[option] || 0} votes
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {prediction.options.map((option) => (
                    <Button
                      key={option}
                      size="sm"
                      onClick={() => resolvePredictionMutation.mutate({
                        predictionId: prediction.id,
                        correctOption: option,
                      })}
                      disabled={resolvePredictionMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Resolve: {option}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            {predictions?.predictions.filter(p => p.status === 'open').length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No open predictions to manage
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
