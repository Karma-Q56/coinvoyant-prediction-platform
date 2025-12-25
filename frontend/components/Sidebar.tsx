import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Coins, Trophy, Wallet, User, LogOut, Home, Target, Gift, 
  Settings, Shield, BarChart3, Swords, Star, Sparkles, 
  TrendingUp, ChevronLeft, ChevronRight, Search
} from 'lucide-react';
import backend from '~backend/client';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const result = await backend.admin.checkAdmin({ userId: user.id });
        setIsAdmin(result.isAdmin);
      } catch (error) {
        console.error('Failed to check admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  if (!user) return null;

  const NavLink = ({ to, icon: Icon, children }: { to: string; icon: any; children: React.ReactNode }) => (
    <Link to={to}>
      <Button
        variant={isActive(to) ? 'default' : 'ghost'}
        size="sm"
        className={`w-full justify-start transition-all ${
          isActive(to) 
            ? 'bg-gray-700/80 text-white hover:bg-gray-700' 
            : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
        } ${isCollapsed ? 'px-2' : 'px-3'}`}
      >
        <Icon className={`h-4 w-4 ${!isCollapsed && 'mr-3'} flex-shrink-0`} />
        {!isCollapsed && <span className="truncate">{children}</span>}
      </Button>
    </Link>
  );

  return (
    <aside 
      className={`hidden lg:flex flex-col bg-gray-800/95 border-r border-gray-700/50 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        {!isCollapsed && (
          <Link to="/" className="flex items-center space-x-2">
            <Coins className="h-6 w-6 text-indigo-400" />
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              CoinVoyant
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-400 hover:text-white hover:bg-gray-700/50 p-1.5"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="px-3 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-700/50"
          >
            <Search className="h-4 w-4 mr-3" />
            <span className="text-gray-500">Search</span>
            <span className="ml-auto text-xs text-gray-500">Ctrl+K</span>
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="text-xs font-semibold text-gray-400 px-3 py-2">
              Main
            </div>
          )}
          
          <NavLink to="/" icon={Home}>Home</NavLink>
          <NavLink to="/dashboard" icon={BarChart3}>Dashboard</NavLink>
          <NavLink to="/predictions" icon={Target}>Predictions</NavLink>
          <NavLink to="/sweepstakes" icon={Gift}>Sweepstakes</NavLink>
          <NavLink to="/challenges" icon={Swords}>Challenges</NavLink>

          {!isCollapsed && (
            <div className="text-xs font-semibold text-gray-400 px-3 py-2 mt-4">
              Activity
            </div>
          )}
          
          <NavLink to="/my-predictions" icon={Trophy}>My Predictions</NavLink>
          <NavLink to="/leaderboard" icon={Trophy}>Leaderboards</NavLink>
          <NavLink to="/achievements" icon={Star}>Achievements</NavLink>
          <NavLink to="/analytics" icon={TrendingUp}>Analytics</NavLink>

          {!isCollapsed && (
            <div className="text-xs font-semibold text-gray-400 px-3 py-2 mt-4">
              Account
            </div>
          )}
          
          <NavLink to="/wallet" icon={Wallet}>Wallet</NavLink>
          <NavLink to="/premium" icon={Sparkles}>Premium</NavLink>
          {isAdmin && <NavLink to="/admin" icon={Shield}>Admin</NavLink>}
        </div>
      </div>

      <div className="border-t border-gray-700/50 p-3 space-y-2">
        {!isCollapsed && (
          <div className="flex items-center justify-between px-2 py-1 text-sm">
            <span className="text-yellow-400 font-medium">🪙 {user.etBalance}</span>
            <span className="text-purple-400 font-medium">🔮 {user.ptBalance}</span>
          </div>
        )}
        
        <Link to="/profile">
          <Button
            variant={isActive('/profile') ? 'default' : 'ghost'}
            size="sm"
            className={`w-full justify-start ${
              isActive('/profile') 
                ? 'bg-gray-700/80 text-white hover:bg-gray-700' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            } ${isCollapsed ? 'px-2' : 'px-3'}`}
          >
            <User className={`h-4 w-4 ${!isCollapsed && 'mr-3'} flex-shrink-0`} />
            {!isCollapsed && <span className="truncate">{user.username}</span>}
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className={`w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50 ${
            isCollapsed ? 'px-2' : 'px-3'
          }`}
        >
          <LogOut className={`h-4 w-4 ${!isCollapsed && 'mr-3'} flex-shrink-0`} />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
