import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, Trophy, Target, Coins, Settings } from 'lucide-react';
import backend from '~backend/client';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => backend.user.getProfile({ userId: user!.id }),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="text-center py-12 px-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">Please sign in to view your profile</h1>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4">
      <h1 className="text-2xl md:text-3xl font-bold">Profile & Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Username</Label>
                  <div className="p-3 bg-gray-700 rounded text-white">
                    {profile?.username}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-300">Email</Label>
                  <div className="p-3 bg-gray-700 rounded text-white flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="break-all">{profile?.email}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Member Since</Label>
                <div className="p-3 bg-gray-700 rounded text-white flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    {profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Settings className="h-5 w-5" />
                <span>Account Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-gray-300">New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-gray-700 border-gray-600"
                      placeholder="Enter new password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-300">Confirm Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-gray-700 border-gray-600"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button
                      onClick={() => {
                        // TODO: Implement password change
                        setIsEditing(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Change Password
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Wallet Stats */}
          <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Coins className="h-5 w-5" />
                <span>Wallet</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-indigo-100">Entertainment Tokens</span>
                <Badge className="bg-yellow-600 text-white">
                  🪙 {profile?.etBalance}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-indigo-100">PredictTokens</span>
                <Badge className="bg-purple-600 text-white">
                  🔮 {profile?.ptBalance}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Achievement Stats */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Trophy className="h-5 w-5" />
                <span>Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-1">
                  {profile?.streak}
                </div>
                <div className="text-sm text-gray-400">Current Win Streak</div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-green-400">
                    {profile?.totalWins}
                  </div>
                  <div className="text-xs text-gray-400">Total Wins</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-400">
                    {profile?.totalPredictions}
                  </div>
                  <div className="text-xs text-gray-400">Predictions</div>
                </div>
              </div>

              {profile?.totalPredictions && profile.totalPredictions > 0 && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">
                    {Math.round((profile.totalWins / profile.totalPredictions) * 100)}%
                  </div>
                  <div className="text-xs text-gray-400">Win Rate</div>
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
              <Button className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white" variant="outline">
                <Target className="h-4 w-4 mr-2" />
                <span>View Predictions</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
