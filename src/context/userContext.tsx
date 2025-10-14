"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { auth } from '@/firebase/config';
import { syncMedusaCustomerWithFirebase } from "@/utils/syncMedusaCustomer";

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
  const [initialAuthCheck, setInitialAuthCheck] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email || 'No user');
      
      setUser(firebaseUser);
      
      // Si hay usuario y es la primera vez, sincronizar con Medusa
      if (firebaseUser && !initialAuthCheck) {
        try {
          await syncMedusaCustomerWithFirebase();
          console.log('Usuario sincronizado con Medusa en auth state change');
        } catch (error) {
          console.error('Error al sincronizar con Medusa en auth state:', error);
          // No bloqueamos el flujo si falla la sincronización
        }
      }
      
      setInitialAuthCheck(true);
      setLoading(false);
      
      // Redirigir solo si estamos en páginas de autenticación
      if (firebaseUser && (pathname === '/login' || pathname === '/register')) {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [pathname, router, initialAuthCheck]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    // Configuración adicional para obtener siempre el consentimiento
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful:', result.user.email);
      
      // Esperar un momento para que Firebase actualice el estado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Sincronizar con Medusa
      try {
        await syncMedusaCustomerWithFirebase();
        console.log('Usuario de Google sincronizado con Medusa');
      } catch (syncError) {
        console.error('Error al sincronizar con Medusa:', syncError);
        // No bloqueamos el login si falla la sincronización
      }
      
      // Redirigir después de login exitoso
      router.push('/');
      
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      
      // Mapear errores específicos
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('El inicio de sesión con Google no está habilitado. Contacta al administrador.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('El popup fue bloqueado. Permite popups para este sitio.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Cerraste la ventana de inicio de sesión.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Usuario canceló o hay múltiples popups
        throw new Error('Operación cancelada. Intenta nuevamente.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Error de red. Verifica tu conexión a internet.');
      } else {
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      console.log('Usuario cerró sesión exitosamente');
      
      // Redirigir al login después de cerrar sesión
      router.push('/login');
      
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
      {!loading ? children : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};