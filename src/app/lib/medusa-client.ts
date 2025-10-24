// app/lib/medusa-client.ts - VERSIÓN COMPATIBLE
/* eslint-disable @typescript-eslint/no-explicit-any */
const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
const MEDUSA_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_API_KEY;

// Verificar configuración
console.log('🔧 Configuración Medusa:', {
  backendUrl: MEDUSA_BACKEND_URL ? '✅ Configurado' : '❌ Faltante',
  publishableKey: MEDUSA_PUBLISHABLE_KEY ? '✅ Configurado' : '❌ Faltante',
});

if (!MEDUSA_BACKEND_URL) {
  console.error('❌ NEXT_PUBLIC_MEDUSA_BACKEND_URL no está configurado');
  throw new Error('NEXT_PUBLIC_MEDUSA_BACKEND_URL no está configurado');
}

if (!MEDUSA_PUBLISHABLE_KEY) {
  console.error('❌ NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY no está configurado');
  throw new Error('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY no está configurado');
}

// Cliente de Medusa - MANTENER AMBAS ESTRUCTURAS
const medusaClient = {
  carts: {
    create: async () => {
      console.log('🛒 Creando carrito en Medusa...');
      
      const url = `${MEDUSA_BACKEND_URL}/store/carts`;
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({}),
        });
        
        console.log('📊 Respuesta status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create cart: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Carrito creado:', data.cart?.id);
        return data;
      } catch (error) {
        console.error('🚨 Error en create cart:', error);
        throw error;
      }
    },

    update: async (cartId: string, data: any) => {
      console.log('🔄 Actualizando carrito...', { cartId });
      
      const url = `${MEDUSA_BACKEND_URL}/store/carts/${cartId}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update cart: ${response.status} - ${errorText}`);
      }
      
      return response.json();
    },

    complete: async (cartId: string) => {
      console.log('🎯 Completando carrito...', { cartId });
      
      const url = `${MEDUSA_BACKEND_URL}/store/carts/${cartId}/complete`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        if (errorText.includes('payment') || errorText.includes('Payment')) {
          throw new Error('PAYMENT_REQUIRED: Se requiere configuración de pago');
        }
        
        throw new Error(`Failed to complete cart: ${response.status} - ${errorText}`);
      }
      
      return response.json();
    },

    lineItems: {
      create: async (cartId: string, data: { variant_id: string; quantity: number }) => {
        console.log('📦 Agregando item al carrito (vía carts.lineItems):', { cartId, data });
        
        const url = `${MEDUSA_BACKEND_URL}/store/carts/${cartId}/line-items`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to add item to cart: ${response.status} - ${errorText}`);
        }
        
        return response.json();
      },
    },
  },

  // 🔹 MANTENER esta propiedad en el nivel raíz para compatibilidad
  lineItems: {
    create: async (cartId: string, data: { variant_id: string; quantity: number }) => {
      console.log('📦 Agregando item al carrito (vía lineItems):', { cartId, data });
      
      const url = `${MEDUSA_BACKEND_URL}/store/carts/${cartId}/line-items`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add item to cart: ${response.status} - ${errorText}`);
      }
      
      console.log('✅ Item agregado exitosamente al carrito Medusa');
      return response.json();
    },
  },

  payments: {
    initSession: async (cartId: string) => {
      console.log('💳 Inicializando sesión de pago...', { cartId });
      
      const url = `${MEDUSA_BACKEND_URL}/store/carts/${cartId}/payment-sessions`;
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Sesión de pago inicializada');
          return data;
        }
        
        if (response.status === 404) {
          console.log('ℹ️ Endpoint de payment-sessions no disponible');
          return null;
        }
        
        const errorText = await response.text();
        throw new Error(`Failed to init payment: ${response.status} - ${errorText}`);
      } catch (error: any) {
        console.warn('⚠️ Error inicializando pago:', error.message);
        return null;
      }
    },
  },

  shipping: {
    listOptions: async (cartId: string) => {
      const url = `${MEDUSA_BACKEND_URL}/store/carts/${cartId}/shipping-options`;
      
      try {
        const response = await fetch(url, {
          headers: {
            'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
          },
        });
        
        if (response.ok) {
          return response.json();
        }
        return { shipping_options: [] };
      } catch (error) {
        console.warn('Error obteniendo opciones de envío:', error);
        return { shipping_options: [] };
      }
    },
  },
};

export default medusaClient;