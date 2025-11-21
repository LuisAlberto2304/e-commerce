// app/api/medusa/cart-item/route.ts - VERSIÓN CORREGIDA
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { cartId, items } = await request.json();
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_API_KEY;

    // Validaciones
    if (!cartId || !items || !Array.isArray(items)) {
      return NextResponse.json({
        success: false,
        error: 'Missing cartId or items array'
      }, { status: 400 });
    }

    if (!medusaUrl || !publishableKey) {
      return NextResponse.json(
        { error: 'Medusa configuration missing' },
        { status: 500 }
      );
    }

    console.log('📦 Agregando múltiples items al carrito Medusa:', {
      cartId,
      itemsCount: items.length,
      hasToken: !!token
    });

    const results = [];
    let lastCart = null;

    // Procesar cada item individualmente
    for (const item of items) {
      try {
        const { variant_id, quantity } = item;

        if (!variant_id || !quantity || quantity < 1) {
          results.push({
            variant_id: variant_id || 'unknown',
            success: false,
            error: 'Invalid variant_id or quantity'
          });
          continue;
        }

        console.log(`➕ Agregando item: ${variant_id}, cantidad: ${quantity}`);

        const response = await fetch(`${medusaUrl}/store/carts/${cartId}/line-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': publishableKey,
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            variant_id: variant_id,
            quantity: parseInt(quantity, 10)
          })
        });

        if (response.ok) {
          const data = await response.json();
          lastCart = data.cart; // Guardar el carrito actualizado
          results.push({
            variant_id: variant_id,
            success: true
          });
          console.log(`✅ Item ${variant_id} agregado exitosamente`);
        } else {
          const errorData = await response.json();
          results.push({
            variant_id: variant_id,
            success: false,
            error: `HTTP ${response.status}: ${JSON.stringify(errorData)}`
          });
          console.warn(`⚠️ Item ${variant_id} falló:`, response.status, errorData);
        }
      } catch (itemError: unknown) {
        const errorMsg = itemError instanceof Error ? itemError.message : 'Error desconocido';
        results.push({
          variant_id: item.variant_id,
          success: false,
          error: errorMsg
        });
        console.error(`❌ Error con item ${item.variant_id}:`, itemError);
      }
    }

    // Calcular resultados
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);

    console.log(`📊 Resultado: ${successful} exitosos, ${failed.length} fallidos`);

    if (successful > 0) {
      return NextResponse.json({
        success: true,
        cart: lastCart,
        results: results,
        summary: {
          total: items.length,
          successful: successful,
          failed: failed.length
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'No se pudo agregar ningún item al carrito',
        results: results
      }, { status: 500 });
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ Error crítico en cart-item API:', error);
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}