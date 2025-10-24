/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/cart/medusa/item/route.ts - VERSIÓN MEJORADA
import { NextRequest, NextResponse } from 'next/server';
import medusaClient from '@/app/lib/medusa-client';

export async function POST(request: NextRequest) {
  try {
    const { cartId, variantId, quantity } = await request.json();

    console.log('📦 Agregando item al carrito Medusa:', { cartId, variantId, quantity });

    if (!cartId || !variantId) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing cartId or variantId' 
      }, { status: 400 });
    }

    // Verificar que el carrito existe primero
    try {
      // Intentar obtener el carrito para verificar que existe
      await medusaClient.carts.update(cartId, {});
      console.log('✅ Carrito verificado');
    } catch (cartError: any) {
      console.error('❌ Error verificando carrito:', cartError);
      return NextResponse.json({
        success: false,
        error: `Carrito no válido: ${cartError.message}`
      }, { status: 400 });
    }

    // Agregar item al carrito
    try {
      const result = await medusaClient.lineItems.create(cartId, {
        variant_id: variantId,
        quantity: quantity || 1,
      });

      console.log('✅ Item agregado exitosamente al carrito Medusa');
      
      return NextResponse.json({ 
        success: true,
        cart: result.cart,
        message: 'Item added to cart successfully'
      });

    } catch (error: any) {
      console.error('❌ Error agregando item al carrito Medusa:', error);
      
      // Intentar método alternativo si el primero falla
      return NextResponse.json(
        { 
          success: false,
          error: error.message || 'Failed to add item to cart',
          details: 'El endpoint de line-items puede no estar disponible'
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Error general en cart item API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}