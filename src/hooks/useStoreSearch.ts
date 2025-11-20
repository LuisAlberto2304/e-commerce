// hooks/useStoreSearch.ts
'use client';

import { useState } from 'react';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseClient';

export interface StoreSearchResult {
  id: string;
  type: 'store';
  name: string;
  storeName: string;
  storeDescription?: string;
  email: string;
  slug: string;
}

export const useStoreSearch = () => {
  const [searching, setSearching] = useState(false);

  const searchStores = async (searchTerm: string): Promise<StoreSearchResult[]> => {
    if (!searchTerm.trim()) return [];

    setSearching(true);
    try {
      // Buscar tiendas por nombre de tienda o nombre del vendedor
      const storesQuery = query(
        collection(db, 'users'),
        where('role', '==', 'seller'),
        limit(5) // Limitar resultados para mejor performance
      );
      
      const storesSnapshot = await getDocs(storesQuery);
      
      const results: StoreSearchResult[] = [];
      
      storesSnapshot.forEach((doc) => {
        const storeData = doc.data();
        const storeName = storeData.storeName || '';
        const sellerName = storeData.name || '';
        
        // Buscar coincidencias en nombre de tienda o nombre del vendedor
        const searchLower = searchTerm.toLowerCase();
        const matchesStoreName = storeName.toLowerCase().includes(searchLower);
        const matchesSellerName = sellerName.toLowerCase().includes(searchLower);
        
        if (matchesStoreName || matchesSellerName) {
          // Generar slug para la URL
          const slug = storeName.toLowerCase().replace(/\s+/g, '-');
          
          results.push({
            id: doc.id,
            type: 'store',
            name: storeName,
            storeName: storeName,
            storeDescription: storeData.storeDescription,
            email: storeData.email,
            slug: slug
          });
        }
      });
      
      return results;
    } catch (error) {
      console.error('Error searching stores:', error);
      return [];
    } finally {
      setSearching(false);
    }
  };

  return { searchStores, searching };
};