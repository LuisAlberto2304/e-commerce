'use client'
// hooks/useProductCardRating.ts
import { useEffect, useState } from 'react';
import { useProductReviews } from './useProductReviews';

export const useProductCardRating = (productId: string, useFirebaseStats: boolean = false) => {
  const { 
    averageRating, 
    totalReviews, 
    loading, 
    error 
  } = useProductReviews(productId);

  // Si no queremos usar Firebase stats, retornamos valores por defecto
  if (!useFirebaseStats) {
    return {
      rating: 0,
      reviewCount: 0,
      loading: false,
      error: null
    };
  }

  return {
    rating: averageRating,
    reviewCount: totalReviews,
    loading,
    error
  };
};

// 🔹 NUEVO HOOK para obtener rating de múltiples productos
export const useMultipleProductRatings = (productIds: string[]) => {
  const [ratings, setRatings] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRatings = async () => {
      setLoading(true);
      const ratingsMap: {[key: string]: number} = {};
      
      // Cargar ratings para cada producto
      await Promise.all(
        productIds.map(async (productId) => {
          try {
            // Aquí puedes hacer una llamada batch a Firebase si es posible
            // Por ahora hacemos llamadas individuales
            const { stats } = await fetchProductStats(productId);
            ratingsMap[productId] = stats?.averageRating || 0;
          } catch (error) {
            console.error(`Error loading rating for product ${productId}:`, error);
            ratingsMap[productId] = 0;
          }
        })
      );
      
      setRatings(ratingsMap);
      setLoading(false);
    };

    if (productIds.length > 0) {
      loadRatings();
    } else {
      setLoading(false);
    }
  }, [productIds]);

  return { ratings, loading };
};

// Función auxiliar para obtener stats del producto
const fetchProductStats = async (productId: string) => {
  // Implementa esta función según tu conexión a Firebase
  // Por ejemplo:
  const response = await fetch(`/api/products/${productId}/stats`);
  return await response.json();
};