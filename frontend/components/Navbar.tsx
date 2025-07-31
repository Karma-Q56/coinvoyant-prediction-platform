import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Coins, Trophy, Wallet, User, LogOut, Home, Target, Gift } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Coins className="h-8 w-8 text-indigo-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              CoinVoyant
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/">
                  <Button
                    variant={isActive('/') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Button>
                </Link>
                
                <Link to="/predictions">
                  <Button
                    variant={isActive('/predictions') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Target className="h-4 w-4" />
                    <span>Predictions</span>
                  </Button>
                </Link>

                <Link to="/my-predictions">
                  <Button
                    variant={isActive('/my-predictions') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Trophy className="h-4 w-4" />
                    <span>My Predictions</span>
                  </Button>
                </Link>

                <Link to="/sweepstakes">
                  <Button
                    variant={isActive('/sweepstakes') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Gift className="h-4 w-4" />
                    <span>Sweepstakes</span>
                  </Button>
                </Link>

                <Link to="/wallet">
                  <Button
                    variant={isActive('/wallet') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Wallet</span>
                  </Button>
                </Link>

                <Link to="/leaderboard">
                  <Button
                    variant={isActive('/leaderboard') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Trophy className="h-4 w-4" />
                    <span>Leaderboard</span>
                  </Button>
                </Link>

                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-yellow-400">🪙 {user.etBalance}</span>
                  <span className="text-purple-400">🔮 {user.ptBalance}</span>
                </div>

                <Link to="/profile">
                  <Button
                    variant={isActive('/profile') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <User className="h-4 w-4" />
                    <span>{user.username}</span>
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
