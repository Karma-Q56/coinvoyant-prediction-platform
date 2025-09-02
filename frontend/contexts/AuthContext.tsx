import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import backend from '~backend/client';
import type { User } from '~backend/user/register';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for stored user data on app load
    const storedUser = localStorage.getItem('coinvoyant_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await backend.user.login({ email, password });
      setUser(response.user);
      localStorage.setItem('coinvoyant_user', JSON.stringify(response.user));
      localStorage.setItem('coinvoyant_token', response.token);
      
      // Navigate to dashboard after login
      navigate('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, username: string, password: string) => {
    try {
      const user = await backend.user.register({ email, username, password });
      setUser(user);
      localStorage.setItem('coinvoyant_user', JSON.stringify(user));
      // Auto-login after registration
      const loginResponse = await backend.user.login({ email, password });
      localStorage.setItem('coinvoyant_token', loginResponse.token);
      
      // Navigate to dashboard after registration
      navigate('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('coinvoyant_user');
    localStorage.removeItem('coinvoyant_token');
    navigate('/');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('coinvoyant_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isLoading,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
