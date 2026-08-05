"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types';
import { api } from '../../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role?: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('ecoloop_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (error) {
          console.error("Failed to fetch profile", error);
          localStorage.removeItem('ecoloop_token');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, []);

  const login = async (emailOrPhone: string, password: string, role?: string) => {
    try {
      // Le backend FastAPI attend 'telephone' et 'mot_de_passe'
      const res = await api.post('/auth/login', { 
        telephone: emailOrPhone, 
        mot_de_passe: password 
      });
      const token = res.data.access_token;
      
      localStorage.setItem('ecoloop_token', token);
      
      // On fetch le profil pour avoir l'utilisateur complet avec son rôle
      const profileRes = await api.get('/auth/me');
      setUser(profileRes.data);
    } catch (err) {
      console.error("Erreur de connexion API:", err);
      throw err; // On laisse remonter l'erreur pour que l'UI affiche un message
    }
  };

  const register = async (userData: any) => {
    const res = await api.post('/auth/register', userData);
    const { token, user: registeredUser } = res.data;
    localStorage.setItem('ecoloop_token', token);
    setUser(registeredUser);
  };

  const logout = () => {
    localStorage.removeItem('ecoloop_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
