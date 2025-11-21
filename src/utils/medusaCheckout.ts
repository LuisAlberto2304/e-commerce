interface CheckoutData {
  cartId: string;
  email: string;
  shippingAddress: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    country_code: string;
    postal_code: string;
    phone: string;
  };
  shippingOptionId: string;
  items: Array<{
    variant_id: string;
    quantity: number;
  }>;
}

export async function processMedusaCheckout(checkoutData: CheckoutData) {
  try {
    const { cartId, email, shippingAddress, shippingOptionId, items } = checkoutData;

    console.log('🔄 Iniciando checkout completo para carrito:', cartId);

    // 1. Asociar carrito con usuario y dirección
    const updateCartResponse = await fetch(`/api/medusa/cart/${cartId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        shipping_address: {
          ...shippingAddress,
          country_code: 'mx' // Forzar México por ahora
        }
      })
    });

    if (!updateCartResponse.ok) {
      throw new Error('Error asociando carrito con usuario/dirección');
    }

    console.log('✅ Carrito asociado con usuario y dirección');

    // 2. Agregar método de envío
    const shippingResponse = await fetch(`/api/medusa/cart/${cartId}/shipping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        option_id: shippingOptionId
      })
    });

    if (!shippingResponse.ok) {
      throw new Error('Error agregando método de envío');
    }

    console.log('✅ Método de envío agregado');

    // 3. Iniciar proceso de pago
    const paymentResponse = await fetch('/api/medusa/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cart_id: cartId
      })
    });

    if (!paymentResponse.ok) {
      throw new Error('Error iniciando proceso de pago');
    }

    const paymentData = await paymentResponse.json();

    console.log('✅ Proceso de pago iniciado');

    return {
      success: true,
      cartId,
      paymentCollection: paymentData.payment_collection,
      paymentSession: paymentData.payment_session,
      nextSteps: ['Completar carrito y procesar inventario']
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ Error en checkout completo:', error);
    return {
      success: false,
      error: errorMessage
    };
  }
}