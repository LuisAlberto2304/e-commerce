/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useMedusaAuth.ts
'use client';

export const useMedusa = () => {
  const createProduct = async (productData: any) => {
    try {
      console.log('🔄 Enviando producto a API...', productData.title);
      
      // Asegúrate de que la URL sea correcta - /api/medusa/products
      const res = await fetch('/api/medusa/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  return { createProduct };
};