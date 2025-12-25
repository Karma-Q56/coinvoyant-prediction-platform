import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Coins, Trophy, Wallet, User, LogOut, Home, Target, Gift, Menu, Settings, Shield, BarChart3, Swords, Star, Sparkles, TrendingUp } from 'lucide-react';
import backend from '~backend/client';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Check admin status when user changes
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

  const NavLink = ({ to, icon: Icon, children, onClick }: { to: string; icon: any; children: React.ReactNode; onClick?: () => void }) => (
    <Link to={to} onClick={onClick}>
      <Button
        variant={isActive(to) ? 'default' : 'ghost'}
        size="sm"
        className={`w-full justify-start ${
          isActive(to) 
            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
            : 'text-gray-200 hover:text-white hover:bg-gray-700'
        }`}
      >
        <Icon className="h-4 w-4 mr-2" />
        <span>{children}</span>
      </Button>
    </Link>
  );

  const closeSheet = () => setIsOpen(false);

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Coins className="h-6 w-6 md:h-8 md:w-8 text-indigo-400" />
            <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              CoinVoyant
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <>
                <NavLink to="/" icon={Home}>Home</NavLink>
                <NavLink to="/dashboard" icon={BarChart3}>Dashboard</NavLink>
                <NavLink to="/predictions" icon={Target}>Predictions</NavLink>
                <NavLink to="/my-predictions" icon={Trophy}>My Predictions</NavLink>
                <NavLink to="/sweepstakes" icon={Gift}>Sweepstakes</NavLink>
                <NavLink to="/wallet" icon={Wallet}>Wallet</NavLink>
                <NavLink to="/leaderboard" icon={Trophy}>Leaderboards</NavLink>
                <NavLink to="/challenges" icon={Swords}>Challenges</NavLink>
                <NavLink to="/achievements" icon={Star}>Achievements</NavLink>
                <NavLink to="/analytics" icon={TrendingUp}>Analytics</NavLink>
                <NavLink to="/premium" icon={Sparkles}>Premium</NavLink>
                {isAdmin && (
                  <NavLink to="/admin" icon={Shield}>Admin</NavLink>
                )}

                <div className="flex items-center space-x-2 text-sm px-2">
                  <span className="text-yellow-400 font-medium">🪙 {user.etBalance}</span>
                  <span className="text-purple-400 font-medium">🔮 {user.ptBalance}</span>
                </div>

                <NavLink to="/profile" icon={User}>{user.username}</NavLink>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-gray-200 hover:text-white hover:bg-gray-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-gray-200 hover:text-white hover:bg-gray-700 font-medium">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden flex items-center space-x-2">
            {user && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-yellow-400 font-medium">🪙 {user.etBalance}</span>
                <span className="text-purple-400 font-medium">🔮 {user.ptBalance}</span>
              </div>
            )}
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-200 hover:text-white">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-gray-800 border-gray-700 overflow-y-auto">
                <div className="flex flex-col space-y-4 mt-8 pb-8">
                  {user ? (
                    <>
                      <div className="text-center pb-4 border-b border-gray-700">
                        <div className="text-white font-semibold">{user.username}</div>
                        <div className="flex justify-center space-x-4 text-sm mt-2">
                          <span className="text-yellow-400 font-medium">🪙 {user.etBalance}</span>
                          <span className="text-purple-400 font-medium">🔮 {user.ptBalance}</span>
                        </div>
                      </div>
                      
                      <NavLink to="/" icon={Home} onClick={closeSheet}>Home</NavLink>
                      <NavLink to="/dashboard" icon={BarChart3} onClick={closeSheet}>Dashboard</NavLink>
                      <NavLink to="/predictions" icon={Target} onClick={closeSheet}>Predictions</NavLink>
                      <NavLink to="/my-predictions" icon={Trophy} onClick={closeSheet}>My Predictions</NavLink>
                      <NavLink to="/sweepstakes" icon={Gift} onClick={closeSheet}>Sweepstakes</NavLink>
                      <NavLink to="/wallet" icon={Wallet} onClick={closeSheet}>Wallet</NavLink>
                      <NavLink to="/leaderboard" icon={Trophy} onClick={closeSheet}>Leaderboards</NavLink>
                      <NavLink to="/challenges" icon={Swords} onClick={closeSheet}>Challenges</NavLink>
                      <NavLink to="/achievements" icon={Star} onClick={closeSheet}>Achievements</NavLink>
                      <NavLink to="/analytics" icon={TrendingUp} onClick={closeSheet}>Analytics</NavLink>
                      <NavLink to="/premium" icon={Sparkles} onClick={closeSheet}>Premium</NavLink>
                      {isAdmin && (
                        <NavLink to="/admin" icon={Shield} onClick={closeSheet}>Admin</NavLink>
                      )}
                      <NavLink to="/profile" icon={Settings} onClick={closeSheet}>Profile & Settings</NavLink>

                      <div className="pt-4 border-t border-gray-700">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            logout();
                            closeSheet();
                          }}
                          className="w-full justify-start text-gray-200 hover:text-white hover:bg-gray-700"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          <span>Logout</span>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={closeSheet}>
                        <Button variant="ghost" size="sm" className="w-full text-gray-200 hover:text-white hover:bg-gray-700 font-medium">
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/register" onClick={closeSheet}>
                        <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                          Sign Up
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
