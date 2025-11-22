// lib/firebase/reviews.ts
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  setDoc,
  increment 
} from 'firebase/firestore';
import { db } from './firebaseClient';
import { ordersService } from './newOrders';

export interface ReviewData {
  id?: string; // <- Agrega esta línea
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: Date;
  verified: boolean;
}

export const reviewsService = {
  // Crear nueva reseña
  async createReview(reviewData: Omit<ReviewData, 'createdAt' | 'verified'>) {
    try {
      const review = {
        ...reviewData,
        createdAt: new Date(),
        verified: false // Puedes verificar compras con Medusa
      };

      const docRef = await addDoc(collection(db, 'reviews'), review);
      
      // Actualizar estadísticas del producto
      await this.updateProductStats(reviewData.productId, reviewData.rating);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  // Obtener reseñas de un producto
    async getProductReviews(productId: string): Promise<ReviewData[]> {
    try {
        const q = query(
        collection(db, 'reviews'),
        where('productId', '==', productId),
        orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const reviews: ReviewData[] = [];
        
        querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
            id: doc.id, // <- Esto ahora es compatible
            productId: data.productId,
            userId: data.userId,
            userName: data.userName,
            userEmail: data.userEmail,
            rating: data.rating,
            comment: data.comment,
            createdAt: data.createdAt.toDate(),
            verified: data.verified || false
        } as ReviewData);
        });
        
        return reviews;
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
 },

  // Calcular estadísticas del producto
  async getProductStats(productId: string) {
    try {
      const reviews = await this.getProductReviews(productId);
      const totalReviews = reviews.length;
      
      if (totalReviews === 0) {
        return { averageRating: 0, totalReviews: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
      }
      
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / totalReviews;
      
      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      });

      return { averageRating, totalReviews, ratingDistribution };
    } catch (error) {
      console.error('Error calculating product stats:', error);
      return { averageRating: 0, totalReviews: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }
  },

  // Actualizar estadísticas del producto
    async updateProductStats(productId: string, newRating: number) {
    try {
      const productStatsRef = doc(db, 'productStats', productId);
      const productStatsSnap = await getDoc(productStatsRef);
      
      if (productStatsSnap.exists()) {
        // El documento existe, actualízalo
        await updateDoc(productStatsRef, {
          totalReviews: increment(1),
          totalRating: increment(newRating),
          [`ratingDistribution.${newRating}`]: increment(1),
          lastUpdated: new Date()
        });
      } else {
        // El documento no existe, créalo con setDoc y merge
        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        ratingDistribution[newRating as keyof typeof ratingDistribution] = 1;
        
        await setDoc(productStatsRef, {
          productId,
          totalReviews: 1,
          totalRating: newRating,
          ratingDistribution,
          lastUpdated: new Date()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error updating product stats:', error);
      throw error; // Propaga el error para manejarlo mejor
    }
  },

  async canUserReview(productId: string, userId: string): Promise<{ canReview: boolean; reason?: string }> {
    try {
      if (!userId) {
        return { canReview: false, reason: 'Usuario no autenticado' };
      }

      // Verificar si el usuario ha comprado el producto
      const hasPurchased = await ordersService.hasUserPurchasedProduct(userId, productId);
      
      if (!hasPurchased) {
        return { 
          canReview: false, 
          reason: 'Debes comprar el producto para poder reseñarlo' 
        };
      }

      return { canReview: true };
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return { 
        canReview: false, 
        reason: 'Error al verificar elegibilidad para reseñar' 
      };
    }
  },
};