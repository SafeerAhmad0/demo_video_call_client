import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse, authAPI, setAuthToken, getAuthToken, setUser, getUser } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on app start
    const initializeAuth = async () => {
      try {
        const token = getAuthToken();
        const savedUser = getUser();
        
        if (token && savedUser) {
          setUserState(savedUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Attempting login with:', { email });
      const response = await authAPI.login(email, password);
      console.log('Login response received:', response);
      
      // Store token and user data
      setAuthToken(response.access_token);
      setUser(response.user);
      setUserState(response.user);
      console.log('Login successful, user stored:', response.user);
    } catch (error) {
      console.error('Login error details:', error);
      console.error('Login error message:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Attempting registration with:', { email });
      const response = await authAPI.register(email, password);
      console.log('Registration response received:', response);
      
      // Store token and user data
      setAuthToken(response.access_token);
      setUser(response.user);
      setUserState(response.user);
      console.log('Registration successful, user stored:', response.user);
    } catch (error) {
      console.error('Registration error details:', error);
      console.error('Registration error message:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUserState(null);
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token: getAuthToken(),
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
