// hooks/useProductReviews.ts
import { useState, useEffect } from 'react';
import { reviewsService, ReviewData } from '@/app/lib/reviews';

interface ReviewWithId extends ReviewData {
  id: string;
}

interface ReviewEligibility {
  canReview: boolean;
  reason?: string;
  loading: boolean;
}

export const useProductReviews = (productId: string) => {
  const [reviews, setReviews] = useState<ReviewWithId[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<ReviewEligibility>({
    canReview: false,
    loading: true
  });

  const loadReviews = async () => {
    try {
      setLoading(true);
      const [reviewsData, stats] = await Promise.all([
        reviewsService.getProductReviews(productId),
        reviewsService.getProductStats(productId)
      ]);
      
      const reviewsWithId: ReviewWithId[] = reviewsData.map(review => ({
        ...review,
        id: review.id || `temp-${Date.now()}-${Math.random()}`
      }));
      
      // Calcular distribución de ratings
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviewsWithId.forEach(review => {
        if (review.rating >= 1 && review.rating <= 5) {
          distribution[review.rating as keyof typeof distribution]++;
        }
      });
      
      setReviews(reviewsWithId);
      setAverageRating(stats.averageRating);
      setTotalReviews(stats.totalReviews);
      setRatingDistribution(distribution);
      
    } catch (err) {
      setError('Error al cargar las reseñas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkReviewEligibility = async (userId: string | null) => {
    if (!userId) {
      setEligibility({ canReview: false, reason: 'Usuario no autenticado', loading: false });
      return;
    }

    try {
      setEligibility(prev => ({ ...prev, loading: true }));
      const eligibilityResult = await reviewsService.canUserReview(productId, userId);
      setEligibility({
        ...eligibilityResult,
        loading: false
      });
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      setEligibility({
        canReview: false,
        reason: 'Error al verificar elegibilidad',
        loading: false
      });
    }
  };

  const addReview = async (reviewData: Omit<ReviewData, 'productId' | 'createdAt' | 'verified' | 'id'>) => {
    try {
      setError(null);
      
      // Verificar si el usuario puede reseñar
      const canReview = await reviewsService.canUserReview(productId, reviewData.userId);
      if (!canReview.canReview) {
        throw new Error(canReview.reason || 'No puedes reseñar este producto');
      }

      await reviewsService.createReview({
        ...reviewData,
        productId
      });

      // Recargar las reseñas
      await loadReviews();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la reseña');
      return false;
    }
  };

  useEffect(() => {
    if (productId) {
      loadReviews();
    }
  }, [productId]);

  return {
    reviews,
    averageRating,
    totalReviews,
    ratingDistribution,
    loading,
    error,
    eligibility,
    addReview,
    refreshReviews: loadReviews,
    checkReviewEligibility
  };
};