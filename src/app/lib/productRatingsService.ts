// app/lib/productRatingsService.ts
import { doc, getDoc, getDocs, collection, where, query } from 'firebase/firestore';
import { db } from './firebaseClient';

export interface ProductRating {
  productId: string;
  averageRating: number;
  totalReviews: number;
}

export const productRatingsService = {
  async getBatchProductRatings(productIds: string[]): Promise<{[key: string]: ProductRating}> {
    try {
      const ratingsMap: {[key: string]: ProductRating} = {};
      
      if (productIds.length === 0) {
        console.log("📭 No hay productIds para cargar ratings");
        return ratingsMap;
      }

      console.log(`📥 Cargando ratings para ${productIds.length} productos`);
      
      const statsPromises = productIds.map(async (productId) => {
        try {
          const statsDoc = await getDoc(doc(db, 'productStats', productId));
          if (statsDoc.exists()) {
            const data = statsDoc.data();
            const totalRating = data.totalRating || 0; // 🔹 Esto es la SUMA
            const totalReviews = data.totalReviews || 0;
            
            // 🔹 CALCULAR EL PROMEDIO CORRECTAMENTE
            const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
            
            ratingsMap[productId] = {
              productId,
              averageRating,
              totalReviews
            };
            
            console.log(`   ✅ ${productId}: ${averageRating.toFixed(1)} estrellas (${totalRating} suma / ${totalReviews} reviews)`);
          } else {
            ratingsMap[productId] = {
              productId,
              averageRating: 0,
              totalReviews: 0
            };
            console.log(`   ❌ ${productId}: No encontrado en productStats`);
          }
        } catch (error) {
          console.error(`Error loading rating for ${productId}:`, error);
          ratingsMap[productId] = {
            productId,
            averageRating: 0,
            totalReviews: 0
          };
        }
      });

      await Promise.all(statsPromises);
      console.log(`✅ Ratings cargados: ${Object.keys(ratingsMap).length} productos`);
      return ratingsMap;
      
    } catch (error) {
      console.error('Error in getBatchProductRatings:', error);
      return {};
    }
  },

  async getAllProductRatings(): Promise<{[key: string]: ProductRating}> {
    try {
      const ratingsMap: {[key: string]: ProductRating} = {};
      console.log("📥 Cargando TODOS los ratings de productStats...");
      
      const querySnapshot = await getDocs(collection(db, 'productStats'));
      
      console.log(`📊 Total documentos en productStats: ${querySnapshot.size}`);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const productId = data.productId;
        const totalRating = data.totalRating || 0; // 🔹 SUMA
        const totalReviews = data.totalReviews || 0;
        
        // 🔹 CALCULAR EL PROMEDIO CORRECTAMENTE
        const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
        
        if (productId) {
          ratingsMap[productId] = {
            productId,
            averageRating,
            totalReviews
          };
          
          console.log(`   📊 ${productId}: Suma=${totalRating}, Reviews=${totalReviews}, Promedio=${averageRating.toFixed(1)}`);
        }
      });
      
      console.log(`✅ Todos los ratings cargados: ${Object.keys(ratingsMap).length} productos`);
      return ratingsMap;
    } catch (error) {
      console.error('Error getting all product ratings:', error);
      return {};
    }
  }
};