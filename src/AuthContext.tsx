import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 1. Define User Interface
export interface User {
  id: number;
  username: string;
  email: string;
  isAdmin?: boolean; // Optional, as it might not always be present or needed everywhere
}

// 2. Define AuthContextType Interface
export interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean; // For initial auth state loading and during login/signup
  isAuthenticated: boolean; // Derived from token presence
  isAdmin: boolean; // Derived from user object
  login: (loginData: { email; password }) => Promise<void>;
  signup: (signupData: { username; email; password }) => Promise<void>;
  logout: () => void;
  initializeAuth: () => void; // To check localStorage on app load
}

// 3. Create AuthContext
// Providing a default placeholder for context methods to satisfy TypeScript
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Implement AuthProvider (Initial structure, functions to be filled in)
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true until initializeAuth runs

  const isAuthenticated = !!token;
  const isAdminUser = !!(user && user.isAdmin);

  const initializeAuth = () => {
    setIsLoading(true);
    try {
      const storedToken = localStorage.getItem('token');
      const storedUserInfo = localStorage.getItem('userInfo');

      if (storedToken) {
        setToken(storedToken);
        if (storedUserInfo) {
          setUser(JSON.parse(storedUserInfo));
        }
      }
    } catch (error) {
      console.error("AuthContext: Error during initialization", error);
      // If error, ensure state is clean
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (loginData: { email; password }) => {
    setIsLoading(true);
    setError(null); // Assuming an setError state would be part of a more complete hook, or handled by component
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('userInfo', JSON.stringify(data.user));
    } catch (error) {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      if (error instanceof Error) throw error;
      throw new Error('An unknown error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (signupData: { username; email; password }) => {
    setIsLoading(true);
    setError(null); // Assuming setError
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      // Signup successful, but no auto-login in this iteration.
      // The user will be redirected to login by the SignupPage component.
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('An unknown error occurred during signup.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    // Potentially redirect or update other app state as needed
    console.log("AuthContext: User logged out");
  };

  // Call initializeAuth on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Helper for error state if we were to manage it globally in context
  // For now, errors are thrown and handled by components
  const [_, setError] = useState<string | null>(null);


  const contextValue: AuthContextType = {
    token,
    user,
    isLoading,
    isAuthenticated,
    isAdmin: isAdminUser,
    login,
    signup,
    logout,
    initializeAuth, // Though called internally, exposing it might be useful for specific scenarios
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 5. Create useAuth Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
