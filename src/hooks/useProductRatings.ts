// hooks/useProductRatings.ts
import { useState, useEffect } from 'react';
import { productRatingsService, ProductRating } from '@/app/lib/productRatingsService';

export const useProductRatings = (productIds?: string[]) => {
  const [ratings, setRatings] = useState<{[key: string]: ProductRating}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRatings = async () => {
      try {
        setLoading(true);
        setError(null);

        let ratingsData: {[key: string]: ProductRating} = {};

        if (productIds && productIds.length > 0) {
          // Cargar ratings específicos para los productos proporcionados
          ratingsData = await productRatingsService.getBatchProductRatings(productIds);
        } else {
          // Cargar todos los ratings disponibles
          ratingsData = await productRatingsService.getAllProductRatings();
        }

        setRatings(ratingsData);
      } catch (err) {
        console.error('Error loading product ratings:', err);
        setError('Error al cargar las calificaciones');
      } finally {
        setLoading(false);
      }
    };

    loadRatings();
  }, [productIds]);

  // Función para obtener el rating de un producto específico
  const getProductRating = (productId: string): number => {
    return ratings[productId]?.averageRating || 0;
  };

  // Función para obtener información completa del rating
  const getProductRatingInfo = (productId: string): ProductRating | null => {
    return ratings[productId] || null;
  };

  return {
    ratings,
    loading,
    error,
    getProductRating,
    getProductRatingInfo
  };
};