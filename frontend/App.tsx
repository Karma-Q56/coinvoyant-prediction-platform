import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PredictionsPage from './pages/PredictionsPage';
import MyPredictionsPage from './pages/MyPredictionsPage';
import SweepstakesPage from './pages/SweepstakesPage';
import WalletPage from './pages/WalletPage';
import LeaderboardPage from './pages/LeaderboardPage';
import NewLeaderboardPage from './pages/NewLeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import EnhancedProfilePage from './pages/EnhancedProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import DashboardPage from './pages/DashboardPage';
import ChallengesPage from './pages/ChallengesPage';
import AchievementsPage from './pages/AchievementsPage';
import PremiumPage from './pages/PremiumPage';
import HistoricalLeaderboardPage from './pages/HistoricalLeaderboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ResolutionQueuePage from './pages/ResolutionQueuePage';


const queryClient = new QueryClient();

function AppInner() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <Navbar />
        <main className="flex-1 container mx-auto py-4 md:py-8 px-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/predictions" element={<PredictionsPage />} />
            <Route path="/my-predictions" element={<MyPredictionsPage />} />
            <Route path="/sweepstakes" element={<SweepstakesPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/leaderboard" element={<NewLeaderboardPage />} />
            <Route path="/leaderboard-old" element={<LeaderboardPage />} />
            <Route path="/leaderboard/history" element={<HistoricalLeaderboardPage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/premium" element={<PremiumPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<EnhancedProfilePage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/resolution-queue" element={<ResolutionQueuePage />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </AuthProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppInner />
      </Router>
    </QueryClientProvider>
  );
}

export default App;