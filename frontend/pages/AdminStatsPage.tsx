import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Trophy, Coins, Sparkles, TrendingUp, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

export default function AdminStatsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => backend.admin.getStats({ userId: user!.id }),
    enabled: !!user,
  });

  return (
    <div className="space-y-6 px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Platform Statistics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
              </div>
              <Users className="h-12 w-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Premium Users</p>
                <p className="text-3xl font-bold text-white">0</p>
              </div>
              <Sparkles className="h-12 w-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Predictions</p>
                <p className="text-3xl font-bold text-white">{stats?.totalPredictions || 0}</p>
              </div>
              <Trophy className="h-12 w-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Active Challenges</p>
                <p className="text-3xl font-bold text-white">0</p>
              </div>
              <TrendingUp className="h-12 w-12 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Token Economy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
              <span className="text-gray-300 font-medium">Total PT in Circulation</span>
              <span className="text-purple-400 font-bold">{stats?.totalPt || 0} PT</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
              <span className="text-gray-300 font-medium">Total ET in Circulation</span>
              <span className="text-yellow-400 font-bold">{stats?.totalEt || 0} ET</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
              <span className="text-gray-300 font-medium">Average PT per User</span>
              <span className="text-white font-bold">
                {stats?.totalUsers ? Math.round((stats.totalPt || 0) / stats.totalUsers) : 0} PT
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">User Engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
              <span className="text-gray-300 font-medium">Total Votes Cast</span>
              <span className="text-blue-400 font-bold">{stats?.totalVotes || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
              <span className="text-gray-300 font-medium">Active Predictions</span>
              <span className="text-green-400 font-bold">{stats?.activePredictions || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
              <span className="text-gray-300 font-medium">Resolved Predictions</span>
              <span className="text-gray-400 font-bold">{stats?.resolvedPredictions || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Monthly Reset Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded">
              <div>
                <p className="text-white font-semibold">Last Monthly Reset</p>
                <p className="text-gray-400 text-sm font-medium">Check database for last reset timestamp</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded">
              <div>
                <p className="text-white font-semibold">Next Scheduled Reset</p>
                <p className="text-gray-400 text-sm font-medium">1st of next month</p>
              </div>
              <Calendar className="h-8 w-8 text-green-400" />
            </div>
            <Button
              onClick={async () => {
                try {
                  await backend.user.monthlyReset();
                  toast({
                    title: 'Monthly Reset Complete',
                    description: 'All users have been reset for the new month',
                  });
                } catch (error) {
                  console.error(error);
                  toast({
                    title: 'Error',
                    description: 'Failed to perform monthly reset',
                    variant: 'destructive',
                  });
                }
              }}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              Trigger Monthly Reset (Manual)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
