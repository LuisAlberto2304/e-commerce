import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { cart_id } = await request.json();

    if (!cart_id) {
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

    console.log('💳 Iniciando proceso de pago para carrito:', cart_id);

    // 1. Crear colección de pagos
    const paymentCollectionResponse = await fetch(`${medusaUrl}/store/payment-collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey,
      },
      body: JSON.stringify({
        cart_id: cart_id
      })
    });

    if (!paymentCollectionResponse.ok) {
      const errorText = await paymentCollectionResponse.text();
      console.error('❌ Error creando colección de pagos:', errorText);
      return NextResponse.json(
        { error: 'Failed to create payment collection' },
        { status: paymentCollectionResponse.status }
      );
    }

    const paymentCollection = await paymentCollectionResponse.json();
    const paymentCollectionId = paymentCollection.payment_collection?.id;

    console.log('✅ Colección de pagos creada:', paymentCollectionId);

    // 2. Crear sesión de pago
    const paymentSessionResponse = await fetch(
      `${medusaUrl}/store/payment-collections/${paymentCollectionId}/payment-sessions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': publishableKey,
        },
        body: JSON.stringify({
          provider_id: "pp_system_default" // Payment Provider por defecto
        })
      }
    );

    if (!paymentSessionResponse.ok) {
      const errorText = await paymentSessionResponse.text();
      console.error('❌ Error creando sesión de pago:', errorText);
      return NextResponse.json(
        { error: 'Failed to create payment session' },
        { status: paymentSessionResponse.status }
      );
    }

    const paymentSession = await paymentSessionResponse.json();

    console.log('✅ Sesión de pago creada');

    return NextResponse.json({
      success: true,
      payment_collection: paymentCollection.payment_collection,
      payment_session: paymentSession.payment_session
    });

  } catch (error: any) {
    console.error('❌ Error en proceso de pago:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}