// app/api/medusa/test-product/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    const ADMIN_TOKEN = process.env.MEDUSA_ADMIN_API_KEY;

    if (!MEDUSA_URL || !ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'Configuración incompleta' },
        { status: 500 }
      );
    }

    // Datos de prueba
    const testProduct = {
      title: "Producto de Prueba",
      description: "Este es un producto de prueba",
      thumbnail: "https://via.placeholder.com/300",
      images: [
        "https://via.placeholder.com/300"
      ],
      variants: [
        {
          title: "Talla M",
          price: 29.99,
          quantity: 10
        }
      ]
    };

    console.log('🚀 Enviando producto de prueba a Medusa...');

    const medusaResponse = await fetch(`${MEDUSA_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify(testProduct)
    });

    const responseText = await medusaResponse.text();
    console.log('📨 Status:', medusaResponse.status);
    console.log('📨 Respuesta:', responseText);

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      data = { message: 'Respuesta inválida' };
    }

    return NextResponse.json({
      success: medusaResponse.ok,
      status: medusaResponse.status,
      data: data
    });

  } catch (error) {
    console.error('💥 Error en test:', error);
    return NextResponse.json(
      { error: 'Error de conexión' },
      { status: 500 }
    );
  }
}