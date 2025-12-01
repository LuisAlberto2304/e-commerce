// app/api/seller/products/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const medusaUrl = `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/seller/products`;
    
    console.log('🔄 Fetching from Medusa:', medusaUrl);

    const response = await fetch(medusaUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MEDUSA_TOKEN}`,
        'Content-Type': 'application/json',
        ...(process.env.NEXT_PUBLIC_MEDUSA_API_KEY && {
          'x-api-key': process.env.NEXT_PUBLIC_MEDUSA_API_KEY
        })
      },
      // Agregar cache control si es necesario
      next: { revalidate: 60 } // Cache por 60 segundos
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Medusa API error:', response.status, errorText);
      
      return NextResponse.json(
        { 
          error: `Medusa API error: ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Products fetched successfully');
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('💥 Proxy API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}