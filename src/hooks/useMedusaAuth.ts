/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useMedusaAuth.ts
'use client';

import { useAuth } from '@/context/userContext';

export const useMedusa = () => {
  const { medusaToken } = useAuth();

  const createProduct = async (productData: any) => {
    try {
      console.log('🔄 Enviando producto a API...', productData.title);

      // Asegúrate de que la URL sea correcta - /api/medusa/products
      const res = await fetch('/api/medusa/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${medusaToken}`
        },
        body: JSON.stringify(productData),
      });

      console.log('📨 Status de respuesta:', res.status);
      console.log('📨 URL llamada:', '/api/medusa/products');

      // Primero verificar si la respuesta está vacía
      const responseText = await res.text();
      console.log('📄 Respuesta completa:', responseText);

      if (!responseText) {
        throw new Error('Respuesta vacía del servidor');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        throw new Error('Respuesta inválida del servidor');
      }

      if (!res.ok) {
        console.error('❌ Error del servidor:', data);
        throw new Error(data.error || `Error ${res.status} creando producto`);
      }

      console.log('✅ Producto creado exitosamente:', data.id);
      return data;

    } catch (error) {
      console.error('❌ Error creando producto:', error);
      throw error;
    }
  };

   const getSellerProducts = async () => {
    try {
      console.log('🔄 Obteniendo productos del seller...');

      console.log('🔑 Token disponible:', !!medusaToken);
      
      if (!medusaToken) {
        // Mostrar más información para debug
        console.error('❌ No hay token disponible. Variables de entorno:');
        console.error('NEXT_PUBLIC_MEDUSA_BACKEND_URL:', process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL);
        console.error('NEXT_PUBLIC_MEDUSA_TOKEN:', process.env.NEXT_PUBLIC_MEDUSA_TOKEN ? 'EXISTE' : 'NO EXISTE');
        throw new Error('No Medusa token configured');
      }

      console.log('🔑 Token primeros caracteres:', medusaToken.substring(0, 10) + '...');

      const res = await fetch('/api/medusa/seller-products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${medusaToken}`
        },
      });

      console.log('📨 Status de respuesta:', res.status);

      const responseText = await res.text();
      console.log('📄 Respuesta completa:', responseText);

      if (!responseText) {
        throw new Error('Respuesta vacía del servidor');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        throw new Error('Respuesta inválida del servidor');
      }

      if (!res.ok) {
        console.error('❌ Error del servidor:', data);
        throw new Error(data.error || `Error ${res.status} obteniendo productos`);
      }

      console.log('✅ Productos obtenidos exitosamente');
      return data;

    } catch (error) {
      console.error('❌ Error obteniendo productos:', error);
      return { 
        error: error instanceof Error ? error.message : 'Error desconocido',
        products: [] 
      };
    }
  };

  // hooks/useMedusaAuth.ts - Función updateProduct actualizada
    const updateProduct = async (productId: string, productData: any) => {
    try {
        console.log('🔄 Actualizando producto...', productId, productData);

        // Validaciones básicas
        if (!productId) {
        throw new Error('ID de producto no proporcionado');
        }

        if (!medusaToken) {
        throw new Error('No Medusa token configured');
        }

        console.log('🔑 Token disponibles:', medusaToken.substring(0, 10) + '...');

        // Usar la misma estructura que createProduct - llamando a nuestra API route
        const res = await fetch('/api/medusa/update-product', {
        method: 'PUT', // Usar PUT para actualizaciones
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${medusaToken}`
        },
        body: JSON.stringify({
            productId,
            ...productData
        }),
        });

        console.log('📨 Status de respuesta:', res.status);
        console.log('📨 URL llamada:', '/api/medusa/update-product');

        // Seguir el mismo patrón que las otras funciones
        const responseText = await res.text();
        console.log('📄 Respuesta completa:', responseText);

        if (!responseText) {
        throw new Error('Respuesta vacía del servidor');
        }

        let data;
        try {
        data = JSON.parse(responseText);
        } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        throw new Error('Respuesta inválida del servidor');
        }

        if (!res.ok) {
        console.error('❌ Error del servidor:', data);
        throw new Error(data.error || `Error ${res.status} actualizando producto`);
        }

        console.log('✅ Producto actualizado exitosamente:', data);
        return data;

    } catch (error) {
        console.error('❌ Error actualizando producto:', error);
        throw error;
    }
    };

    const getStoreProducts = async (medusaSellerId: string) => {
    try {
        console.log('🔄 Obteniendo productos de la tienda para Medusa Seller ID:', medusaSellerId);

        console.log('🔑 Token disponible:', !!medusaToken);
        
        if (!medusaToken) {
        throw new Error('No Medusa token configured');
        }

        if (!medusaSellerId) {
        throw new Error('Medusa Seller ID is required');
        }

        const res = await fetch(`/api/medusa/store/${medusaSellerId}/products`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${medusaToken}`
        },
        });

        console.log('📨 Status de respuesta:', res.status);

        const responseText = await res.text();
        console.log('📄 Respuesta completa:', responseText);

        if (!responseText) {
        throw new Error('Respuesta vacía del servidor');
        }

        let data;
        try {
        data = JSON.parse(responseText);
        } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        throw new Error('Respuesta inválida del servidor');
        }

        if (!res.ok) {
        console.error('❌ Error del servidor:', data);
        throw new Error(data.error || `Error ${res.status} obteniendo productos de la tienda`);
        }

        console.log(`✅ ${data.products?.length || 0} productos obtenidos exitosamente`);
        return data;

    } catch (error) {
        console.error('❌ Error obteniendo productos de tienda:', error);
        return { 
        error: error instanceof Error ? error.message : 'Error desconocido',
        products: [] 
        };
    }
    };

  return { createProduct, getSellerProducts, updateProduct, getStoreProducts };
};