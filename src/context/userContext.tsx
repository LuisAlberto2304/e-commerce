/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { auth } from '@/firebase/config';
import { syncMedusaCustomerWithFirebase, getMedusaCustomerWithFirebaseToken } from "@/utils/syncMedusaCustomer";
import { loginMedusaCustomer } from "@/utils/medusaAuth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from '@/app/lib/firebaseClient';

interface AuthContextType {
  user: User | null;
  role: string; // Cambiar a role para consistencia
  loading: boolean;
  signInWithGoogle: (useRedirect?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  medusaToken: string | null;
  customer: any | null;
  loginMedusa: (email: string, password: string) => Promise<string>;
  // Añadir estas propiedades para compatibilidad
  isAdmin: boolean;
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

const loadUserData = async (uid: string) => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data(); // contiene role, name, storeName, etc.
  } else {
    return null;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [medusaToken, setMedusaToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string>("customer"); // Estado separado para el rol
  const router = useRouter();
  const pathname = usePathname();

  // Calcular si es admin basado en el rol
  const isAdmin = userRole === "admin";

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
        const customerData = JSON.parse(savedCustomer);
        setCustomer(customerData);
        // También establecer el rol desde el customer guardado
        if (customerData.role) {
          setUserRole(customerData.role);
        }
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

  // Manejar resultado de redirect (si se usó signInWithRedirect)
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('✅ Google sign-in via redirect successful:', result.user.email);
        }
      } catch (error: any) {
        console.error('❌ Error handling redirect result:', error);
      }
    };

    handleRedirectResult();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Auth state changed:', firebaseUser?.email || 'No user');

      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // 🔹 1. Verificar o crear usuario en Firestore
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          let userData: any;
          if (userSnap.exists()) {
            userData = userSnap.data();
            setCustomer(userData);
            // Establecer el rol desde Firestore
            setUserRole(userData.role || "customer");
            console.log(`👤 Rol del usuario: ${userData.role}`);
          } else {
            // Crear nuevo documento con rol "customer" por defecto
            userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: "customer",
              createdAt: new Date(),
            };
            await setDoc(userRef, userData);
            setCustomer(userData);
            setUserRole("customer"); // Establecer rol por defecto
            console.log("🆕 Usuario registrado en Firestore con rol 'customer'");
          }

          // 🔹 2. Guardar en el estado customer para usar rol
          setCustomer(userData);

          // 🔹 3. Sincronizar con Medusa
          await syncWithMedusa(firebaseUser);

          // 🔹 4. Redirigir si está en login/register
          if (pathname === "/login" || pathname === "/register") {
            // Redirigir a admin si es administrador, sino al home
            if (userData.role === "admin") {
              router.push("/admin");
            } else {
              router.push("/");
            }
          }

        } catch (err) {
          console.error("❌ Error cargando rol del usuario:", err);
        }

      } else {
        // 🔹 5. Limpiar estado al cerrar sesión
        setMedusaToken(null);
        setCustomer(null);
        setUserRole("customer"); // Resetear a customer
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const signInWithGoogle = async (useRedirect: boolean = false) => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      console.log('🔵 Iniciando Google Sign-In...');

      if (useRedirect) {
        // Usar redirect en lugar de popup (más confiable en móviles)
        console.log('🔄 Usando redirect method...');
        await signInWithRedirect(auth, provider);
        // El resultado se maneja en useEffect con getRedirectResult
      } else {
        // Intentar con popup primero
        console.log('🪟 Usando popup method...');
        const result = await signInWithPopup(auth, provider);
        console.log('✅ Google sign-in successful:', result.user.email);

        // Esperar a que onAuthStateChanged maneje la sincronización
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error: any) {
      console.error('❌ Error signing in with Google:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('El inicio de sesión con Google no está habilitado en Firebase Console.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('El popup fue bloqueado por el navegador. Intenta permitir popups o usa el método alternativo.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Cerraste la ventana de inicio de sesión antes de completar el proceso.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Se canceló la solicitud de popup. Intenta nuevamente.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Error de red. Verifica tu conexión a internet.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('Este dominio no está autorizado. Agrega el dominio en Firebase Console.');
      } else {
        throw new Error(`Error al iniciar sesión con Google: ${error.message}`);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      console.log('✅ Usuario cerró sesión exitosamente');
      // Limpiar estados locales
      setMedusaToken(null);
      setCustomer(null);
      setUserRole("customer");
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
    /* console.log('🔐 Estado del contexto:', {
      hasUser: !!user,
      userEmail: user?.email,
      hasMedusaToken: !!medusaToken,
      hasCustomer: !!customer,
      userRole: userRole,
      isAdmin: isAdmin
    }); */
  }, [user, medusaToken, customer, userRole, isAdmin]);

  const value = useMemo(() => ({
    user,
    role: userRole, // Usar el estado separado del rol
    loading,
    signInWithGoogle,
    logout,
    medusaToken,
    customer,
    loginMedusa,
    isAdmin, // Añadir propiedad isAdmin
  }), [user, userRole, loading, medusaToken, customer, isAdmin]);

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