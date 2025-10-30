/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

interface CartItem {
  title: string;
  quantity: number;
  variant_id: string;
}

const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_API_KEY;

const updateInventory = async (items: CartItem[]) => {
  try {
    // CORREGIDO: Enviar como objeto con propiedad items
    const requestBody = {
      items: items.map((i: CartItem) => ({
        variantId: i.variant_id,
        quantity: i.quantity,
      })),
    };

    console.log('📤 Request body para inventario:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${medusaUrl}/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey!,
      },
      body: JSON.stringify(requestBody), // CORREGIDO: Enviar el objeto completo
    });

    // Verificar primero si la respuesta es HTML (error)
    const responseText = await response.text();
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ La respuesta no es JSON válido:', responseText.substring(0, 200));
      throw new Error(`El servidor respondió con HTML en lugar de JSON. Posible error 404 o ruta incorrecta.`);
    }

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${result.message || 'Error actualizando inventario'}`);
    }

    return {
      success: result.success,
      results: result.results || [],
      errors: result.errors_detail || [],
      message: result.message || 'Inventario actualizado'
    };
  } catch (err: any) {
    console.error('❌ Error en updateInventory:', err.message);
    return { 
      success: false, 
      results: [], 
      errors: [err.message],
      message: err.message
    };
  }
};

// El resto de tu función POST permanece igual...
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

    // 2. ACTUALIZAR INVENTARIO - DESCONTAR PRODUCTOS
    let inventoryResult = {
      success: false,
      results: [] as any[],
      errors: [] as string[],
      message: 'No se procesaron items'
    };
    
    if (items.length > 0) {
      console.log('📦 Procesando actualización de inventario...');
      console.log('📤 Enviando items al inventario:', items.map((i: CartItem) => ({
        variantId: i.variant_id,
        quantity: i.quantity
      })));
      
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
          inventory_results: inventoryResult.results,
          inventory_errors: inventoryResult.errors,
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
          })),
          inventory_updated: inventoryResult.success,
          inventory_errors: inventoryResult.errors
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
      inventory_results: inventoryResult.results,
      inventory_errors: inventoryResult.errors,
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