/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useProductStats.ts
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseClient';

export type ProductStats = {
  productId: string;
  totalRating: number; // 🔹 Esto YA ES el promedio, no la suma
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  lastUpdated: any;
};

export const useProductStats = (productId: string) => {
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const statsDoc = await getDoc(doc(db, 'productStats', productId));
        
        if (statsDoc.exists()) {
          const data = statsDoc.data() as ProductStats;
          console.log('📊 Product Stats:', data); // 🔹 Para debug
          setStats(data);
        } else {
          setStats(null);
        }
      } catch (err) {
        console.error('Error fetching product stats:', err);
        setError('Error al cargar las estadísticas del producto');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [productId]);

  return { stats, loading, error };
};