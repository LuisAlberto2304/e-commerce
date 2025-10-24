// app/api/medusa/cart/route.ts - VERSIÓN FINAL
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('🔑 Token JWT recibido:', token ? 'Sí' : 'No');

    let requestBody;
    try {
      requestBody = await request.json();
      console.log('📦 Body recibido:', requestBody);
    } catch (parseError) {
      console.log('📦 Body vacío o inválido, usando valores por defecto');
      requestBody = {};
    }

    const { region_id, items = [], customer_id, email } = requestBody;

    const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_API_KEY;

    if (!medusaUrl || !publishableKey) {
      return NextResponse.json(
        { error: 'Medusa configuration missing' },
        { status: 500 }
      );
    }

    // ⬇️ USAR LA REGIÓN CORRECTA
    const regionId = region_id || process.env.NEXT_PUBLIC_MEDUSA_DEFAULT_REGION;
    
    if (!regionId) {
      return NextResponse.json(
        { error: 'Region ID is required' },
        { status: 400 }
      );
    }

    console.log('📍 Region ID a usar:', regionId);

    const cartData: any = {
      region_id: regionId
    };

    // ⬇️ ASOCIAR CLIENTE AL CARRITO (IMPORTANTE PARA EL CHECKOUT)
    if (token) {
      try {
        const decoded: any = jwt.decode(token);
        console.log('🔓 Token decodificado:', decoded);
        
        if (decoded?.customer_id) {
          cartData.customer_id = decoded.customer_id;
          console.log('👤 Customer ID del token:', decoded.customer_id);
        }
        if (decoded?.email) {
          cartData.email = decoded.email;
          console.log('📧 Email del token:', decoded.email);
        }
      } catch (decodeError) {
        console.warn('⚠️ No se pudo decodificar el token:', decodeError);
      }
    }

    // Prioridad a los datos explícitos
    if (customer_id) {
      cartData.customer_id = customer_id;
      console.log('👤 Customer ID explícito:', customer_id);
    }
    if (email) {
      cartData.email = email;
      console.log('📧 Email explícito:', email);
    }

    console.log('🛒 Creando carrito con datos:', cartData);

    const response = await fetch(`${medusaUrl}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey,
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(cartData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error creando carrito en Medusa:', {
        status: response.status,
        error: errorText
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to create cart in Medusa',
          details: errorText,
          status: response.status
        },
        { status: response.status }
      );
    }

    const cart = await response.json();
    
    console.log('✅ Carrito creado en Medusa:', {
      id: cart.cart?.id,
      customer_id: cart.cart?.customer_id,
      email: cart.cart?.email
    });

    // Agregar items si existen
    if (items && items.length > 0 && cart.cart?.id) {
      console.log('📦 Agregando items iniciales al carrito...');
      
      for (const item of items) {
        try {
          if (!item.variant_id || !item.quantity) {
            console.warn('⚠️ Item inválido:', item);
            continue;
          }

          const lineItemResponse = await fetch(`${medusaUrl}/store/carts/${cart.cart.id}/line-items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': publishableKey,
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify({
              variant_id: item.variant_id,
              quantity: item.quantity
            })
          });

          if (lineItemResponse.ok) {
            console.log(`✅ Item ${item.variant_id} agregado`);
          } else {
            const errorData = await lineItemResponse.json();
            console.warn(`⚠️ Error agregando item ${item.variant_id}:`, errorData);
          }
        } catch (itemError) {
          console.error(`❌ Error procesando item ${item.variant_id}:`, itemError);
        }
      }
    }

    return NextResponse.json({ 
      cart: cart.cart,
      success: true 
    });

  } catch (error: any) {
    console.error('❌ Error crítico creando carrito:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}