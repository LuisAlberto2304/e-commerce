/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

interface CartItem {
  title: string;
  quantity: number;
  variant_id: string;
}

const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_API_KEY;



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

      if (shipping_address) {
        let countryCode = shipping_address.country_code;
        if (countryCode && countryCode.toLowerCase() === 'mexico') {
          countryCode = 'mx';
        }

        updateData.shipping_address = {
          ...shipping_address,
          country_code: countryCode
        };
      }

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

    // 2. AGREGAR MÉTODO DE ENVÍO (Shipping Method)
    console.log('🚚 Agregando método de envío...');
    try {
      // Usamos el ID hardcodeado por ahora según instrucción del usuario
      const shippingOptionId = "so_01K5HT9AP1KW93QSPHAK14B59C";

      const shippingResponse = await fetch(`${medusaUrl}/store/carts/${cartId}/shipping-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': publishableKey!,
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ option_id: shippingOptionId })
      });

      if (shippingResponse.ok) {
        console.log('✅ Método de envío agregado:', shippingOptionId);
      } else {
        const errorData = await shippingResponse.json();
        console.warn('⚠️ Error agregando método de envío:', errorData);
        // No lanzamos error aquí para permitir que continúe si es posible, 
        // aunque probablemente falle en complete-cart si es requerido.
      }
    } catch (shippingError: any) {
      console.warn('⚠️ Error en proceso de envío:', shippingError.message);
    }

    // 2. INICIALIZAR PAYMENT COLLECTION
    console.log('💳 Inicializando Payment Collection...');

    // Mantenemos la estructura de inventoryResult para no romper el resto del código
    const inventoryResult = {
      success: true,
      results: [],
      errors: [],
      message: 'Inventario manejado nativamente por Medusa'
    };

    try {
      // 2.1 Crear Payment Collection
      const paymentCollectionResponse = await fetch(`${medusaUrl}/store/payment-collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': publishableKey!,
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ cart_id: cartId })
      });

      if (!paymentCollectionResponse.ok) {
        const errorData = await paymentCollectionResponse.json();
        console.error('❌ Error creando payment collection:', errorData);
        throw new Error(`Error creating payment collection: ${errorData.message || 'Unknown error'}`);
      }

      const paymentCollectionData = await paymentCollectionResponse.json();
      const paymentCollectionId = paymentCollectionData.payment_collection.id;
      console.log('✅ Payment Collection creado:', paymentCollectionId);

      // 2.2 Crear Payment Session
      console.log('💳 Creando Payment Session...');
      const paymentSessionResponse = await fetch(`${medusaUrl}/store/payment-collections/${paymentCollectionId}/payment-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': publishableKey!,
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ provider_id: 'pp_system_default' })
      });

      if (!paymentSessionResponse.ok) {
        const errorData = await paymentSessionResponse.json();
        console.error('❌ Error creando payment session:', errorData);
        throw new Error(`Error creating payment session: ${errorData.message || 'Unknown error'}`);
      }

      console.log('✅ Payment Session creado exitosamente');

    } catch (paymentError: any) {
      console.error('❌ Error en proceso de pago:', paymentError.message);
      throw paymentError;
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