import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { cartId: string } }
) {
  try {
    const { cartId } = params;
    const { email, shipping_address } = await request.json();

    if (!cartId) {
      return NextResponse.json(
        { error: 'Cart ID is required' },
        { status: 400 }
      );
    }

    const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_API_KEY;

    if (!medusaUrl || !publishableKey) {
      return NextResponse.json(
        { error: 'Medusa configuration missing' },
        { status: 500 }
      );
    }

    // Preparar datos para actualizar el carrito
    const updateData: any = {};

    if (email) {
      updateData.email = email;
    }

    if (shipping_address) {
      // Asegurar que el country_code sea 'mx' si el país es México
      const shippingData = { ...shipping_address };
      if (shippingData.country === 'México' || shippingData.country === 'Mexico') {
        shippingData.country_code = 'mx';
      }
      updateData.shipping_address = shippingData;
    }

    console.log('🔄 Actualizando carrito:', { cartId, updateData });

    const response = await fetch(`${medusaUrl}/store/carts/${cartId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey,
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error actualizando carrito:', {
        status: response.status,
        error: errorText
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to update cart',
          details: errorText
        },
        { status: response.status }
      );
    }

    const cart = await response.json();
    
    console.log('✅ Carrito actualizado:', {
      id: cart.cart?.id,
      email: cart.cart?.email,
      shipping_address: cart.cart?.shipping_address
    });

    return NextResponse.json({ 
      cart: cart.cart,
      success: true 
    });

  } catch (error: any) {
    console.error('❌ Error actualizando carrito:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}