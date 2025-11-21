import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ cartId: string }> }
) {
  try {
    const { cartId } = await context.params;
    const { option_id } = await request.json();

    if (!cartId || !option_id) {
      return NextResponse.json(
        { error: 'Cart ID and shipping option ID are required' },
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

    console.log('🚚 Agregando método de envío:', { cartId, option_id });

    const response = await fetch(`${medusaUrl}/store/carts/${cartId}/shipping-methods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey,
      },
      body: JSON.stringify({
        option_id: option_id
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error agregando método de envío:', {
        status: response.status,
        error: errorText
      });

      return NextResponse.json(
        {
          error: 'Failed to add shipping method',
          details: errorText
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    console.log('✅ Método de envío agregado:', result.cart?.id);

    return NextResponse.json({
      cart: result.cart,
      success: true
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('❌ Error agregando método de envío:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}