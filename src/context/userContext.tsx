"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut 
} from 'firebase/auth';
import { auth } from '@/firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
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
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // Si hay un usuario autenticado y estamos en una página de auth, redirigir al home
      if (user) {
        const currentPath = window.location.pathname;
        if (currentPath === '/login' || currentPath === '/register') {
          router.push('/');
        }
      }
    });

    return unsubscribe;
  }, [router]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    try {
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful:', result.user);
      
      // Redirigir después de login exitoso
      router.push('/');
      
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('El inicio de sesión con Google no está habilitado. Contacta al administrador.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('El popup fue bloqueado. Permite popups para este sitio.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Cerraste la ventana de inicio de sesión.');
      } else {
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};