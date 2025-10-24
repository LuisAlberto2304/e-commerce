/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY;

  // Endpoints comunes de Medusa para probar
  const endpointsToTest = [
    '/store/carts',
    '/store/carts/{cartId}/payment-sessions',
    '/store/carts/{cartId}/payment-sessions?provider_id=manual',
    '/store/carts/{cartId}/payment-methods',
    '/store/carts/{cartId}/payments',
    '/store/payment-providers',
  ];

  const results = [];

  // Primero crear un carrito de prueba
  try {
    const cartResponse = await fetch(`${medusaUrl}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': apiKey || '',
      },
    });

    if (cartResponse.ok) {
      const cartData = await cartResponse.json();
      const cartId = cartData.cart?.id;

      if (cartId) {
        // Probar cada endpoint con el cartId real
        for (const endpoint of endpointsToTest) {
          const testUrl = `${medusaUrl}${endpoint.replace('{cartId}', cartId)}`;
          
          try {
            const testResponse = await fetch(testUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'x-publishable-api-key': apiKey || '',
              },
            });

            results.push({
              endpoint,
              url: testUrl,
              status: testResponse.status,
              ok: testResponse.ok,
              method: 'GET'
            });

            // También probar POST para algunos endpoints
            if (endpoint.includes('payment-sessions')) {
              const postResponse = await fetch(testUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-publishable-api-key': apiKey || '',
                },
                body: JSON.stringify({ provider_id: 'manual' }),
              });

              results.push({
                endpoint: endpoint + ' (POST)',
                url: testUrl,
                status: postResponse.status,
                ok: postResponse.ok,
                method: 'POST'
              });
            }

          } catch (error:any) {
            results.push({
              endpoint,
              url: testUrl,
              error: error.message,
              ok: false
            });
          }
        }

        // Limpiar carrito de prueba
        await fetch(`${medusaUrl}/store/carts/${cartId}`, { method: 'DELETE' });
      }
    }
  } catch (error:any) {
    results.push({ error: 'No se pudo crear carrito de prueba: ' + error.message });
  }

  return NextResponse.json({
    medusaUrl,
    endpointsTested: results,
    note: 'Esto te ayudará a identificar los endpoints correctos'
  });
}