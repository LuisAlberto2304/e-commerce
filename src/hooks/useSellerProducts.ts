/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useSellerProducts.ts
'use client';

import { useState } from 'react';
import { db } from '@/app/lib/firebaseClient';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ProductVariant {
  title: string;
  price: number;
  quantity: number;
}

interface ProductFormData {
  title: string;
  description: string;
  thumbnail: string;
  images: string[];
  variants: ProductVariant[];
}

export const useSellerProducts = (getMedusaToken: (email: string) => Promise<string | null>) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProduct = async (
    productData: ProductFormData, 
    storeId: string, 
    userId: string, 
    userEmail: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Iniciando creación de producto...');

      // Validaciones básicas
      if (!productData.title?.trim()) {
        throw new Error('El título del producto es requerido');
      }

      if (!productData.thumbnail?.trim()) {
        throw new Error('La imagen principal es requerida');
      }

      const validVariants = productData.variants.filter(variant => 
        variant.title?.trim() && variant.price > 0 && variant.quantity >= 0
      );

      if (validVariants.length === 0) {
        throw new Error('Debe agregar al menos una variante válida');
      }

      // Obtener token de Medusa usando la función proporcionada
      const userToken = await getMedusaToken(userEmail);
      
      if (!userToken) {
        throw new Error('No se pudo autenticar con Medusa. Por favor, intenta nuevamente.');
      }

      console.log('📤 Enviando a Medusa...');

      // 1. Crear producto en Medusa
      const medusaResponse = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          ...productData,
          variants: validVariants
        })
      });

      const responseText = await medusaResponse.text();
      console.log('📨 Status:', medusaResponse.status);

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        data = { message: 'Respuesta inválida' };
      }

      if (!medusaResponse.ok) {
        console.error('❌ Error de Medusa:', data);
        throw new Error(data.message || data.error || `Error ${medusaResponse.status} de Medusa`);
      }

      console.log('✅ Producto creado en Medusa:', data.id);

      // 2. Guardar información en Firebase
      console.log('🔥 Guardando en Firebase...');
      
      const firebaseData = {
        medusaId: data.id,
        title: productData.title,
        description: productData.description || '',
        thumbnail: productData.thumbnail,
        images: productData.images.filter(img => img.trim() !== ''),
        storeId: storeId,
        sellerId: userId,
        createdAt: serverTimestamp(),
        status: 'active',
        variantsCount: validVariants.length,
        variants: validVariants,
        updatedAt: serverTimestamp()
      };

      try {
        const firebaseDocRef = await addDoc(collection(db, 'products'), firebaseData);
        console.log('✅ Producto guardado en Firebase con ID:', firebaseDocRef.id);
      } catch (firebaseError) {
        console.error('❌ Error guardando en Firebase:', firebaseError);
      }

      return {
        ...data,
        firebaseId: data.id
      };

    } catch (err: any) {
      console.error('💥 Error completo en createProduct:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    createProduct,
    loading,
    error,
    clearError
  };
};