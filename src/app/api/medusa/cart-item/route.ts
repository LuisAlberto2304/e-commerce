import { NextRequest, NextResponse } from 'next/server';

// En /api/medusa/cart-item/route.ts
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const { cartId, variantId, quantity } = await request.json();

    // ⬇️ VALIDACIONES MÁS ESTRICTAS
    if (!cartId) {
      return NextResponse.json(
        { error: 'cartId is required' },
        { status: 400 }
      );
    }

    if (!variantId) {
      return NextResponse.json(
        { error: 'variantId is required' },
        { status: 400 }
      );
    }

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      );
    }

    console.log('➕ Agregando item:', {
      cartId,
      variantId,
      quantity,
      hasToken: !!token
    });

    const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_API_KEY;

    if (!medusaUrl || !publishableKey) {
      return NextResponse.json(
        { error: 'Medusa configuration missing' },
        { status: 500 }
      );
    }

    const response = await fetch(`${medusaUrl}/store/carts/${cartId}/line-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey,
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        variant_id: variantId,
        quantity: parseInt(quantity, 10)
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error agregando item:', errorData);
      return NextResponse.json(
        { error: 'Failed to add item to cart', details: errorData },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Item agregado exitosamente al carrito Medusa');

    return NextResponse.json({ 
      cart: result.cart,
      success: true 
    });

  } catch (error: any) {
    console.error('❌ Error crítico agregando item:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}