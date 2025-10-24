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
import { syncMedusaCustomerWithFirebase, getMedusaCustomerWithFirebaseToken } from "@/utils/syncMedusaCustomer";
import { loginMedusaCustomer } from "@/utils/medusaAuth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  medusaToken: string | null;
  customer: any | null;
  loginMedusa: (email: string, password: string) => Promise<string>;
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
  const [medusaToken, setMedusaToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Cargar token desde localStorage al iniciar
  useEffect(() => {
    const savedToken = localStorage.getItem('medusaToken');
    const savedCustomer = localStorage.getItem('medusaCustomer');
    
    if (savedToken) {
      console.log('🔑 Token recuperado de localStorage');
      setMedusaToken(savedToken);
    }
    
    if (savedCustomer) {
      try {
        setCustomer(JSON.parse(savedCustomer));
      } catch (e) {
        console.error('Error parsing saved customer:', e);
      }
    }
  }, []);

  // Guardar en localStorage cuando cambien
  useEffect(() => {
    if (medusaToken) {
      localStorage.setItem('medusaToken', medusaToken);
    } else {
      localStorage.removeItem('medusaToken');
    }
  }, [medusaToken]);

  useEffect(() => {
    if (customer) {
      localStorage.setItem('medusaCustomer', JSON.stringify(customer));
    } else {
      localStorage.removeItem('medusaCustomer');
    }
  }, [customer]);

  // Sincronizar con Medusa cuando cambie el usuario de Firebase
  const syncWithMedusa = async (firebaseUser: User) => {
    try {
      console.log('🔄 Sincronizando con Medusa...');
      
      // Intentar obtener customer existente
      const medusaData = await getMedusaCustomerWithFirebaseToken();
      
      if (medusaData.medusaToken && medusaData.customer) {
        setMedusaToken(medusaData.medusaToken);
        setCustomer(medusaData.customer);
        console.log('✅ Customer existente encontrado en Medusa');
      } else {
        // Si no existe, crear uno nuevo
        const syncResult = await syncMedusaCustomerWithFirebase();
        if (syncResult.medusaToken && syncResult.customer) {
          setMedusaToken(syncResult.medusaToken);
          setCustomer(syncResult.customer);
          console.log('✅ Nuevo customer creado en Medusa');
        }
      }
    } catch (error) {
      console.error('❌ Error sincronizando con Medusa:', error);
      // No lanzar error para no bloquear el login
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Auth state changed:', firebaseUser?.email || 'No user');
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Sincronizar con Medusa
        await syncWithMedusa(firebaseUser);
        
        // Redirigir si está en login/register
        if (pathname === '/login' || pathname === '/register') {
          router.push('/');
        }
      } else {
        // Limpiar estado al logout
        setMedusaToken(null);
        setCustomer(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Google sign-in successful:', result.user.email);
      
      // Esperar a que onAuthStateChanged maneje la sincronización
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push('/');
      
    } catch (error: any) {
      console.error('❌ Error signing in with Google:', error);
      
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('El inicio de sesión con Google no está habilitado.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('El popup fue bloqueado. Permite popups para este sitio.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Cerraste la ventana de inicio de sesión.');
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
      console.log('✅ Usuario cerró sesión exitosamente');
      router.push('/login');
    } catch (error) {
      console.error('❌ Error signing out:', error);
      throw error;
    }
  };

  const loginMedusa = async (email: string, password: string) => {
    try {
      const token = await loginMedusaCustomer(email, password);
      setMedusaToken(token);
      
      console.log('🔐 Token de Medusa obtenido:', {
        hasToken: !!token,
        tokenPreview: token?.substring(0, 20) + '...'
      });
      
      return token;
    } catch (error) {
      console.error('❌ Error obteniendo token de Medusa:', error);
      throw error;
    }
  };

  // Debug
  useEffect(() => {
    console.log('🔐 Estado del contexto:', {
      hasUser: !!user,
      userEmail: user?.email,
      hasMedusaToken: !!medusaToken,
      hasCustomer: !!customer
    });
  }, [user, medusaToken, customer]);

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout,
    medusaToken,
    customer,
    loginMedusa,
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