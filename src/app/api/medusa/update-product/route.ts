/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/medusa/update-product/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;

    if (!MEDUSA_URL) {
      return NextResponse.json(
        { error: "Missing Medusa configuration" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 }
      );
    }

    // Parsear el cuerpo de la solicitud
    const body = await request.json();
    const { productId, ...productData } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    console.log('🔄 Actualizando producto en Medusa...');
    
    // Probar diferentes endpoints y métodos
    const endpointsToTry = [
      { url: `${MEDUSA_URL}/products/${productId}`, method: 'POST' },
      { url: `${MEDUSA_URL}/products/${productId}`, method: 'PUT' },
      { url: `${MEDUSA_URL}/products/${productId}`, method: 'PATCH' },
      { url: `${MEDUSA_URL}/products/${productId}`, method: 'PUT' },
      { url: `${MEDUSA_URL}/products/${productId}`, method: 'POST' },
      { url: `${MEDUSA_URL}/products/${productId}`, method: 'PATCH' },
    ];

    let lastError = null;

    for (const endpoint of endpointsToTry) {
      try {
        console.log(`🔍 Probando: ${endpoint.method} ${endpoint.url}`);
        
        const medusaResponse = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify(productData),
        });

        const resText = await medusaResponse.text();
        console.log(`📨 Status de respuesta (${endpoint.method}):`, medusaResponse.status);

        if (medusaResponse.ok) {
          // Éxito - parsear y retornar respuesta
          let data = {};
          try { 
            data = JSON.parse(resText); 
          } catch (e) {
            console.error('❌ Error parseando JSON de Medusa:', e);
            continue; // Intentar con siguiente endpoint
          }

          console.log(`✅ Producto actualizado exitosamente con ${endpoint.method}`);
          return NextResponse.json(data, { status: 200 });
        } else {
          console.log(`❌ ${endpoint.method} falló:`, medusaResponse.status);
          lastError = {
            method: endpoint.method,
            url: endpoint.url,
            status: medusaResponse.status,
            response: resText
          };
        }
      } catch (error) {
        console.error(`💥 Error con ${endpoint.method}:`, error);
        lastError = error;
      }
    }

    // Si llegamos aquí, todos los métodos fallaron
    console.error('💥 Todos los métodos fallaron:', lastError);
    return NextResponse.json(
      { 
        error: "All update methods failed",
        details: lastError,
        suggestion: "Check Medusa API documentation for correct endpoint"
      },
      { status: 500 }
    );

  } catch (error: any) {
    console.error('💥 Error en update-product API:', error);
    return NextResponse.json(
      { error: "Medusa connection error", details: error.message },
      { status: 500 }
    );
  }
}