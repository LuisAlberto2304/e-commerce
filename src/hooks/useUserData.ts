/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useFirestoreUser.ts
import { useState, useEffect } from 'react';
import { doc, getDoc } from "firebase/firestore";
import { db } from '@/app/lib/firebaseClient';
import { auth } from '@/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';

// Define solo las propiedades que necesitas
interface UserData {
  uid: string;
  email: string;
  name?: string;
  fullName?: string;
  phoneNumber?: string;
  phone?: string;
  mobile?: string;
}

export const useFirestoreUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);
      
      if (firebaseUser) {
        setUser(firebaseUser);
        
        try {
          // Obtener datos de Firestore
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            
            // Extraer solo los campos que necesitamos
            const userData: UserData = {
              uid: firebaseUser.uid,
              email: data.email || firebaseUser.email || '',
              name: data.name || firebaseUser.displayName || '',
              fullName: data.fullName || data.name || '',
              phoneNumber: data.phoneNumber || '',
              phone: data.phone || data.phoneNumber || '',
              mobile: data.mobile || data.phoneNumber || '',
            };
            
            setUserData(userData);
            console.log('✅ Datos del usuario obtenidos:', userData);
          } else {
            // Si no existe en Firestore, usar datos de Firebase Auth
            const userData: UserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              fullName: firebaseUser.displayName || '',
              phoneNumber: '',
              phone: '',
              mobile: '',
            };
            
            setUserData(userData);
            console.log('⚠️ Usando datos de Firebase Auth');
          }
        } catch (err: any) {
          console.error('❌ Error obteniendo datos:', err);
          setError(err.message);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Función para recargar datos manualmente
  const refetch = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        const userData: UserData = {
          uid: user.uid,
          email: data.email || user.email || '',
          name: data.name || user.displayName || '',
          fullName: data.fullName || data.name || '',
          phoneNumber: data.phoneNumber || '',
          phone: data.phone || data.phoneNumber || '',
          mobile: data.mobile || data.phoneNumber || '',
        };
        
        setUserData(userData);
      }
    } catch (err: any) {
      console.error('Error refetching user data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    userData,
    loading,
    error,
    refetch,
    isAuthenticated: !!user
  };
};