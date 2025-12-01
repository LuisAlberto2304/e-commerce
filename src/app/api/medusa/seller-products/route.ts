/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/medusa/seller-products/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;

    // Para GET, no necesitamos ADMIN_KEY ya que usamos el token del cliente
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

    console.log('🔄 Obteniendo productos del seller...');
    console.log('📡 URL:', `${MEDUSA_URL}/seller/products`);
    console.log('🔑 Token recibido:', authHeader.substring(0, 20) + '...');

    const medusaResponse = await fetch(`${MEDUSA_URL}/seller/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader // Forward the token from the client
      },
    });

    const resText = await medusaResponse.text();
    console.log('📨 Status de respuesta:', medusaResponse.status);
    console.log('📄 Respuesta:', resText.substring(0, 200) + '...');

    let data = {};

    try { 
      data = JSON.parse(resText); 
    } catch (e) {
      console.error('❌ Error parseando JSON:', e);
      return NextResponse.json(
        { error: "Invalid JSON response from Medusa" },
        { status: 500 }
      );
    }

    if (!medusaResponse.ok) {
      return NextResponse.json(
        { 
          error: "Error from Medusa API",
          details: data,
          status: medusaResponse.status 
        },
        { status: medusaResponse.status }
      );
    }

    console.log('✅ Productos obtenidos exitosamente');
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error('💥 Error en seller-products API:', error);
    return NextResponse.json(
      { error: "Medusa connection error", details: error.message },
      { status: 500 }
    );
  }
}