import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, Crown, Calendar, TrendingUp, Clock } from 'lucide-react';
import backend from '~backend/client';

export default function HistoricalLeaderboardPage() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [leaderboardType, setLeaderboardType] = useState<'streak' | 'pt_balance'>('pt_balance');

  const { data: months } = useQuery({
    queryKey: ['snapshot-months'],
    queryFn: () => backend.user.listSnapshotMonths(),
  });

  const { data: historicalData, isLoading } = useQuery({
    queryKey: ['historical-leaderboard', selectedMonth, leaderboardType],
    queryFn: () => backend.user.getHistoricalLeaderboard({ 
      monthYear: selectedMonth, 
      leaderboardType 
    }),
    enabled: !!selectedMonth,
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

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  if (!months?.months || months.months.length === 0) {
    return (
      <div className="space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Historical Leaderboards</h1>
          <p className="text-gray-400 font-medium">View past monthly rankings and performance</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <Clock className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 font-medium text-lg">No historical data available yet</p>
            <p className="text-gray-500 text-sm mt-2">Snapshots will be created after the first monthly reset</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedMonth && months.months.length > 0) {
    setSelectedMonth(months.months[0].monthYear);
  }

  return (
    <div className="space-y-6 px-4">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Historical Leaderboards</h1>
        <p className="text-gray-400 font-medium">View past monthly rankings and performance</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {months?.months.map((month) => (
                <SelectItem 
                  key={month.monthYear} 
                  value={month.monthYear}
                  className="text-white hover:bg-gray-700"
                >
                  {formatMonthYear(month.monthYear)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Badge className="bg-indigo-600 text-white font-semibold">
          {historicalData?.entries.length || 0} entries
        </Badge>
      </div>

      <Tabs value={leaderboardType} onValueChange={(v) => setLeaderboardType(v as 'streak' | 'pt_balance')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
          <TabsTrigger 
            value="pt_balance" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <Trophy className="h-4 w-4 mr-2" />
            PT Balance
          </TabsTrigger>
          <TabsTrigger 
            value="streak" 
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Streak
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pt_balance" className="space-y-4 mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Trophy className="h-6 w-6 text-purple-400" />
                <span>Top PT Holders - {selectedMonth && formatMonthYear(selectedMonth)}</span>
              </CardTitle>
              <p className="text-sm text-gray-400 font-medium">
                Historical ranking based on prediction token balance at month end
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="text-lg text-gray-200 font-medium">Loading historical data...</div>
                </div>
              ) : historicalData?.entries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 font-medium">No data available for this month</p>
                </div>
              ) : (
                historicalData?.entries.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                      isCurrentUser(entry.userId) ? 'bg-indigo-600' : 'bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${getRankColor(entry.rank)}`}>
                        {getRankIcon(entry.rank)}
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center space-x-2">
                          <span>{entry.username}</span>
                          {isCurrentUser(entry.userId) && (
                            <Badge variant="secondary" className="text-xs font-medium">You</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-medium">
                          Streak: {entry.streak}
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
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streak" className="space-y-4 mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <TrendingUp className="h-6 w-6 text-orange-400" />
                <span>Top Streaks - {selectedMonth && formatMonthYear(selectedMonth)}</span>
              </CardTitle>
              <p className="text-sm text-gray-400 font-medium">
                Historical ranking based on winning streak at month end
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="text-lg text-gray-200 font-medium">Loading historical data...</div>
                </div>
              ) : historicalData?.entries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 font-medium">No data available for this month</p>
                </div>
              ) : (
                historicalData?.entries.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                      isCurrentUser(entry.userId) ? 'bg-orange-600' : 'bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${getRankColor(entry.rank)}`}>
                        {getRankIcon(entry.rank)}
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center space-x-2">
                          <span>{entry.username}</span>
                          {isCurrentUser(entry.userId) && (
                            <Badge variant="secondary" className="text-xs font-medium">You</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-medium">
                          PT Balance: {entry.ptBalance}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-400">
                        {entry.streak}
                      </div>
                      <div className="text-xs text-gray-400 font-medium">Streak</div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
