// hooks/useSellerAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseClient';
import { SellerProfile } from '@/app/types/seller';

export const useSellerAuth = () => {
  const [user, setUser] = useState<SellerProfile | null>(null);
  const [isSeller, setIsSeller] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as SellerProfile;
            setUser(userData);
            setIsSeller(userData.role === 'seller');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setIsSeller(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, isSeller, loading };
};