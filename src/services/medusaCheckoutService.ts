// src/services/medusaCheckoutService.ts
/**
 * Servicio completo para manejar el flujo de checkout con Medusa v2.10.3
 * Sigue el orden correcto de operaciones según la documentación
 */

interface CheckoutConfig {
  medusaToken: string; // Token de autenticación del usuario
  regionId: string;
  email: string;
  shippingAddress: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    country_code: string; // Siempre 'mx'
    postal_code: string;
    phone: string;
  };
  items: Array<{
    variant_id: string;
    quantity: number;
  }>;
  shippingOptionId?: string; // Por defecto: so_01K5HT9AP08S9T13NQEKCHHJCC
}

interface CheckoutResult {
  success: boolean;
  orderId?: string;
  cartId?: string;
  error?: string;
  step?: string;
}

class MedusaCheckoutService {
  private baseUrl: string;
  private apiKey: string;
  private token: string;

  constructor(token: string) {
    this.baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || '';
    this.apiKey = process.env.NEXT_PUBLIC_MEDUSA_API_KEY || '';
    this.token = token;
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-publishable-api-key': this.apiKey,
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * PASO 1: Crear carrito en Medusa
   */
  async createCart(regionId: string): Promise<{ cartId: string; cart: any }> {
    console.log('📦 Paso 1: Creando carrito...');
    
    const response = await fetch(`${this.baseUrl}/store/carts`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ region_id: regionId })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error creando carrito: ${error}`);
    }

    const data = await response.json();
    const cartId = data.cart?.id;

    if (!cartId) {
      throw new Error('No se recibió ID del carrito');
    }

    console.log('✅ Carrito creado:', cartId);
    return { cartId, cart: data.cart };
  }

  /**
   * PASO 2: Asociar carrito al customer (email)
   */
  async associateCustomer(cartId: string, email: string): Promise<void> {
    console.log('👤 Paso 2: Asociando customer al carrito...');
    
    const response = await fetch(`${this.baseUrl}/store/carts/${cartId}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error asociando customer: ${error}`);
    }

    console.log('✅ Customer asociado:', email);
  }

  /**
   * PASO 3: Agregar productos al carrito
   */
  async addItemsToCart(cartId: string, items: Array<{ variant_id: string; quantity: number }>): Promise<void> {
    console.log('🛍️ Paso 3: Agregando items al carrito...');
    
    for (const item of items) {
      const response = await fetch(`${this.baseUrl}/store/carts/${cartId}/line-items`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          variant_id: item.variant_id,
          quantity: item.quantity
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.warn(`⚠️ Error agregando item ${item.variant_id}:`, error);
        // Continuar con los demás items
      } else {
        console.log(`✅ Item agregado: ${item.variant_id} x${item.quantity}`);
      }
    }
  }

  /**
   * PASO 4: Agregar dirección de envío
   */
  async addShippingAddress(
    cartId: string, 
    email: string,
    shippingAddress: CheckoutConfig['shippingAddress']
  ): Promise<void> {
    console.log('📍 Paso 4: Agregando dirección de envío...');
    
    const response = await fetch(`${this.baseUrl}/store/carts/${cartId}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        email,
        shipping_address: {
          ...shippingAddress,
          country_code: 'mx' // Forzar México
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error agregando dirección: ${error}`);
    }

    console.log('✅ Dirección agregada');
  }

  /**
   * PASO 5: Agregar método de envío
   */
  async addShippingMethod(cartId: string, optionId: string): Promise<void> {
    console.log('🚚 Paso 5: Agregando método de envío...');
    
    const response = await fetch(`${this.baseUrl}/store/carts/${cartId}/shipping-methods`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ option_id: optionId })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error agregando método de envío: ${error}`);
    }

    console.log('✅ Método de envío agregado:', optionId);
  }

  /**
   * PASO 6: Crear Payment Collection
   */
  async createPaymentCollection(cartId: string): Promise<string> {
    console.log('💳 Paso 6: Creando payment collection...');
    
    const response = await fetch(`${this.baseUrl}/store/payment-collections`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ cart_id: cartId })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error creando payment collection: ${error}`);
    }

    const data = await response.json();
    const paymentCollectionId = data.payment_collection?.id;

    if (!paymentCollectionId) {
      throw new Error('No se recibió ID del payment collection');
    }

    console.log('✅ Payment collection creado:', paymentCollectionId);
    return paymentCollectionId;
  }

  /**
   * PASO 7: Crear Payment Session
   */
  async createPaymentSession(paymentCollectionId: string): Promise<void> {
    console.log('💰 Paso 7: Creando payment session...');
    
    const response = await fetch(
      `${this.baseUrl}/store/payment-collections/${paymentCollectionId}/payment-sessions`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ provider_id: 'pp_system_default' })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error creando payment session: ${error}`);
    }

    console.log('✅ Payment session creado');
  }

  /**
   * PASO 8: Completar carrito y crear orden
   */
  async completeCart(cartId: string): Promise<{ orderId: string; order: any }> {
    console.log('🎯 Paso 8: Completando carrito...');
    
    const response = await fetch(`${this.baseUrl}/store/carts/${cartId}/complete`, {
      method: 'POST',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error completando carrito: ${error}`);
    }

    const data = await response.json();
    
    if (data.type === 'order' && data.data) {
      console.log('✅ Orden creada:', data.data.id);
      return { orderId: data.data.id, order: data.data };
    }

    throw new Error('Respuesta inesperada al completar carrito');
  }

  /**
   * FLUJO COMPLETO: Ejecutar todos los pasos en orden
   */
  async processCompleteCheckout(config: CheckoutConfig): Promise<CheckoutResult> {
    let cartId: string | undefined;
    let currentStep = '';

    try {
      // Paso 1: Crear carrito
      currentStep = 'create_cart';
      const { cartId: newCartId } = await this.createCart(config.regionId);
      cartId = newCartId;

      // Paso 2: Asociar customer
      currentStep = 'associate_customer';
      await this.associateCustomer(cartId, config.email);

      // Paso 3: Agregar items
      currentStep = 'add_items';
      await this.addItemsToCart(cartId, config.items);

      // Paso 4: Agregar dirección
      currentStep = 'add_shipping_address';
      await this.addShippingAddress(cartId, config.email, config.shippingAddress);

      // Paso 5: Agregar método de envío
      currentStep = 'add_shipping_method';
      const shippingOptionId = config.shippingOptionId || 'so_01K5HT9AP08S9T13NQEKCHHJCC';
      await this.addShippingMethod(cartId, shippingOptionId);

      // Paso 6: Crear payment collection
      currentStep = 'create_payment_collection';
      const paymentCollectionId = await this.createPaymentCollection(cartId);

      // Paso 7: Crear payment session
      currentStep = 'create_payment_session';
      await this.createPaymentSession(paymentCollectionId);

      // Paso 8: Completar carrito
      currentStep = 'complete_cart';
      const { orderId, order } = await this.completeCart(cartId);

      console.log('🎉 ¡Checkout completado exitosamente!');
      
      return {
        success: true,
        orderId,
        cartId,
        step: 'completed'
      };

    } catch (error: any) {
      console.error(`❌ Error en paso ${currentStep}:`, error.message);
      
      return {
        success: false,
        error: error.message,
        step: currentStep,
        cartId
      };
    }
  }
}

export default MedusaCheckoutService;

// ============================================
// Hook para usar en componentes React
// ============================================

export function useMedusaCheckout() {
  const processCheckout = async (config: CheckoutConfig): Promise<CheckoutResult> => {
    const service = new MedusaCheckoutService(config.medusaToken);
    return await service.processCompleteCheckout(config);
  };

  return { processCheckout };
}

// ============================================
// API Route Handler - src/app/api/medusa/checkout/complete/route.ts
// ============================================

/*
// Este es el contenido para: src/app/api/medusa/checkout/complete/route.ts

import { NextRequest, NextResponse } from 'next/server';
import MedusaCheckoutService from '@/services/medusaCheckoutService';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const {
      email,
      shippingAddress,
      items,
      regionId,
      shippingOptionId
    } = body;

    // Validaciones
    if (!email || !shippingAddress || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Datos incompletos para el checkout' },
        { status: 400 }
      );
    }

    // Usar región por defecto si no se proporciona
    const finalRegionId = regionId || process.env.NEXT_PUBLIC_MEDUSA_DEFAULT_REGION;
    
    if (!finalRegionId) {
      return NextResponse.json(
        { error: 'Region ID no configurada' },
        { status: 500 }
      );
    }

    console.log('🚀 Iniciando checkout completo...');

    // Ejecutar checkout completo
    const service = new MedusaCheckoutService(token);
    const result = await service.processCompleteCheckout({
      medusaToken: token,
      regionId: finalRegionId,
      email,
      shippingAddress: {
        ...shippingAddress,
        country_code: 'mx' // Forzar México
      },
      items,
      shippingOptionId: shippingOptionId || 'so_01K5HT9AP08S9T13NQEKCHHJCC'
    });

    if (result.success) {
      console.log('✅ Checkout completado exitosamente:', result.orderId);
      
      return NextResponse.json({
        success: true,
        orderId: result.orderId,
        cartId: result.cartId,
        message: 'Orden creada exitosamente'
      });
    } else {
      console.error('❌ Error en checkout:', result.error);
      
      return NextResponse.json({
        success: false,
        error: result.error,
        step: result.step,
        cartId: result.cartId
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Error crítico en checkout:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}
*/