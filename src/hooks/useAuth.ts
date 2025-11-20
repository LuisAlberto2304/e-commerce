/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useAuth.ts (actualización)
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseClient';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>('user');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Verificar rol del usuario en Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRole(userData.role || 'user');
          } else {
            setRole('user');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setRole('user');
        }
      } else {
        setUser(null);
        setRole('user');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, role, loading };
};