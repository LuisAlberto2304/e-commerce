/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useFirebaseSync.ts
'use client';

import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseClient';

export const useFirebaseSync = () => {
  const syncProductToFirebase = async (medusaProduct: any, userId: string, storeId: string) => {
    try {
      console.log('🔄 Iniciando sincronización con Firebase...');
      console.log('📦 Producto recibido:', medusaProduct);
      
      // Verificar Firebase
      if (typeof db === 'undefined' || !db) {
        console.error('❌ Firebase no está disponible');
        throw new Error('Firebase no configurado');
      }

      // Buscar ID en diferentes ubicaciones posibles
      const productId = medusaProduct.id || 
                       medusaProduct.product?.id || 
                       medusaProduct.data?.id ||
                       `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('🆔 ID del producto:', productId);

      // Si no hay un ID real, usar uno temporal pero continuar
      const isTempId = productId.startsWith('temp-');
      if (isTempId) {
        console.warn('⚠️ Usando ID temporal para Firebase:', productId);
      }

      if (!userId) {
        throw new Error('User ID es requerido');
      }

      // Si storeId está vacío, usar un valor por defecto
      const validStoreId = storeId?.trim() || `store-${userId}`;
      console.log('🏪 Store ID:', validStoreId);
      console.log('👤 User ID:', userId);

      // Crear referencia al documento en Firebase
      const productRef = doc(db, 'stores', validStoreId, 'products', productId);
      console.log('📄 Referencia de Firebase creada');

      // Extraer el producto real de la respuesta
      const actualProduct = medusaProduct.product || medusaProduct.data || medusaProduct;

      // Preparar datos para Firebase (versión segura)
      const firebaseProduct = {
        id: productId,
        title: actualProduct.title || 'Sin título',
        description: actualProduct.description || '',
        thumbnail: actualProduct.thumbnail || '',
        status: actualProduct.status || 'draft',
        
        // Procesar variantes de manera segura
        variants: (actualProduct.variants || []).map((variant: any, index: number) => ({
          id: variant.id || `var-${Date.now()}-${index}`,
          title: variant.title || 'Variante sin nombre',
          price: variant.prices?.[0]?.amount || variant.price || 0,
          inventory_quantity: variant.inventory_quantity || variant.quantity || 0,
          sku: variant.sku || '',
        })),
        
        // Precio principal
        price: actualProduct.variants?.[0]?.prices?.[0]?.amount || 0,
        inventory: actualProduct.variants?.[0]?.inventory_quantity || 0,
        
        // Metadatos
        medusa_data: medusaProduct, // Guardar respuesta completa
        medusa_original: actualProduct, // Guardar datos del producto
        seller_id: userId,
        store_id: validStoreId,
        is_temporary_id: isTempId, // Marcar si es ID temporal
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_sync: new Date().toISOString(),
      };

      console.log('💾 Guardando en Firebase...', {
        id: firebaseProduct.id,
        title: firebaseProduct.title,
        is_temporary: firebaseProduct.is_temporary_id,
        variants: firebaseProduct.variants.length
      });

      // Guardar en Firebase
      // Crear documento principal de la tienda (si no existe aún)
        await setDoc(doc(db, 'stores', validStoreId), {
          store_id: validStoreId,
          owner: userId,
          created_at: new Date().toISOString()
        }, { merge: true });

        // Ahora sí guardar el producto
        await setDoc(productRef, firebaseProduct, { merge: true });

      return {
        ...firebaseProduct,
        success: true,
        has_real_id: !isTempId
      };

    } catch (error) {
      console.error('❌ Error sincronizando con Firebase:', error);
      
      // Proporcionar más detalles del error
      if (error instanceof Error) {
        console.error('📋 Detalles del error:', error.message);
      }
      
      throw error;
    }
  };

  return {
    syncProductToFirebase,
  };
};