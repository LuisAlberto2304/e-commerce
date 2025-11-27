// app/api/medusa/debug/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  
  if (!MEDUSA_URL) {
    return NextResponse.json({ error: 'MEDUSA_URL no configurada' }, { status: 500 });
  }

  try {
    // Probar conexión básica
    const testResponse = await fetch(MEDUSA_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseText = await testResponse.text();
    
    return NextResponse.json({
      medusaUrl: MEDUSA_URL,
      status: testResponse.status,
      contentType: testResponse.headers.get('content-type'),
      responsePreview: responseText.substring(0, 200),
      isJson: testResponse.headers.get('content-type')?.includes('application/json')
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Error de conexión',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}