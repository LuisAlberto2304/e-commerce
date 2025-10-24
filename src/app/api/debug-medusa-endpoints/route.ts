/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/debug-medusa-endpoints/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY;

  if (!medusaUrl || !apiKey) {
    return NextResponse.json({
      error: 'Configuración faltante',
      medusaUrl: !!medusaUrl,
      apiKey: !!apiKey
    });
  }

  // Crear un carrito de prueba
  let cartId = null;
  try {
    const cartResponse = await fetch(`${medusaUrl}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': apiKey,
      },
    });
    
    if (cartResponse.ok) {
      const cartData = await cartResponse.json();
      cartId = cartData.cart?.id;
    }
  } catch (error) {
    console.error('Error creando carrito:', error);
  }

  // Probar diferentes endpoints de items
  const endpoints = [
    '/store/carts/{cartId}/line-items',
    '/store/carts/{cartId}/items',
    '/store/carts/{cartId}/line_items'
  ];

  const results = [];

  if (cartId) {
    for (const endpoint of endpoints) {
      const url = `${medusaUrl}${endpoint.replace('{cartId}', cartId)}`;
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': apiKey,
          },
          body: JSON.stringify({
            variant_id: 'test_variant_id',
            quantity: 1
          }),
        });

        results.push({
          endpoint,
          url,
          status: response.status,
          ok: response.ok,
          method: 'POST'
        });

        // También probar GET
        const getResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'x-publishable-api-key': apiKey,
          },
        });

        results.push({
          endpoint: endpoint + ' (GET)',
          url,
          status: getResponse.status,
          ok: getResponse.ok,
          method: 'GET'
        });

      } catch (error: any) {
        results.push({
          endpoint,
          url,
          error: error.message,
          ok: false
        });
      }
    }

    // Limpiar carrito de prueba
    if (cartId) {
      await fetch(`${medusaUrl}/store/carts/${cartId}`, { 
        method: 'DELETE',
        headers: {
          'x-publishable-api-key': apiKey,
        },
      });
    }
  }

  return NextResponse.json({
    cartId,
    endpointsTested: results,
    note: 'Esto te mostrará qué endpoints de items están disponibles'
  });
}