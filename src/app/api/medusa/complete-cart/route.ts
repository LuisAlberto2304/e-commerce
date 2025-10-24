/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

interface CartItem {
  title: string;
  quantity: number;
  variant_id: string;
}

  const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_API_KEY;

const updateInventory = async (items: any[]) => {
  console.log('📦 Actualizando inventario para items:', items);
  
  const updatedItems: any[] = [];
  const failedItems: any[] = [];

  for (const item of items) {
    try {
      const { variant_id, quantity } = item;
      console.log(`➖ Reduciendo stock: ${variant_id} - ${quantity} unidades`);

      // ✅ LLAMA DIRECTAMENTE A MEDUSA, NO A TU ENDPOINT NEXT.JS
      const inventoryResponse = await fetch(`${medusaUrl}/api/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variantId: variant_id,
          quantity: quantity
        }),
      });

      if (!inventoryResponse.ok) {
        const errorText = await inventoryResponse.text();
        throw new Error(`Error ${inventoryResponse.status}: ${errorText}`);
      }

      const result = await inventoryResponse.json();

      if (result.success) {
        updatedItems.push({
          variantId: variant_id,
          quantityReduced: quantity,
          status: 'success',
          response: result
        });
        console.log(`✅ Stock actualizado: ${variant_id}`);
      } else {
        throw new Error(result.error || 'Error en inventario');
      }

    } catch (error: any) {
      console.error(`❌ Error procesando item ${item.variant_id}:`, error);
      failedItems.push({
        variantId: item.variant_id,
        error: error.message
      });
    }
  }

  return {
    success: failedItems.length === 0,
    message: failedItems.length === 0 
      ? "Inventario actualizado correctamente" 
      : "Algunos items fallaron",
    updated: updatedItems,
    failed: failedItems
  };
};

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('🔑 Token recibido en complete-cart:', token ? 'Sí' : 'No');
    
    const { cartId, email, shipping_address, payment_method = 'manual', items = [] } = await request.json();

    if (!cartId) {
      return NextResponse.json({ error: 'Missing cartId' }, { status: 400 });
    }

    console.log('🔄 Procesando orden completa...', { 
      cartId, 
      itemsCount: items.length,
      payment_method,
      authenticated: !!token
    });
    
    if (!publishableKey) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_MEDUSA_API_KEY no configurada' },
        { status: 500 }
      );
    }

    // 1. ACTUALIZAR CARRITO CON INFORMACIÓN DEL CLIENTE
    try {
      const updateData: any = {};
      
      if (email) updateData.email = email;
      if (shipping_address) updateData.shipping_address = shipping_address;
      
      updateData.metadata = {
        payment_method,
        created_via: 'nextjs-storefront',
        timestamp: new Date().toISOString()
      };

      console.log('📝 Actualizando carrito con:', updateData);

      const updateResponse = await fetch(`${medusaUrl}/store/carts/${cartId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': publishableKey,
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(updateData)
      });
      
      if (updateResponse.ok) {
        console.log('✅ Carrito actualizado con información del cliente');
      } else {
        const errorData = await updateResponse.json();
        console.warn('⚠️ No se pudo actualizar información del carrito:', errorData);
      }
    } catch (updateError: any) {
      console.warn('⚠️ Error actualizando carrito:', updateError.message);
    }

    // 2. ACTUALIZAR INVENTARIO
    let inventoryResult = {
      success: false,
      updated: [] as any[],
      failed: [] as any[],
      message: 'No se procesaron items'
    };
    
    if (items.length > 0) {
      console.log('📦 Procesando actualización de inventario...');
      inventoryResult = await updateInventory(items);
      console.log('✅ Resultado inventario:', inventoryResult);
    }

    // 3. COMPLETAR CARRITO EN MEDUSA
    console.log('🎯 Completando carrito en Medusa...');
    
    let orderResult;
    let completedViaApi = false;

    try {
      const completeResponse = await fetch(`${medusaUrl}/store/carts/${cartId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': publishableKey,
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (completeResponse.ok) {
        const completedData = await completeResponse.json();
        console.log('🔍 Respuesta completa de Medusa:', JSON.stringify(completedData, null, 2));
        
        // ✅ CORREGIDO: Usar completedData.order en lugar de completedData.data
        if (completedData.type === 'order' && completedData.order) {
          orderResult = completedData.order;
          completedViaApi = true;
          console.log('✅ Carrito completado en Medusa. Orden ID:', orderResult.id);
        } else {
          console.warn('⚠️ Respuesta inesperada de complete:', completedData);
          throw new Error('Estructura de respuesta inesperada');
        }
      } else {
        const errorData = await completeResponse.json();
        console.error('❌ Error completando carrito:', {
          status: completeResponse.status,
          error: errorData
        });
        throw new Error(`Error ${completeResponse.status}: ${errorData.message}`);
      }
      
    } catch (completeError: any) {
      console.error('⚠️ Error completando carrito:', completeError.message);
      console.log('📝 Creando orden manual como fallback...');
      
      // FALLBACK: Crear orden manual
      orderResult = {
        id: `order_manual_${Date.now()}`,
        status: 'pending',
        fulfillment_status: 'not_fulfilled',
        payment_status: 'awaiting',
        created_at: new Date().toISOString(),
        cart_id: cartId,
        email: email || 'customer@example.com',
        shipping_address: shipping_address || {},
        metadata: {
          created_manually: true,
          payment_method,
          inventory_updated: inventoryResult.success,
          inventory_updates: inventoryResult.updated,
          inventory_failed: inventoryResult.failed,
          note: 'Orden creada manualmente debido a error en API de Medusa'
        }
      };
      completedViaApi = false;
      console.log('✅ Orden manual creada:', orderResult.id);
    }

    // 4. ENVIAR EMAIL CON LA ORDEN CORRECTA
    try {
      console.log('📧 Enviando email para orden:', orderResult.id);
      
      const emailPayload: any = {
        to: orderResult.email,
        type: "confirmation",
        custom_data: {
          items: items.map((i: CartItem) => ({
            title: i.title,
            quantity: i.quantity,
            variant_id: i.variant_id
          }))
        }
      };

      // Solo enviar order_id si es una orden real de Medusa
      if (completedViaApi) {
        emailPayload.order_id = orderResult.id;
      } else {
        // Para órdenes manuales, enviar datos en custom_data
        emailPayload.custom_data.order_number = orderResult.id.replace('order_manual_', '');
        emailPayload.custom_data.is_manual_order = true;
      }

      const emailResponse = await fetch(`${medusaUrl}/sendEmail`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-publishable-api-key": publishableKey
        },
        body: JSON.stringify(emailPayload),
      });

      if (emailResponse.ok) {
        console.log('✅ Email enviado exitosamente');
      } else {
        const errorText = await emailResponse.text();
        console.warn('⚠️ Error enviando email:', errorText);
      }
    } catch (emailError: any) {
      console.warn('❌ Error enviando email:', emailError.message);
    }

    return NextResponse.json({ 
      success: true, 
      order: orderResult,
      completed_via_api: completedViaApi,
      inventory_updated: inventoryResult.success,
      inventory_updates: inventoryResult.updated,
      inventory_failed: inventoryResult.failed,
      payment_method
    });

  } catch (error: any) {
    console.error('❌ Error crítico en complete-cart:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}