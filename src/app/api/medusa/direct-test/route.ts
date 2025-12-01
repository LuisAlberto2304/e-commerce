// app/api/medusa/direct-test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    const ADMIN_KEY = process.env.MEDUSA_ADMIN_API_KEY;

    console.log('🔧 Configuración:');
    console.log('URL:', MEDUSA_URL);
    console.log('KEY:', ADMIN_KEY ? `${ADMIN_KEY.substring(0, 15)}...` : 'NO HAY KEY');

    if (!MEDUSA_URL || !ADMIN_KEY) {
      return NextResponse.json({ error: 'Configuración faltante' }, { status: 500 });
    }

    const testProduct = {
      title: "Test Directo " + Date.now(),
      description: "Prueba directa con admin key",
      thumbnail: "https://via.placeholder.com/300",
      variants: [
        {
          title: "Test Variant",
          price: 19.99,
          quantity: 1
        }
      ]
    };

    console.log('🚀 Enviando directamente a Medusa...');
    
    const response = await fetch(`${MEDUSA_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_KEY}`
      },
      body: JSON.stringify(testProduct)
    });

    const responseText = await response.text();
    console.log('📨 Status:', response.status);
    console.log('📨 Respuesta:', responseText);

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      data = { parseError: e, rawText: responseText };
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data: data
    });

  } catch (error) {
    console.error('💥 Error directo:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}