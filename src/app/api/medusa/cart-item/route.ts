/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/medusa/cart-item/route.ts - VERSIÓN SIMPLIFICADA
import { NextRequest, NextResponse } from 'next/server';

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
const MEDUSA_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { cartId, items } = await request.json();

    if (!cartId || !items) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing cartId or items' 
      }, { status: 400 });
    }

    console.log('📦 Agregando items al carrito Medusa:', { cartId, itemsCount: items.length });

    const results = [];
    let lastCart = null;

    for (const item of items) {
      try {
        console.log(`🔧 Agregando: ${item.variant_id}, cantidad: ${item.quantity}`);
        
        const response = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cartId}/line-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': MEDUSA_API_KEY || '',
          },
          body: JSON.stringify({
            variant_id: item.variant_id,
            quantity: item.quantity,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          lastCart = data.cart; // Guardar el carrito actualizado
          results.push({
            variant_id: item.variant_id,
            success: true
          });
          console.log(`✅ Item ${item.variant_id} agregado`);
        } else {
          const errorText = await response.text();
          results.push({
            variant_id: item.variant_id,
            success: false,
            error: `HTTP ${response.status}: ${errorText}`
          });
          console.warn(`⚠️ Item ${item.variant_id} falló:`, response.status);
        }
      } catch (itemError: any) {
        results.push({
          variant_id: item.variant_id,
          success: false,
          error: itemError.message
        });
        console.error(`❌ Error con item ${item.variant_id}:`, itemError);
      }
    }

    const successful = results.filter(r => r.success).length;
    
    if (successful > 0) {
      return NextResponse.json({ 
        success: true,
        cart: lastCart,
        results: results,
        note: `${successful} de ${items.length} items agregados`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'No se pudo agregar ningún item',
        results: results
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Error en cart-item API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}