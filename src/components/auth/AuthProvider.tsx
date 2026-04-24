// Simple mock auth for demo - NOAH 🌊
// Replace with real Supabase auth in production

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface DemoUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: DemoUser | null;
  profile: DemoUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_USERS = [
  { id: '1', email: 'caio@email.com', password: '123456', name: 'Caio Artur' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing session
    const saved = localStorage.getItem('demo_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('demo_user');
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    
    const found = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...userWithoutPassword } = found;
      setUser(userWithoutPassword);
      localStorage.setItem('demo_user', JSON.stringify(userWithoutPassword));
      return { error: null };
    }
    return { error: new Error('Email ou senha inválidos') };
  };

  const signUp = async (email: string, password: string, name: string) => {
    await new Promise(r => setTimeout(r, 500));
    
    const exists = DEMO_USERS.find(u => u.email === email);
    if (exists) {
      return { error: new Error('Email já cadastrado') };
    }

    const newUser = { id: String(DEMO_USERS.length + 1), email, name };
    DEMO_USERS.push({ ...newUser, password });
    setUser(newUser);
    localStorage.setItem('demo_user', JSON.stringify(newUser));
    return { error: null };
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('demo_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile: user,
      isLoading,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};