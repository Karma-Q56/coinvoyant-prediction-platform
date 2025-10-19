import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Swords, Trophy, Clock, CheckCircle, XCircle, Copy, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

export default function ChallengesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [opponentId, setOpponentId] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: challengeIdData } = useQuery({
    queryKey: ['challengeId', user?.id],
    queryFn: () => backend.user.generateChallengeId(),
    enabled: !!user,
  });

  const { data: challenges } = useQuery({
    queryKey: ['challenges', user?.id],
    queryFn: () => backend.challenge.listChallenges(),
    enabled: !!user,
  });

  const { data: pendingChallenges } = useQuery({
    queryKey: ['pendingChallenges', user?.id],
    queryFn: () => backend.challenge.getPendingChallenges(),
    enabled: !!user,
  });

  const acceptChallengeMutation = useMutation({
    mutationFn: ({ challengeId, choice }: { challengeId: number; choice: boolean }) =>
      backend.challenge.acceptChallenge({ challengeId, choice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['pendingChallenges'] });
      toast({
        title: 'Challenge Accepted!',
        description: 'Good luck in your prediction battle!',
      });
    },
    onError: (error: Error) => {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const copyChallengeId = () => {
    if (challengeIdData?.challengeId) {
      navigator.clipboard.writeText(challengeIdData.challengeId);
      toast({
        title: 'Copied!',
        description: 'Challenge ID copied to clipboard',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-600">Pending</Badge>;
      case 'active':
        return <Badge className="bg-blue-600">Active</Badge>;
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getResultIcon = (challenge: any) => {
    if (!challenge.winnerId) return null;
    if (challenge.winnerId === user?.id) {
      return <Trophy className="h-5 w-5 text-yellow-400" />;
    }
    return <XCircle className="h-5 w-5 text-red-400" />;
  };

  return (
    <div className="space-y-6 px-4">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Challenges</h1>
        <p className="text-gray-400 font-medium">Battle other users in 1v1 prediction showdowns</p>
      </div>

      <Card className="bg-gradient-to-r from-orange-600 to-red-600 border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Your Challenge ID</h3>
              <p className="text-orange-100 text-sm font-medium">Share this with friends to receive challenges</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 px-6 py-3 rounded-lg">
                <span className="text-2xl font-bold text-white tracking-wider">
                  {challengeIdData?.challengeId || 'Loading...'}
                </span>
              </div>
              <Button
                onClick={copyChallengeId}
                variant="secondary"
                size="icon"
                className="bg-white/20 hover:bg-white/30"
              >
                <Copy className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {pendingChallenges && pendingChallenges.challenges.length > 0 && (
        <Card className="bg-yellow-900/30 border-yellow-600">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <span>Pending Challenges</span>
              <Badge className="bg-yellow-600">{pendingChallenges.challenges.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingChallenges.challenges.map((challenge) => (
              <div key={challenge.id} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-white">{challenge.predictionTitle}</h4>
                    <p className="text-sm text-gray-400 font-medium">
                      Challenged by <span className="text-orange-400">{challenge.challengerUsername}</span>
                    </p>
                    <p className="text-sm text-gray-400 font-medium">
                      Stake: {challenge.challengerStake} PT • Their choice: {challenge.challengerChoice ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => acceptChallengeMutation.mutate({ challengeId: challenge.id, choice: true })}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Accept (Yes)
                    </Button>
                    <Button
                      onClick={() => acceptChallengeMutation.mutate({ challengeId: challenge.id, choice: false })}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Accept (No)
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3 mt-6">
          {challenges?.challenges.filter(c => c.status === 'active').length === 0 ? (
            <div className="text-center py-12">
              <Swords className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No active challenges</p>
            </div>
          ) : (
            challenges?.challenges
              .filter(c => c.status === 'active')
              .map((challenge) => (
                <Card key={challenge.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white text-lg">{challenge.predictionTitle}</h4>
                        <p className="text-sm text-gray-400 font-medium">
                          {challenge.challengerUsername} vs {challenge.opponentUsername}
                        </p>
                      </div>
                      {getStatusBadge(challenge.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-700 p-3 rounded">
                        <p className="text-gray-400 font-medium">{challenge.challengerUsername}</p>
                        <p className="text-white font-semibold">
                          {challenge.challengerChoice ? 'Yes' : 'No'} • {challenge.challengerStake} PT
                        </p>
                      </div>
                      <div className="bg-gray-700 p-3 rounded">
                        <p className="text-gray-400 font-medium">{challenge.opponentUsername}</p>
                        <p className="text-white font-semibold">
                          {challenge.opponentChoice ? 'Yes' : 'No'} • {challenge.opponentStake} PT
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3 mt-6">
          {challenges?.challenges.filter(c => c.status === 'completed').length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No completed challenges yet</p>
            </div>
          ) : (
            challenges?.challenges
              .filter(c => c.status === 'completed')
              .map((challenge) => (
                <Card key={challenge.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-white text-lg">{challenge.predictionTitle}</h4>
                        {getResultIcon(challenge)}
                      </div>
                      {getStatusBadge(challenge.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                      <div className={`p-3 rounded ${challenge.winnerId === user?.id ? 'bg-green-900/30 border border-green-600' : 'bg-gray-700'}`}>
                        <p className="text-gray-400 font-medium">{challenge.challengerUsername}</p>
                        <p className="text-white font-semibold">
                          {challenge.challengerChoice ? 'Yes' : 'No'} • {challenge.challengerStake} PT
                        </p>
                      </div>
                      <div className={`p-3 rounded ${challenge.winnerId !== user?.id && challenge.opponentUsername ? 'bg-green-900/30 border border-green-600' : 'bg-gray-700'}`}>
                        <p className="text-gray-400 font-medium">{challenge.opponentUsername}</p>
                        <p className="text-white font-semibold">
                          {challenge.opponentChoice ? 'Yes' : 'No'} • {challenge.opponentStake} PT
                        </p>
                      </div>
                    </div>
                    {challenge.winnerId && (
                      <p className="text-center text-sm font-semibold text-green-400">
                        Winner gets {(challenge.challengerStake || 0) + (challenge.opponentStake || 0)} PT
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-3 mt-6">
          {!challenges || challenges.challenges.length === 0 ? (
            <div className="text-center py-12">
              <Swords className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No challenges yet. Create one to get started!</p>
            </div>
          ) : (
            challenges.challenges.map((challenge) => (
              <Card key={challenge.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-white text-lg">{challenge.predictionTitle}</h4>
                      {challenge.status === 'completed' && getResultIcon(challenge)}
                    </div>
                    {getStatusBadge(challenge.status)}
                  </div>
                  <p className="text-sm text-gray-400 font-medium mb-2">
                    {challenge.challengerUsername} vs {challenge.opponentUsername || 'Waiting...'}
                  </p>
                  <div className="text-xs text-gray-500 font-medium">
                    Created {new Date(challenge.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
